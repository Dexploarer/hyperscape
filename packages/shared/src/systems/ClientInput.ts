import THREE from '../extras/three'
import { SystemBase } from './SystemBase'
import { EventType } from '../types/events'
import { MovementConfig } from '../utils/MovementUtils'
import { buttons, codeToProp } from '../extras/buttons'
import type { 
  World, WorldOptions, ControlEntry, ButtonEntry, 
  VectorEntry, ValueEntry, PointerEntry, ScreenEntry, TouchInfo,
  ControlAction, ControlsBinding, ControlBinding, XRInputSource, InputCommand,
  PointerNode, CustomPointerEvent
} from '../types'
import { InputButtons } from '../types/networking'

// Pre-allocated temp objects to avoid per-frame allocations
const _v3_1 = new THREE.Vector3()
const _v3_2 = new THREE.Vector3()
const _v3_3 = new THREE.Vector3()
const _quat_1 = new THREE.Quaternion()

// Constants
const LMB = 1
const RMB = 2
const MouseLeft = 'mouseLeft'
const MouseRight = 'mouseRight'
const HandednessLeft = 'left'
const HandednessRight = 'right'

const isBrowser = typeof window !== 'undefined'
let actionIds = 0

// Control type factories
const controlTypes = {
  mouseLeft: createButton,
  mouseRight: createButton,
  touchStick: createVector,
  scrollDelta: createValue,
  pointer: createPointer,
  screen: createScreen,
  xrLeftStick: createVector,
  xrLeftTrigger: createButton,
  xrLeftBtn1: createButton,
  xrLeftBtn2: createButton,
  xrRightStick: createVector,
  xrRightTrigger: createButton,
  xrRightBtn1: createButton,
  xrRightBtn2: createButton,
  touchA: createButton,
  touchB: createButton,
}

// Optimized pointer state
class PointerState {
  activePath = new Set<PointerNode>()
  cursor = 'default'
  pressedNodes = new Set<PointerNode>()
  propagationStopped = false
  
  update(hit: { node?: PointerNode } | null, pressed: boolean, released: boolean) {
    const newPath = new Set<PointerNode>()
    
    if (hit?.node) {
      let current: PointerNode | undefined = hit.node
      while (current) {
        newPath.add(current)
        current = current.parent as PointerNode
      }
    }
    
    // Handle enter/leave efficiently
    const createEvent = (): CustomPointerEvent => ({
      type: null,
      _propagationStopped: false,
      set(type: string) { this.type = type },
      stopPropagation() { this._propagationStopped = true }
    })
    
    for (const node of this.activePath) {
      if (!newPath.has(node)) {
        node.onPointerLeave?.(createEvent())
      }
    }
    
    for (const node of newPath) {
      if (!this.activePath.has(node)) {
        node.onPointerEnter?.(createEvent())
      }
    }
    
    // Handle press/release
    if (pressed && hit?.node) {
      this.propagationStopped = false
      for (const node of this.getOrderedPath(newPath)) {
        if (this.propagationStopped) break
        node.onPointerDown?.(createEvent())
        this.pressedNodes.add(node)
      }
    }
    
    if (released) {
      this.propagationStopped = false
      for (const node of this.pressedNodes) {
        if (this.propagationStopped) break
        node.onPointerUp?.(createEvent())
      }
      this.pressedNodes.clear()
    }
    
    // Handle hover
    this.cursor = 'default'
    for (const node of newPath) {
      if (node.cursor) {
        this.cursor = node.cursor
        break
      }
    }
    
    this.activePath = newPath
  }
  
  private getOrderedPath(pathSet: Set<PointerNode>): PointerNode[] {
    return Array.from(pathSet).reverse()
  }
  
  stopPropagation() {
    this.propagationStopped = true
  }
}

/**
 * Unified Client Input System
 * 
 * Handles all client input: keyboard, mouse, touch, XR, and input networking
 */
export class ClientInput extends SystemBase {
  // Control state
  controls: ControlsBinding[] = []
  actions: ControlAction[] = []
  buttonsDown = new Set<string>()
  isMac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false
  
  // Pointer state
  pointer = {
    locked: false,
    shouldLock: false,
    coords: new THREE.Vector3(),
    position: new THREE.Vector3(),
    delta: new THREE.Vector3(),
  }
  pointerState = new PointerState()
  screenHit: { node?: PointerNode } | null = null
  
