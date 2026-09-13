/**
 * PhoneManager.js
 * In-game Smartphone UI with 5 Apps:
 * 1. تلفن (Dialer: dialing 1000 spawns black Lamborghini)
 * 2. بانک (Bank: displays coin balance)
 * 3. رادیو (Radio: plays "دل من عاشق چشماته خوشگلی والا" with volume control)
 * 4. عکس (Camera: Front/Back selfie mode with zoom & flash)
 * 5. گالری (Gallery: photo viewer & delete)
 */

import * as THREE from 'three';

export class PhoneManager {
  constructor(game) {
    this.game = game;
    this.sound = game.sound;
    this.isOpen = false;
    this.currentApp = null; // null: Home Screen, 'dialer', 'bank', 'radio', 'camera', 'gallery'

    // Dialer state
    this.dialedNumber = '';

    // Camera app state
    this.cameraFacing = 'back'; // 'back' | 'front'
    this.cameraZoom = 1.0;

    this.container = null;
    this.initPhoneUI();
  }

  initPhoneUI() {
    this.container = document.createElement('div');
    this.container.id = 'phone-container';
    this.container.className = 'phone-wrapper hidden';
    document.body.appendChild(this.container);
    this.render();
  }

  togglePhone() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.sound.playClick();
      this.container.classList.remove('hidden');
      this.render();
    } else {
      this.sound.playClick();
      this.container.classList.add('hidden');
      this.currentApp = null;
    }
  }

  openApp(appName) {
    this.sound.playClick();
    this.currentApp = appName;
    this.render();
  }

  goHome() {
    this.sound.playClick();
    this.currentApp = null;
    this.render();
  }

  render() {
    if (!this.isOpen) return;

    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    let appContent = '';
    if (this.currentApp === 'dialer') {
      appContent = this.renderDialerApp();
    } else if (this.currentApp === 'bank') {
      appContent = this.renderBankApp();
    } else if (this.currentApp === 'radio') {
      appContent = this.renderRadioApp();
    } else if (this.currentApp === 'camera') {
      appContent = this.renderCameraApp();
    } else if (this.currentApp === 'gallery') {
      appContent = this.renderGalleryApp();
    } else {
      appContent = this.renderHomeScreen();
    }

    this.container.innerHTML = `
      <div class="cyber-phone">
        <!-- Status Bar -->
        <div class="phone-status-bar">
          <span class="phone-time">${timeStr}</span>
          <div class="phone-status-icons">
            <span>5G 📶</span>
            <span>100% 🔋</span>
          </div>
        </div>

        <!-- Phone Body -->
        <div class="phone-screen">
          ${appContent}
        </div>

        <!-- Bottom Home Bar -->
        <div class="phone-nav-bar">
          <button class="phone-home-btn" id="phone-btn-home">●</button>
          <button class="phone-close-btn" id="phone-btn-close">✕ بستن گوشی</button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderHomeScreen() {
    return `
      <div class="phone-home">
        <div class="phone-app-grid">
          <div class="phone-app-item" data-app="dialer">
            <div class="app-icon dialer-icon">📞</div>
            <span class="app-label">تلفن</span>
          </div>
          <div class="phone-app-item" data-app="bank">
            <div class="app-icon bank-icon">🏦</div>
            <span class="app-label">بانک</span>
          </div>
          <div class="phone-app-item" data-app="radio">
            <div class="app-icon radio-icon">📻</div>
            <span class="app-label">رادیو</span>
          </div>
          <div class="phone-app-item" data-app="camera">
            <div class="app-icon camera-icon">📷</div>
            <span class="app-label">عکس</span>
          </div>
          <div class="phone-app-item" data-app="gallery">
            <div class="app-icon gallery-icon">🖼️</div>
            <span class="app-label">گالری</span>
          </div>
        </div>
        <div class="phone-widget">
          <div class="widget-title">SHADOW OS 4.0</div>
          <div class="widget-desc">سکه فعال: 🪙 ${this.game.state.coins.toLocaleString('fa-IR')}</div>
        </div>
      </div>
    `;
  }

  /* =========================================================================
     APP 1: DIALER (تلفن) - Dials 1000 for Lamborghini
     ========================================================================= */
  renderDialerApp() {
    return `
      <div class="phone-app dialer-app">
        <div class="app-header">
          <button class="back-btn" id="app-back">‹</button>
          <span>شماره‌گیر</span>
        </div>
        <div class="dialer-display">
          <span class="dialer-number">${this.dialedNumber || '---'}</span>
        </div>
        <div class="dialpad">
          <button class="key-btn" data-key="1">1</button>
          <button class="key-btn" data-key="2">2</button>
          <button class="key-btn" data-key="3">3</button>
          <button class="key-btn" data-key="4">4</button>
          <button class="key-btn" data-key="5">5</button>
          <button class="key-btn" data-key="6">6</button>
          <button class="key-btn" data-key="7">7</button>
          <button class="key-btn" data-key="8">8</button>
          <button class="key-btn" data-key="9">9</button>
          <button class="key-btn" data-key="*">*</button>
          <button class="key-btn" data-key="0">0</button>
          <button class="key-btn" data-key="#">#</button>
        </div>
        <div class="dialer-actions">
          <button class="call-btn" id="btn-call">📞 تماس</button>
          <button class="del-btn" id="btn-del">⌫</button>
        </div>
      </div>
    `;
  }

  onDialKeyPress(key) {
    this.sound.playPhoneDial();
    if (this.dialedNumber.length < 8) {
      this.dialedNumber += key;
      this.render();
    }
  }

  onDialDelete() {
    this.sound.playClick();
    this.dialedNumber = this.dialedNumber.slice(0, -1);
    this.render();
  }

  onCall() {
    if (!this.dialedNumber) return;

    if (this.dialedNumber === '1000') {
      // Secret Lamborghini Spawner Code
      this.sound.playPhoneRing();
      this.dialedNumber = 'در حال تماس...';
      this.render();

      setTimeout(() => {
        this.sound.playPhoneRing();
      }, 700);

      setTimeout(() => {
        // Disconnect and spawn black Lamborghini in front of player
        this.sound.playClick();
        this.game.vehicleManager.spawnLamborghiniInFrontOfPlayer();
        this.game.hud.showToast('🏎️ لامبورگینی مشکی با موفقیت جلومون تلپورت شد!', 'success');
        this.dialedNumber = '';
        this.togglePhone();
      }, 1500);
    } else {
      this.sound.playPhoneRing();
      this.dialedNumber = 'شماره نامعتبر است';
      this.render();
      setTimeout(() => {
        this.sound.playError();
        this.dialedNumber = '';
        this.render();
      }, 1200);
    }
  }

  /* =========================================================================
     APP 2: BANK (بانک)
     ========================================================================= */
  renderBankApp() {
    return `
      <div class="phone-app bank-app">
        <div class="app-header">
          <button class="back-btn" id="app-back">‹</button>
          <span>بانک ملی شهر سایبر</span>
        </div>
        <div class="bank-card">
          <div class="card-chip">💳</div>
          <div class="card-number">**** **** **** 8820</div>
          <div class="card-holder">SHADOW CITY VIP</div>
          <div class="card-balance-title">موجودی حساب:</div>
          <div class="card-balance">🪙 ${this.game.state.coins.toLocaleString('fa-IR')} سکه</div>
        </div>
        <div class="bank-stats">
          <div class="stat-row">
            <span>تعداد قتل‌ها:</span>
            <strong>${this.game.state.stats.kills}</strong>
          </div>
          <div class="stat-row">
            <span>ماشین‌های منفجر شده:</span>
            <strong>${this.game.state.stats.carsDestroyed}</strong>
          </div>
          <div class="stat-row">
            <span>وضعیت کارت:</span>
            <strong style="color: #00ff66;">فعال و نامحدود</strong>
          </div>
        </div>
      </div>
    `;
  }

  /* =========================================================================
     APP 3: RADIO (رادیو) - Song: "دل من عاشق چشماته خوشگلی والا"
     ========================================================================= */
  renderRadioApp() {
    const isPlaying = this.sound.isRadioPlaying;
    const vol = Math.round(this.game.state.settings.radioVolume * 100);

    return `
      <div class="phone-app radio-app">
        <div class="app-header">
          <button class="back-btn" id="app-back">‹</button>
          <span>رادیو شادو</span>
        </div>
        <div class="radio-disc ${isPlaying ? 'spinning' : ''}">
          🎵
        </div>
        <div class="song-info">
          <div class="song-title">دل من عاشق چشماته خوشگلی والا</div>
          <div class="song-artist">آهنگ شاد ایرانی 6/8</div>
        </div>
        <div class="radio-visualizer ${isPlaying ? 'active' : ''}">
          <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
        </div>
        <div class="radio-controls">
          <button class="radio-play-btn" id="btn-radio-toggle">
            ${isPlaying ? '⏸️ توقف آهنگ' : '▶️ پخش آهنگ'}
          </button>
        </div>
        <div class="radio-volume-section">
          <div class="vol-label">تنظیم موسیقی رادیو: <span id="vol-val">${vol}%</span></div>
          <input type="range" id="radio-vol-slider" min="0" max="100" value="${vol}" />
        </div>
      </div>
    `;
  }

  toggleRadio() {
    if (this.sound.isRadioPlaying) {
      this.sound.stopRadio();
    } else {
      this.sound.playRadio();
    }
    this.render();
  }

  setRadioVolume(val) {
    const vol = val / 100;
    this.game.state.settings.radioVolume = vol;
    this.sound.setRadioVolume(vol);
    this.game.saveState();
    const label = document.getElementById('vol-val');
    if (label) label.textContent = `${val}%`;
  }

  /* =========================================================================
     APP 4: CAMERA (عکس) - Front & Back Mode + Zoom
     ========================================================================= */
  renderCameraApp() {
    return `
      <div class="phone-app camera-app">
        <div class="app-header">
          <button class="back-btn" id="app-back">‹</button>
          <span>دوربین عکاسی</span>
          <button class="switch-cam-btn" id="btn-switch-cam">🔄 ${this.cameraFacing === 'back' ? 'دوربین جلو' : 'دوربین عقب'}</button>
        </div>
        <div class="camera-viewfinder" id="cam-viewfinder">
          <div class="cam-crosshair"></div>
          <div class="cam-mode-tag">${this.cameraFacing === 'back' ? '📸 دید شهر (دوربین عقب)' : '🤳 سلفی کاراکتر (دوربین جلو)'}</div>
        </div>
        <div class="camera-zoom-ctrl">
          <span>زوم:</span>
          <input type="range" id="cam-zoom-slider" min="10" max="30" value="${Math.round(this.cameraZoom * 10)}" />
          <span id="zoom-val">${this.cameraZoom.toFixed(1)}x</span>
        </div>
        <div class="camera-actions">
          <button class="shutter-btn" id="btn-shutter">🔘 گرفتن عکس</button>
        </div>
      </div>
    `;
  }

  switchCamera() {
    this.sound.playClick();
    this.cameraFacing = this.cameraFacing === 'back' ? 'front' : 'back';
    this.render();
  }

  takePhoto() {
    this.sound.playCameraClick();

    // Trigger Screen Flash
    const flash = document.createElement('div');
    flash.className = 'camera-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 250);

    // Capture Canvas frame
    try {
      const glCanvas = this.game.renderer.domElement;
      const dataUrl = glCanvas.toDataURL('image/jpeg', 0.85);

      const photoItem = {
        id: Date.now().toString(),
        dataUrl: dataUrl,
        date: new Date().toLocaleDateString('fa-IR'),
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        mode: this.cameraFacing === 'front' ? 'سلفی جلو' : 'دوربین عقب'
      };

      this.game.state.gallery.unshift(photoItem);
      this.game.saveState();
      this.game.hud.showToast('📸 عکس در گالری ذخیره شد!', 'success');
    } catch (e) {
      console.warn('Failed to snapshot canvas:', e);
    }
  }

  /* =========================================================================
     APP 5: GALLERY (گالری)
     ========================================================================= */
  renderGalleryApp() {
    const photos = this.game.state.gallery || [];

    let photosHtml = '';
    if (photos.length === 0) {
      photosHtml = `<div class="empty-gallery">هنوز هیچ عکسی نگرفته‌اید! از برنامه دوربین عکس بگیرید.</div>`;
    } else {
      photosHtml = `
        <div class="gallery-grid">
          ${photos.map((p, idx) => `
            <div class="gallery-thumb" data-idx="${idx}">
              <img src="${p.dataUrl}" alt="Photo ${idx}" />
              <div class="photo-badge">${p.mode}</div>
              <button class="photo-del-btn" data-del-id="${p.id}">🗑️</button>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="phone-app gallery-app">
        <div class="app-header">
          <button class="back-btn" id="app-back">‹</button>
          <span>گالری تصاویر (${photos.length})</span>
        </div>
        <div class="gallery-content">
          ${photosHtml}
        </div>
      </div>
    `;
  }

  deletePhoto(id) {
    this.sound.playClick();
    this.game.state.gallery = this.game.state.gallery.filter(p => p.id !== id);
    this.game.saveState();
    this.render();
    this.game.hud.showToast('عکس از گالری حذف شد.', 'info');
  }

  attachEvents() {
    // Nav buttons
    const btnHome = document.getElementById('phone-btn-home');
    if (btnHome) btnHome.onclick = () => this.goHome();

    const btnClose = document.getElementById('phone-btn-close');
    if (btnClose) btnClose.onclick = () => this.togglePhone();

    const btnBack = document.getElementById('app-back');
    if (btnBack) btnBack.onclick = () => this.goHome();

    // App icons click
    const appIcons = this.container.querySelectorAll('.phone-app-item');
    appIcons.forEach(icon => {
      icon.onclick = () => {
        const app = icon.getAttribute('data-app');
        if (app) this.openApp(app);
      };
    });

    // Dialer events
    const keyBtns = this.container.querySelectorAll('.key-btn');
    keyBtns.forEach(k => {
      k.onclick = () => this.onDialKeyPress(k.getAttribute('data-key'));
    });

    const btnCall = document.getElementById('btn-call');
    if (btnCall) btnCall.onclick = () => this.onCall();

    const btnDel = document.getElementById('btn-del');
    if (btnDel) btnDel.onclick = () => this.onDialDelete();

    // Radio events
    const btnRadio = document.getElementById('btn-radio-toggle');
    if (btnRadio) btnRadio.onclick = () => this.toggleRadio();

    const volSlider = document.getElementById('radio-vol-slider');
    if (volSlider) {
      volSlider.oninput = (e) => this.setRadioVolume(e.target.value);
    }

    // Camera events
    const btnSwitchCam = document.getElementById('btn-switch-cam');
    if (btnSwitchCam) btnSwitchCam.onclick = () => this.switchCamera();

    const btnShutter = document.getElementById('btn-shutter');
    if (btnShutter) btnShutter.onclick = () => this.takePhoto();

    const zoomSlider = document.getElementById('cam-zoom-slider');
    if (zoomSlider) {
      zoomSlider.oninput = (e) => {
        this.cameraZoom = e.target.value / 10;
        const zv = document.getElementById('zoom-val');
        if (zv) zv.textContent = `${this.cameraZoom.toFixed(1)}x`;
      };
    }

    // Gallery delete events
    const delBtns = this.container.querySelectorAll('.photo-del-btn');
    delBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-id');
        if (id) this.deletePhoto(id);
      };
    });
  }
}
