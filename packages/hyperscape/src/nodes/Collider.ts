
import THREE, { safeMatrixDecompose } from '../extras/three'

import type {
  PxBoxGeometry,
  PxConvexMeshGeometry,
  PxFilterData,
  PxMaterial,
  PxQuat,
  PxShape,
  PxSphereGeometry,
  PxTransform,
  PxTriangleMeshGeometry,
  PxVec3
} from '../types/physics'
import type { ColliderData } from '../types/nodes'

import { getRef, Node } from './Node'
import { isNumber, isBoolean } from '../utils/validation'

import { Layers } from '../extras/Layers'
import { geometryToPxMesh } from '../extras/geometryToPxMesh'

// PhysX mesh scale interface
interface PxMeshScale {
  scale: PxVec3
  rotation: PxQuat
}

// PhysX shape flags interface with proper methods
interface PhysXShapeFlags {
  raise: (flag: number) => void
  isSet: (flag: number) => boolean
  clear: (flag: number) => void
}

declare const PHYSX: {
  PxBoxGeometry: new (x: number, y: number, z: number) => PxBoxGeometry
  PxSphereGeometry: new (radius: number) => PxSphereGeometry
  PxMeshScale: new (scale: PxVec3, rotation: PxQuat) => PxMeshScale
  PxVec3: new (x: number, y: number, z: number) => PxVec3
  PxQuat: new (x: number, y: number, z: number, w: number) => PxQuat
  PxConvexMeshGeometry: new (mesh: unknown, scale: unknown) => PxConvexMeshGeometry
  PxTriangleMeshGeometry: new (mesh: unknown, scale: unknown) => PxTriangleMeshGeometry
  PxShapeFlags: new () => PhysXShapeFlags
  PxShapeFlagEnum: { eTRIGGER_SHAPE: number; eSCENE_QUERY_SHAPE: number; eSIMULATION_SHAPE: number }
  PxPairFlagEnum: { eNOTIFY_TOUCH_FOUND: number; eNOTIFY_TOUCH_LOST: number; eNOTIFY_CONTACT_POINTS: number }
  PxFilterData: new (group: number, mask: number, flags: number, data: number) => PxFilterData
  PxTransform: new () => PxTransform
  destroy: (obj: unknown) => void
}

// Type extensions for PhysX integration
interface PhysXShape extends PxShape {
  setQueryFilterData: (filterData: PxFilterData) => void
  setSimulationFilterData: (filterData: PxFilterData) => void
  setLocalPose: (pose: PxTransform) => void
  release: () => void
}

interface PhysXMesh {
  value: unknown
  release: () => void
}

interface NodeWithShape extends Node {
  addShape?: (shape: PhysXShape) => void
  removeShape?: (shape: PhysXShape) => void
}

const defaults = {
  type: 'box',
  width: 1,
  height: 1,
  depth: 1,
  radius: 0.5,
  geometry: null,
  convex: false,
  trigger: false,
  layer: 'environment',
  staticFriction: 0.6,
  dynamicFriction: 0.6,
  restitution: 0,
}

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _q1 = new THREE.Quaternion()
const m1 = new THREE.Matrix4()

const types = ['box', 'sphere', 'geometry']
const layers = ['environment', 'prop', 'player', 'tool']

export class Collider extends Node {
  _type?: string
  _width?: number
  _height?: number
  _depth?: number
  _radius?: number
  _geometry?: THREE.BufferGeometry
  _convex?: boolean
  _trigger?: boolean
  _layer?: string
  _staticFriction?: number
  _dynamicFriction?: number
  _restitution?: number
  shape?: PhysXShape
  pmesh?: PhysXMesh
  needsRebuild?: boolean

  constructor(data: ColliderData = {}) {
    super(data)
    this.name = 'collider'

    this.type = data.type
    this.width = data.width
    this.height = data.height
    this.depth = data.depth
    this.radius = data.radius
    if (data.geometry) {
      this._geometry = data.geometry
    }
    this.convex = data.convex
    this.trigger = data.trigger
    this.layer = data.layer
    this.staticFriction = data.staticFriction
    this.dynamicFriction = data.dynamicFriction
    this.restitution = data.restitution
  }

