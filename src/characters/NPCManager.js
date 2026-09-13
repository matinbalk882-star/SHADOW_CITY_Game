/**
 * NPCManager.js
 * Manages 100+ pedestrian NPCs:
 * - Distributed walking paths on sidewalks
 * - Panic screaming & fleeing behavior when gunfire/explosions happen (10s timer)
 * - Headshots with decapitation & blood particles
 * - Blood decals on ground (cleaned up after 6s)
 * - Car collision flinging 5 meters & 700 coin payout
 * - Despawn after 6 seconds, respawn after 1 minute at random city sidewalk spots
 */

import * as THREE from 'three';
import { CharacterMeshBuilder, OUTFIT_DATA } from './CharacterCustomizer.js';
import { TextureGenerator } from '../core/TextureGenerator.js';

export class NPCManager {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.sound = game.sound;
    this.npcs = [];
    this.deadNPCsQueue = []; // { respawnTime: number }
    this.bloodDecals = []; // { mesh, removeTime: number }

    this.bloodMaterial = new THREE.MeshBasicMaterial({
      map: TextureGenerator.createBloodSplatterTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });

    this.targetNPCCount = 110; // at least 100 NPCs
  }

  init() {
    for (let i = 0; i < this.targetNPCCount; i++) {
      this.spawnNPC();
    }
  }

  spawnNPC(initialPos = null) {
    const sidewalkNodes = this.game.city.sidewalkNodes;
    if (!sidewalkNodes || sidewalkNodes.length === 0) return;

    let pos = initialPos;
    if (!pos) {
      const node = sidewalkNodes[Math.floor(Math.random() * sidewalkNodes.length)];
      pos = node.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5));
    }

    const gender = Math.random() > 0.5 ? 'boy' : 'girl';
    const skinColor = OUTFIT_DATA.skinTones[Math.floor(Math.random() * OUTFIT_DATA.skinTones.length)];
    const hairColor = OUTFIT_DATA.hairColors[Math.floor(Math.random() * OUTFIT_DATA.hairColors.length)];
    const shirtIndex = Math.floor(Math.random() * 5);
    const pantsIndex = Math.floor(Math.random() * 5);

    const config = { gender, skinColor, hairColor, shirtIndex, pantsIndex };
    const charData = CharacterMeshBuilder.buildCharacter(config, true);
    charData.mesh.position.copy(pos);
    this.scene.add(charData.mesh);

    const npc = {
      id: Math.random().toString(36).substring(2, 9),
      mesh: charData.mesh,
      bones: charData.bones,
      gender: gender,
      position: pos.clone(),
      velocity: new THREE.Vector3(),
      health: 100,
      isDead: false,
      isPanicking: false,
      panicTimer: 0,
      state: 'walk', // 'walk' | 'idle' | 'panic' | 'dead'
      walkSpeed: 1.8 + Math.random() * 0.8,
      panicSpeed: 5.5 + Math.random() * 1.5,
      animTime: Math.random() * 10,
      targetWaypoint: this.getRandomSidewalkNode(),
      deathTime: 0,
      headDecapitated: false,
    };

    this.npcs.push(npc);
  }

  getRandomSidewalkNode() {
    const nodes = this.game.city.sidewalkNodes;
    return nodes[Math.floor(Math.random() * nodes.length)].clone();
  }

  update(delta) {
    const now = performance.now();

    // Check dead NPCs queue for 1-minute respawn
    for (let i = this.deadNPCsQueue.length - 1; i >= 0; i--) {
      if (now >= this.deadNPCsQueue[i].respawnTime) {
        this.deadNPCsQueue.splice(i, 1);
        this.spawnNPC();
      }
    }

    // Clean up blood decals after 6s
    for (let i = this.bloodDecals.length - 1; i >= 0; i--) {
      const b = this.bloodDecals[i];
      if (now >= b.removeTime) {
        this.scene.remove(b.mesh);
        this.bloodDecals.splice(i, 1);
      }
    }

    // Update active NPCs
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];

      if (npc.isDead) {
        // Despawn dead NPC after 6 seconds
        if (now - npc.deathTime > 6000) {
          this.scene.remove(npc.mesh);
          this.npcs.splice(i, 1);
          // Queue for 1 minute respawn
          this.deadNPCsQueue.push({ respawnTime: now + 60000 });
        }
        continue;
      }

      this.updateNPCAI(npc, delta, now);
      this.updateNPCAnimation(npc, delta);
    }
  }

  updateNPCAI(npc, delta, now) {
    // Panic recovery after 10 seconds
    if (npc.isPanicking) {
      npc.panicTimer -= delta;
      if (npc.panicTimer <= 0) {
        npc.isPanicking = false;
        // Teleport back to nearest walk path node as specified
        const nearestNode = this.getClosestSidewalkNode(npc.position);
        if (nearestNode) {
          npc.position.copy(nearestNode);
          npc.mesh.position.copy(npc.position);
        }
        npc.targetWaypoint = this.getRandomSidewalkNode();
      }
    }

    let target = npc.targetWaypoint;
    let speed = npc.isPanicking ? npc.panicSpeed : npc.walkSpeed;

    if (!target) {
      npc.targetWaypoint = this.getRandomSidewalkNode();
      return;
    }

    // Distance to target
    const toTarget = new THREE.Vector3().subVectors(target, npc.position);
    toTarget.y = 0;
    const dist = toTarget.length();

    if (dist < 1.5) {
      // Pick next random sidewalk waypoint
      npc.targetWaypoint = this.getRandomSidewalkNode();
    } else {
      toTarget.normalize();
      const moveDelta = toTarget.clone().multiplyScalar(speed * delta);
      npc.position.add(moveDelta);
      npc.mesh.position.copy(npc.position);

      const targetAngle = Math.atan2(toTarget.x, toTarget.z);
      npc.mesh.rotation.y = targetAngle + Math.PI;
    }
  }

  getClosestSidewalkNode(pos) {
    let closest = null;
    let minDist = Infinity;
    for (const node of this.game.city.sidewalkNodes) {
      const d = pos.distanceTo(node);
      if (d < minDist) {
        minDist = d;
        closest = node;
      }
    }
    return closest;
  }

  updateNPCAnimation(npc, delta) {
    if (npc.isDead) return;

    const animSpeed = npc.isPanicking ? 14 : 7;
    npc.animTime += delta * animSpeed;

    const legAngle = Math.sin(npc.animTime) * 0.6;
    const armAngle = Math.sin(npc.animTime) * 0.55;

    npc.bones.lHip.rotation.x = legAngle;
    npc.bones.rHip.rotation.x = -legAngle;
    npc.bones.lKnee.rotation.x = Math.max(0, -legAngle * 0.7);
    npc.bones.rKnee.rotation.x = Math.max(0, legAngle * 0.7);

    if (npc.isPanicking) {
      // Arms raised in fear
      npc.bones.lShoulder.rotation.x = -Math.PI / 1.5 + Math.sin(npc.animTime * 2) * 0.2;
      npc.bones.rShoulder.rotation.x = -Math.PI / 1.5 - Math.sin(npc.animTime * 2) * 0.2;
    } else {
      npc.bones.lShoulder.rotation.x = -armAngle;
      npc.bones.rShoulder.rotation.x = armAngle;
    }
  }

  triggerGunshotPanic(center, radius = 25) {
    for (const npc of this.npcs) {
      if (npc.isDead) continue;
      const dist = npc.position.distanceTo(center);
      if (dist <= radius) {
        if (!npc.isPanicking) {
          npc.isPanicking = true;
          npc.panicTimer = 10.0; // Panic for 10 seconds!
          this.sound.playPanicScream();

          // Run away from gunfire center
          const awayDir = new THREE.Vector3().subVectors(npc.position, center).normalize();
          npc.targetWaypoint = npc.position.clone().add(awayDir.multiplyScalar(40));
        }
      }
    }
  }

  damageNPC(npc, damage, weaponId, hitPoint, isHeadshot = false) {
    if (npc.isDead) return false;

    npc.health -= damage;
    this.createBloodSplatter(hitPoint || npc.position);

    if (isHeadshot || npc.health <= 0) {
      this.killNPC(npc, isHeadshot);
      return true;
    }
    return false;
  }

  killNPC(npc, isHeadshot = false) {
    if (npc.isDead) return;
    npc.isDead = true;
    npc.deathTime = performance.now();

    // If headshot: decapitate head
    if (isHeadshot && npc.bones.headGroup) {
      npc.headDecapitated = true;
      npc.bones.headGroup.visible = false;
      this.spawnDecapitatedHead(npc.position);
    }

    // Ragdoll collapse animation
    npc.bones.hips.position.y = 0.2;
    npc.bones.spine.rotation.x = Math.PI / 2.2;
    npc.bones.lHip.rotation.x = 0.4;
    npc.bones.rHip.rotation.x = -0.3;
    npc.bones.lShoulder.rotation.z = 1.2;
    npc.bones.rShoulder.rotation.z = -1.2;
    npc.mesh.position.y = 0.15;
    npc.mesh.rotation.z = (Math.random() - 0.5) * 0.6;

    // Spawn blood pool decal on ground
    this.spawnBloodDecal(npc.position);
    this.game.state.stats.kills++;
  }

  spawnDecapitatedHead(pos) {
    const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x8a1010, roughness: 0.6 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.copy(pos).add(new THREE.Vector3(0, 1.4, 0));
    this.scene.add(headMesh);

    // Roll head on ground
    const velocity = new THREE.Vector3((Math.random() - 0.5) * 3, 2.5, (Math.random() - 0.5) * 3);
    const startTime = performance.now();
    const animateHead = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 6.0) {
        velocity.y -= 15 * 0.016;
        headMesh.position.addScaledVector(velocity, 0.016);
        if (headMesh.position.y <= 0.18) {
          headMesh.position.y = 0.18;
          velocity.multiplyScalar(0.7);
        }
        headMesh.rotation.x += 0.1;
        headMesh.rotation.z += 0.1;
        requestAnimationFrame(animateHead);
      } else {
        this.scene.remove(headMesh);
      }
    };
    requestAnimationFrame(animateHead);
  }

  spawnBloodDecal(pos) {
    const geo = new THREE.PlaneGeometry(2.4, 2.4);
    const mesh = new THREE.Mesh(geo, this.bloodMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;
    mesh.position.set(pos.x, 0.03, pos.z);
    this.scene.add(mesh);

    this.bloodDecals.push({
      mesh: mesh,
      removeTime: performance.now() + 6000 // cleaned up after 6 seconds
    });
  }

  createBloodSplatter(point) {
    // 3D particle burst
    const count = 12;
    const geo = new THREE.SphereGeometry(0.04, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x990000 });

    for (let i = 0; i < count; i++) {
      const drop = new THREE.Mesh(geo, mat);
      drop.position.copy(point).add(new THREE.Vector3(0, 1.0, 0));
      this.scene.add(drop);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      );

      const start = performance.now();
      const animDrop = () => {
        const t = (performance.now() - start) / 1000;
        if (t < 0.6) {
          vel.y -= 18 * 0.016;
          drop.position.addScaledVector(vel, 0.016);
          requestAnimationFrame(animDrop);
        } else {
          this.scene.remove(drop);
        }
      };
      requestAnimationFrame(animDrop);
    }
  }

  hitNPCWithVehicle(npc, vehicleSpeed, vehicleDir) {
    if (npc.isDead) return;

    // Fling 5 meters into air as required!
    const flingDir = vehicleDir.clone().normalize().multiplyScalar(5.0);
    flingDir.y = 4.5; // fly 5m
    npc.position.add(flingDir);
    npc.mesh.position.copy(npc.position);

    this.sound.playPanicScream();
    this.killNPC(npc, false);
    this.game.addCoins(700, 'تصادف با عابر پیاده (+700 🪙)');
  }

  explodeNPCsInRadius(center, radius) {
    let count = 0;
    for (const npc of this.npcs) {
      if (npc.isDead) continue;
      if (npc.position.distanceTo(center) <= radius) {
        this.killNPC(npc, true);
        count++;
      }
    }
    return count;
  }

  findClosestNPCInCone(origin, forward, maxDist, minDot = 0.7) {
    let best = null;
    let minDist = maxDist;
    for (const npc of this.npcs) {
      if (npc.isDead) continue;
      const toNPC = new THREE.Vector3().subVectors(npc.position, origin);
      const dist = toNPC.length();
      if (dist <= maxDist) {
        toNPC.normalize();
        const dot = forward.dot(toNPC);
        if (dot >= minDot && dist < minDist) {
          minDist = dist;
          best = npc;
        }
      }
    }
    return best;
  }

  raycastNPC(raycaster, maxDist) {
    for (const npc of this.npcs) {
      if (npc.isDead) continue;
      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(npc.position.x, npc.position.y + 1.0, npc.position.z),
        new THREE.Vector3(0.9, 2.0, 0.9)
      );
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectBox(box, hitPoint)) {
        if (hitPoint.distanceTo(raycaster.ray.origin) <= maxDist) {
          const isHeadshot = (hitPoint.y - npc.position.y >= 1.5);
          return { npc, point: hitPoint, isHeadshot };
        }
      }
    }
    return null;
  }
}
