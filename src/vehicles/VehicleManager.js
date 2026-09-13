/**
 * VehicleManager.js
 * Manages player Lamborghini supercar and 60+ autonomous city traffic cars.
 * Supports car raycasting, jumping on cars, explosions, and spawning.
 */

import * as THREE from 'three';
import { Lamborghini } from './Lamborghini.js';
import { TrafficCar } from './TrafficCar.js';

export class VehicleManager {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.lamborghini = null;
    this.trafficCars = [];
    this.targetTrafficCount = 65; // At least 60 traffic cars!
  }

  init() {
    // 1. Initialize Player's Lamborghini at house driveway
    const spawnPos = this.game.city.playerHousePosition.clone().add(new THREE.Vector3(-7, 0, 12));
    this.lamborghini = new Lamborghini(this.game, spawnPos);

    // 2. Spawn 60+ City Traffic Cars
    const carColors = [
      '#c0392b', '#2980b9', '#8e44ad', '#27ae60', '#f39c12',
      '#d35400', '#2c3e50', '#7f8c8d', '#bdc3c7', '#16a085',
      '#e74c3c', '#34495e', '#1abc9c', '#9b59b6', '#3498db'
    ];

    const roadSegments = this.game.city.roadSegments;
    if (roadSegments && roadSegments.length > 0) {
      for (let i = 0; i < this.targetTrafficCount; i++) {
        const seg = roadSegments[i % roadSegments.length];
        const dir = (i % 2 === 0) ? 1 : -1;
        const color = carColors[i % carColors.length];
        const trafficCar = new TrafficCar(this.game, seg, dir, color, i);
        this.trafficCars.push(trafficCar);
      }
    }
  }

  spawnLamborghiniInFrontOfPlayer() {
    if (!this.lamborghini) return;
    const playerPos = this.game.player.getPosition();
    const forward = this.game.player.getForwardVector();
    this.lamborghini.teleportInFrontOfPlayer(playerPos, forward);
  }

  update(delta, input) {
    if (this.lamborghini) {
      this.lamborghini.update(delta, input);
    }

    for (let i = 0; i < this.trafficCars.length; i++) {
      this.trafficCars[i].update(delta);
    }
  }

  /**
   * Checks if player is currently above/on top of a vehicle (Lamborghini or traffic car)
   * to enable standing on top of cars without falling through!
   */
  findCarUnderPoint(point) {
    // Check Lamborghini
    if (this.lamborghini) {
      const dist = point.distanceTo(new THREE.Vector3(this.lamborghini.position.x, point.y, this.lamborghini.position.z));
      if (dist < 2.0 && point.y >= this.lamborghini.topY - 0.2 && point.y <= this.lamborghini.topY + 1.2) {
        return this.lamborghini;
      }
    }

    // Check Traffic Cars
    for (const car of this.trafficCars) {
      if (car.isDestroyed) continue;
      const dist = point.distanceTo(new THREE.Vector3(car.position.x, point.y, car.position.z));
      if (dist < 2.0 && point.y >= car.topY - 0.2 && point.y <= car.topY + 1.2) {
        return car;
      }
    }

    return null;
  }

  findCarNear(pos, radius) {
    for (const car of this.trafficCars) {
      if (car.isDestroyed) continue;
      if (car.position.distanceTo(pos) <= radius) {
        return car;
      }
    }
    return null;
  }

  explodeCarsInRadius(center, radius) {
    let count = 0;
    for (const car of this.trafficCars) {
      if (car.isDestroyed) continue;
      if (car.position.distanceTo(center) <= radius) {
        car.destroy();
        count++;
        this.game.state.stats.carsDestroyed++;
      }
    }
    return count;
  }

  raycastCar(raycaster, maxDist) {
    for (const car of this.trafficCars) {
      if (car.isDestroyed) continue;
      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(car.position.x, 0.7, car.position.z),
        new THREE.Vector3(2.2, 1.4, 4.4)
      );
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectBox(box, hitPoint)) {
        if (hitPoint.distanceTo(raycaster.ray.origin) <= maxDist) {
          return { car, point: hitPoint };
        }
      }
    }
    return null;
  }

  damageCar(car, damage, hitPoint) {
    car.onHitByPlayer();
  }
}
