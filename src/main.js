/**
 * main.js
 * Master Game Controller for SHADOW CITY.
 * Integrates Three.js Engine, Physics, AI, City, Vehicles, Phone, HUD, Audio, and Menus.
 */

import * as THREE from 'three';
import { SaveManager } from './core/SaveManager.js';
import { SoundManager } from './audio/SoundManager.js';
import { InputManager } from './core/InputManager.js';
import { CityGenerator } from './city/CityGenerator.js';
import { Player } from './characters/Player.js';
import { NPCManager } from './characters/NPCManager.js';
import { VehicleManager } from './vehicles/VehicleManager.js';
import { WeaponManager } from './weapons/WeaponManager.js';
import { PhoneManager } from './phone/PhoneManager.js';
import { HUD } from './ui/HUD.js';
import { MiniMap } from './ui/MiniMap.js';
import { MenuManager } from './ui/MenuManager.js';

class Game {
  constructor() {
    this.state = SaveManager.load();
    this.sound = new SoundManager();
    this.input = new InputManager(this);

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.city = null;
    this.player = null;
    this.npcManager = null;
    this.vehicleManager = null;
    this.weaponManager = null;
    this.phoneManager = null;
    this.hud = null;
    this.minimap = null;
    this.menuManager = null;

    this.isRunning = false;
    this.lastTime = 0;
    this.clock = new THREE.Clock();

    this.initThreeJS();
    this.menuManager = new MenuManager(this);
  }

  initThreeJS() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e14);
    this.scene.fog = new THREE.FogExp2(0x0c121e, 0.0055);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 800);

    // 3. Renderer with antialiasing and shadow maps
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // required for in-game camera snapshots!
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    document.body.appendChild(this.renderer.domElement);

    // 4. Lighting (Atmospheric Cyberpunk City Lighting)
    const ambientLight = new THREE.AmbientLight(0xddeeff, 0.65);
    this.scene.add(ambientLight);

    // Main Sunlight / Moonlight with Shadows
    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    sunLight.position.set(80, 140, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 350;
    const shadowD = 120;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);
    this.sunLight = sunLight;

    // Cyberpunk Skybox Dome
    this.createSkyDome();

    // Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());

    // Apply Saved Audio & Quality Settings
    this.sound.setMasterVolume(this.state.settings.masterVolume);
    this.sound.setRadioVolume(this.state.settings.radioVolume);
    this.sound.setSfxVolume(this.state.settings.sfxVolume);
    this.applyQualitySettings(this.state.settings.quality);
  }

  createSkyDome() {
    const skyGeo = new THREE.SphereGeometry(600, 32, 15);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x141e30,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  startSimulation() {
    if (this.isRunning) return;

    // 1. Generate City
    const cityGen = new CityGenerator(this.scene);
    this.city = cityGen.generate();
    this.cityGenInstance = cityGen;

    // 2. Initialize Player
    this.player = new Player(this);

    // 3. Initialize Weapon Manager
    this.weaponManager = new WeaponManager(this);

    // 4. Initialize 100+ NPCs
    this.npcManager = new NPCManager(this);
    this.npcManager.init();

    // 5. Initialize 60+ Traffic Cars & Lamborghini
    this.vehicleManager = new VehicleManager(this);
    this.vehicleManager.init();

    // 6. Initialize Smartphone
    this.phoneManager = new PhoneManager(this);

    // 7. Initialize HUD & MiniMap
    this.hud = new HUD(this);
    this.minimap = new MiniMap(this);

    this.isRunning = true;
    this.clock.start();

    // Start Game Loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  stopSimulation() {
    this.isRunning = false;
    this.sound.stopRadio();
    this.sound.stopEngine();

    // Remove HUD and MiniMap
    const hudEl = document.getElementById('game-hud');
    if (hudEl) hudEl.remove();
    const mapEl = document.getElementById('minimap-wrapper');
    if (mapEl) mapEl.remove();
    const phoneEl = document.getElementById('phone-container');
    if (phoneEl) phoneEl.remove();
  }

  gameLoop(time) {
    if (!this.isRunning) return;
    requestAnimationFrame((t) => this.gameLoop(t));

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (!this.menuManager.isPaused) {
      this.input.update();

      if (this.player) {
        this.player.update(delta, this.input);
      }

      if (this.npcManager) {
        this.npcManager.update(delta);
      }

      if (this.vehicleManager) {
        this.vehicleManager.update(delta, this.input);
      }

      if (this.weaponManager) {
        this.weaponManager.update(delta);
      }

      if (this.hud) {
        this.hud.updateProximityPrompts();
      }

      if (this.minimap) {
        this.minimap.update();
      }

      // Update sun shadow center around player
      if (this.sunLight && this.player) {
        const pPos = this.player.getPosition();
        this.sunLight.position.set(pPos.x + 80, 140, pPos.z + 60);
        this.sunLight.target.position.copy(pPos);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  addCoins(amount, message = '') {
    this.state.coins += amount;
    this.state.stats.moneyEarned += amount;
    this.saveState();
    this.sound.playCoinReward();

    if (this.hud) {
      this.hud.updateCoins(this.state.coins);
      if (message) {
        this.hud.showToast(message, 'coin');
      }
    }
  }

  saveState() {
    SaveManager.save(this.state);
  }

  applyQualitySettings(quality) {
    if (!this.renderer) return;

    if (quality === 'low') {
      this.renderer.setPixelRatio(0.8);
      this.renderer.shadowMap.enabled = false;
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
    } else if (quality === 'high') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else if (quality === 'ultra') {
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
