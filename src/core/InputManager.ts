export class InputManager {
  public forward: boolean = false;
  public backward: boolean = false;
  public left: boolean = false;
  public right: boolean = false;
  public sprint: boolean = false;
  public jump: boolean = false;
  public interactPressed: boolean = false;
  public cameraSwitchPressed: boolean = false;
  public hornPressed: boolean = false;
  public headlightPressed: boolean = false;
  public resetPressed: boolean = false;
  public mapPressed: boolean = false;
  public mutePressed: boolean = false;

  // Mouse camera rotation
  public mouseDeltaX: number = 0;
  public mouseDeltaY: number = 0;
  public touchCameraDeltaX: number = 0;
  public touchCameraDeltaY: number = 0;
  public isPointerLocked: boolean = false;
  public isMouseDown: boolean = false;
  public isTouchDevice: boolean = false;

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.setupKeyboard();
    this.setupMouse();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling on space/arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.sprint = true;
          break;
        case 'Space':
          this.jump = true;
          break;
        case 'KeyF':
          this.interactPressed = true;
          break;
        case 'KeyC':
          this.cameraSwitchPressed = true;
          break;
        case 'KeyH':
          this.hornPressed = true;
          break;
        case 'KeyL':
          this.headlightPressed = true;
          break;
        case 'KeyR':
          this.resetPressed = true;
          break;
        case 'KeyM':
          this.mapPressed = true;
          break;
        case 'KeyN':
          this.mutePressed = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.sprint = false;
          break;
        case 'Space':
          this.jump = false;
          break;
        case 'KeyF':
          this.interactPressed = false;
          break;
        case 'KeyC':
          this.cameraSwitchPressed = false;
          break;
        case 'KeyH':
          this.hornPressed = false;
          break;
        case 'KeyL':
          this.headlightPressed = false;
          break;
        case 'KeyR':
          this.resetPressed = false;
          break;
        case 'KeyM':
          this.mapPressed = false;
          break;
        case 'KeyN':
          this.mutePressed = false;
          break;
      }
    });
  }

  private setupMouse(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        if (!this.isPointerLocked) {
          this.canvas.requestPointerLock?.();
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked || this.isMouseDown) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });
  }

  public consumeInteract(): boolean {
    if (this.interactPressed) {
      this.interactPressed = false;
      return true;
    }
    return false;
  }

  public consumeCameraSwitch(): boolean {
    if (this.cameraSwitchPressed) {
      this.cameraSwitchPressed = false;
      return true;
    }
    return false;
  }

  public consumeHeadlight(): boolean {
    if (this.headlightPressed) {
      this.headlightPressed = false;
      return true;
    }
    return false;
  }

  public consumeReset(): boolean {
    if (this.resetPressed) {
      this.resetPressed = false;
      return true;
    }
    return false;
  }

  public consumeMap(): boolean {
    if (this.mapPressed) {
      this.mapPressed = false;
      return true;
    }
    return false;
  }

  public consumeMute(): boolean {
    if (this.mutePressed) {
      this.mutePressed = false;
      return true;
    }
    return false;
  }

  public addTouchCameraDelta(dx: number, dy: number): void {
    this.touchCameraDeltaX += dx;
    this.touchCameraDeltaY += dy;
  }

  public getAndResetMouseDelta(): { x: number; y: number } {
    const delta = {
      x: this.mouseDeltaX + this.touchCameraDeltaX,
      y: this.mouseDeltaY + this.touchCameraDeltaY
    };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.touchCameraDeltaX = 0;
    this.touchCameraDeltaY = 0;
    return delta;
  }
}