  // Touch state
  touches = new Map<number, TouchInfo>()
  
  // Screen state
  screen = { width: 0, height: 0 }
  scroll = { delta: 0 }
  
  // XR state
  xrSession: XRSession | null = null
  
  // DOM elements
  viewport: HTMLElement | undefined
  ui: { active: boolean; getBoundingClientRect(): { width: number; height: number } } | null = null
  
  // Mouse button state
  lmbDown = false
  rmbDown = false
  
  // Input buffering for networking
  private inputBuffer: Array<{ command: InputCommand; sent: boolean; acknowledged: boolean; timestamp: number }> = []
  private sequenceNumber = 0
  private lastAcknowledgedSequence = -1
  private accumulator = 0
  private moveVector = new THREE.Vector3()
  private buttons = 0
  private viewAngles = new THREE.Quaternion()
  
  constructor(world: World) {
    super(world, { name: 'client-input', dependencies: { required: [], optional: [] }, autoCleanup: true })
  }
  
  async init(options: WorldOptions & { viewport?: HTMLElement; ui?: { active: boolean; getBoundingClientRect(): { width: number; height: number } } }): Promise<void> {
    if (!isBrowser) return
    
    this.viewport = options.viewport
    this.ui = options.ui || null
    
    if (!this.viewport) return
    
    this.screen.width = this.viewport.offsetWidth
    this.screen.height = this.viewport.offsetHeight
    
    // Setup event listeners
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
    this.viewport.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointermove', this.onPointerMove)
    this.viewport.addEventListener('touchstart', this.onTouchStart)
    this.viewport.addEventListener('touchmove', this.onTouchMove)
    this.viewport.addEventListener('touchend', this.onTouchEnd)
    this.viewport.addEventListener('touchcancel', this.onTouchEnd)
    this.viewport.addEventListener('pointerup', this.onPointerUp)
    this.viewport.addEventListener('wheel', this.onScroll, { passive: false })
    document.body.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('focus', this.onFocus)
    window.addEventListener('blur', this.onBlur)
  }
  
  start() {
    this.subscribe(EventType.XR_SESSION, (session: XRSession | null) => this.onXRSession(session))
    
    // Listen for input acknowledgments
    this.world.on('inputAck', this.handleInputAck.bind(this))
    
    // Setup keyboard input monitoring for movement
    this.setupMovementInput()
  }
  
  preFixedUpdate() {
    // Process scroll delta
    for (const control of this.controls) {
      const scrollDelta = control.entries.scrollDelta
      if (scrollDelta) {
        (scrollDelta as ValueEntry).value = this.scroll.delta
        if ((scrollDelta as ValueEntry).capture) break
      }
    }
    
    // Process XR input
    this.processXRInput()
  }
  
  update(delta: number) {
    // Update pointer state
    this.pointerState.update(
      this.screenHit,
      this.lmbDown && !this.pointerState.pressedNodes.size,
      !this.lmbDown && this.pointerState.pressedNodes.size > 0
    )
    
    // Apply cursor
    if (this.ui?.active && this.viewport) {
      this.viewport.style.cursor = this.pointerState.cursor
    }
    
    // Process networked input at fixed rate
    this.accumulator += delta
    const tickInterval = 1.0 / MovementConfig.clientTickRate
    
    while (this.accumulator >= tickInterval) {
      this.captureAndSendInput(tickInterval)
      this.accumulator -= tickInterval
    }
    
    // Clean old acknowledged inputs
    this.cleanInputBuffer()
  }
  
  postLateUpdate() {
    // Clear deltas
    this.pointer.delta.set(0, 0, 0)
    this.scroll.delta = 0
    
    // Clear button states
    for (const control of this.controls) {
      for (const key in control.entries) {
        const entry = control.entries[key] as ButtonEntry
        if (entry.$button) {
          entry.pressed = false
          entry.released = false
        }
      }
    }
    
    // Clear touch deltas
    for (const [_id, info] of this.touches) {
      info.delta.set(0, 0, 0)
    }
  }
  
