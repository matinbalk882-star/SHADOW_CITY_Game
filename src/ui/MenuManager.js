/**
 * MenuManager.js
 * Manages:
 * - Main Menu (SHADOW CITY Cyberpunk title, Play, Character, Fullscreen, Coins)
 * - Loading Screen
 * - Character Customizer (Boy/Girl, 20 outfits, hair & skin colors, 3D preview)
 * - Cyberpunk Gun Shop Modal (5 guns with square images, prices, buy validation)
 * - In-Game Pause Menu (Settings: Quality, Audio, Aim, Change Character, Exit)
 */

import * as THREE from 'three';
import { CharacterMeshBuilder, OUTFIT_DATA } from '../characters/CharacterCustomizer.js';
import { TextureGenerator } from '../core/TextureGenerator.js';

export class MenuManager {
  constructor(game) {
    this.game = game;
    this.sound = game.sound;
    this.weaponsData = TextureGenerator.getWeaponData();

    this.currentScreen = 'main_menu'; // 'main_menu' | 'loading' | 'in_game' | 'character_customizer'
    this.isPaused = false;

    // Character preview mini-scene
    this.previewRenderer = null;
    this.previewScene = null;
    this.previewCamera = null;
    this.previewMesh = null;
    this.previewRotation = 0;
    this.previewAnimId = null;

    this.container = null;
    this.initMenus();
  }

  initMenus() {
    this.container = document.createElement('div');
    this.container.id = 'menu-root';
    this.container.className = 'menu-root';
    document.body.appendChild(this.container);

    this.renderMainMenu();
  }

  /* =========================================================================
     1. MAIN MENU
     ========================================================================= */
  renderMainMenu() {
    this.currentScreen = 'main_menu';
    const coins = this.game.state.coins.toLocaleString('fa-IR');

    this.container.innerHTML = `
      <div class="cyber-main-menu">
        <!-- Top Bar with Coins & Fullscreen -->
        <div class="menu-top-bar">
          <button class="fullscreen-btn" id="btn-fullscreen">⛶ تمام صفحه</button>
          <div class="menu-coin-badge">
            <span class="coin-icon">🪙</span>
            <span class="coin-amount">${coins} سکه</span>
          </div>
        </div>

        <!-- Center Cyberpunk Header & Play/Character Buttons -->
        <div class="menu-center-box">
          <div class="game-cyber-title">
            <span class="glitch-text" data-text="SHADOW CITY">SHADOW CITY</span>
            <div class="game-subtitle">جهان آزاد • شبیه‌ساز گانگستری</div>
          </div>

          <div class="menu-main-buttons">
            <button class="cyber-btn primary-btn" id="btn-play">
              <span class="btn-glow"></span>
              ▶️ شروع بازی (PLAY)
            </button>

            <button class="cyber-btn secondary-btn" id="btn-character">
              👤 انتخاب کاراکتر (CHARACTER)
            </button>
          </div>
        </div>

        <!-- Cyberpunk Footer Credits -->
        <div class="menu-footer">
          <span>SHADOW CITY v1.0 • ANDROID & PC EDITION</span>
        </div>
      </div>
    `;

    this.attachMainMenuEvents();
  }

  attachMainMenuEvents() {
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
      btnPlay.onclick = () => {
        this.sound.playClick();
        this.startLoading();
      };
    }

    const btnChar = document.getElementById('btn-character');
    if (btnChar) {
      btnChar.onclick = () => {
        this.sound.playClick();
        this.openCharacterCustomizer();
      };
    }

