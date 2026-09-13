/**
 * Player.js
 * Controls player avatar, 3D mesh, movement joystick physics, jumping on cars,
 * weapon gripping in hands, attack animations, camera modes (1st, 2nd, 3rd person).
 */

import * as THREE from 'three';
import { CharacterMeshBuilder } from './CharacterCustomizer.js';
import { WeaponModels } from '../weapons/WeaponModels.js';

export class Player {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.camera = game.camera;

    this.position = new THREE.Vector3(0, 0, 40); // spawn at player house
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.isSprinting = false;

    // Movement speeds
    this.walkSpeed = 4.8;
    this.runSpeed = 9.2;
    this.jumpForce = 8.5;
    this.gravity = 22.0;

    // Camera modes: 0: 3rd Person, 1: 1st Person, 2: 2nd Person (Over-shoulder)
    this.cameraMode = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.15;
    this.cameraDist = 4.5;

    // Vehicle state
    this.inVehicle = null;

    // Animation timers & state
    this.animTime = 0;
    this.isAttacking = false;
    this.attackProgress = 0;

    this.meshData = null;
    this.currentWeaponMesh = null;

    this.initCharacterMesh();
  }

  initCharacterMesh() {
    if (this.meshData && this.meshData.mesh) {
      this.scene.remove(this.meshData.mesh);
    }

    const config = this.game.state.character;
    this.meshData = CharacterMeshBuilder.buildCharacter(config, false);
    this.meshData.mesh.position.copy(this.position);
    this.scene.add(this.meshData.mesh);

    this.attachWeapon(this.game.state.currentWeapon || 'bat');
  }

  attachWeapon(weaponId) {
    if (!this.meshData || !this.meshData.bones.rHand) return;

    if (this.currentWeaponMesh) {
      this.meshData.bones.rHand.remove(this.currentWeaponMesh);
      this.currentWeaponMesh = null;
    }

    this.currentWeaponMesh = WeaponModels.createWeaponMesh(weaponId);
    this.meshData.bones.rHand.add(this.currentWeaponMesh);
  }

  playAttackAnimation() {
    this.isAttacking = true;
    this.attackProgress = 0;
  }

  setCameraMode(mode) {
    this.cameraMode = mode % 3;
    // Hide head/body in 1st person
    if (this.meshData && this.meshData.mesh) {
      this.meshData.mesh.visible = (this.cameraMode !== 1);
    }
  }

  cycleCameraMode() {
    this.setCameraMode(this.cameraMode + 1);
    return this.cameraMode;
  }

  getPosition() {
    return this.inVehicle ? this.inVehicle.position : this.position;
  }

  getForwardVector() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(new THREE.Euler(0, this.rotation.y, 0, 'YXZ'));
    return forward;
  }

  enterVehicle(vehicle) {
    this.inVehicle = vehicle;
    this.meshData.mesh.visible = false;
    vehicle.driver = this;
    this.game.sound.startEngine();
    this.game.hud.onEnterVehicle(vehicle);
  }

  exitVehicle() {
    if (!this.inVehicle) return;
    const v = this.inVehicle;
    this.inVehicle = null;
    v.driver = null;
    this.position.copy(v.position).add(new THREE.Vector3(2.2, 0.5, 0));
    this.meshData.mesh.position.copy(this.position);
    this.meshData.mesh.visible = (this.cameraMode !== 1);
    this.velocity.set(0, 0, 0);
    this.game.sound.stopEngine();
    this.game.hud.onExitVehicle();
  }

  jump() {
    if (this.inVehicle) return;
    if (this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
  }

  update(delta, input) {
    if (this.inVehicle) {
      this.updateInVehicle(delta, input);
      return;
    }

    this.updateOnFoot(delta, input);
    this.updateAnimations(delta, input);
    this.updateCamera();
  }

  updateOnFoot(delta, input) {
    // Rotation from input / touch look
    this.cameraYaw -= input.lookDeltaX * 0.0035;
    this.cameraPitch = Math.max(-0.85, Math.min(1.1, this.cameraPitch + input.lookDeltaY * 0.0035));

    // Movement relative to camera angle
    let moveX = input.moveX;
    let moveZ = input.moveZ;

    const moveMag = Math.sqrt(moveX * moveX + moveZ * moveZ);
    let speed = (this.isSprinting ? this.runSpeed : this.walkSpeed);

    if (moveMag > 0.05) {
      // Normalize
      moveX /= Math.max(1, moveMag);
      moveZ /= Math.max(1, moveMag);

      // Camera-relative direction
      const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

      const targetDir = new THREE.Vector3()
        .addScaledVector(forward, -moveZ)
        .addScaledVector(right, moveX)
        .normalize();

      const targetAngle = Math.atan2(targetDir.x, targetDir.z);
      // Smooth rotation
      let diff = targetAngle - this.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotation.y += diff * 15 * delta;

      // Desired horizontal movement
      const moveDelta = targetDir.clone().multiplyScalar(speed * delta);
      this.resolveHorizontalCollision(moveDelta);
    }

    // Vertical physics (gravity & jump)
    this.velocity.y -= this.gravity * delta;
    this.position.y += this.velocity.y * delta;

    // Check ground and standing on cars
    let groundHeight = 0;

    // Check if on top of any vehicle! (Allows jumping on cars and standing on them)
    const carUnder = this.game.vehicleManager.findCarUnderPoint(this.position);
    if (carUnder) {
      groundHeight = carUnder.topY;
    }

    if (this.position.y <= groundHeight) {
      this.position.y = groundHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Check collision with city boundaries and buildings
    this.meshData.mesh.position.copy(this.position);
    this.meshData.mesh.rotation.y = this.rotation.y + Math.PI; // Face forward
  }

  resolveHorizontalCollision(moveDelta) {
    const nextPos = this.position.clone().add(moveDelta);
    const playerRadius = 0.35;
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(nextPos.x, nextPos.y + 1.0, nextPos.z),
      new THREE.Vector3(playerRadius * 2, 1.8, playerRadius * 2)
    );

    let canMove = true;
    for (const col of this.game.city.colliders) {
      if (col.intersectsBox(playerBox)) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      this.position.copy(nextPos);
    } else {
      // Slide along X or Z
      const posX = this.position.clone().add(new THREE.Vector3(moveDelta.x, 0, 0));
      const boxX = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posX.x, posX.y + 1.0, posX.z),
        new THREE.Vector3(playerRadius * 2, 1.8, playerRadius * 2)
      );
      let canMoveX = true;
      for (const col of this.game.city.colliders) {
        if (col.intersectsBox(boxX)) { canMoveX = false; break; }
      }
      if (canMoveX) this.position.x = posX.x;

      const posZ = this.position.clone().add(new THREE.Vector3(0, 0, moveDelta.z));
      const boxZ = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(posZ.x, posZ.y + 1.0, posZ.z),
        new THREE.Vector3(playerRadius * 2, 1.8, playerRadius * 2)
      );
      let canMoveZ = true;
      for (const col of this.game.city.colliders) {
        if (col.intersectsBox(boxZ)) { canMoveZ = false; break; }
      }
      if (canMoveZ) this.position.z = posZ.z;
    }
  }

  updateAnimations(delta, input) {
    if (!this.meshData) return;
    const bones = this.meshData.bones;
    const isMoving = (Math.abs(input.moveX) > 0.05 || Math.abs(input.moveZ) > 0.05);

    if (isMoving) {
      const animSpeed = this.isSprinting ? 16 : 9;
      this.animTime += delta * animSpeed;

      const legAngle = Math.sin(this.animTime) * 0.7;
      const armAngle = Math.sin(this.animTime) * 0.6;

      bones.lHip.rotation.x = legAngle;
      bones.rHip.rotation.x = -legAngle;
      bones.lKnee.rotation.x = Math.max(0, -legAngle * 0.8);
      bones.rKnee.rotation.x = Math.max(0, legAngle * 0.8);

      if (!this.isAttacking && !this.game.weaponManager.isAiming) {
        bones.lShoulder.rotation.x = -armAngle;
        bones.rShoulder.rotation.x = armAngle;
      }
    } else {
      // Idle breathing
      this.animTime += delta * 2;
      bones.lHip.rotation.x = 0;
      bones.rHip.rotation.x = 0;
      bones.lKnee.rotation.x = 0;
      bones.rKnee.rotation.x = 0;
      bones.spine.position.y = 0.15 + Math.sin(this.animTime) * 0.015;

      if (!this.isAttacking && !this.game.weaponManager.isAiming) {
        bones.lShoulder.rotation.x = 0;
        bones.rShoulder.rotation.x = 0;
      }
    }

    // Aiming animation: raise hands & arms forward towards target
    if (this.game.weaponManager.isAiming) {
      bones.rShoulder.rotation.x = -Math.PI / 2 + 0.1;
      bones.rShoulder.rotation.z = -0.2;
      bones.lShoulder.rotation.x = -Math.PI / 2 + 0.2;
      bones.lShoulder.rotation.z = 0.4;
    }

    // Attack animation: bat swing / weapon recoil
    if (this.isAttacking) {
      this.attackProgress += delta * 6;
      if (this.attackProgress < 1.0) {
        const swing = Math.sin(this.attackProgress * Math.PI);
        bones.rShoulder.rotation.x = -Math.PI / 2.2 - swing * 0.8;
        bones.rShoulder.rotation.y = swing * 0.8;
      } else {
        this.isAttacking = false;
      }
    }
  }

  updateInVehicle(delta, input) {
    const v = this.inVehicle;
    v.update(delta, input);

    // Follow vehicle with camera
    this.cameraYaw = v.mesh.rotation.y;
    this.updateCamera();
  }

  updateCamera() {
    const targetPos = this.getPosition().clone().add(new THREE.Vector3(0, 1.6, 0));

    if (this.cameraMode === 1) {
      // Mode 1: First Person
      this.camera.position.copy(targetPos).add(new THREE.Vector3(0, 0.1, 0));
      const lookDir = new THREE.Vector3(
        -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
        Math.sin(this.cameraPitch),
        -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
      );
      this.camera.lookAt(this.camera.position.clone().add(lookDir));
    } else if (this.cameraMode === 2) {
      // Mode 2: Second Person (Over Shoulder Cinematic)
      const dist = 2.4;
      const shoulderOffset = new THREE.Vector3(0.7, 0.2, 0);
      shoulderOffset.applyEuler(new THREE.Euler(0, this.cameraYaw, 0, 'YXZ'));

      const camX = targetPos.x + shoulderOffset.x + Math.sin(this.cameraYaw) * dist * Math.cos(this.cameraPitch);
      const camY = targetPos.y + shoulderOffset.y + Math.sin(this.cameraPitch) * dist;
      const camZ = targetPos.z + shoulderOffset.z + Math.cos(this.cameraYaw) * dist * Math.cos(this.cameraPitch);

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(targetPos.clone().add(shoulderOffset.clone().multiplyScalar(0.5)));
    } else {
      // Mode 3: Third Person (GTA Classic Follow)
      const dist = this.inVehicle ? 7.5 : this.cameraDist;
      const height = this.inVehicle ? 3.0 : 2.0;

      const camX = targetPos.x + Math.sin(this.cameraYaw) * dist * Math.cos(this.cameraPitch);
      const camY = targetPos.y + height + Math.sin(this.cameraPitch) * dist;
      const camZ = targetPos.z + Math.cos(this.cameraYaw) * dist * Math.cos(this.cameraPitch);

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(targetPos);
    }
  }
}
