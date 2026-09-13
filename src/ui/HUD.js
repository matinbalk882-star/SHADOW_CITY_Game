/**
 * HUD.js
 * In-game Heads-Up Display:
 * - Coin balance in top right
 * - Phone, Camera Mode, Pause Menu quick buttons
 * - Virtual joystick & sprint toggle
 * - Jump, Attack, Aim, and 8-slot GTA Weapon Wheel
 * - In-vehicle steering buttons & drift button
 * - Gun shop prompt & optical sniper scope reticle
 */

import { TextureGenerator } from '../core/TextureGenerator.js';

export class HUD {
  constructor(game) {
    this.game = game;
    this.weaponsData = TextureGenerator.getWeaponData();

    this.container = null;
    this.weaponWheelOpen = false;
    this.shopPromptVisible = false;

    this.initHUD();
  }

  initHUD() {
    this.container = document.createElement('div');
    this.container.id = 'game-hud';
    this.container.className = 'game-hud-root';
    document.body.appendChild(this.container);

    this.render();
  }

  render() {
    const coins = this.game.state.coins.toLocaleString('fa-IR');
    const curWeapon = this.game.weaponManager.getCurrentWeaponData();
    const isGun = this.game.weaponManager.isGun();

    this.container.innerHTML = `
      <!-- Top Right Bar: Coins, Phone, Camera Mode, Menu -->
      <div class="hud-top-right">
        <div class="hud-coin-badge" id="hud-coin-badge">
          <span class="coin-icon">🪙</span>
          <span class="coin-amount" id="hud-coin-amount">${coins}</span>
        </div>

        <button class="hud-circle-btn phone-btn" id="btn-phone" title="گوشی موبایل">
          📱
        </button>

        <button class="hud-circle-btn cam-btn" id="btn-cam-mode" title="تغییر زاویه دید">
          🎥 <span class="cam-badge" id="cam-badge-text">3P</span>
        </button>

        <button class="hud-pill-btn menu-btn" id="btn-ingame-menu">
          ⚙️ منوی بازی
        </button>
      </div>

      <!-- Crosshair / Aim Reticle -->
      <div class="cyber-crosshair" id="hud-crosshair"></div>

      <!-- Optical Sniper Scope Overlay -->
      <div class="sniper-scope-overlay hidden" id="sniper-scope-overlay">
        <div class="scope-vignette"></div>
        <div class="scope-reticle">
          <div class="scope-line-h"></div>
          <div class="scope-line-v"></div>
          <div class="scope-ticks"></div>
          <div class="scope-range">DISTANCE: 120m [CALIBRATED]</div>
        </div>
      </div>

      <!-- Shop Prompt when near shopkeeper -->
      <div class="shop-prompt-container hidden" id="shop-prompt">
        <button class="shop-prompt-btn" id="btn-open-shop">
          🛒 خرید تفنگ
        </button>
      </div>

      <!-- ON-FOOT CONTROLS (ANDROIDS / TOUCH) -->
      <div class="onfoot-controls" id="onfoot-controls">
        <!-- Bottom Left: Virtual Joystick -->
        <div class="joystick-zone" id="joystick-zone">
          <div class="joystick-base">
            <div class="joystick-thumb" id="joystick-thumb"></div>
          </div>
        </div>

        <!-- Middle Left: Sprint Toggle Button -->
        <button class="hud-btn sprint-btn" id="btn-sprint">
          🏃 دویدن
        </button>

        <!-- Middle Right: Aim Button (hidden for Bat) -->
        <button class="hud-btn aim-btn ${isGun ? '' : 'hidden'}" id="btn-aim">
          🎯 Aim / زوم
        </button>

        <!-- Middle Right: Weapon Wheel Button -->
        <button class="hud-btn wheel-btn" id="btn-weapon-wheel">
          🔫 سلاح‌ها (${curWeapon.nameFa})
        </button>

        <!-- Bottom Right: Jump Button (slightly larger) -->
        <button class="hud-btn jump-btn" id="btn-jump">
          ⬆️ پرش
        </button>

        <!-- Bottom Right: Attack / Shoot Button -->
        <button class="hud-btn attack-btn" id="btn-attack">
          💥 ${isGun ? 'شلیک' : 'ضربه'}
        </button>
      </div>

      <!-- IN-VEHICLE CONTROLS (WHEN INSIDE CAR) -->
      <div class="invehicle-controls hidden" id="invehicle-controls">
        <!-- Bottom Left: Steer Left & Steer Right side by side -->
        <div class="steer-buttons-group">
          <button class="steer-btn steer-left" id="btn-steer-left">◀ چپ</button>
          <button class="steer-btn steer-right" id="btn-steer-right">راست ▶</button>
        </div>

        <!-- Middle: Drift & Horn -->
        <div class="vehicle-mid-controls">
          <button class="hud-btn drift-btn" id="btn-drift">💨 دریفت</button>
          <button class="hud-btn horn-btn" id="btn-horn">📢 بوق</button>
        </div>

        <!-- Bottom Right: Gas, Brake, Exit -->
        <div class="vehicle-right-controls">
          <button class="hud-btn exit-car-btn" id="btn-exit-car">🚪 پیاده شدن</button>
          <button class="vehicle-pedal-btn brake-btn" id="btn-car-brake">🛑 ترمز / دنده عقب</button>
          <button class="vehicle-pedal-btn gas-btn" id="btn-car-gas">⚡ گاز</button>
        </div>
      </div>

      <!-- GTA-STYLE 8-SLOT WEAPON WHEEL -->
      <div class="weapon-wheel-overlay hidden" id="weapon-wheel-overlay">
        <div class="weapon-wheel-center">
          <div class="wheel-title">انتخاب سلاح</div>
          <div class="wheel-slots-ring" id="wheel-slots-ring">
            ${this.renderWeaponWheelSlots()}
          </div>
          <button class="wheel-close-btn" id="btn-wheel-close">بستن</button>
        </div>
      </div>

      <!-- Toast Container -->
      <div class="toast-container" id="hud-toasts"></div>
    `;

    this.attachEvents();
  }

