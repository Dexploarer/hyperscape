import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import Hls from 'hls.js/dist/hls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { createEmoteFactory } from '../extras/createEmoteFactory'
import { createNode } from '../extras/createNode'
import { createVRMFactory } from '../extras/createVRMFactory'
import { glbToNodes } from '../extras/glbToNodes'
import { patchTextureLoader } from '../extras/textureLoaderPatch'
import THREE from '../extras/three'
import { Node } from '../nodes/Node'
import type { GLBData, HSNode as INode, LoadedAvatar, LoadedEmote, LoadedModel, LoaderResult, VideoFactory, World, WorldOptions } from '../types'
import { EventType } from '../types/events'
import { SystemBase } from './SystemBase'

// THREE.Cache.enabled = true

function nodeToINode(node: Node): INode {
  // Ensure transforms are current, then return the actual Node instance
  node.updateTransform();
  return node as INode;
}

/**
 * Client Loader System
 *
 * - Runs on the client
 * - Basic file loader for many different formats, cached.
 *
 */
export class ClientLoader extends SystemBase {
  files: Map<string, File>
  promises: Map<string, Promise<LoaderResult>>
  results: Map<string, LoaderResult>
  rgbeLoader: RGBELoader
  texLoader: THREE.TextureLoader
  gltfLoader: GLTFLoader
  preloadItems: Array<{ type: string; url: string }> = []
  vrmHooks?: { camera: THREE.Camera; scene: THREE.Scene; octree: unknown; setupMaterial: (material: THREE.Material) => void; loader?: ClientLoader }
  preloader?: Promise<void> | null
  constructor(world: World) {
    super(world, { name: 'client-loader', dependencies: { required: [], optional: [] }, autoCleanup: true })
        this.files = new Map()
    this.promises = new Map()
    this.results = new Map()
    this.rgbeLoader = new RGBELoader()
    this.texLoader = new THREE.TextureLoader()
    this.gltfLoader = new GLTFLoader()
    // Register VRM loader plugin with proper parser typing
    this.gltfLoader.register((parser: GLTFParser) => new VRMLoaderPlugin(parser))
    
    // Apply texture loader patch to handle blob URL errors
    patchTextureLoader()
  }

  async init(options: WorldOptions): Promise<void> {
        await super.init(options)
  }

  start() {
                this.vrmHooks = {
      camera: this.world.camera,
      scene: this.world.stage.scene,
      octree: this.world.stage.octree,
      setupMaterial: this.world.setupMaterial,
      loader: this.world.loader,
    }
  }

  has(type, url) {
    const key = `${type}/${url}`
    return this.promises.has(key)
  }

  get(type, url) {
    const key = `${type}/${url}`
    return this.results.get(key)
  }

  preload(type, url) {
    this.preloadItems.push({ type, url })
  }

