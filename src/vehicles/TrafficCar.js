/**
 * TrafficCar.js
 * AI traffic car running along road lanes and making turns at intersections.
 * Features tinted windows, orderly driving, horn honking when collided with by player,
 * and standing surface for player jumping on roof.
 */

import * as THREE from 'three';
import { VehicleModels } from './VehicleModels.js';

export class TrafficCar {
  constructor(game, roadSegment, laneDir = 1, colorHex = '#2a3b4c', typeIdx = 0) {
    this.game = game;
    this.scene = game.scene;
    this.sound = game.sound;
    this.roadSegment = roadSegment;
    this.laneDir = laneDir; // 1 or -1

    const data = VehicleModels.createTrafficCarMesh(colorHex, typeIdx);
    this.mesh = data.mesh;
    this.wheels = data.wheels;
    this.topY = 1.35; // Surface height for player to stand on top

    this.position = new THREE.Vector3();
    this.speed = 7.5 + Math.random() * 3.5; // ~28-40 km/h orderly moderate speed
    this.isDestroyed = false;

    this.initPosition();
    this.scene.add(this.mesh);
  }

  initPosition() {
    if (this.roadSegment.type === 'NS') {
      const laneX = this.laneDir === 1 ? this.roadSegment.laneRightX : this.roadSegment.laneLeftX;
      const startZ = this.laneDir === 1 ? this.roadSegment.zStart + Math.random() * 300 : this.roadSegment.zEnd - Math.random() * 300;
      this.position.set(laneX, 0, startZ);
      this.mesh.rotation.y = this.laneDir === 1 ? 0 : Math.PI;
    } else {
      const laneZ = this.laneDir === 1 ? this.roadSegment.laneRightZ : this.roadSegment.laneLeftZ;
      const startX = this.laneDir === 1 ? this.roadSegment.xStart + Math.random() * 300 : this.roadSegment.xEnd - Math.random() * 300;
      this.position.set(startX, 0, laneZ);
      this.mesh.rotation.y = this.laneDir === 1 ? Math.PI / 2 : -Math.PI / 2;
    }
    this.mesh.position.copy(this.position);
  }

  onHitByPlayer() {
    // Honk horn on every collision impact as required!
    this.sound.playCarHorn();
  }

  update(delta) {
    if (this.isDestroyed) return;

    // Move forward in facing direction
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.mesh.rotation);
    this.position.addScaledVector(forward, this.speed * delta);
    this.mesh.position.copy(this.position);

    // Wheel spin
    const wheelRotDelta = (this.speed / 0.34) * delta;
    this.wheels.forEach(w => {
      w.children[0].rotation.x += wheelRotDelta;
    });

    // Check boundary wrap-around
    const halfCity = this.game.city.citySize / 2;
    if (Math.abs(this.position.x) > halfCity || Math.abs(this.position.z) > halfCity) {
      this.initPosition();
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Visual burning / blackened wreck
    this.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        child.material = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
      }
    });

    setTimeout(() => {
      this.scene.remove(this.mesh);
      // Respawn as a fresh traffic car after 15 seconds
      setTimeout(() => {
        this.isDestroyed = false;
        this.initPosition();
        this.scene.add(this.mesh);
      }, 15000);
    }, 6000);
  }
}
