import type { PxTransform, PxVec3 } from '../types/physics'
import type PhysX from '@hyperscape/physx-js-webidl'
import THREE from './three'
import { setTransformPosition, vector3ToPxVec3 } from '../physics/vector-conversions'

/**
 * A wrapper around THREE.Vector3 that provides change detection
 * Used for reactive updates in Node transforms
 */
export class ReactiveVector3 extends THREE.Vector3 {
  _onChange?: () => void

  constructor(x = 0, y = 0, z = 0) {
    super(x, y, z)
  }

  set x(value: number) {
    super.x = value
    this._onChange?.()
  }

  get x(): number {
    return super.x
  }

  set y(value: number) {
    super.y = value
    this._onChange?.()
  }

  get y(): number {
    return super.y
  }

  set z(value: number) {
    super.z = value
    this._onChange?.()
  }

  get z(): number {
    return super.z
  }

  set(x: number, y: number, z: number): this {
    super.set(x, y, z)
    this._onChange?.()
    return this
  }

  copy(v: THREE.Vector3): this {
    super.copy(v)
    this._onChange?.()
    return this
  }

  fromArray(array: number[] | Float32Array, offset = 0): this {
    super.fromArray(array, offset)
    this._onChange?.()
    return this
  }

  // Set the change callback
  onChange(callback: () => void): this {
    this._onChange = callback
    return this
  }

  // PhysX conversion methods (delegated to vector-conversions)
  toPxVec3(pxVec3?: PxVec3): PhysX.PxVec3 | undefined {
    return vector3ToPxVec3(this, pxVec3) as PhysX.PxVec3 | undefined
  }

  toPxExtVec3(pxExtVec3?: PxVec3): PhysX.PxVec3 | undefined {
    return vector3ToPxVec3(this, pxExtVec3) || undefined
  }

  toPxTransform(pxTransform: PxTransform): void {
    setTransformPosition(pxTransform, this)
  }
}