  execPreload() {
    if (this.preloadItems.length === 0) {
      this.emitTypedEvent(EventType.ASSETS_LOADING_PROGRESS, { progress: 100, total: 0 })
      return
    }
    
    let loadedItems = 0
    const totalItems = this.preloadItems.length
    let progress = 0
    
    const promises = this.preloadItems.map(item => {
      return this.load(item.type, item.url)
        .then(() => {
          loadedItems++
          progress = (loadedItems / totalItems) * 100
          this.emitTypedEvent(EventType.ASSETS_LOADING_PROGRESS, { progress, total: totalItems })
        })
        .catch(error => {
          this.logger.error(`Failed to load ${item.type}: ${item.url}: ${error instanceof Error ? error.message : String(error)}`)
          throw error // Re-throw to be caught by allSettled
        })
    })
    
    this.preloader = Promise.allSettled(promises).then((results) => {
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        this.logger.error(`Some assets failed to load: ${failed.length}`)
      }
      this.preloader = null
      // Don't emit ready here - let PlayerLocal do it after it's initialized
      // this.emitTypedEvent('ready', true)
    })
  }

  setFile(url, file) {
    this.files.set(url, file)
  }

  getFile(url: string, name?: string): File | undefined {
    url = this.world.resolveURL(url)
    if (name) {
      const file = this.files.get(url)
      if (!file) return undefined
      return new File([file], name, {
        type: file.type, // Preserve the MIME type
        lastModified: file.lastModified, // Preserve the last modified timestamp
      })
    }
    return this.files.get(url)
  }

  loadFile = async (url: string): Promise<File | undefined> => {
    url = this.world.resolveURL(url)
    if (this.files.has(url)) {
      return this.files.get(url)
    }
    
    try {
      const resp = await fetch(url)
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`)
      }
      const blob = await resp.blob()
      const file = new File([blob], url.split('/').pop() as string, { type: blob.type })
      this.files.set(url, file)
      return file
    } catch (error) {
      this.logger.error(`Failed to fetch file: ${url}: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async load(type: string, url: string): Promise<LoaderResult> {
    if (this.preloader) {
      await this.preloader
    }
    const key = `${type}/${url}`
    if (this.promises.has(key)) {
      return this.promises.get(key)!
    }
    if (type === 'video') {
      const promise = new Promise<VideoFactory>(resolve => {
        url = this.world.resolveURL(url)
        const factory = createVideoFactory(this.world, url)
        resolve(factory)
      })
      this.promises.set(key, promise)
      return promise
    }
    const promise: Promise<LoaderResult> = this.loadFile(url).then(async (file: File | undefined): Promise<LoaderResult> => {
      if (!file) throw new Error(`Failed to load file: ${url}`)
      if (type === 'hdr') {
        const buffer = await file.arrayBuffer()
        const result = this.rgbeLoader.parse(buffer)
        // we just mimicing what rgbeLoader.load() does behind the scenes
        const texture = new THREE.DataTexture(result.data, result.width, result.height)
        texture.colorSpace = THREE.LinearSRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
        texture.flipY = true
        texture.type = result.type
        texture.needsUpdate = true
        this.results.set(key, texture)
        return texture
      }
      if (type === 'image') {
        return new Promise<LoaderResult>(resolve => {
          const img = new Image()
          img.onload = () => {
            this.results.set(key, img)
            resolve(img)
            // URL.revokeObjectURL(img.src)
          }
          img.src = URL.createObjectURL(file)
        })
      }
      if (type === 'texture') {
        return new Promise<LoaderResult>(resolve => {
          const img = new Image()
          img.onload = () => {
            const texture = this.texLoader.load(img.src)
            this.results.set(key, texture)
            resolve(texture)
            URL.revokeObjectURL(img.src)
          }
          img.src = URL.createObjectURL(file)
        })
      }
      if (type === 'model') {
        const buffer = await file.arrayBuffer()
        try {
          const gltf = await this.gltfLoader.parseAsync(buffer, '')
          // Convert GLTF to GLBData format
          const glb = {
            scene: gltf.scene,
            animations: gltf.animations || []
          }
          const node = glbToNodes(glb, this.world)
          const model: LoadedModel = {
            toNodes() {
              const clonedNode = node.clone(true)
              const nodeMap = new Map<string, INode>()
              nodeMap.set('root', nodeToINode(clonedNode))
              return nodeMap
            },
            getStats() {
              const stats = node.getStats(true)
              // append file size
              stats.fileBytes = file.size
              return stats
            },
          }
          this.results.set(key, model)
          return model
        } catch (error) {
          this.logger.warn(`Failed to parse GLB model, texture loading issue: ${url}: ${(error as Error)?.message || 'Unknown error'}`)
          // Create a simple fallback model  
          const fallbackNode = {
            clone: () => ({
              name: 'group',
              id: '$root',
              children: [],
              add: () => {},
              getStats: () => ({ triangles: 0, vertices: 0, materials: 0, fileBytes: file.size })
            }),
            getStats: () => ({ triangles: 0, vertices: 0, materials: 0, fileBytes: file.size })
          }
          const model: LoadedModel = {
            toNodes: () => {
              const nodeMap = new Map<string, INode>()
              // Create a minimal fallback node
              const node = createNode('group', {})
              nodeMap.set('root', nodeToINode(node))
              return nodeMap
            },
            getStats: () => fallbackNode.getStats(),
          }
          this.results.set(key, model)
          return model
        }
      }
      if (type === 'emote') {
        const buffer = await file.arrayBuffer()
        try {
          const glb = await this.gltfLoader.parseAsync(buffer, '')
          const factory = createEmoteFactory({ ...glb, animations: glb.animations || [] } as GLBData, url)
          const emote: LoadedEmote = {
            toNodes() {
              return new Map<string, INode>()  // Emotes don't have nodes
            },
            getStats() {
              return { triangles: 0, texBytes: 0, nodes: 0 }  // Emotes don't have stats
            },
            toClip(options?: { rootToHips?: number; version?: string; getBoneName?: (name: string) => string }) {
              return factory.toClip(options || {}) ?? null
            },
          }
          this.results.set(key, emote)
          return emote
        } catch (error) {
          this.logger.warn(`Failed to parse emote GLB, texture loading issue: ${url}: ${(error as Error)?.message || 'Unknown error'}`)
          const emote: LoadedEmote = {
            toNodes() {
              return new Map<string, INode>()  // Fallback emote
            },
            getStats() {
              return {}
            },
            toClip(_options?: { rootToHips?: number; version?: string; getBoneName?: (name: string) => string }) {
              return null
            },
          }
          this.results.set(key, emote)
          return emote
        }
      }
      if (type === 'avatar') {
        const buffer = await file.arrayBuffer()
        try {
          const glb = await this.gltfLoader.parseAsync(buffer, '')
          const factory = createVRMFactory(glb as GLBData, this.world.setupMaterial)
          const hooks = this.vrmHooks
          const node = createNode('group', { id: '$root' })
          const node2 = createNode('avatar', { id: 'avatar', factory, hooks })
          node.add(node2)
          const avatar: LoadedAvatar = {
            toNodes(customHooks) {
              const nodeMap = new Map<string, INode>()
              const clone = node.clone(true)
              // Apply custom hooks if provided to the cloned avatar node
              if (customHooks) {
                const clonedAvatar = clone.get('avatar')
                if (clonedAvatar) {
                                    Object.assign(clonedAvatar, { hooks: customHooks })
                }
              }
              // Always expose a stable map interface
              nodeMap.set('root', nodeToINode(clone))
              const clonedAvatarForMap = clone.get('avatar')
              if (clonedAvatarForMap) {
                nodeMap.set('avatar', nodeToINode(clonedAvatarForMap))
              }
              return nodeMap
            },
            getStats() {
              const stats = node.getStats(true)
              // append file size
              stats.fileBytes = file.size
              return stats
            },
          }
          this.results.set(key, avatar)
          return avatar
        } catch (error) {
          this.logger.warn(`Failed to parse avatar GLB, texture loading issue: ${url}: ${(error as Error).message}`)
          // Create a simple fallback avatar
          const _hooks = this.vrmHooks
          const fallbackNode = {
            clone: () => {
              const mockNode = new Node();
              mockNode.name = 'group';
              mockNode.id = '$root';
              return mockNode;
            },
            getStats: () => ({ triangles: 0, vertices: 0, materials: 0, fileBytes: file.size })
          }
          const avatar: LoadedAvatar = {
            toNodes: () => {
              const nodeMap = new Map<string, INode>()
              const clone = fallbackNode.clone()
              nodeMap.set('root', nodeToINode(clone))
              // Fallback has no explicit avatar node; expose root as best-effort avatar
              nodeMap.set('avatar', nodeToINode(clone))
              return nodeMap
            },
            getStats: () => fallbackNode.getStats(),
          }
          this.results.set(key, avatar)
          return avatar
        }
      }
      if (type === 'script') {
        // DISABLED: Script loading from external files
        this.logger.warn('⚠️ Script loading disabled - Attempted to load from file')
        this.logger.warn('Scripts must now be implemented as TypeScript classes')
        throw new Error('Script loading is disabled. Use TypeScript classes instead.')
      }
      if (type === 'audio') {
        const buffer = await file.arrayBuffer()
        if (!this.world.audio?.ctx) {
          throw new Error('Audio context not available')
        }
        const audioBuffer = await this.world.audio.ctx.decodeAudioData(buffer)
        this.results.set(key, audioBuffer)
        return audioBuffer
      }
      
      // Unknown type - throw error
      throw new Error(`Unsupported loader type: ${type}`)
    })
    this.promises.set(key, promise)
    return promise
  }

  insert(type, url, file) {
    const key = `${type}/${url}`
    const localUrl = URL.createObjectURL(file)
    let promise
    if (type === 'hdr') {
      promise = this.rgbeLoader.loadAsync(localUrl).then(texture => {
        this.results.set(key, texture)
        return texture
      })
    }
    if (type === 'image') {
      promise = new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          this.results.set(key, img)
          resolve(img)
        }
        img.src = localUrl
      })
    }
    if (type === 'video') {
      promise = new Promise(resolve => {
        const factory = createVideoFactory(this.world, localUrl)
        resolve(factory)
      })
    }
    if (type === 'texture') {
      promise = this.texLoader.loadAsync(localUrl).then(texture => {
        this.results.set(key, texture)
        return texture
      })
    }
    if (type === 'model') {
      promise = this.gltfLoader.loadAsync(localUrl).then(gltf => {
        // Convert GLTF to GLBData format
        const glb = {
                          scene: gltf.scene,
          animations: gltf.animations || []
        }
        const node = glbToNodes(glb, this.world)
        const model: LoadedModel = {
          toNodes() {
            const clonedNode = node.clone(true)
            const nodeMap = new Map<string, INode>()
            nodeMap.set('root', nodeToINode(clonedNode))
            return nodeMap
          },
          getStats() {
            const stats = node.getStats(true)
            // append file size
            stats.fileBytes = file.size
            return stats
          },
        }
        this.results.set(key, model)
        return model
      })
    }
    if (type === 'emote') {
      promise = this.gltfLoader.loadAsync(localUrl).then(glb => {
        const factory = createEmoteFactory(glb as GLBData, url)
        const emote: LoadedEmote = {
          toNodes() {
            return new Map<string, INode>()  // Emotes don't have nodes
          },
          getStats() {
            return { triangles: 0, texBytes: 0, nodes: 0 }  // Emotes don't have stats
          },
          toClip(_options?: { rootToHips?: number; version?: string; getBoneName?: (name: string) => string }) {
            return factory.toClip({}) ?? null
          },
        }
        this.results.set(key, emote)
        return emote
      })
    }
    if (type === 'avatar') {
       this.logger.info(`Loading avatar from: ${localUrl}`)
      promise = this.gltfLoader.loadAsync(localUrl).then(glb => {
         this.logger.info('Avatar GLB loaded')
          const factory = createVRMFactory(glb as GLBData, this.world.setupMaterial)
        const hooks = this.vrmHooks
        const node = createNode('group', { id: '$root' })
        const node2 = createNode('avatar', { id: 'avatar', factory, hooks })
          this.logger.info(`Created avatar node2: id=${node2.id}`)
        
        // Add avatar to root
        node.add(node2)
        
         this.logger.info(`After add: rootChildren=${node.children.length}`)
        
        // Verify the structure is correct
         const verifyGet = node.get('avatar')
         this.logger.info(`Verify node.get("avatar"): ${verifyGet ? 'FOUND' : 'NOT FOUND'}`)
        
        // Test that the node structure is correct before returning
        const testGet = node.get('avatar')
                
        const logger = this.logger
        const avatar: LoadedAvatar = {
          toNodes(customHooks) {
            logger.info('toNodes called')
            
            // Test get() on original node
            const originalAvatar = node.get('avatar')
            logger.info(`Original node.get("avatar"): ${originalAvatar ? 'FOUND' : 'NOT FOUND'}`)
            
            // Clone the node tree
            const clone = node.clone(true)
            logger.info(`After clone: cloneChildren=${clone.children.length}`)
            
            // Test get() on cloned node
            const clonedAvatar = clone.get('avatar')
            logger.info(`Clone.get("avatar"): ${clonedAvatar ? 'FOUND' : 'NOT FOUND'}`)
            
            // Apply custom hooks if provided
            if (customHooks && clonedAvatar) {
              Object.assign(clonedAvatar, { hooks: customHooks })
            }
            
            // Create the map with both root and avatar nodes
            const nodeMap = new Map<string, INode>()
            nodeMap.set('root', nodeToINode(clone))
            
            // Try multiple ways to get the avatar
            let avatarForMap = clonedAvatar
            if (!avatarForMap && clone.children.length > 0) {
              logger.warn('Using first child as fallback')
              avatarForMap = clone.children[0]
            }
            
            if (avatarForMap) {
              nodeMap.set('avatar', nodeToINode(avatarForMap))
              logger.info('Added avatar to map')
            } else {
              logger.error('NO AVATAR FOUND TO ADD TO MAP!')
            }
            
            logger.info(`Final nodeMap keys: ${Array.from(nodeMap.keys()).join(',')}`)
            return nodeMap
          },
          getStats() {
            const stats = node.getStats(true)
            // append file size
            stats.fileBytes = file.size
            return stats
          },
        }
        this.results.set(key, avatar)
        return avatar
      })
    }
    if (type === 'script') {
      // DISABLED: Script loading from external files
      console.warn(`[ClientLoader] ⚠️ Script loading disabled - Attempted to load: ${url}`)
      console.warn(`[ClientLoader] Scripts must now be implemented as TypeScript classes`)
      promise = Promise.reject(new Error('Script loading is disabled. Use TypeScript classes instead.'))
    }
    if (type === 'audio') {
      promise = (async () => {
        const arrayBuffer = await file.arrayBuffer()
        if (!this.world.audio?.ctx) {
          throw new Error('Audio context not available')
        }
        const audioBuffer = await this.world.audio.ctx.decodeAudioData(arrayBuffer)
        this.results.set(key, audioBuffer)
        return audioBuffer
      })()
    }
    this.promises.set(key, promise)
  }

  destroy() {
    this.files.clear()
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}

