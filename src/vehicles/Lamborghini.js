/**
 * Lamborghini.js
 * High-performance supercar vehicle controller with realistic weight,
 * smooth steering, acceleration, braking, and drifting mechanics.
 */

import * as THREE from 'three';
import { VehicleModels } from './VehicleModels.js';

export class Lamborghini {
  constructor(game, spawnPos) {
    this.game = game;
    this.scene = game.scene;
    this.sound = game.sound;

    const data = VehicleModels.createLamborghiniMesh();
    this.mesh = data.mesh;
    this.wheels = data.wheels;
    this.topY = 1.25; // Height for player to stand on top

    this.position = spawnPos.clone();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Physics state
    this.speed = 0; // forward speed in m/s
    this.maxForwardSpeed = 38.0; // ~137 km/h - fast yet controllable
    this.maxReverseSpeed = -14.0;
    this.accel = 18.0;
    this.brakeDecel = 28.0;
    this.naturalDecel = 6.0;
    this.steerAngle = 0;
    this.maxSteerAngle = 0.55; // radians
    this.steerSpeed = 3.5;
    this.driftFactor = 1.0;
    this.isDrifting = false;

    this.driver = null;
    this.lastHonkTime = 0;
  }

  teleportInFrontOfPlayer(playerPos, forwardDir) {
    this.position.copy(playerPos).add(forwardDir.clone().multiplyScalar(4.5));
    this.position.y = 0;
    this.mesh.position.copy(this.position);

    const angle = Math.atan2(forwardDir.x, forwardDir.z);
    this.mesh.rotation.set(0, angle, 0);
    this.speed = 0;

    // Visual spawn spark effect
    this.sound.playTeleportSpawn();
  }

  honk() {
    const now = performance.now();
    if (now - this.lastHonkTime > 600) {
      this.sound.playCarHorn();
      this.lastHonkTime = now;
    }
  }

  update(delta, input) {
    if (!this.driver) {
      // Idle decelerate if no driver
      if (Math.abs(this.speed) > 0.1) {
        this.speed -= Math.sign(this.speed) * this.naturalDecel * delta;
      } else {
        this.speed = 0;
      }
      return;
    }

    const isGas = input.vehicleGas || false;
    const isBrake = input.vehicleBrake || false;
    const isSteerLeft = input.vehicleSteerLeft || false;
    const isSteerRight = input.vehicleSteerRight || false;
    this.isDrifting = input.vehicleDrift || false;

    // Acceleration & Braking
    if (isGas) {
      this.speed = Math.min(this.maxForwardSpeed, this.speed + this.accel * delta);
    } else if (isBrake) {
      if (this.speed > 0.5) {
        this.speed = Math.max(0, this.speed - this.brakeDecel * delta);
      } else {
        this.speed = Math.max(this.maxReverseSpeed, this.speed - this.accel * 0.7 * delta);
      }
    } else {
      // Coasting friction
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.naturalDecel * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.naturalDecel * delta);
      }
    }

    // Steering
    let targetSteer = 0;
    if (isSteerLeft) targetSteer += this.maxSteerAngle;
    if (isSteerRight) targetSteer -= this.maxSteerAngle;

    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, this.steerSpeed * delta);

    // Front wheels turning visual
    if (this.wheels[0] && this.wheels[1]) {
      this.wheels[0].rotation.y = this.steerAngle;
      this.wheels[1].rotation.y = this.steerAngle;
    }

    // Wheel spin visual
    const wheelRotDelta = (this.speed / 0.35) * delta;
    this.wheels.forEach(w => {
      w.children[0].rotation.x += wheelRotDelta;
    });

    // Turning vehicle body
    if (Math.abs(this.speed) > 0.1) {
      const turnMultiplier = (this.isDrifting ? 2.2 : 1.0) * Math.sign(this.speed);
      const turnAngle = this.steerAngle * (this.speed / this.maxForwardSpeed) * 3.5 * turnMultiplier * delta;
      this.mesh.rotation.y += turnAngle;

      if (this.isDrifting && Math.abs(this.speed) > 10) {
        this.sound.playTireScreech();
        this.createDriftSmoke();
      }
    }

    // Engine sound pitch update
    const speedRatio = Math.abs(this.speed) / this.maxForwardSpeed;
    this.sound.updateEnginePitch(speedRatio, isGas);

    // Calculate movement vector
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.mesh.rotation);
    const moveDelta = forward.clone().multiplyScalar(this.speed * delta);

    // Resolve Collisions
    this.resolveMove(moveDelta);
    this.checkHitNPCs(forward);
    this.checkHitTrafficCars();
  }

  createDriftSmoke() {
    // Small tire smoke particle
    if (Math.random() > 0.4) return;
    const smokeGeo = new THREE.SphereGeometry(0.2, 4, 4);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });
    const smoke = new THREE.Mesh(smokeGeo, smokeMat);

    const rearLeft = this.position.clone().add(new THREE.Vector3(-0.9, 0.2, -1.4).applyEuler(this.mesh.rotation));
    smoke.position.copy(rearLeft);
    this.scene.add(smoke);

    const start = performance.now();
    const anim = () => {
      const elapsed = (performance.now() - start) / 1000;
      if (elapsed < 0.4) {
        smoke.position.y += 0.02;
        smoke.scale.multiplyScalar(1.05);
        smokeMat.opacity = 0.5 * (1 - elapsed / 0.4);
        requestAnimationFrame(anim);
      } else {
        this.scene.remove(smoke);
      }
    };
    requestAnimationFrame(anim);
  }

  resolveMove(moveDelta) {
    const nextPos = this.position.clone().add(moveDelta);
    const carBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(nextPos.x, 0.6, nextPos.z),
      new THREE.Vector3(2.3, 1.2, 4.8)
    );

    let collided = false;
    for (const col of this.game.city.colliders) {
      if (col.intersectsBox(carBox)) {
        collided = true;
        break;
      }
    }

    if (!collided) {
      this.position.copy(nextPos);
      this.mesh.position.copy(this.position);
    } else {
      // Crash rebound & sound
      if (Math.abs(this.speed) > 5) {
        this.sound.playCarCrash();
      }
      this.speed = -this.speed * 0.3; // Rebound
    }
  }

  checkHitNPCs(forward) {
    if (Math.abs(this.speed) < 3.0) return;
    const carBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.position.x, 0.6, this.position.z),
      new THREE.Vector3(2.4, 1.2, 4.8)
    );

    for (const npc of this.game.npcManager.npcs) {
      if (npc.isDead) continue;
      const npcBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(npc.position.x, 0.9, npc.position.z),
        new THREE.Vector3(0.8, 1.8, 0.8)
      );

      if (carBox.intersectsBox(npcBox)) {
        this.game.npcManager.hitNPCWithVehicle(npc, this.speed, forward);
      }
    }
  }

  checkHitTrafficCars() {
    if (Math.abs(this.speed) < 2.0) return;
    const carBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.position.x, 0.6, this.position.z),
      new THREE.Vector3(2.3, 1.2, 4.8)
    );

    for (const other of this.game.vehicleManager.trafficCars) {
      const otherBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(other.position.x, 0.6, other.position.z),
        new THREE.Vector3(2.2, 1.2, 4.4)
      );

      if (carBox.intersectsBox(otherBox)) {
        this.sound.playCarCrash();
        other.onHitByPlayer(); // Causes the hit traffic car to honk!
        this.speed = -this.speed * 0.35;
        break;
      }
    }
  }
}
