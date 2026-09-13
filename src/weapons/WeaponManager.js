/**
 * WeaponManager.js
 * Manages inventory, weapon wheel selection, aiming, firing, muzzle flash,
 * projectiles (RPG rocket), bullet rays, damage application, coin payouts.
 */

import * as THREE from 'three';
import { WeaponModels } from './WeaponModels.js';
import { TextureGenerator } from '../core/TextureGenerator.js';

export class WeaponManager {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.sound = game.sound;
    this.weaponsData = TextureGenerator.getWeaponData();

    this.currentWeaponId = 'bat';
    this.isAiming = false;
    this.isFiring = false;
    this.lastFireTime = 0;

    this.weaponMesh = null;
    this.muzzleLight = null;
    this.projectiles = []; // active RPG rockets

    this.initMuzzleLight();
  }

  initMuzzleLight() {
    this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 15);
    this.scene.add(this.muzzleLight);
  }

  getCurrentWeaponData() {
    return this.weaponsData.find(w => w.id === this.currentWeaponId) || this.weaponsData[0];
  }

  isGun() {
    const data = this.getCurrentWeaponData();
    return data.type !== 'melee';
  }

  equipWeapon(weaponId) {
    if (!this.game.state.ownedWeapons.includes(weaponId)) return;
    this.currentWeaponId = weaponId;
    this.game.state.currentWeapon = weaponId;
    this.game.saveState();

    if (this.currentWeaponId === 'bat' && this.isAiming) {
      this.setAim(false);
    }

    if (this.game.player) {
      this.game.player.attachWeapon(weaponId);
    }
    this.game.hud.updateWeaponHUD();
  }

  toggleAim() {
    if (this.currentWeaponId === 'bat') return; // Melee has no Aim button!
    this.setAim(!this.isAiming);
  }

  setAim(val) {
    if (this.currentWeaponId === 'bat') {
      this.isAiming = false;
      this.game.hud.setAimOverlay(false, null);
      return;
    }
    this.isAiming = val;
    this.game.hud.setAimOverlay(val, this.currentWeaponId);
  }

  attack() {
    const now = performance.now();
    const wData = this.getCurrentWeaponData();

    if (now - this.lastFireTime < wData.fireRate) {
      return;
    }
    this.lastFireTime = now;

    if (wData.type === 'melee') {
      this.performMeleeAttack(wData);
    } else if (wData.type === 'explosive') {
      this.fireRPG(wData);
    } else {
      this.fireGun(wData);
    }
  }

  performMeleeAttack(wData) {
    this.sound.playGunfire('bat');
    this.game.player.playAttackAnimation();

    // Check hit against NPCs in front
    const playerPos = this.game.player.getPosition();
    const forward = this.game.player.getForwardVector();

    const hitNPC = this.game.npcManager.findClosestNPCInCone(playerPos, forward, wData.range, 0.85);
    if (hitNPC) {
      this.sound.playBatHit();
      const killed = this.game.npcManager.damageNPC(hitNPC, 1, 'bat', hitNPC.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
      if (killed) {
        this.game.addCoins(wData.killReward, `کشتن با چماق (+${wData.killReward} 🪙)`);
      }
    }
  }

  fireGun(wData) {
    this.sound.playGunfire(wData.id);
    this.flashMuzzle();
    this.game.player.playAttackAnimation();

    // Raycast from camera center or player aim direction
    const raycaster = new THREE.Raycaster();
    const camera = this.game.camera;
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Hit test NPCs, headshots, traffic cars
    const npcHit = this.game.npcManager.raycastNPC(raycaster, wData.range);
    if (npcHit) {
      const isHeadshot = (wData.id === 'sniper') || npcHit.isHeadshot;
      const damage = isHeadshot ? 999 : (wData.hitsToKill === 1 ? 999 : (wData.hitsToKill === 2 ? 50 : 34));

      if (isHeadshot) {
        this.sound.playHeadshot();
      }

      const killed = this.game.npcManager.damageNPC(npcHit.npc, damage, wData.id, npcHit.point, isHeadshot);
      if (killed) {
        const reward = isHeadshot && wData.id !== 'sniper' ? wData.killReward * 1.5 : wData.killReward;
        this.game.addCoins(reward, `کشتن با ${wData.nameFa} (+${reward} 🪙)`);
      }

      // Gunshot panic reaction to nearby NPCs
      this.game.npcManager.triggerGunshotPanic(npcHit.point, 28);
      return;
    }

    // Hit test traffic cars
    const carHit = this.game.vehicleManager.raycastCar(raycaster, wData.range);
    if (carHit) {
      this.game.vehicleManager.damageCar(carHit.car, 25, carHit.point);
      this.game.npcManager.triggerGunshotPanic(carHit.point, 28);
      return;
    }

    // Trigger panic in player's vicinity
    this.game.npcManager.triggerGunshotPanic(this.game.player.getPosition(), 24);
  }

  fireRPG(wData) {
    this.sound.playGunfire('rpg');
    this.flashMuzzle();
    this.game.player.playAttackAnimation();

    const origin = this.game.player.getPosition().clone().add(new THREE.Vector3(0, 1.4, 0));
    let dir = this.game.camera.getWorldDirection(new THREE.Vector3());

    // Spawn rocket projectile
    const rocketGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
    const rocketMat = new THREE.MeshStandardMaterial({ color: 0x3d4d3c, emissive: 0xff4400, emissiveIntensity: 0.8 });
    const rocketMesh = new THREE.Mesh(rocketGeo, rocketMat);
    rocketMesh.rotation.x = Math.PI / 2;
    rocketMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    rocketMesh.position.copy(origin).add(dir.clone().multiplyScalar(1.2));
    this.scene.add(rocketMesh);

    this.projectiles.push({
      mesh: rocketMesh,
      velocity: dir.clone().multiplyScalar(42),
      life: 3.5,
      spawnTime: performance.now()
    });

    this.game.npcManager.triggerGunshotPanic(origin, 35);
  }

  flashMuzzle() {
    if (!this.muzzleLight || !this.game.player) return;
    const pPos = this.game.player.getPosition().clone().add(new THREE.Vector3(0, 1.3, 0));
    const forward = this.game.player.getForwardVector();
    this.muzzleLight.position.copy(pPos).add(forward.clone().multiplyScalar(0.8));
    this.muzzleLight.intensity = 5.0;
    setTimeout(() => {
      if (this.muzzleLight) this.muzzleLight.intensity = 0;
    }, 45);
  }

  update(delta) {
    // Update active RPG projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Check collision with ground or buildings
      let hit = false;
      if (p.mesh.position.y <= 0.1) {
        hit = true;
      } else {
        // Collide with city buildings
        const pBox = new THREE.Box3().setFromCenterAndSize(p.mesh.position, new THREE.Vector3(0.5, 0.5, 0.5));
        for (const col of this.game.city.colliders) {
          if (col.intersectsBox(pBox)) {
            hit = true;
            break;
          }
        }
      }

      // Check collision with vehicles or NPCs
      if (!hit) {
        const car = this.game.vehicleManager.findCarNear(p.mesh.position, 2.5);
        if (car) hit = true;
      }

      if (hit || p.life <= 0) {
        this.explodeRPG(p.mesh.position);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  explodeRPG(position) {
    this.sound.playExplosion();

    // Visual Explosion Sphere & Light
    const expLight = new THREE.PointLight(0xff5500, 15, 30);
    expLight.position.copy(position);
    this.scene.add(expLight);

    const expGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const expMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.95
    });
    const expMesh = new THREE.Mesh(expGeo, expMat);
    expMesh.position.copy(position);
    this.scene.add(expMesh);

    // Expand and fade
    const startTime = performance.now();
    const animateExp = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 0.6) {
        const scale = 1 + elapsed * 5;
        expMesh.scale.set(scale, scale, scale);
        expMat.opacity = Math.max(0, 1 - elapsed / 0.6);
        expLight.intensity = Math.max(0, 15 * (1 - elapsed / 0.6));
        requestAnimationFrame(animateExp);
      } else {
        this.scene.remove(expMesh);
        this.scene.remove(expLight);
      }
    };
    requestAnimationFrame(animateExp);

    // Blast radius: 10 meters - destroy all NPCs and cars!
    const blastRadius = 10.0;
    const killedNPCs = this.game.npcManager.explodeNPCsInRadius(position, blastRadius);
    const destroyedCars = this.game.vehicleManager.explodeCarsInRadius(position, blastRadius);

    const totalVictims = killedNPCs + destroyedCars;
    if (totalVictims > 0) {
      const totalReward = totalVictims * 10000; // minimum 10,000 per victim/car
      this.game.addCoins(totalReward, `انفجار آرپیچی! (${totalVictims} هدف x 10,000 = +${totalReward} 🪙)`);
    }

    this.game.npcManager.triggerGunshotPanic(position, 40);
  }
}
