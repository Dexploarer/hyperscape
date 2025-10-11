import { useEffect, useMemo, useRef, useState } from 'react'
import THREE from '../extras/three'

import { createClientWorld } from '../createClientWorld'
import type { World } from '../types'
import { EventType } from '../types/events'
import { CoreUI } from './components/CoreUI'
import type { ClientProps } from '../types/client-types'

export { System } from '../systems/System'

export function Client({ wsUrl, onSetup }: ClientProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const uiRef = useRef<HTMLDivElement>(null)
  
  // Detect HMR and force full page reload instead of hot reload
  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        console.log('[Client] HMR detected - reloading page to prevent duplicate worlds')
        window.location.reload()
      })
    }
  }, [])
  
  // Create world immediately so network can connect and deliver characterList
  const world = useMemo(() => {
    console.log('[Client] Creating new world instance')
    const w = createClientWorld()
    console.log('[Client] World instance created')
    
    // Expose world for browser debugging
    if (typeof window !== 'undefined') {
      (window as any).world = w;
      
      // Install simple debug commands
      (window as any).debug = {
        // Teleport camera to see mobs at Y=40+
        seeHighEntities: () => {
          if (w.camera) {
            w.camera.position.set(10, 50, 10);
            w.camera.lookAt(0, 40, 0);
            console.log('📷 Camera moved to Y=50, looking at Y=40');
          }
        },
        // Teleport to ground level
        seeGround: () => {
          if (w.camera) {
            w.camera.position.set(10, 5, 10);
            w.camera.lookAt(0, 0, 0);
            console.log('📷 Camera moved to ground level');
          }
        },
        // List all mobs with positions
        mobs: () => {
          const entityManager = w.getSystem('rpg-entity-manager');
          if (!entityManager) return;
          const mobs: Array<{ name: string; position: number[]; hasMesh: boolean; meshVisible: boolean | undefined }> = [];
          for (const [id, entity] of (entityManager as any).getAllEntities()) {
            if (entity.type === 'mob') {
              mobs.push({
                name: entity.name,
                position: entity.node.position.toArray(),
                hasMesh: !!entity.mesh,
                meshVisible: entity.mesh?.visible
              });
            }
          }
          console.table(mobs);
          return mobs;
        }
      };
      console.log('🛠️  Debug commands ready: debug.seeHighEntities(), debug.seeGround(), debug.mobs()');
    }
    
    return w
  }, [])
  const defaultUI = { visible: true, active: false, app: null, pane: null }
  const [ui, setUI] = useState(defaultUI)
  useEffect(() => {
    const handleUI = (data: unknown) => {
      if (data && typeof data === 'object') setUI(data as typeof ui)
    }
    world.on(EventType.UI_UPDATE, handleUI)
    return () => {
      world.off(EventType.UI_UPDATE, handleUI)
    }
  }, [world])

  // Handle window resize to update Three.js canvas
  useEffect(() => {
    const handleResize = () => {
      const viewport = viewportRef.current
      if (viewport && world.graphics) {
        const width = viewport.offsetWidth
        const height = viewport.offsetHeight
        world.graphics.resize(width, height)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [world])

  useEffect(() => {
    let cleanedUp = false
    
    const init = async () => {
      console.log('[Client] Init useEffect triggered')
      const viewport = viewportRef.current
      const ui = uiRef.current
      
      if (!viewport || !ui) {
        console.log('[Client] Waiting for viewport/ui refs...')
        return
      }
      console.log('[Client] Starting world initialization...')
            
      const baseEnvironment = {
        model: '/base-environment.glb',
        bg: '/day2-2k.jpg',
        hdr: '/day2.hdr',
        sunDirection: new THREE.Vector3(-1, -2, -2).normalize(),
        sunIntensity: 1,
        sunColor: 0xffffff,
        fogNear: null,
        fogFar: null,
        fogColor: null,
      }
      
      // Use wsUrl prop if provided (already resolved by parent App component)
      // The App component handles environment variables, so we should prioritize the prop
      let finalWsUrl: string
      if (wsUrl) {
        finalWsUrl = wsUrl as string
      } else {
        // Fallback if no prop provided
        finalWsUrl = window.env?.PUBLIC_WS_URL || 
          `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
      }
      
      console.log('[Client] WebSocket URL:', finalWsUrl)
      
      // Set assetsUrl from environment variable for asset:// URL resolution
      const assetsUrl =
        window.env?.PUBLIC_ASSETS_URL ||
        `${window.location.protocol}//${window.location.host}/world-assets/`

      const config = {
        viewport,
        ui,
        wsUrl: finalWsUrl,
        baseEnvironment,
        assetsUrl,
      }
      
      // Call onSetup if provided
      if (onSetup) {
        onSetup(world, config)
      }
      
      
      // Ensure RPG systems are registered before initializing the world
      const maybeWorld = world as unknown as World & { systemsLoadedPromise?: Promise<void> }
      if (maybeWorld.systemsLoadedPromise) {
        try {
          await maybeWorld.systemsLoadedPromise
                  } catch (e) {
          console.warn('[Client] Proceeding without awaiting systemsLoadedPromise due to error:', e)
        }
      }
      
      try {
        console.log('[Client] Calling world.init()...')
        await world.init(config)
        console.log('[Client] World.init() complete')
              } catch (error) {
        console.error('[Client] Failed to initialize world:', error)
      }
    }
    
    init()
    
    // Cleanup function
    return () => {
      if (!cleanedUp) {
        cleanedUp = true
        console.log('[Client] Cleaning up world on unmount...')
        try {
          // Destroy the world to cleanup WebSocket and resources
          if (world && world.destroy) {
            world.destroy()
            console.log('[Client] World destroyed')
          }
        } catch (error) {
          console.error('[Client] Error during cleanup:', error)
        }
      }
    }
  }, [world, wsUrl, onSetup])
  
    
  return (
    <div
      className='App absolute top-0 left-0 right-0 h-screen'
    >
      <style>{`
        .App__viewport {
          position: fixed;
          overflow: hidden;
          width: 100%;
          height: 100%;
          inset: 0;
        }
        .App__ui {
          position: absolute;
          inset: 0;
          pointer-events: none;
          user-select: none;
          display: ${ui.visible ? 'block' : 'block'};
          overflow: hidden;
          z-index: 10;
        }
      `}</style>
      <div className='App__viewport' ref={viewportRef} data-component="viewport">
        <div className='App__ui' ref={uiRef} data-component="ui">
          <CoreUI world={world} />
        </div>
      </div>
    </div>
  )
}
