export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
}

export class InputManager {
  public state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false
  };

  public mouseDeltaX: number = 0;
  public mouseDeltaY: number = 0;
  public zoomDelta: number = 0;
  public isPointerLocked: boolean = false;
  private isMouseDown: boolean = false;
  private targetElement: HTMLElement;

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseDownBound: (e: MouseEvent) => void;
  private onMouseUpBound: (e: MouseEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;
  private onPointerLockChangeBound: () => void;

  constructor(targetElement: HTMLElement) {
    this.targetElement = targetElement;

    this.onKeyDownBound = this.onKeyDown.bind(this);
    this.onKeyUpBound = this.onKeyUp.bind(this);
    this.onMouseMoveBound = this.onMouseMove.bind(this);
    this.onMouseDownBound = this.onMouseDown.bind(this);
    this.onMouseUpBound = this.onMouseUp.bind(this);
    this.onWheelBound = this.onWheel.bind(this);
    this.onPointerLockChangeBound = this.onPointerLockChange.bind(this);

    this.attachEvents();
  }

  private attachEvents(): void {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    this.targetElement.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    this.targetElement.addEventListener('wheel', this.onWheelBound, { passive: false });
    document.addEventListener('pointerlockchange', this.onPointerLockChangeBound);
  }

  public requestPointerLock(): void {
    try {
      this.targetElement.requestPointerLock?.();
    } catch (err) {
      console.warn('Pointer lock request ignored:', err);
    }
  }

  public exitPointerLock(): void {
    try {
      if (document.pointerLockElement === this.targetElement) {
        document.exitPointerLock?.();
      }
    } catch {}
  }

  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.targetElement;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    const code = e.code;

    if (code === 'KeyW' || code === 'ArrowUp') this.state.forward = true;
    if (code === 'KeyS' || code === 'ArrowDown') this.state.backward = true;
    if (code === 'KeyA' || code === 'ArrowLeft') this.state.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') this.state.right = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.state.sprint = true;
    if (code === 'Space') this.state.jump = true;
  }

  private onKeyUp(e: KeyboardEvent): void {
    const code = e.code;

    if (code === 'KeyW' || code === 'ArrowUp') this.state.forward = false;
    if (code === 'KeyS' || code === 'ArrowDown') this.state.backward = false;
    if (code === 'KeyA' || code === 'ArrowLeft') this.state.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') this.state.right = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.state.sprint = false;
    if (code === 'Space') this.state.jump = false;
  }

  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0 || e.button === 2) {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      // Auto request pointer lock on left click if not locked
      if (e.button === 0 && !this.isPointerLocked) {
        this.requestPointerLock();
      }
    }
  }

  private onMouseUp(): void {
    this.isMouseDown = false;
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isPointerLocked) {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
    } else if (this.isMouseDown) {
      const dx = (typeof e.movementX === 'number' && e.movementX !== 0) ? e.movementX : (e.clientX - this.lastMouseX);
      const dy = (typeof e.movementY === 'number' && e.movementY !== 0) ? e.movementY : (e.clientY - this.lastMouseY);
      this.mouseDeltaX += dx;
      this.mouseDeltaY += dy;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.zoomDelta += Math.sign(e.deltaY);
  }

  /**
   * Consumes and resets the accumulated mouse deltas. Call once per frame tick.
   */
  public consumeMouseDelta(): { deltaX: number; deltaY: number } {
    const deltaX = this.mouseDeltaX;
    const deltaY = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { deltaX, deltaY };
  }

  /**
   * Consumes and resets zoom delta. Call once per frame tick.
   */
  public consumeZoomDelta(): number {
    const zoom = this.zoomDelta;
    this.zoomDelta = 0;
    return zoom;
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    this.targetElement.removeEventListener('mousedown', this.onMouseDownBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    this.targetElement.removeEventListener('wheel', this.onWheelBound);
    document.removeEventListener('pointerlockchange', this.onPointerLockChangeBound);
  }
}
