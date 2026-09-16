import { InputManager } from './InputManager';
import { PlayerMode } from './CameraController';

export class TouchControls {
  private input: InputManager;
  private joystickBase: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;
  private joystickContainer: HTMLElement | null = null;

  // Joystick touch tracking
  private joystickTouchId: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private maxRadius = 50;

  // Camera touch tracking
  private cameraTouchId: number | null = null;
  private lastCameraTouch = { x: 0, y: 0 };

  // Pinch zoom tracking
  private pinchStartDist = 0;
  private isPinching = false;

  // Touch action elements
  private btnDrive: HTMLElement | null = null;
  private driveIcon: HTMLElement | null = null;
  private driveLabel: HTMLElement | null = null;
  private btnJump: HTMLElement | null = null;
  private jumpIcon: HTMLElement | null = null;
  private jumpLabel: HTMLElement | null = null;
  private btnSprint: HTMLElement | null = null;
  private sprintIcon: HTMLElement | null = null;
  private sprintLabel: HTMLElement | null = null;

  public isMobileDevice: boolean = false;

  constructor(input: InputManager) {
    this.input = input;
    this.isMobileDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 900;

    this.initElements();
    this.setupJoystick();
    this.setupTouchLook();
    this.setupActionButtons();
    this.setupQuickBar();
  }