  mount() {
    if (!PHYSX) {
      console.warn('[collider] PHYSX not initialized yet')
      return
    }

    let geometry
    let pmesh
    if (this._type === 'box') {
      geometry = new PHYSX.PxBoxGeometry(this._width! / 2, this._height! / 2, this._depth! / 2)
    } else if (this._type === 'sphere') {
      geometry = new PHYSX.PxSphereGeometry(this._radius!)
    } else if (this._type === 'geometry') {
      // note: triggers MUST be convex according to PhysX/Unity
      const isConvex = this._trigger || this._convex || false
      if (this._geometry) {
        pmesh = geometryToPxMesh(this.ctx!, this._geometry, isConvex)
      }
      if (!pmesh) return console.error('failed to generate collider pmesh')
      const tempPos = _v1
      const tempQuat = _q1
      const tempScale = _v2
      const plainMatrix = m1.copy(this.matrixWorld)
      safeMatrixDecompose(plainMatrix, tempPos, tempQuat, tempScale)
      _v1.multiplyScalar(0.02) // for visible selection
      const scale = new PHYSX.PxMeshScale(new PHYSX.PxVec3(_v2.x, _v2.y, _v2.z), new PHYSX.PxQuat(0, 0, 0, 1))
      if (isConvex) {
        geometry = new PHYSX.PxConvexMeshGeometry(pmesh.value, scale)
      } else {
        // const flags = new PHYSX.PxMeshGeometryFlags()
        // flags.raise(PHYSX.PxMeshGeometryFlagEnum.eDOUBLE_SIDED)
        geometry = new PHYSX.PxTriangleMeshGeometry(pmesh.value, scale)
      }
      PHYSX.destroy(scale)
    }
    let material: PxMaterial | null = null
    const worldPhysics = this.ctx?.physics
    const physics = worldPhysics
    if (physics && physics.getMaterial) {
      material = physics.getMaterial(this._staticFriction!, this._dynamicFriction!, this._restitution!)
    }
    if (!material) {
      console.error('[collider] failed to create physics material')
      // cleanup
      if (geometry) {
        PHYSX.destroy(geometry)
      }
      if (this.pmesh) {
        this.pmesh.release()
        this.pmesh = undefined
      }
      return
    }
    const flags = new PHYSX.PxShapeFlags()
    if (this._trigger) {
      flags.raise(PHYSX.PxShapeFlagEnum.eTRIGGER_SHAPE)
    } else {
      flags.raise(
        (PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE as number) | (PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE as number)
      )
    }
    const layer = Layers[this._layer!]
    if (!layer) {
      throw new Error(`[collider] layer not found: ${this._layer}`)
    }
    let pairFlags =
      (PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND as number) | (PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST as number)
    if (!this._trigger) {
      pairFlags |= PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS as number
    }
    this.pmesh = pmesh
    const filterData = new PHYSX.PxFilterData(layer.group, layer.mask, pairFlags, 0)
    try {
      let shape: PhysXShape | undefined = undefined
      if (physics && physics.physics && physics.physics.createShape) {
        shape = physics.physics.createShape(geometry, material, true, flags)
      }
      this.shape = shape
      if (!this.shape) {
        console.error('[collider] failed to create shape - physics.createShape returned null')
        // cleanup
        if (geometry) {
          PHYSX.destroy(geometry)
        }
        if (this.pmesh) {
          this.pmesh.release()
          this.pmesh = undefined
        }
        return
      }
    } catch (err) {
      console.error('[collider] failed to create shape')
      console.error(err)
      // cleanup
      if (geometry) {
        PHYSX.destroy(geometry)
      }
      if (this.pmesh) {
        this.pmesh.release()
        this.pmesh = undefined
      }
      return
    }
    if (this.shape) {
      this.shape.setQueryFilterData(filterData)
      this.shape.setSimulationFilterData(filterData)
    }
    const plainPosition = _v1.copy(this.position)
    const plainScale = this.parent?.scale ? _v2.copy(this.parent.scale) : _v2.set(1, 1, 1)
    const position: THREE.Vector3 = _v1.copy(plainPosition).multiply(plainScale)
    const pose = new PHYSX.PxTransform()

    // Set position directly on pose (PxTransform has p: PxVec3)
    const poseP = (pose as { p: { x: number; y: number; z: number } }).p
    poseP.x = position.x
    poseP.y = position.y
    poseP.z = position.z

    // Set quaternion directly on pose (PxTransform has q: PxQuat)
    const poseQ = (pose as { q: { x: number; y: number; z: number; w: number } }).q
    poseQ.x = this.quaternion.x
    poseQ.y = this.quaternion.y
    poseQ.z = this.quaternion.z
    poseQ.w = this.quaternion.w

    if (this.shape) {
      this.shape.setLocalPose(pose)
      const parentWithShape = this.parent as NodeWithShape
      if (parentWithShape?.addShape) {
        parentWithShape.addShape(this.shape)
      }
    }
    // this._geometry = geometry
    PHYSX.destroy(geometry)
    this.needsRebuild = false
  }