  // Control binding API
  bind(options: { priority?: number; onRelease?: () => void; onTouch?: (info: TouchInfo) => boolean; onTouchEnd?: (info: TouchInfo) => boolean } = {}): ControlBinding {
    const entries: Record<string, ControlEntry> = {}
    const control: ControlsBinding = {
      options,
      entries,
      actions: null,
      api: {
        setActions: (value) => {
          control.actions = value
          if (value) {
            for (const action of value) {
              action.id = ++actionIds
            }
          }
          this.buildActions()
        },
        release: () => {
          const idx = this.controls.indexOf(control)
          if (idx === -1) return
          this.controls.splice(idx, 1)
          options.onRelease?.()
        },
      },
      release: () => {
        const idx = this.controls.indexOf(control)
        if (idx === -1) return
        this.controls.splice(idx, 1)
        options.onRelease?.()
      },
    }
    
    // Insert at priority
    const priority = options.priority ?? 0
    const idx = this.controls.findIndex(c => (c.options.priority ?? 0) <= priority)
    if (idx === -1) {
      this.controls.push(control)
    } else {
      this.controls.splice(idx, 0, control)
    }
    
    // Return proxy
    return new Proxy(control, {
      get(target, prop) {
        if (typeof prop === 'symbol') return undefined
        if (prop === 'release') return target.release
        if (prop in target.api) return target.api[prop]
        if (prop in entries) return entries[prop]
        if (buttons.has(prop)) {
          entries[prop] = createButton()
          return entries[prop]
        }
        const createType = controlTypes[prop as keyof typeof controlTypes]
        if (createType) {
          entries[prop] = createType()
          return entries[prop]
        }
        return undefined
      },
    }) as ControlBinding
  }
  
  private buildActions() {
    this.actions = []
    for (const control of this.controls) {
      if (!control.actions) continue
      for (const action of control.actions) {
        if (action.type !== 'custom') {
          if (this.actions.find(a => a.type === action.type)) continue
        }
        this.actions.push(action)
      }
    }
    this.emit('actions', this.actions)
  }
  