  renderWeaponWheelSlots() {
    // 8 slots arranged radially (45 deg apart)
    const slots = [
      { id: 'bat', label: 'چماق', icon: '🏏', angle: 0 },
      { id: 'pistol', label: 'پیستول', icon: '🔫', angle: 45 },
      { id: 'ak47', label: 'کلاشینکف', icon: '💥', angle: 90 },
      { id: 'lmg', label: 'صد تیر', icon: '⚡', angle: 135 },
      { id: 'sniper', label: 'اسنایپ', icon: '🎯', angle: 180 },
      { id: 'rpg', label: 'آرپیچی', icon: '🚀', angle: 225 },
      { id: 'fist', label: 'مشت', icon: '👊', angle: 270 },
      { id: 'knife', label: 'چاقو', icon: '🔪', angle: 315 },
    ];

    const owned = this.game.state.ownedWeapons;
    const current = this.game.state.currentWeapon;

    return slots.map(s => {
      const isOwned = owned.includes(s.id) || s.id === 'fist' || s.id === 'bat';
      const isSelected = (current === s.id);
      const rad = (s.angle - 90) * (Math.PI / 180);
      const radius = 110;
      const x = Math.round(Math.cos(rad) * radius);
      const y = Math.round(Math.sin(rad) * radius);

      return `
        <div class="wheel-slot ${isSelected ? 'selected' : ''} ${isOwned ? '' : 'locked'}"
             style="transform: translate(${x}px, ${y}px);"
             data-weapon="${s.id}">
          <div class="slot-icon">${s.icon}</div>
          <div class="slot-name">${s.label}</div>
          ${!isOwned ? '<div class="slot-lock">🔒</div>' : ''}
        </div>
      `;
    }).join('');
  }

  updateCoins(amount) {
    const el = document.getElementById('hud-coin-amount');
    if (el) el.textContent = amount.toLocaleString('fa-IR');
  }

  updateWeaponHUD() {
    const curWeapon = this.game.weaponManager.getCurrentWeaponData();
    const isGun = this.game.weaponManager.isGun();

    const aimBtn = document.getElementById('btn-aim');
    if (aimBtn) {
      if (isGun) {
        aimBtn.classList.remove('hidden');
      } else {
        aimBtn.classList.add('hidden');
      }
    }

    const wheelBtn = document.getElementById('btn-weapon-wheel');
    if (wheelBtn) {
      wheelBtn.textContent = `🔫 سلاح‌ها (${curWeapon.nameFa})`;
    }

    const atkBtn = document.getElementById('btn-attack');
    if (atkBtn) {
      atkBtn.innerHTML = `💥 ${isGun ? 'شلیک' : 'ضربه'}`;
    }

    // Update weapon wheel items selection
    const wheelSlots = document.querySelectorAll('.wheel-slot');
    wheelSlots.forEach(slot => {
      if (slot.getAttribute('data-weapon') === curWeapon.id) {
        slot.classList.add('selected');
      } else {
        slot.classList.remove('selected');
      }
    });
  }

