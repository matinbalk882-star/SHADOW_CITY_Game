/**
 * InputManager.js
 * Handles Mobile Touch Joystick, Touch Buttons, and Desktop Keyboard/Mouse input.
 */

export class InputManager {
  constructor(game) {
    this.game = game;

    // Movement vector
    this.moveX = 0;
    this.moveZ = 0;

    // Camera look delta
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;

    // Vehicle input flags
    this.vehicleGas = false;
    this.vehicleBrake = false;
    this.vehicleSteerLeft = false;
    this.vehicleSteerRight = false;
    this.vehicleDrift = false;

    // Virtual Joystick state
    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickRadius = 50;

    // Camera touch drag state
    this.cameraTouchId = null;
    this.lastTouchPos = { x: 0, y: 0 };

    this.keys = {};
    this.initKeyboardMouse();
    this.initTouchControls();
  }

  initKeyboardMouse() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyP') {
        this.game.phoneManager.togglePhone();
      }
      if (e.code === 'KeyC') {
        this.game.player.cycleCameraMode();
      }
      if (e.code === 'KeyF') {
        this.toggleVehicleEnterExit();
      }
      if (e.code === 'KeyE') {
        this.game.hud.checkShopInteract();
      }
      if (e.code === 'Space') {
        this.game.player.jump();
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        this.game.hud.toggleWeaponWheel();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.game.player.isSprinting = true;
      }
      if (e.code === 'Escape') {
        this.game.menuManager.togglePauseMenu();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.game.player.isSprinting = false;
      }
    });

    // Mouse aiming & firing
    window.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'CANVAS' && !this.game.phoneManager.isOpen && !this.game.menuManager.isPaused) {
        if (e.button === 0) { // Left click
          this.game.weaponManager.attack();
        } else if (e.button === 2) { // Right click
          this.game.weaponManager.toggleAim();
        }
      }
    });

    window.addEventListener('contextmenu', (e) => {
      if (e.target.tagName === 'CANVAS') e.preventDefault();
    });

    // Mouse Look (when mouse moves on canvas)
    let isMouseDownLook = false;
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && e.target.tagName === 'CANVAS') isMouseDownLook = true;
    });
    window.addEventListener('mouseup', () => { isMouseDownLook = false; });
    window.addEventListener('mousemove', (e) => {
      if (isMouseDownLook && !this.game.phoneManager.isOpen && !this.game.menuManager.isPaused) {
        this.lookDeltaX += e.movementX;
        this.lookDeltaY += e.movementY;
      }
    });
  }

  initTouchControls() {
    // Touch event listeners for canvas/screen drag
    window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    window.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
  }

  handleTouchStart(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      // If touch on right half of screen and not on a button: Camera Look Drag
      if (t.clientX > window.innerWidth * 0.45 && !this.isTouchOnUI(t.target)) {
        if (this.cameraTouchId === null) {
          this.cameraTouchId = t.identifier;
          this.lastTouchPos = { x: t.clientX, y: t.clientY };
        }
      }
    }
  }

  handleTouchMove(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];

      // Camera look drag
      if (t.identifier === this.cameraTouchId) {
        const dx = t.clientX - this.lastTouchPos.x;
        const dy = t.clientY - this.lastTouchPos.y;
        this.lookDeltaX += dx * 1.6;
        this.lookDeltaY += dy * 1.6;
        this.lastTouchPos = { x: t.clientX, y: t.clientY };
      }

      // Joystick drag
      if (t.identifier === this.joystickTouchId && this.joystickActive) {
        const dx = t.clientX - this.joystickCenter.x;
        const dy = t.clientY - this.joystickCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = this.joystickRadius;

        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const stickX = Math.cos(angle) * (clampedDist / maxDist);
        const stickZ = Math.sin(angle) * (clampedDist / maxDist);

        this.moveX = stickX;
        this.moveZ = stickZ;

        // Visual thumbstick update
        const thumb = document.getElementById('joystick-thumb');
        if (thumb) {
          const px = Math.cos(angle) * clampedDist;
          const py = Math.sin(angle) * clampedDist;
          thumb.style.transform = `translate(${px}px, ${py}px)`;
        }
      }
    }
  }

  handleTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.cameraTouchId) {
        this.cameraTouchId = null;
      }
      if (t.identifier === this.joystickTouchId) {
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.moveX = 0;
        this.moveZ = 0;
        const thumb = document.getElementById('joystick-thumb');
        if (thumb) thumb.style.transform = 'translate(0px, 0px)';
      }
    }
  }

  isTouchOnUI(target) {
    if (!target) return false;
    return target.closest('.hud-btn, .cyber-phone, .modal-cyber, .menu-panel, .weapon-wheel, #joystick-zone');
  }

  setupJoystickZone(zoneElem, thumbElem) {
    zoneElem.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.joystickActive = true;
      this.joystickTouchId = t.identifier;
      const rect = zoneElem.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.handleTouchMove(e);
    }, { passive: false });
  }

  toggleVehicleEnterExit() {
    if (this.game.player.inVehicle) {
      this.game.player.exitVehicle();
    } else {
      // Find nearest car to enter
      const pPos = this.game.player.getPosition();
      if (this.game.vehicleManager.lamborghini) {
        const dist = pPos.distanceTo(this.game.vehicleManager.lamborghini.position);
        if (dist < 4.0) {
          this.game.player.enterVehicle(this.game.vehicleManager.lamborghini);
          return;
        }
      }
      for (const car of this.game.vehicleManager.trafficCars) {
        if (car.isDestroyed) continue;
        const dist = pPos.distanceTo(car.position);
        if (dist < 3.5) {
          this.game.player.enterVehicle(car);
          return;
        }
      }
    }
  }

  update() {
    // Merge Keyboard with Joystick
    if (!this.joystickActive) {
      let kx = 0;
      let kz = 0;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) kx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) kx += 1;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) kz -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) kz += 1;

      this.moveX = kx;
      this.moveZ = kz;

      // Vehicle keyboard inputs
      this.vehicleGas = !!(this.keys['KeyW'] || this.keys['ArrowUp']);
      this.vehicleBrake = !!(this.keys['KeyS'] || this.keys['ArrowDown']);
      this.vehicleSteerLeft = !!(this.keys['KeyA'] || this.keys['ArrowLeft']);
      this.vehicleSteerRight = !!(this.keys['KeyD'] || this.keys['ArrowRight']);
      this.vehicleDrift = !!this.keys['Space'];
    }

    // Reset look delta per frame
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
  }
}