  private initElements(): void {
    this.joystickContainer = document.getElementById('joystick-container');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickKnob = document.getElementById('joystick-knob');

    this.btnDrive = document.getElementById('btn-touch-drive');
    this.driveIcon = document.getElementById('touch-drive-icon');
    this.driveLabel = document.getElementById('touch-drive-label');

    this.btnJump = document.getElementById('btn-touch-jump');
    this.jumpIcon = document.getElementById('touch-jump-icon');
    this.jumpLabel = document.getElementById('touch-jump-label');

    this.btnSprint = document.getElementById('btn-touch-sprint');
    this.sprintIcon = document.getElementById('touch-sprint-icon');
    this.sprintLabel = document.getElementById('touch-sprint-label');

    // Show mobile controls if touch device
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
      if (this.isMobileDevice) {
        mobileControls.classList.add('active');
        document.body.classList.add('mobile-mode');
      }
    }
  }

  private setupJoystick(): void {
    if (!this.joystickBase || !this.joystickKnob || !this.joystickContainer) return;

    const onStart = (e: TouchEvent) => {
      if (this.joystickTouchId !== null) return;
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;

      const rect = this.joystickBase!.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      this.updateJoystickPosition(touch.clientX, touch.clientY);
    };

    // Also allow touching anywhere in the bottom-left zone to steer
    window.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (this.joystickTouchId !== null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (
            touch.clientX < window.innerWidth * 0.42 &&
            touch.clientY > window.innerHeight * 0.4 &&
            !this.isInteractiveElement(touch.target)
          ) {
            this.joystickTouchId = touch.identifier;
            const rect = this.joystickBase!.getBoundingClientRect();
            this.joystickCenter = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };
            this.updateJoystickPosition(touch.clientX, touch.clientY);
            break;
          }
        }
      },
      { passive: false }
    );

    const onMove = (e: TouchEvent) => {
      if (this.joystickTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.updateJoystickPosition(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (this.joystickTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.resetJoystick();
          break;
        }
      }
    };

    this.joystickContainer.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: false });
    window.addEventListener('touchcancel', onEnd, { passive: false });
  }

  private isInteractiveElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    return (
      target.closest('#joystick-container') !== null ||
      target.closest('.touch-actions-cluster') !== null ||
      target.closest('.mobile-top-pills') !== null ||
      target.closest('#minimap-card') !== null ||
      target.closest('#btn-toggle-map') !== null ||
      target.closest('#btn-toggle-sound') !== null ||
      target.closest('#world-map-modal') !== null ||
      target.closest('#start-modal') !== null ||
      target.tagName === 'BUTTON'
    );
  }

  private updateJoystickPosition(clientX: number, clientY: number): void {
    if (!this.joystickKnob) return;

    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(dist, this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    this.joystickKnob.style.transform = 'translate(' + knobX.toFixed(1) + 'px, ' + knobY.toFixed(1) + 'px)';

    // Digital & thresholded directional inputs
    const normX = dx / this.maxRadius;
    const normY = dy / this.maxRadius;

    this.input.forward = normY < -0.28;
    this.input.backward = normY > 0.28;
    this.input.left = normX < -0.28;
    this.input.right = normX > 0.28;
  }

  private resetJoystick(): void {
    this.joystickTouchId = null;
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(0px, 0px)';
    }
    this.input.forward = false;
    this.input.backward = false;
    this.input.left = false;
    this.input.right = false;
  }

  private setupTouchLook(): void {
    window.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 2) {
          // Detect pinch start
          this.isPinching = true;
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          this.pinchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          return;
        }

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          // Right half of screen or middle upper area
          if (touch.clientX > window.innerWidth * 0.38 && !this.isInteractiveElement(touch.target)) {
            if (this.cameraTouchId === null) {
              this.cameraTouchId = touch.identifier;
              this.lastCameraTouch = { x: touch.clientX, y: touch.clientY };
            }
          }
        }
      },
      { passive: false }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        // Handle pinch zoom
        if (this.isPinching && e.touches.length === 2) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          const diff = currentDist - this.pinchStartDist;
          if (Math.abs(diff) > 70) {
            this.input.cameraSwitchPressed = true;
            this.pinchStartDist = currentDist;
          }
          return;
        }

        if (this.cameraTouchId === null) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.cameraTouchId) {
            const dx = touch.clientX - this.lastCameraTouch.x;
            const dy = touch.clientY - this.lastCameraTouch.y;

            // Touch look sensitivity
            this.input.addTouchCameraDelta(dx * 1.8, dy * 1.8);

            this.lastCameraTouch = { x: touch.clientX, y: touch.clientY };
            break;
          }
        }
      },
      { passive: false }
    );

    const onCameraTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        this.isPinching = false;
      }
      if (this.cameraTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
          break;
        }
      }
    };

    window.addEventListener('touchend', onCameraTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onCameraTouchEnd, { passive: false });
  }

  private setupActionButtons(): void {
    // Drive / Dismount Button
    if (this.btnDrive) {
      const triggerInteract = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.input.interactPressed = true;
      };
      this.btnDrive.addEventListener('touchstart', triggerInteract, { passive: false });
      this.btnDrive.addEventListener('click', triggerInteract);
    }

    // Jump / Handbrake Button
    if (this.btnJump) {
      const onJumpStart = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.input.jump = true;
      };
      const onJumpEnd = (e: Event) => {
        e.preventDefault();
        this.input.jump = false;
      };
      this.btnJump.addEventListener('touchstart', onJumpStart, { passive: false });
      this.btnJump.addEventListener('touchend', onJumpEnd, { passive: false });
      this.btnJump.addEventListener('touchcancel', onJumpEnd, { passive: false });
      this.btnJump.addEventListener('mousedown', onJumpStart);
      this.btnJump.addEventListener('mouseup', onJumpEnd);
    }

    // Sprint / Turbo Boost Button
    if (this.btnSprint) {
      const onSprintStart = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.input.sprint = true;
      };
      const onSprintEnd = (e: Event) => {
        e.preventDefault();
        this.input.sprint = false;
      };
      this.btnSprint.addEventListener('touchstart', onSprintStart, { passive: false });
      this.btnSprint.addEventListener('touchend', onSprintEnd, { passive: false });
      this.btnSprint.addEventListener('touchcancel', onSprintEnd, { passive: false });
      this.btnSprint.addEventListener('mousedown', onSprintStart);
      this.btnSprint.addEventListener('mouseup', onSprintEnd);
    }
  }

  private setupQuickBar(): void {
    const bindBtn = (id: string, action: () => void) => {
      const el = document.getElementById(id);
      if (!el) return;
      const handler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        action();
      };
      el.addEventListener('touchstart', handler, { passive: false });
      el.addEventListener('click', handler);
    };

    bindBtn('btn-touch-cam', () => {
      this.input.cameraSwitchPressed = true;
    });

    bindBtn('btn-touch-horn', () => {
      this.input.hornPressed = true;
    });

    bindBtn('btn-touch-light', () => {
      this.input.headlightPressed = true;
    });

    bindBtn('btn-touch-reset', () => {
      this.input.resetPressed = true;
    });

    bindBtn('btn-touch-fs', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    bindBtn('btn-touch-info', () => {
      const panel = document.getElementById('controls-panel');
      if (panel) {
        panel.classList.toggle('mobile-open');
      }
    });
  }

  public updateUI(playerMode: PlayerMode, canMount: boolean, mountType: 'BIKE' | 'CAR' | null): void {
    if (!this.btnDrive || !this.driveIcon || !this.driveLabel) return;

    if (playerMode === 'ON_FOOT') {
      if (canMount) {
        this.btnDrive.style.opacity = '1';
        this.btnDrive.style.pointerEvents = 'auto';
        this.btnDrive.classList.add('glow-pulse');
        if (mountType === 'BIKE') {
          this.driveIcon.textContent = '🏍️';
          this.driveLabel.textContent = 'RIDE BIKE';
        } else {
          this.driveIcon.textContent = '🚗';
          this.driveLabel.textContent = 'DRIVE CAR';
        }
      } else {
        this.btnDrive.style.opacity = '0.35';
        this.btnDrive.style.pointerEvents = 'none';
        this.btnDrive.classList.remove('glow-pulse');
        this.driveIcon.textContent = '🚶';
        this.driveLabel.textContent = 'WALK';
      }

      if (this.jumpIcon && this.jumpLabel) {
        this.jumpIcon.textContent = '🦘';
        this.jumpLabel.textContent = 'JUMP';
      }
      if (this.sprintIcon && this.sprintLabel) {
        this.sprintIcon.textContent = '⚡';
        this.sprintLabel.textContent = 'SPRINT';
      }
    } else {
      // In Vehicle
      this.btnDrive.style.opacity = '1';
      this.btnDrive.style.pointerEvents = 'auto';
      this.btnDrive.classList.remove('glow-pulse');
      this.driveIcon.textContent = '🚶';
      this.driveLabel.textContent = 'DISMOUNT';

      if (this.jumpIcon && this.jumpLabel) {
        this.jumpIcon.textContent = '🛑';
        this.jumpLabel.textContent = playerMode === 'BIKE' ? 'BRAKE' : 'HANDBRAKE';
      }
      if (this.sprintIcon && this.sprintLabel) {
        this.sprintIcon.textContent = '🚀';
        this.sprintLabel.textContent = playerMode === 'BIKE' ? 'NITRO' : 'TURBO';
      }
    }
  }
}
