/**
 * VehicleModels.js
 * High quality 3D procedural meshes for Lamborghini Aventador/Huracan and City Traffic Cars.
 * Tinted windows, headlights, taillights, sports wheels, spoilers, realistic styling.
 */

import * as THREE from 'three';

export class VehicleModels {
  /**
   * Builds high quality Lamborghini Supercar in Glossy Black
   */
  static createLamborghiniMesh() {
    const carGroup = new THREE.Group();

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x08080a, // Sleek black
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.5,
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x151618,
      roughness: 0.4,
      metalness: 0.6,
    });

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d12, // Tinted black glass
      metalness: 0.95,
      roughness: 0.05,
      transparent: true,
      opacity: 0.88,
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });

    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff0022,
      emissive: 0xff0022,
      emissiveIntensity: 1.5,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold/Bronze Cyber Rims
      metalness: 0.95,
      roughness: 0.2,
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.85,
    });

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.45, 4.6);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.42;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carGroup.add(chassis);

    // 2. Aerodynamic Wedge Hood
    const hoodGeo = new THREE.BoxGeometry(1.9, 0.25, 1.6);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.58, 1.2);
    hood.rotation.x = 0.12; // Slanted nose
    hood.castShadow = true;
    carGroup.add(hood);

    // Front Splitter / Carbon Bumper
    const splitGeo = new THREE.BoxGeometry(2.15, 0.12, 0.6);
    const splitter = new THREE.Mesh(splitGeo, carbonMat);
    splitter.position.set(0, 0.22, 2.3);
    carGroup.add(splitter);

    // 3. Cabin / Tinted Glass Canopy
    const cabinGeo = new THREE.BoxGeometry(1.65, 0.52, 1.8);
    const cabin = new THREE.Mesh(cabinGeo, windowMat);
    cabin.position.set(0, 0.86, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Roof Panel
    const roofGeo = new THREE.BoxGeometry(1.45, 0.08, 1.4);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 1.14, -0.2);
    carGroup.add(roof);

    // 4. Rear Engine Deck & Vents
    const deckGeo = new THREE.BoxGeometry(1.85, 0.35, 1.4);
    const deck = new THREE.Mesh(deckGeo, bodyMat);
    deck.position.set(0, 0.68, -1.4);
    deck.castShadow = true;
    carGroup.add(deck);

    // GT Wing / Spoiler
    const wingGeo = new THREE.BoxGeometry(2.05, 0.06, 0.35);
    const wing = new THREE.Mesh(wingGeo, carbonMat);
    wing.position.set(0, 1.05, -2.1);
    carGroup.add(wing);

    const wingPillarGeo = new THREE.BoxGeometry(0.06, 0.32, 0.15);
    const p1 = new THREE.Mesh(wingPillarGeo, carbonMat);
    p1.position.set(-0.6, 0.88, -2.1);
    const p2 = new THREE.Mesh(wingPillarGeo, carbonMat);
    p2.position.set(0.6, 0.88, -2.1);
    carGroup.add(p1);
    carGroup.add(p2);

    // 5. Y-shaped Headlights (Lamborghini signature)
    const hlGeo = new THREE.BoxGeometry(0.4, 0.08, 0.2);
    const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
    hlLeft.position.set(-0.75, 0.52, 2.2);
    hlLeft.rotation.y = 0.2;
    const hlRight = new THREE.Mesh(hlGeo, headlightMat);
    hlRight.position.set(0.75, 0.52, 2.2);
    hlRight.rotation.y = -0.2;
    carGroup.add(hlLeft);
    carGroup.add(hlRight);

    // Headlight Point Lights
    const hLight1 = new THREE.SpotLight(0xffffff, 3.5, 30, Math.PI / 4, 0.3);
    hLight1.position.set(-0.75, 0.52, 2.3);
    hLight1.target.position.set(-0.75, 0, 15);
    carGroup.add(hLight1);
    carGroup.add(hLight1.target);

    const hLight2 = new THREE.SpotLight(0xffffff, 3.5, 30, Math.PI / 4, 0.3);
    hLight2.position.set(0.75, 0.52, 2.3);
    hLight2.target.position.set(0.75, 0, 15);
    carGroup.add(hLight2);
    carGroup.add(hLight2.target);

    // 6. Taillights
    const tlGeo = new THREE.BoxGeometry(0.5, 0.08, 0.1);
    const tlLeft = new THREE.Mesh(tlGeo, taillightMat);
    tlLeft.position.set(-0.7, 0.55, -2.31);
    const tlRight = new THREE.Mesh(tlGeo, taillightMat);
    tlRight.position.set(0.7, 0.55, -2.31);
    carGroup.add(tlLeft);
    carGroup.add(tlRight);

    // Dual Exhausts
    const exGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
    const exMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9, roughness: 0.2 });
    const ex1 = new THREE.Mesh(exGeo, exMat);
    ex1.rotation.x = Math.PI / 2;
    ex1.position.set(-0.2, 0.32, -2.32);
    const ex2 = new THREE.Mesh(exGeo, exMat);
    ex2.rotation.x = Math.PI / 2;
    ex2.position.set(0.2, 0.32, -2.32);
    carGroup.add(ex1);
    carGroup.add(ex2);

    // 7. Four Wheels with Cyber Gold Rims
    const wheels = [];
    const wheelPositions = [
      { x: -1.05, y: 0.35, z: 1.4 },
      { x: 1.05, y: 0.35, z: 1.4 },
      { x: -1.05, y: 0.38, z: -1.4 },
      { x: 1.05, y: 0.38, z: -1.4 }
    ];

    wheelPositions.forEach((wp, idx) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wp.x, wp.y, wp.z);

      const tRadius = idx >= 2 ? 0.38 : 0.35; // Staggered wider rear wheels
      const tWidth = 0.28;

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(tRadius, tRadius, tWidth, 16), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(tRadius * 0.65, tRadius * 0.65, tWidth + 0.02, 12), rimMat);
      rim.rotation.z = Math.PI / 2;
      wGroup.add(rim);

      carGroup.add(wGroup);
      wheels.push(wGroup);
    });

    return { mesh: carGroup, wheels };
  }

  /**
   * Builds diverse Traffic Cars (Sedans, SUVs, Coupes) with tinted windows
   */
  static createTrafficCarMesh(colorHex, typeIndex = 0) {
    const carGroup = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.7,
      roughness: 0.3,
    });

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x0d1117, // Tinted dark glass
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffae0,
      emissiveIntensity: 0.8,
    });

    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff1122,
      emissive: 0xff1122,
      emissiveIntensity: 1.0,
    });

    const tireMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 });

    // Chassis dimensions
    const isSUV = (typeIndex % 3 === 1);
    const carW = 1.9;
    const carH = isSUV ? 0.65 : 0.48;
    const carL = 4.2;

    const chassisGeo = new THREE.BoxGeometry(carW, carH, carL);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carGroup.add(chassis);

    // Cabin
    const cabinH = isSUV ? 0.7 : 0.55;
    const cabinL = isSUV ? 2.4 : 2.0;
    const cabinGeo = new THREE.BoxGeometry(carW * 0.88, cabinH, cabinL);
    const cabin = new THREE.Mesh(cabinGeo, windowMat);
    cabin.position.set(0, 0.45 + carH / 2 + cabinH / 2, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Roof
    const roofGeo = new THREE.BoxGeometry(carW * 0.84, 0.06, cabinL * 0.8);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 0.45 + carH / 2 + cabinH + 0.03, -0.2);
    carGroup.add(roof);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const hlL = new THREE.Mesh(hlGeo, headlightMat);
    hlL.position.set(-0.65, 0.5, carL / 2 + 0.02);
    const hlR = new THREE.Mesh(hlGeo, headlightMat);
    hlR.position.set(0.65, 0.5, carL / 2 + 0.02);
    carGroup.add(hlL);
    carGroup.add(hlR);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const tlL = new THREE.Mesh(tlGeo, taillightMat);
    tlL.position.set(-0.65, 0.5, -carL / 2 - 0.02);
    const tlR = new THREE.Mesh(tlGeo, taillightMat);
    tlR.position.set(0.65, 0.5, -carL / 2 - 0.02);
    carGroup.add(tlL);
    carGroup.add(tlR);

    // 4 Wheels
    const wheels = [];
    const wZ = carL * 0.32;
    const wY = 0.35;
    const wheelPositions = [
      { x: -carW / 2 - 0.06, y: wY, z: wZ },
      { x: carW / 2 + 0.06, y: wY, z: wZ },
      { x: -carW / 2 - 0.06, y: wY, z: -wZ },
      { x: carW / 2 + 0.06, y: wY, z: -wZ }
    ];

    wheelPositions.forEach(wp => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wp.x, wp.y, wp.z);

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.24, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      wGroup.add(rim);

      carGroup.add(wGroup);
      wheels.push(wGroup);
    });

    return { mesh: carGroup, wheels };
  }
}