  // Event handlers
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.repeat || this.isInputFocused()) return
    
    if (e.code === 'Tab') e.preventDefault()
    
    const prop = codeToProp[e.code]
    this.buttonsDown.add(prop)
    
    // Update movement buttons
    this.handleButtonPress(e.code)
    
    for (const control of this.controls) {
      const button = control.entries[prop] as ButtonEntry
      if (button) {
        button.pressed = true
        button.down = true
        const capture = button.onPress?.()
        if (capture || button.capture) break
      }
    }
  }
  
  private onKeyUp = (e: KeyboardEvent) => {
    if (e.repeat || this.isInputFocused()) return
    
    if (e.code === 'MetaLeft' || e.code === 'MetaRight') {
      return this.releaseAllButtons()
    }
    
    const prop = codeToProp[e.code]
    this.buttonsDown.delete(prop)
    
    // Update movement buttons
    this.handleButtonRelease(e.code)
    
    for (const control of this.controls) {
      const button = control.entries[prop] as ButtonEntry
      if (button?.down) {
        button.down = false
        button.released = true
        button.onRelease?.()
      }
    }

    // RuneScape-style: no keyboard-driven movement; do not send network cancels on key release
  }
  
  private onPointerDown = (e: PointerEvent) => {
    type ExtendedPointerEvent = PointerEvent & { isCoreUI?: boolean }
    if ((e as ExtendedPointerEvent).isCoreUI) return
    this.checkPointerChanges(e)
  }
  
  private onPointerMove = (e: PointerEvent) => {
    type ExtendedPointerEvent = PointerEvent & { isCoreUI?: boolean }
    if ((e as ExtendedPointerEvent).isCoreUI || !this.viewport) return
    
    const rect = this.viewport.getBoundingClientRect()
    const offsetX = e.pageX - rect.left
    const offsetY = e.pageY - rect.top
    
    this.pointer.coords.x = Math.max(0, Math.min(1, offsetX / rect.width))
    this.pointer.coords.y = Math.max(0, Math.min(1, offsetY / rect.height))
    this.pointer.position.x = offsetX
    this.pointer.position.y = offsetY
    this.pointer.delta.x += e.movementX
    this.pointer.delta.y += e.movementY
  }
  
  private onPointerUp = (e: PointerEvent) => {
    type ExtendedPointerEvent = PointerEvent & { isCoreUI?: boolean }
    if ((e as ExtendedPointerEvent).isCoreUI) return
    this.checkPointerChanges(e)
  }
  
  private checkPointerChanges(e: PointerEvent) {
    const lmb = !!(e.buttons & LMB)
    const rmb = !!(e.buttons & RMB)
    
    // Left mouse
    if (!this.lmbDown && lmb) {
      this.lmbDown = true
      this.buttonsDown.add(MouseLeft)
      for (const control of this.controls) {
        const button = control.entries.mouseLeft as ButtonEntry
        if (button) {
          button.down = true
          button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    
    if (this.lmbDown && !lmb) {
      this.lmbDown = false
      this.buttonsDown.delete(MouseLeft)
      for (const control of this.controls) {
        const button = control.entries.mouseLeft as ButtonEntry
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
    
    // Right mouse
    if (!this.rmbDown && rmb) {
      this.rmbDown = true
      this.buttonsDown.add(MouseRight)
      for (const control of this.controls) {
        const button = control.entries.mouseRight as ButtonEntry
        if (button) {
          button.down = true
          button.pressed = true
          const capture = button.onPress?.()
          if (capture || button.capture) break
        }
      }
    }
    
    if (this.rmbDown && !rmb) {
      this.rmbDown = false
      this.buttonsDown.delete(MouseRight)
      for (const control of this.controls) {
        const button = control.entries.mouseRight as ButtonEntry
        if (button) {
          button.down = false
          button.released = true
          button.onRelease?.()
        }
      }
    }
  }
  
  private onTouchStart = (e: TouchEvent) => {
    type ExtendedTouchEvent = TouchEvent & { isCoreUI?: boolean }
    if ((e as ExtendedTouchEvent).isCoreUI) return
    // Ignore touches that begin on UI elements so mobile UI remains interactive
    const t = e.changedTouches && e.changedTouches[0]
    if (t) {
      const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null
      if (el && this.viewport && el !== (this.viewport as unknown as HTMLElement)) {
        return
      }
    }
    e.preventDefault()
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const info: TouchInfo = {
        id: touch.identifier,
        position: _v3_1.set(touch.clientX, touch.clientY, 0),
        prevPosition: _v3_2.set(touch.clientX, touch.clientY, 0),
        delta: _v3_3.set(0, 0, 0),
      }
      this.touches.set(info.id, info)
      
      for (const control of this.controls) {
        const consume = control.options.onTouch?.(info)
        if (consume) break
      }
    }
  }
  
  private onTouchMove = (e: TouchEvent) => {
    type ExtendedTouchEvent = TouchEvent & { isCoreUI?: boolean }
    if ((e as ExtendedTouchEvent).isCoreUI) return
    // Don't interfere with UI drags/gestures
    const t = e.changedTouches && e.changedTouches[0]
    if (t) {
      const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null
      if (el && this.viewport && el !== (this.viewport as unknown as HTMLElement)) {
        return
      }
    }
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const info = this.touches.get(touch.identifier)
      if (!info) continue
      
      const currentX = touch.clientX
      const currentY = touch.clientY
      info.delta.x += currentX - info.prevPosition.x
      info.delta.y += currentY - info.prevPosition.y
      info.position.x = currentX
      info.position.y = currentY
      info.prevPosition.x = currentX
      info.prevPosition.y = currentY
    }
  }
  
  private onTouchEnd = (e: TouchEvent) => {
    type ExtendedTouchEvent = TouchEvent & { isCoreUI?: boolean }
    if ((e as ExtendedTouchEvent).isCoreUI) return
    // Allow UI taps to complete and generate click events
    const t = e.changedTouches && e.changedTouches[0]
    if (t) {
      const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null
      if (el && this.viewport && el !== (this.viewport as unknown as HTMLElement)) {
        return
      }
    }
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const info = this.touches.get(touch.identifier)
      
      for (const control of this.controls) {
        const consume = control.options.onTouchEnd?.(info!)
        if (consume) break
      }
      
      this.touches.delete(touch.identifier)
    }
  }
  
  private onScroll = (e: WheelEvent) => {
    type ExtendedWheelEvent = WheelEvent & { isCoreUI?: boolean }
    if ((e as ExtendedWheelEvent).isCoreUI) return
    let delta = e.shiftKey ? e.deltaX : e.deltaY
    if (!this.isMac) delta = -delta
    this.scroll.delta += delta
  }
  
  private onContextMenu = (e: Event) => {
    e.preventDefault()
  }
  
  private onResize = () => {
    this.screen.width = this.viewport?.offsetWidth || 0
    this.screen.height = this.viewport?.offsetHeight || 0
  }
  
  private onFocus = () => {
    this.releaseAllButtons()
  }
  
  private onBlur = () => {
    this.releaseAllButtons()
  }
  
  private onPointerLockChange = () => {
    // Pointer lock disabled for UI
  }
  
  private onXRSession(session: XRSession | null) {
    this.xrSession = session
  }
  
  // XR input processing
  private processXRInput() {
    if (!this.xrSession) return
    
    this.xrSession.inputSources?.forEach((src: XRInputSource) => {
      if (!src.gamepad) return
      
      const isLeft = src.handedness === HandednessLeft
      const isRight = src.handedness === HandednessRight
      
      if (isLeft) {
        this.processXRController(src, 'xrLeftStick', 'xrLeftTrigger', 'xrLeftBtn1', 'xrLeftBtn2')
      } else if (isRight) {
        this.processXRController(src, 'xrRightStick', 'xrRightTrigger', 'xrRightBtn1', 'xrRightBtn2')
      }
    })
  }
  
  private processXRController(src: XRInputSource, stickKey: string, triggerKey: string, btn1Key: string, btn2Key: string) {
    for (const control of this.controls) {
      // Stick
      const stick = control.entries[stickKey] as VectorEntry
      if (stick) {
        stick.value.x = src.gamepad!.axes[2]
        stick.value.z = src.gamepad!.axes[3]
        if (stick.capture) break
      }
      
      // Trigger
      this.processXRButton(control, triggerKey, src.gamepad!.buttons[0].pressed)
      
      // Buttons
      this.processXRButton(control, btn1Key, src.gamepad!.buttons[4].pressed)
      this.processXRButton(control, btn2Key, src.gamepad!.buttons[5].pressed)
    }
  }
  
  private processXRButton(control: ControlsBinding, key: string, pressed: boolean) {
    const button = control.entries[key] as ButtonEntry
    if (!button) return
    
    if (pressed && !button.down) {
      button.pressed = true
      button.onPress?.()
    }
    if (!pressed && button.down) {
      button.released = true
      button.onRelease?.()
    }
    button.down = pressed
  }
  
  // Movement input handling
  private setupMovementInput() {
    if (this.world.rig) {
      setInterval(() => {
        this.viewAngles.copy(this.world.rig.quaternion)
      }, 16)
    }
  }
  
  private handleButtonPress(button: string): void {
    switch (button) {
      case 'KeyW':
      case 'ArrowUp':
        this.buttons |= InputButtons.FORWARD
        break
      case 'KeyS':
      case 'ArrowDown':
        this.buttons |= InputButtons.BACKWARD
        break
      case 'KeyA':
      case 'ArrowLeft':
        this.buttons |= InputButtons.LEFT
        break
      case 'KeyD':
      case 'ArrowRight':
        this.buttons |= InputButtons.RIGHT
        break
      case 'Space':
        this.buttons |= InputButtons.JUMP
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.buttons |= InputButtons.SPRINT
        break
      case 'ControlLeft':
      case 'ControlRight':
        this.buttons |= InputButtons.CROUCH
        break
    }
  }
  
  private handleButtonRelease(button: string): void {
    switch (button) {
      case 'KeyW':
      case 'ArrowUp':
        this.buttons &= ~InputButtons.FORWARD
        break
      case 'KeyS':
      case 'ArrowDown':
        this.buttons &= ~InputButtons.BACKWARD
        break
      case 'KeyA':
      case 'ArrowLeft':
        this.buttons &= ~InputButtons.LEFT
        break
      case 'KeyD':
      case 'ArrowRight':
        this.buttons &= ~InputButtons.RIGHT
        break
      case 'Space':
        this.buttons &= ~InputButtons.JUMP
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.buttons &= ~InputButtons.SPRINT
        break
      case 'ControlLeft':
      case 'ControlRight':
        this.buttons &= ~InputButtons.CROUCH
        break
    }
  }
  
  // Network input handling
  private captureAndSendInput(deltaTime: number): void {
    const now = performance.now()
    
    const input: InputCommand = {
      sequence: this.sequenceNumber++,
      timestamp: now,
      deltaTime: deltaTime,
      moveVector: this.moveVector.clone(),
      buttons: this.buttons,
      viewAngles: this.viewAngles.clone(),
      checksum: this.calculateChecksum()
    }
    
    const buffered = {
      command: input,
      sent: false,
      acknowledged: false,
      timestamp: now
    }
    
    this.inputBuffer.push(buffered)
    
    // RuneScape-style: no keyboard-driven movement; do not send moveRequest from keyboard
    
    // Trim buffer
    while (this.inputBuffer.length > MovementConfig.inputBufferSize) {
      this.inputBuffer.shift()
    }
  }
  
  private handleInputAck(data: { sequence: number; corrections?: unknown }): void {
    this.lastAcknowledgedSequence = data.sequence
    
    for (const buffered of this.inputBuffer) {
      if (buffered.command.sequence <= data.sequence) {
        buffered.acknowledged = true
      }
    }
    
    if (data.corrections) {
      this.world.emit('serverCorrection', {
        sequence: data.sequence,
        corrections: data.corrections
      })
    }
  }
  
  private cleanInputBuffer(): void {
    const now = performance.now()
    this.inputBuffer = this.inputBuffer.filter(buffered => {
      if (!buffered.acknowledged) return true
      const age = now - buffered.timestamp
      return age < 100
    })
  }
  
  private calculateChecksum(): number {
    const data = 
      this.sequenceNumber +
      this.buttons +
      Math.floor(this.moveVector.x * 1000) +
      Math.floor(this.moveVector.z * 1000)
    return data % 65536
  }
  
  // Helper methods
  private releaseAllButtons() {
    for (const control of this.controls) {
      for (const key in control.entries) {
        const button = control.entries[key] as ButtonEntry
        if (button.$button && button.down) {
          button.released = true
          button.down = false
          button.onRelease?.()
        }
      }
    }
  }
  
  private isInputFocused() {
    return document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA'
  }
  
  setScreenHit(screenHit: { node?: PointerNode } | null) {
    this.screenHit = screenHit
  }
  
  setMoveTarget(target: THREE.Vector3 | null): void {
    if (target) {
      const player = this.world.entities.player
      if (player && 'position' in player) {
        _v3_1.subVectors(target, player.position as THREE.Vector3).setY(0).normalize()
        this.moveVector.copy(_v3_1)
      }
    } else {
      this.moveVector.set(0, 0, 0)
    }
  }
  
  getUnacknowledgedInputs(): InputCommand[] {
    return this.inputBuffer
      .filter(b => !b.acknowledged)
      .map(b => b.command)
  }
  
  // Plugin compatibility methods
  goto(x: number, y: number, z?: number): void {
    console.log(`goto: ${x}, ${y}, ${z || 0}`)
  }
  
  async followEntity(entityId: string): Promise<void> {
    console.log(`followEntity: ${entityId}`)
  }
  
  stopAll(): void {
    this.releaseAllButtons()
    this.moveVector.set(0, 0, 0)
    this.buttons = 0
  }
  
  destroy() {
    if (!isBrowser) return
    
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    this.viewport?.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.viewport?.removeEventListener('touchstart', this.onTouchStart)
    this.viewport?.removeEventListener('touchmove', this.onTouchMove)
    this.viewport?.removeEventListener('touchend', this.onTouchEnd)
    this.viewport?.removeEventListener('touchcancel', this.onTouchEnd)
    this.viewport?.removeEventListener('pointerup', this.onPointerUp)
    this.viewport?.removeEventListener('wheel', this.onScroll)
    document.body.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('focus', this.onFocus)
    window.removeEventListener('blur', this.onBlur)
  }
}

// Factory functions for control entries
function createButton(): ButtonEntry {
  return {
    $button: true,
    down: false,
    pressed: false,
    released: false,
    capture: false,
    onPress: null,
    onRelease: null,
  }
}

function createVector(): VectorEntry {
  return {
    $vector: true,
    value: new THREE.Vector3(),
    capture: false,
  }
}

function createValue(): ValueEntry {
  return {
    $value: true,
    value: null,
    capture: false,
  }
}

function createPointer(): PointerEntry {
  const coords = new THREE.Vector3()
  const position = new THREE.Vector3()
  const delta = new THREE.Vector3()
  
  return {
    $pointer: true,
    get coords() { return coords },
    get position() { return position },
    get delta() { return delta },
    get locked() { return false },
    lock() {},
    unlock() {},
  } as PointerEntry
}

function createScreen(): ScreenEntry {
  return {
    $screen: true,
    get width() { return 0 },
    get height() { return 0 },
  }
}