  setAimOverlay(isAiming, weaponId) {
    const scopeOverlay = document.getElementById('sniper-scope-overlay');
    const crosshair = document.getElementById('hud-crosshair');

    if (isAiming) {
      if (weaponId === 'sniper') {
        if (scopeOverlay) scopeOverlay.classList.remove('hidden');
        if (crosshair) crosshair.classList.add('hidden');
        this.game.camera.fov = 15; // Optical zoom
      } else {
        if (scopeOverlay) scopeOverlay.classList.add('hidden');
        if (crosshair) crosshair.classList.remove('hidden');
        this.game.camera.fov = 40; // ADS zoom
      }
    } else {
      if (scopeOverlay) scopeOverlay.classList.add('hidden');
      if (crosshair) crosshair.classList.remove('hidden');
      this.game.camera.fov = 60; // Normal fov
    }
    this.game.camera.updateProjectionMatrix();
  }

  onEnterVehicle(vehicle) {
    document.getElementById('onfoot-controls').classList.add('hidden');
    document.getElementById('invehicle-controls').classList.remove('hidden');
    this.setAimOverlay(false, null);
  }

  onExitVehicle() {
    document.getElementById('onfoot-controls').classList.remove('hidden');
    document.getElementById('invehicle-controls').classList.add('hidden');
  }

  toggleWeaponWheel() {
    this.weaponWheelOpen = !this.weaponWheelOpen;
    const overlay = document.getElementById('weapon-wheel-overlay');
    if (overlay) {
      if (this.weaponWheelOpen) {
        this.game.sound.playClick();
        overlay.classList.remove('hidden');
        const ring = document.getElementById('wheel-slots-ring');
        if (ring) ring.innerHTML = this.renderWeaponWheelSlots();
        this.attachWheelSlotClicks();
      } else {
        overlay.classList.add('hidden');
      }
    }
  }

  showShopPrompt(show) {
    const prompt = document.getElementById('shop-prompt');
    if (!prompt) return;
    if (show && !this.shopPromptVisible) {
      this.shopPromptVisible = true;
      prompt.classList.remove('hidden');
    } else if (!show && this.shopPromptVisible) {
      this.shopPromptVisible = false;
      prompt.classList.add('hidden');
    }
  }