function createVideoFactory(world, url) {
  const isHLS = url?.endsWith('.m3u8')
  const sources = {}
  let width
  let height
  let duration
  let ready = false
  let prepare
  function createSource(key) {
    const elem = document.createElement('video')
    elem.crossOrigin = 'anonymous'
    elem.playsInline = true
    elem.loop = false
    elem.muted = true
    elem.style.width = '1px'
    elem.style.height = '1px'
    elem.style.position = 'absolute'
    elem.style.opacity = '0'
    elem.style.zIndex = '-1000'
    elem.style.pointerEvents = 'none'
    elem.style.overflow = 'hidden'
    const needsPolyfill = isHLS && !elem.canPlayType('application/vnd.apple.mpegurl') && Hls.isSupported()
    if (needsPolyfill) {
      const hls = new Hls()
      hls.loadSource(url)
      hls.attachMedia(elem)
    } else {
      elem.src = url
    }
    const audio = world.audio.ctx.createMediaElementSource(elem)
    let n = 0
    let dead
    world.audio.ready(() => {
      if (dead) return
      elem.muted = false
    })
    // set linked=false to have a separate source (and texture)
    const texture = new THREE.VideoTexture(elem)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = world.graphics.maxAnisotropy
    if (!prepare) {
      prepare = (function () {
        /**
         *
         * A regular video will load data automatically BUT a stream
         * needs to hit play() before it gets that data.
         *
         * The following code handles this for us, and when streaming
         * will hit play just until we get the data needed, then pause.
         */
        return new Promise<void>((resolve) => {
          let playing = false
          let data = false
          elem.addEventListener(
            'loadeddata',
            () => {
              // if we needed to hit play to fetch data then revert back to paused
              if (playing) elem.pause()
              data = true
              // await new Promise(resolve => setTimeout(resolve, 2000))
              width = elem.videoWidth
              height = elem.videoHeight
              duration = elem.duration
              ready = true
              resolve()
            },
            { once: true }
          )
          elem.addEventListener(
            'loadedmetadata',
            () => {
              // we need a gesture before we can potentially hit play
              // await this.engine.driver.gesture
              // if we already have data do nothing, we're done!
              if (data) return
              // otherwise hit play to force data loading for streams
              elem.play()
              playing = true
            },
            { once: true }
          )
        })
      })()
    }
    function isPlaying() {
      return elem.currentTime > 0 && !elem.paused && !elem.ended && elem.readyState > 2
    }
    function play(restartIfPlaying = false) {
      if (restartIfPlaying) elem.currentTime = 0
      elem.play()
    }
    function pause() {
      elem.pause()
    }
    function stop() {
      elem.currentTime = 0
      elem.pause()
    }
    function release() {
      n--
      if (n === 0) {
        stop()
        audio.disconnect()
        texture.dispose()
        document.body.removeChild(elem)
        delete sources[key]
        // help to prevent chrome memory leaks
        // see: https://github.com/facebook/react/issues/15583#issuecomment-490912533
        elem.src = ''
        elem.load()
      }
    }
    const handle = {
      elem,
      audio,
      texture,
      prepare,
      get ready() {
        return ready
      },
      get width() {
        return width
      },
      get height() {
        return height
      },
      get duration() {
        return duration
      },
      get loop() {
        return elem.loop
      },
      set loop(value) {
        elem.loop = value
      },
      get isPlaying() {
        return isPlaying()
      },
      get currentTime() {
        return elem.currentTime
      },
      set currentTime(value) {
        elem.currentTime = value
      },
      play,
      pause,
      stop,
      release,
    }
    return {
      createHandle() {
        n++
        if (n === 1) {
          document.body.appendChild(elem)
        }
        return handle
      },
    }
  }
  return {
    get(key) {
      let source = sources[key]
      if (!source) {
        source = createSource(key)
        sources[key] = source
      }
      return source.createHandle()
    },
  }
}