  commit(didMove: boolean) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      // ...
    }
  }

  unmount() {
    // if (this.type === 'geometry' && pxMeshes[this.geometry.uuid]) {
    //   pxMeshes[this.geometry.uuid].release()
    //   delete pxMeshes[this.geometry.uuid]
    // }
    if (this.shape) {
      const parentWithShape = this.parent as NodeWithShape
      if (parentWithShape?.removeShape) {
        parentWithShape.removeShape(this.shape)
      }
    }
    this.shape?.release()
    this.shape = undefined
    this.pmesh?.release()
    this.pmesh = undefined
  }

  copy(source: Collider, recursive: boolean) {
    super.copy(source, recursive)
    this._type = source._type
    this._width = source._width
    this._height = source._height
    this._depth = source._depth
    this._radius = source._radius
    this._geometry = source._geometry
    this._convex = source._convex
    this._trigger = source._trigger
    this._layer = source._layer
    this._staticFriction = source._staticFriction
    this._dynamicFriction = source._dynamicFriction
    this._restitution = source._restitution
    return this
  }

  get type() {
    return this._type
  }

  set type(value) {
    if (value === undefined) value = defaults.type
    if (!isType(value)) {
      throw new Error(`[collider] invalid type: ${value}`)
    }
    this._type = value
    this.needsRebuild = true
    this.setDirty()
  }

  get width() {
    return this._width
  }

  set width(value) {
    if (value === undefined) value = defaults.width
    if (!isNumber(value)) {
      throw new Error('[collider] width not a number')
    }
    this._width = value
    if (this.shape && this._type === 'box') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get height() {
    return this._height
  }

  set height(value) {
    if (value === undefined) value = defaults.height
    if (!isNumber(value)) {
      throw new Error('[collider] height not a number')
    }
    this._height = value
    if (this.shape && this._type === 'box') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get depth() {
    return this._depth
  }

  set depth(value) {
    if (value === undefined) value = defaults.depth
    if (!isNumber(value)) {
      throw new Error('[collider] depth not a number')
    }
    this._depth = value
    if (this.shape && this._type === 'box') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  setSize(width: number, height: number, depth: number) {
    this.width = width
    this.height = height
    this.depth = depth
  }

  get radius() {
    return this._radius
  }

  set radius(value) {
    if (value === undefined) value = defaults.radius
    if (!isNumber(value)) {
      throw new Error('[collider] radius not a number')
    }
    this._radius = value
    if (this.shape && this._type === 'sphere') {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get geometry() {
    return this._geometry || null
  }

  set geometry(value) {
    if (value === undefined) value = defaults.geometry
    if (value === null) {
      this._geometry = undefined
    } else if (value && typeof value === 'object' && (value as { isBufferGeometry?: unknown }).isBufferGeometry) {
      this._geometry = value as unknown as THREE.BufferGeometry
    } else {
      const geometry = getRef(value as unknown as Node)
      if (geometry && (geometry as unknown as { isBufferGeometry?: unknown }).isBufferGeometry) {
        this._geometry = geometry as unknown as THREE.BufferGeometry
      }
    }
    this.needsRebuild = true
    this.setDirty()
  }

  get convex() {
    return this._convex
  }

  set convex(value) {
    if (value === undefined) value = defaults.convex
    if (!isBoolean(value)) {
      throw new Error('[collider] convex not a boolean')
    }
    this._convex = value
    if (this.shape) {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get trigger() {
    return this._trigger
  }

  set trigger(value) {
    if (value === undefined) value = defaults.trigger

    this._trigger = value
    if (this.shape) {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get layer() {
    return this._layer
  }

  set layer(value) {
    if (value === undefined) value = defaults.layer
    if (!isLayer(value)) {
      throw new Error(`[collider] invalid layer: ${value}`)
    }
    this._layer = value
    if (this.shape) {
      // TODO: we could just update the PxFilterData tbh
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get staticFriction() {
    return this._staticFriction
  }

  set staticFriction(value) {
    if (value === undefined) value = defaults.staticFriction
    if (!isNumber(value)) {
      throw new Error('[collider] staticFriction not a number')
    }
    this._staticFriction = value
    if (this.shape) {
      // todo: we could probably just update the PxMaterial tbh
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get dynamicFriction() {
    return this._dynamicFriction
  }

  set dynamicFriction(value) {
    if (value === undefined) value = defaults.dynamicFriction
    if (!isNumber(value)) {
      throw new Error('[collider] dynamicFriction not a number')
    }
    this._dynamicFriction = value
    if (this.shape) {
      // todo: we could probably just update the PxMaterial tbh
      this.needsRebuild = true
      this.setDirty()
    }
  }

  get restitution() {
    return this._restitution
  }

  set restitution(value) {
    if (value === undefined) value = defaults.restitution
    if (!isNumber(value)) {
      throw new Error('[collider] restitution not a number')
    }
    this._restitution = value
    if (this.shape) {
      // todo: we could probably just update the PxMaterial tbh
      this.needsRebuild = true
      this.setDirty()
    }
  }

  setMaterial(staticFriction, dynamicFriction, restitution) {
    this.staticFriction = staticFriction
    this.dynamicFriction = dynamicFriction
    this.restitution = restitution
  }

  requestRebuild() {
    this.needsRebuild = true
    this.setDirty()
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get type() {
          return self.type
        },
        set type(value) {
          self.type = value
        },
        get width() {
          return self.width
        },
        set width(value) {
          self.width = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get depth() {
          return self.depth
        },
        set depth(value) {
          self.depth = value
        },
        setSize(width, height, depth) {
          self.setSize(width, height, depth)
        },
        get radius() {
          return self.radius
        },
        set radius(value) {
          self.radius = value
        },
        get geometry() {
          return self.geometry
        },
        set geometry(value) {
          self.geometry = value
        },
        get convex() {
          return self.convex
        },
        set convex(value) {
          self.convex = value
        },
        get trigger() {
          return self.trigger
        },
        set trigger(value) {
          self.trigger = value
        },
        get layer() {
          return self.layer
        },
        set layer(value) {
          if (value === 'player') {
            throw new Error('[collider] layer invalid: player')
          }
          self.layer = value
        },
        get staticFriction() {
          return self.staticFriction
        },
        set staticFriction(value) {
          self.staticFriction = value
        },
        get dynamicFriction() {
          return self.dynamicFriction
        },
        set dynamicFriction(value) {
          self.dynamicFriction = value
        },
        get restitution() {
          return self.restitution
        },
        set restitution(value) {
          self.restitution = value
        },
        setMaterial(staticFriction, dynamicFriction, restitution) {
          self.setMaterial(staticFriction, dynamicFriction, restitution)
        },
        requestRebuild() {
          self.requestRebuild()
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}

function isType(value) {
  return types.includes(value)
}

function isLayer(value) {
  return layers.includes(value)
}