  checkShopInteract() {
    if (this.shopPromptVisible) {
      this.game.menuManager.openGunShop();
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('hud-toasts');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `cyber-toast toast-${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  attachEvents() {
    // Phone button
    const btnPhone = document.getElementById('btn-phone');
    if (btnPhone) btnPhone.onclick = () => this.game.phoneManager.togglePhone();

    // Camera Mode button
    const btnCam = document.getElementById('btn-cam-mode');
    if (btnCam) {
      btnCam.onclick = () => {
        const mode = this.game.player.cycleCameraMode();
        const badge = document.getElementById('cam-badge-text');
        if (badge) {
          badge.textContent = mode === 0 ? '3P' : (mode === 1 ? '1P' : '2P');
        }
      };
    }

    // Pause Menu button
    const btnMenu = document.getElementById('btn-ingame-menu');
    if (btnMenu) btnMenu.onclick = () => this.game.menuManager.openPauseMenu();

    // Sprint button (toggle)
    const btnSprint = document.getElementById('btn-sprint');
    if (btnSprint) {
      btnSprint.onclick = () => {
        this.game.player.isSprinting = !this.game.player.isSprinting;
        if (this.game.player.isSprinting) {
          btnSprint.classList.add('active');
        } else {
          btnSprint.classList.remove('active');
        }
      };
    }

    // Jump button
    const btnJump = document.getElementById('btn-jump');
    if (btnJump) {
      btnJump.onclick = () => this.game.player.jump();
      btnJump.ontouchstart = (e) => { e.preventDefault(); this.game.player.jump(); };
    }

    // Attack button
    const btnAttack = document.getElementById('btn-attack');
    if (btnAttack) {
      btnAttack.onclick = () => this.game.weaponManager.attack();
      btnAttack.ontouchstart = (e) => { e.preventDefault(); this.game.weaponManager.attack(); };
    }

    // Aim button
    const btnAim = document.getElementById('btn-aim');
    if (btnAim) {
      btnAim.onclick = () => this.game.weaponManager.toggleAim();
    }

    // Weapon Wheel button
    const btnWheel = document.getElementById('btn-weapon-wheel');
    if (btnWheel) btnWheel.onclick = () => this.toggleWeaponWheel();

    const btnWheelClose = document.getElementById('btn-wheel-close');
    if (btnWheelClose) btnWheelClose.onclick = () => this.toggleWeaponWheel();

    // Shop prompt button
    const btnShop = document.getElementById('btn-open-shop');
    if (btnShop) btnShop.onclick = () => this.game.menuManager.openGunShop();

    // Vehicle buttons: Steer left / right
    const btnSteerL = document.getElementById('btn-steer-left');
    if (btnSteerL) {
      btnSteerL.ontouchstart = (e) => { e.preventDefault(); this.game.input.vehicleSteerLeft = true; };
      btnSteerL.ontouchend = (e) => { e.preventDefault(); this.game.input.vehicleSteerLeft = false; };
      btnSteerL.onmousedown = () => { this.game.input.vehicleSteerLeft = true; };
      btnSteerL.onmouseup = () => { this.game.input.vehicleSteerLeft = false; };
    }

    const btnSteerR = document.getElementById('btn-steer-right');
    if (btnSteerR) {
      btnSteerR.ontouchstart = (e) => { e.preventDefault(); this.game.input.vehicleSteerRight = true; };
      btnSteerR.ontouchend = (e) => { e.preventDefault(); this.game.input.vehicleSteerRight = false; };
      btnSteerR.onmousedown = () => { this.game.input.vehicleSteerRight = true; };
      btnSteerR.onmouseup = () => { this.game.input.vehicleSteerRight = false; };
    }

    // Vehicle Gas & Brake
    const btnGas = document.getElementById('btn-car-gas');
    if (btnGas) {
      btnGas.ontouchstart = (e) => { e.preventDefault(); this.game.input.vehicleGas = true; };
      btnGas.ontouchend = (e) => { e.preventDefault(); this.game.input.vehicleGas = false; };
      btnGas.onmousedown = () => { this.game.input.vehicleGas = true; };
      btnGas.onmouseup = () => { this.game.input.vehicleGas = false; };
    }

    const btnBrake = document.getElementById('btn-car-brake');
    if (btnBrake) {
      btnBrake.ontouchstart = (e) => { e.preventDefault(); this.game.input.vehicleBrake = true; };
      btnBrake.ontouchend = (e) => { e.preventDefault(); this.game.input.vehicleBrake = false; };
      btnBrake.onmousedown = () => { this.game.input.vehicleBrake = true; };
      btnBrake.onmouseup = () => { this.game.input.vehicleBrake = false; };
    }

    // Vehicle Drift & Horn
    const btnDrift = document.getElementById('btn-drift');
    if (btnDrift) {
      btnDrift.ontouchstart = (e) => { e.preventDefault(); this.game.input.vehicleDrift = true; };
      btnDrift.ontouchend = (e) => { e.preventDefault(); this.game.input.vehicleDrift = false; };
      btnDrift.onmousedown = () => { this.game.input.vehicleDrift = true; };
      btnDrift.onmouseup = () => { this.game.input.vehicleDrift = false; };
    }

    const btnHorn = document.getElementById('btn-horn');
    if (btnHorn) {
      btnHorn.onclick = () => {
        if (this.game.player.inVehicle) this.game.player.inVehicle.honk();
      };
    }

    // Exit Car button
    const btnExitCar = document.getElementById('btn-exit-car');
    if (btnExitCar) {
      btnExitCar.onclick = () => this.game.player.exitVehicle();
    }

    // Virtual Joystick Setup
    const jZone = document.getElementById('joystick-zone');
    const jThumb = document.getElementById('joystick-thumb');
    if (jZone && jThumb) {
      this.game.input.setupJoystickZone(jZone, jThumb);
    }

    this.attachWheelSlotClicks();
  }

  attachWheelSlotClicks() {
    const slots = document.querySelectorAll('.wheel-slot');
    slots.forEach(slot => {
      slot.onclick = () => {
        const wid = slot.getAttribute('data-weapon');
        if (this.game.state.ownedWeapons.includes(wid)) {
          this.game.sound.playClick();
          this.game.weaponManager.equipWeapon(wid);
          this.toggleWeaponWheel();
        } else {
          this.game.sound.playError();
          this.showToast('این سلاح را هنوز از اسلحه فروشی نخریده‌اید!', 'error');
        }
      };
    });
  }

  updateProximityPrompts() {
    if (!this.game.player || !this.game.city) return;
    const pPos = this.game.player.getPosition();
    const shopPos = this.game.city.gunShopKeeperPosition;

    const distToShop = pPos.distanceTo(shopPos);
    if (distToShop < 3.8) {
      this.showShopPrompt(true);
    } else {
      this.showShopPrompt(false);
    }
  }
}
