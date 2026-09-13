/**
 * WeaponModels.js
 * Creates realistic 3D meshes for Bat, Pistol, AK-47, LMG, Sniper, and RPG.
 */

import * as THREE from 'three';

export class WeaponModels {
  static createWeaponMesh(weaponId) {
    switch (weaponId) {
      case 'bat':
        return this.createBatMesh();
      case 'pistol':
        return this.createPistolMesh();
      case 'ak47':
        return this.createAK47Mesh();
      case 'lmg':
        return this.createLMGMesh();
      case 'sniper':
        return this.createSniperMesh();
      case 'rpg':
        return this.createRPGMesh();
      default:
        return this.createBatMesh();
    }
  }

  static createBatMesh() {
    const group = new THREE.Group();
    // Wooden / Metallic Baseball Bat
    const batGeo = new THREE.CylinderGeometry(0.045, 0.02, 0.85, 12);
    const batMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.5,
      metalness: 0.1,
    });
    const bat = new THREE.Mesh(batGeo, batMat);
    bat.position.y = 0.35;
    bat.castShadow = true;
    group.add(bat);

    // Grip handle tape
    const gripGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.22, 12);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = 0.08;
    group.add(grip);

    // Knob
    const knobGeo = new THREE.SphereGeometry(0.032, 8, 8);
    const knob = new THREE.Mesh(knobGeo, batMat);
    knob.position.y = -0.04;
    group.add(knob);

    group.rotation.x = -Math.PI / 2.5;
    group.scale.set(1.2, 1.2, 1.2);
    return group;
  }

  static createPistolMesh() {
    const group = new THREE.Group();
    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1d,
      roughness: 0.3,
      metalness: 0.8,
    });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x2d2218, roughness: 0.7 });

    // Slide / Barrel
    const slideGeo = new THREE.BoxGeometry(0.06, 0.08, 0.32);
    const slide = new THREE.Mesh(slideGeo, gunMat);
    slide.position.set(0, 0.08, 0.08);
    slide.castShadow = true;
    group.add(slide);

    // Barrel tip
    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
    const barrel = new THREE.Mesh(barrelGeo, gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.07, 0.25);
    group.add(barrel);

    // Grip
    const gripGeo = new THREE.BoxGeometry(0.055, 0.18, 0.08);
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.02, -0.04);
    grip.rotation.x = -0.25;
    grip.castShadow = true;
    group.add(grip);

    group.rotation.x = -Math.PI / 2;
    group.position.set(0, 0, 0.05);
    return group;
  }

  static createAK47Mesh() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.4, metalness: 0.7 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e3b1f, roughness: 0.6 });

    // Receiver
    const recGeo = new THREE.BoxGeometry(0.07, 0.1, 0.42);
    const rec = new THREE.Mesh(recGeo, metalMat);
    rec.position.set(0, 0.05, 0);
    rec.castShadow = true;
    group.add(rec);

    // Long Barrel
    const barGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.5, 8);
    const bar = new THREE.Mesh(barGeo, metalMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 0.07, 0.45);
    bar.castShadow = true;
    group.add(bar);

    // Wooden Stock
    const stockGeo = new THREE.BoxGeometry(0.06, 0.12, 0.32);
    const stock = new THREE.Mesh(stockGeo, woodMat);
    stock.position.set(0, 0.02, -0.34);
    stock.rotation.x = -0.12;
    stock.castShadow = true;
    group.add(stock);

    // Curved Banana Magazine
    const magGeo = new THREE.BoxGeometry(0.05, 0.24, 0.1);
    const magMat = new THREE.MeshStandardMaterial({ color: 0x8a4513 });
    const mag = new THREE.Mesh(magGeo, magMat);
    mag.position.set(0, -0.12, 0.08);
    mag.rotation.x = 0.35;
    group.add(mag);

    // Grip
    const gripGeo = new THREE.BoxGeometry(0.05, 0.14, 0.06);
    const grip = new THREE.Mesh(gripGeo, woodMat);
    grip.position.set(0, -0.08, -0.12);
    grip.rotation.x = -0.3;
    group.add(grip);

    group.rotation.x = -Math.PI / 2;
    group.scale.set(1.1, 1.1, 1.1);
    return group;
  }

  static createLMGMesh() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x181c20, roughness: 0.3, metalness: 0.85 });

    // Heavy Body
    const bodyGeo = new THREE.BoxGeometry(0.1, 0.14, 0.55);
    const body = new THREE.Mesh(bodyGeo, metalMat);
    body.position.set(0, 0.06, 0);
    body.castShadow = true;
    group.add(body);

    // Heavy Barrel with Heat Shroud
    const barGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8);
    const bar = new THREE.Mesh(barGeo, metalMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 0.07, 0.58);
    bar.castShadow = true;
    group.add(bar);

    // 100-Round Drum Magazine
    const drumGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.14, 16);
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x2b313a, metalness: 0.6 });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(0, -0.12, 0.08);
    group.add(drum);

    // Bipod folded
    const bipodGeo = new THREE.BoxGeometry(0.02, 0.22, 0.02);
    const bipod = new THREE.Mesh(bipodGeo, metalMat);
    bipod.position.set(0.06, -0.04, 0.65);
    group.add(bipod);

    // Heavy Stock
    const stockGeo = new THREE.BoxGeometry(0.08, 0.14, 0.28);
    const stock = new THREE.Mesh(stockGeo, metalMat);
    stock.position.set(0, 0.03, -0.4);
    group.add(stock);

    group.rotation.x = -Math.PI / 2;
    group.scale.set(1.15, 1.15, 1.15);
    return group;
  }

  static createSniperMesh() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.35, metalness: 0.8 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3d443e, roughness: 0.6 });

    // Chassis / Body
    const bodyGeo = new THREE.BoxGeometry(0.08, 0.1, 0.65);
    const body = new THREE.Mesh(bodyGeo, frameMat);
    body.position.set(0, 0.05, 0);
    body.castShadow = true;
    group.add(body);

    // Long Precision Barrel
    const barGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.85, 8);
    const bar = new THREE.Mesh(barGeo, metalMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 0.07, 0.72);
    bar.castShadow = true;
    group.add(bar);

    // Muzzle Brake
    const muzzleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8);
    const muzzle = new THREE.Mesh(muzzleGeo, metalMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.07, 1.18);
    group.add(muzzle);

    // Large Optical Scope
    const scopeGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.34, 12);
    const scopeMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    const scope = new THREE.Mesh(scopeGeo, scopeMat);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.18, 0.08);
    group.add(scope);

    // Stock
    const stockGeo = new THREE.BoxGeometry(0.07, 0.14, 0.38);
    const stock = new THREE.Mesh(stockGeo, frameMat);
    stock.position.set(0, 0.02, -0.48);
    group.add(stock);

    group.rotation.x = -Math.PI / 2;
    group.scale.set(1.1, 1.1, 1.1);
    return group;
  }

  static createRPGMesh() {
    const group = new THREE.Group();
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x3b4d3c, roughness: 0.6, metalness: 0.4 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.4, metalness: 0.8 });
    const warheadMat = new THREE.MeshStandardMaterial({ color: 0x5a6d54, roughness: 0.5 });

    // Main Launcher Tube
    const tubeGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.1, 16);
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, 0.08, 0.1);
    tube.castShadow = true;
    group.add(tube);

    // Rear Venturi Cone
    const coneGeo = new THREE.ConeGeometry(0.11, 0.25, 16);
    const cone = new THREE.Mesh(coneGeo, metalMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.set(0, 0.08, -0.55);
    group.add(cone);

    // Rocket Warhead (Front)
    const warheadGeo = new THREE.ConeGeometry(0.14, 0.38, 16);
    const warhead = new THREE.Mesh(warheadGeo, warheadMat);
    warhead.rotation.x = Math.PI / 2;
    warhead.position.set(0, 0.08, 0.82);
    warhead.castShadow = true;
    group.add(warhead);

    // Warhead stem
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8);
    const stem = new THREE.Mesh(stemGeo, metalMat);
    stem.rotation.x = Math.PI / 2;
    stem.position.set(0, 0.08, 0.68);
    group.add(stem);

    // Trigger Grips
    const gripGeo = new THREE.BoxGeometry(0.05, 0.18, 0.06);
    const grip = new THREE.Mesh(gripGeo, metalMat);
    grip.position.set(0, -0.06, 0.08);
    group.add(grip);

    // Optical Sight
    const sightGeo = new THREE.BoxGeometry(0.06, 0.1, 0.14);
    const sightMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x002233 });
    const sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(-0.08, 0.18, 0.15);
    group.add(sight);

    group.rotation.x = -Math.PI / 2;
    group.scale.set(1.15, 1.15, 1.15);
    return group;
  }
}