    const btnFull = document.getElementById('btn-fullscreen');
    if (btnFull) {
      btnFull.onclick = () => this.toggleFullscreen();
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  /* =========================================================================
     2. LOADING SCREEN
     ========================================================================= */
  startLoading() {
    this.currentScreen = 'loading';
    this.container.innerHTML = `
      <div class="cyber-loading-screen">
        <div class="loading-center">
          <div class="loading-title">SHADOW CITY</div>
          <div class="loading-spinner"></div>
          <div class="loading-bar-wrap">
            <div class="loading-bar-fill" id="load-bar"></div>
          </div>
          <div class="loading-status" id="load-status">در حال بارگذاری شبیه‌ساز شهر و ترافیک...</div>
        </div>
      </div>
    `;

    let progress = 0;
    const bar = document.getElementById('load-bar');
    const status = document.getElementById('load-status');

    const interval = setInterval(() => {
      progress += Math.random() * 22 + 12;
      if (progress > 100) progress = 100;
      if (bar) bar.style.width = `${progress}%`;

      if (progress < 40 && status) status.textContent = 'در حال ساخت ساختمان‌ها و آسمان‌خراش‌ها...';
      else if (progress < 75 && status) status.textContent = 'در حال اسپان ۱۰۰+ عابر پیاده و ۶۰+ ماشین ترافیک...';
      else if (status) status.textContent = 'آماده‌سازی ورود به شادو سیتی...';

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.enterGame();
        }, 300);
      }
    }, 120);
  }

  enterGame() {
    this.currentScreen = 'in_game';
    this.container.innerHTML = ''; // Clear menu
    this.game.startSimulation();
  }

  /* =========================================================================
     3. CHARACTER CUSTOMIZATION (پسر / دختر + 20 لباس و شلوار + رنگ پوست و مو)
     ========================================================================= */
  openCharacterCustomizer() {
    this.currentScreen = 'character_customizer';
    const char = this.game.state.character;
    const gender = char.gender || 'boy';
    const outfits = OUTFIT_DATA[gender] || OUTFIT_DATA.boy;

    this.container.innerHTML = `
      <div class="cyber-customizer-screen">
        <!-- Top Center Gender Switcher -->
        <div class="customizer-gender-bar">
          <button class="gender-btn ${gender === 'girl' ? 'active' : ''}" id="btn-gender-girl">
            👧 دختر
          </button>
          <button class="gender-btn ${gender === 'boy' ? 'active' : ''}" id="btn-gender-boy">
            👦 پسر
          </button>
        </div>

        <!-- Main Body: 3D Preview on left, Controls on right -->
        <div class="customizer-body">
          <div class="preview-3d-box" id="preview-canvas-container">
            <div class="preview-drag-hint">برای چرخاندن کاراکتر بکشید 🔄</div>
          </div>

          <div class="customizer-controls-panel">
            <div class="panel-section">
              <label class="section-label">لباس و بالاتنه (۵ مدل برای ${gender === 'boy' ? 'پسر' : 'دختر'}):</label>
              <div class="outfit-options-grid" id="shirt-options">
                ${outfits.shirts.map((s, idx) => `
                  <button class="outfit-chip ${char.shirtIndex === idx ? 'selected' : ''}" data-shirt-idx="${idx}">
                    ${s.name}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="panel-section">
              <label class="section-label">شلوار و پایین‌تنه (۵ مدل برای ${gender === 'boy' ? 'پسر' : 'دختر'}):</label>
              <div class="outfit-options-grid" id="pants-options">
                ${outfits.pants.map((p, idx) => `
                  <button class="outfit-chip ${char.pantsIndex === idx ? 'selected' : ''}" data-pants-idx="${idx}">
                    ${p.name}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="panel-section">
              <label class="section-label">رنگ پوست:</label>
              <div class="color-swatches-row" id="skin-swatches">
                ${OUTFIT_DATA.skinTones.map(st => `
                  <div class="color-swatch ${char.skinColor === st ? 'selected' : ''}" style="background: ${st};" data-skin="${st}"></div>
                `).join('')}
              </div>
            </div>

            <div class="panel-section">
              <label class="section-label">رنگ مو:</label>
              <div class="color-swatches-row" id="hair-swatches">
                ${OUTFIT_DATA.hairColors.map(hc => `
                  <div class="color-swatch ${char.hairColor === hc ? 'selected' : ''}" style="background: ${hc};" data-hair="${hc}"></div>
                `).join('')}
              </div>
            </div>

            <div class="customizer-actions">
              <button class="cyber-btn primary-btn" id="btn-save-char">💾 ذخیره و بازگشت</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.init3DCharacterPreview();
    this.attachCustomizerEvents();
  }

  init3DCharacterPreview() {
    const container = document.getElementById('preview-canvas-container');
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 450;

    this.previewScene = new THREE.Scene();
    this.previewCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.previewCamera.position.set(0, 1.2, 3.2);

    this.previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.previewRenderer.setSize(width, height);
    this.previewRenderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.previewRenderer.domElement);

    // Studio Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    this.previewScene.add(amb);

    const dir1 = new THREE.DirectionalLight(0x00f0ff, 2.0);
    dir1.position.set(3, 4, 3);
    this.previewScene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xff007f, 1.5);
    dir2.position.set(-3, 2, -2);
    this.previewScene.add(dir2);

    this.update3DPreviewMesh();

    // Drag to rotate character
    let isDragging = false;
    let lastX = 0;
    const canvas = this.previewRenderer.domElement;

    const onDown = (x) => { isDragging = true; lastX = x; };
    const onMove = (x) => {
      if (isDragging && this.previewMesh) {
        const dx = x - lastX;
        this.previewMesh.rotation.y += dx * 0.015;
        lastX = x;
      }
    };
    const onUp = () => { isDragging = false; };

    canvas.onmousedown = (e) => onDown(e.clientX);
    window.onmousemove = (e) => onMove(e.clientX);
    window.onmouseup = onUp;

    canvas.ontouchstart = (e) => onDown(e.touches[0].clientX);
    window.ontouchmove = (e) => { if (e.touches[0]) onMove(e.touches[0].clientX); };
    window.ontouchend = onUp;

    // Animation loop
    const anim = () => {
      if (this.currentScreen !== 'character_customizer') return;
      if (this.previewMesh && !isDragging) {
        this.previewMesh.rotation.y += 0.008; // Gentle auto-turn
      }
      if (this.previewRenderer && this.previewScene && this.previewCamera) {
        this.previewRenderer.render(this.previewScene, this.previewCamera);
      }
      this.previewAnimId = requestAnimationFrame(anim);
    };
    anim();
  }

  update3DPreviewMesh() {
    if (!this.previewScene) return;
    if (this.previewMesh) {
      this.previewScene.remove(this.previewMesh);
      this.previewMesh = null;
    }

    const charConfig = this.game.state.character;
    const charData = CharacterMeshBuilder.buildCharacter(charConfig, false);
    this.previewMesh = charData.mesh;
    this.previewMesh.position.set(0, 0, 0);
    this.previewScene.add(this.previewMesh);
  }

  attachCustomizerEvents() {
    const btnBoy = document.getElementById('btn-gender-boy');
    const btnGirl = document.getElementById('btn-gender-girl');

    if (btnBoy) {
      btnBoy.onclick = () => {
        this.sound.playClick();
        this.game.state.character.gender = 'boy';
        this.game.state.character.shirtIndex = 0;
        this.game.state.character.pantsIndex = 0;
        this.openCharacterCustomizer();
      };
    }

    if (btnGirl) {
      btnGirl.onclick = () => {
        this.sound.playClick();
        this.game.state.character.gender = 'girl';
        this.game.state.character.shirtIndex = 0;
        this.game.state.character.pantsIndex = 0;
        this.openCharacterCustomizer();
      };
    }

    // Shirt clicks
    const shirtBtns = document.querySelectorAll('[data-shirt-idx]');
    shirtBtns.forEach(btn => {
      btn.onclick = () => {
        this.sound.playClick();
        this.game.state.character.shirtIndex = parseInt(btn.getAttribute('data-shirt-idx'));
        shirtBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.update3DPreviewMesh();
      };
    });

    // Pants clicks
    const pantsBtns = document.querySelectorAll('[data-pants-idx]');
    pantsBtns.forEach(btn => {
      btn.onclick = () => {
        this.sound.playClick();
        this.game.state.character.pantsIndex = parseInt(btn.getAttribute('data-pants-idx'));
        pantsBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.update3DPreviewMesh();
      };
    });

    // Skin clicks
    const skinBtns = document.querySelectorAll('[data-skin]');
    skinBtns.forEach(btn => {
      btn.onclick = () => {
        this.sound.playClick();
        this.game.state.character.skinColor = btn.getAttribute('data-skin');
        skinBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.update3DPreviewMesh();
      };
    });

    // Hair clicks
    const hairBtns = document.querySelectorAll('[data-hair]');
    hairBtns.forEach(btn => {
      btn.onclick = () => {
        this.sound.playClick();
        this.game.state.character.hairColor = btn.getAttribute('data-hair');
        hairBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.update3DPreviewMesh();
      };
    });

    // Save & Return
    const btnSave = document.getElementById('btn-save-char');
    if (btnSave) {
      btnSave.onclick = () => {
        this.sound.playClick();
        this.game.saveState();
        if (this.game.player) {
          this.game.player.initCharacterMesh();
        }
        if (this.isPaused) {
          this.openPauseMenu();
        } else {
          this.renderMainMenu();
        }
      };
    }
  }

  /* =========================================================================
     4. CYBERPUNK GUN SHOP MODAL (فروشگاه ۵ تفنگ)
     ========================================================================= */
  openGunShop() {
    this.sound.playClick();

    const guns = this.weaponsData.filter(w => w.type !== 'melee');
    const owned = this.game.state.ownedWeapons;

    const modal = document.createElement('div');
    modal.id = 'gun-shop-modal';
    modal.className = 'cyber-modal-overlay';

    modal.innerHTML = `
      <div class="cyber-shop-card">
        <div class="shop-header">
          <div class="shop-title">⚡ اسلحه فروشی سایبر (SHADOW ARMORY) ⚡</div>
          <div class="shop-coins-display">موجودی: 🪙 <span id="shop-coins-val">${this.game.state.coins.toLocaleString('fa-IR')}</span></div>
          <button class="shop-close-btn" id="btn-shop-close">✕</button>
        </div>

        <div class="shop-weapons-grid">
          ${guns.map(g => {
            const isOwned = owned.includes(g.id);
            return `
              <div class="gun-shop-item" id="gun-card-${g.id}">
                <!-- Square Image with Cyberpunk Border -->
                <div class="gun-square-preview">
                  <span class="gun-icon-big">${g.icon}</span>
                  <span class="gun-name-tag">${g.nameFa}</span>
                </div>

                <div class="gun-details">
                  <div class="gun-en-name">${g.nameEn}</div>
                  <div class="gun-desc">${g.descFa}</div>
                  <div class="gun-price-tag">قیمت: 🪙 ${g.price.toLocaleString('fa-IR')} سکه</div>

                  ${isOwned ? `
                    <button class="gun-buy-btn owned" disabled>✓ خریداری شده</button>
                  ` : `
                    <button class="gun-buy-btn" data-buy-id="${g.id}" data-price="${g.price}">
                      خرید
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachGunShopEvents(modal);
  }

  attachGunShopEvents(modal) {
    const btnClose = modal.querySelector('#btn-shop-close');
    if (btnClose) {
      btnClose.onclick = () => {
        this.sound.playClick();
        modal.remove();
      };
    }

    const buyBtns = modal.querySelectorAll('[data-buy-id]');
    buyBtns.forEach(btn => {
      btn.onclick = () => {
        const wid = btn.getAttribute('data-buy-id');
        const price = parseInt(btn.getAttribute('data-price'));

        if (this.game.state.coins >= price) {
          // Success purchase
          this.sound.playCoinReward();
          this.game.state.coins -= price;
          this.game.state.ownedWeapons.push(wid);
          this.game.weaponManager.equipWeapon(wid);
          this.game.saveState();
          this.game.hud.updateCoins(this.game.state.coins);

          const shopCoins = modal.querySelector('#shop-coins-val');
          if (shopCoins) shopCoins.textContent = this.game.state.coins.toLocaleString('fa-IR');

          btn.disabled = true;
          btn.className = 'gun-buy-btn owned';
          btn.textContent = '✓ خرید انجام شد';

          this.game.hud.showToast(`خرید انجام شد! سلاح به تجهیزات اضافه شد.`, 'success');
        } else {
          // Error: Insufficient coins
          this.sound.playError();
          btn.classList.add('error-shake');
          setTimeout(() => btn.classList.remove('error-shake'), 400);
          this.game.hud.showToast(`شما سکه کافی ندارید!`, 'error');
        }
      };
    });
  }

  /* =========================================================================
     5. IN-GAME PAUSE MENU (منوی بازی)
     ========================================================================= */
  openPauseMenu() {
    this.isPaused = true;
    this.sound.playClick();

    const modal = document.createElement('div');
    modal.id = 'pause-menu-modal';
    modal.className = 'cyber-modal-overlay';

    const s = this.game.state.settings;

    modal.innerHTML = `
      <div class="pause-menu-card">
        <div class="pause-header">⚙️ منوی بازی</div>

        <div class="pause-options-list">
          <button class="cyber-menu-btn" id="pbtn-resume">▶️ ادامه بازی</button>
          <button class="cyber-menu-btn" id="pbtn-character">👤 تغییر کاراکتر</button>

          <!-- Quality Settings -->
          <div class="menu-setting-group">
            <span class="set-label">تنظیم کیفیت:</span>
            <div class="quality-pills">
              <button class="q-btn ${s.quality === 'low' ? 'active' : ''}" data-q="low">پایین</button>
              <button class="q-btn ${s.quality === 'medium' ? 'active' : ''}" data-q="medium">متوسط</button>
              <button class="q-btn ${s.quality === 'high' ? 'active' : ''}" data-q="high">عالی</button>
              <button class="q-btn ${s.quality === 'ultra' ? 'active' : ''}" data-q="ultra">اولترا</button>
            </div>
          </div>

          <!-- Audio Settings -->
          <div class="menu-setting-group">
            <span class="set-label">تنظیم صدا:</span>
            <div class="audio-slider-row">
              <span>صدای کل:</span>
              <input type="range" id="slider-master" min="0" max="100" value="${Math.round(s.masterVolume * 100)}" />
            </div>
          </div>

          <!-- Aim Sensitivity -->
          <div class="menu-setting-group">
            <span class="set-label">تنظیم Aim (حساسیت هدف‌گیری):</span>
            <input type="range" id="slider-aim" min="5" max="30" value="${Math.round(s.aimSensitivity * 10)}" />
          </div>

          <button class="cyber-menu-btn danger-btn" id="pbtn-exit">🚪 خارج از بازی</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachPauseMenuEvents(modal);
  }

  togglePauseMenu() {
    const existing = document.getElementById('pause-menu-modal');
    if (existing) {
      existing.remove();
      this.isPaused = false;
    } else {
      this.openPauseMenu();
    }
  }

  attachPauseMenuEvents(modal) {
    const resume = modal.querySelector('#pbtn-resume');
    if (resume) {
      resume.onclick = () => {
        this.sound.playClick();
        this.isPaused = false;
        modal.remove();
      };
    }

    const charBtn = modal.querySelector('#pbtn-character');
    if (charBtn) {
      charBtn.onclick = () => {
        this.sound.playClick();
        modal.remove();
        this.openCharacterCustomizer();
      };
    }

    const exitBtn = modal.querySelector('#pbtn-exit');
    if (exitBtn) {
      exitBtn.onclick = () => {
        this.sound.playClick();
        this.isPaused = false;
        modal.remove();
        this.game.stopSimulation();
        this.renderMainMenu();
      };
    }

    // Quality buttons
    const qBtns = modal.querySelectorAll('[data-q]');
    qBtns.forEach(btn => {
      btn.onclick = () => {
        this.sound.playClick();
        const q = btn.getAttribute('data-q');
        this.game.state.settings.quality = q;
        this.game.applyQualitySettings(q);
        this.game.saveState();
        qBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    // Master volume slider
    const masterSlider = modal.querySelector('#slider-master');
    if (masterSlider) {
      masterSlider.oninput = (e) => {
        const val = e.target.value / 100;
        this.game.state.settings.masterVolume = val;
        this.sound.setMasterVolume(val);
        this.game.saveState();
      };
    }

    // Aim slider
    const aimSlider = modal.querySelector('#slider-aim');
    if (aimSlider) {
      aimSlider.oninput = (e) => {
        const val = e.target.value / 10;
        this.game.state.settings.aimSensitivity = val;
        this.game.saveState();
      };
    }
  }
}
