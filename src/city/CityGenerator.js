/**
 * CityGenerator.js
 * Generates a realistic, large cyberpunk/modern 3D city:
 * - Road network with lane markings and crosswalks
 * - Concrete sidewalks and curbs
 * - Modern skyscrapers, commercial centers, residential buildings
 * - Player's stylish spawn house
 * - Shadow Weapons Armory (Gun Store) with neon signage
 * - Trees with shadows, streetlamps with night glow, traffic lights, benches, props
 * - Invisible boundary collision walls around the city perimeter
 * - Collision bounding boxes list for realistic physics
 */

import * as THREE from 'three';
import { TextureGenerator } from '../core/TextureGenerator.js';

export class CityGenerator {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // Array of THREE.Box3 for collision detection
    this.roadSegments = []; // Road lane segments for traffic AI navigation
    this.sidewalkNodes = []; // Sidewalk waypoints for pedestrian NPC navigation
    this.spawnPoints = [];
    this.playerHousePosition = new THREE.Vector3(0, 0, 40);
    this.gunShopPosition = new THREE.Vector3(-60, 0, -60);
    this.gunShopKeeperPosition = new THREE.Vector3(-60, 0, -52);
    this.citySize = 360; // 360x360 meters city area
    this.blockSize = 60;
    this.roadWidth = 14;
    this.sidewalkWidth = 3.5;

    this.buildingMaterials = [];
    this.roadMaterial = null;
    this.intersectionMaterial = null;
    this.sidewalkMaterial = null;
    this.grassMaterial = null;
  }

  generate() {
    this.initMaterials();
    this.createGround();
    this.createRoadGrid();
    this.createBuildingsAndZones();
    this.createPlayerHouse();
    this.createGunShop();
    this.createCityProps();
    this.createBoundaryWalls();

    return {
      colliders: this.colliders,
      roadSegments: this.roadSegments,
      sidewalkNodes: this.sidewalkNodes,
      playerHousePosition: this.playerHousePosition,
      gunShopPosition: this.gunShopPosition,
      gunShopKeeperPosition: this.gunShopKeeperPosition,
    };
  }

  initMaterials() {
    const roadTex = TextureGenerator.createRoadTexture();
    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.85,
      metalness: 0.1,
    });

    const interTex = TextureGenerator.createIntersectionTexture();
    this.intersectionMaterial = new THREE.MeshStandardMaterial({
      map: interTex,
      roughness: 0.85,
      metalness: 0.1,
    });

    const sideTex = TextureGenerator.createSidewalkTexture();
    this.sidewalkMaterial = new THREE.MeshStandardMaterial({
      map: sideTex,
      roughness: 0.9,
      metalness: 0.05,
    });

    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d4c28,
      roughness: 0.95,
      metalness: 0.0,
    });

    // 4 Building facade styles
    for (let i = 0; i < 4; i++) {
      const bTex = TextureGenerator.createBuildingFacadeTexture(i);
      this.buildingMaterials.push(
        new THREE.MeshStandardMaterial({
          map: bTex,
          roughness: 0.4,
          metalness: 0.3,
        })
      );
    }
  }

  createGround() {
    // City base plane
    const groundGeo = new THREE.PlaneGeometry(this.citySize * 1.5, this.citySize * 1.5);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111418,
      roughness: 0.95,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  createRoadGrid() {
    const halfCity = this.citySize / 2;
    const step = this.blockSize + this.roadWidth;
    const roadY = 0.02;

    // Grid coordinates
    const coords = [];
    for (let p = -halfCity + step / 2; p <= halfCity - step / 2; p += step) {
      coords.push(p);
    }

    // Create Roads (North-South & East-West)
    coords.forEach(x => {
      // NS Road
      const nsGeo = new THREE.PlaneGeometry(this.roadWidth, this.citySize);
      const nsRoad = new THREE.Mesh(nsGeo, this.roadMaterial.clone());
      nsRoad.material.map.repeat.set(1, this.citySize / 14);
      nsRoad.rotation.x = -Math.PI / 2;
      nsRoad.position.set(x, roadY, 0);
      nsRoad.receiveShadow = true;
      this.scene.add(nsRoad);

      // Register traffic waypoints along this road
      this.roadSegments.push({
        type: 'NS',
        x: x,
        laneRightX: x + 3.2,
        laneLeftX: x - 3.2,
        zStart: -halfCity,
        zEnd: halfCity,
      });
    });

    coords.forEach(z => {
      // EW Road
      const ewGeo = new THREE.PlaneGeometry(this.citySize, this.roadWidth);
      const ewRoad = new THREE.Mesh(ewGeo, this.roadMaterial.clone());
      ewRoad.material.map.repeat.set(this.citySize / 14, 1);
      ewRoad.rotation.x = -Math.PI / 2;
      ewRoad.rotation.z = Math.PI / 2;
      ewRoad.position.set(0, roadY + 0.005, z);
      ewRoad.receiveShadow = true;
      this.scene.add(ewRoad);

      this.roadSegments.push({
        type: 'EW',
        z: z,
        laneRightZ: z + 3.2,
        laneLeftZ: z - 3.2,
        xStart: -halfCity,
        xEnd: halfCity,
      });
    });

    // Intersections at every cross
    coords.forEach(x => {
      coords.forEach(z => {
        const interGeo = new THREE.PlaneGeometry(this.roadWidth, this.roadWidth);
        const inter = new THREE.Mesh(interGeo, this.intersectionMaterial);
        inter.rotation.x = -Math.PI / 2;
        inter.position.set(x, roadY + 0.01, z);
        inter.receiveShadow = true;
        this.scene.add(inter);
      });
    });
  }

  createBuildingsAndZones() {
    const halfCity = this.citySize / 2;
    const step = this.blockSize + this.roadWidth;
    const halfRoad = this.roadWidth / 2;

    const coords = [];
    for (let p = -halfCity + step / 2; p <= halfCity - step / 2; p += step) {
      coords.push(p);
    }

    // For every block cell between roads
    for (let i = 0; i < coords.length - 1; i++) {
      for (let j = 0; j < coords.length - 1; j++) {
        const minX = coords[i] + halfRoad;
        const maxX = coords[i + 1] - halfRoad;
        const minZ = coords[j] + halfRoad;
        const maxZ = coords[j + 1] - halfRoad;

        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const blockW = maxX - minX;
        const blockD = maxZ - minZ;

        // Sidewalk around block
        this.createBlockSidewalk(centerX, centerZ, blockW, blockD);

        // Check if this block is reserved for Player House or Gun Shop
        if (Math.abs(centerX - 0) < 30 && Math.abs(centerZ - 40) < 30) {
          // Reserved for Player House
          continue;
        }
        if (Math.abs(centerX - (-60)) < 30 && Math.abs(centerZ - (-60)) < 30) {
          // Reserved for Gun Store
          continue;
        }

        // Subdivide block into 2 or 4 modern skyscrapers or plazas
        this.populateBlockWithBuildings(centerX, centerZ, blockW - this.sidewalkWidth * 2, blockD - this.sidewalkWidth * 2);
      }
    }
  }

  createBlockSidewalk(cx, cz, w, d) {
    const curbHeight = 0.22;
    const sideGeo = new THREE.BoxGeometry(w, curbHeight, d);
    const sidewalk = new THREE.Mesh(sideGeo, this.sidewalkMaterial);
    sidewalk.position.set(cx, curbHeight / 2, cz);
    sidewalk.receiveShadow = true;
    this.scene.add(sidewalk);

    // Register sidewalk pedestrian nodes along the 4 edges of this block
    const pad = 1.2;
    const x1 = cx - w / 2 + pad;
    const x2 = cx + w / 2 - pad;
    const z1 = cz - d / 2 + pad;
    const z2 = cz + d / 2 - pad;

    // Corner nodes & intermediate nodes for NPC walking paths
    const stepCount = 4;
    for (let s = 0; s <= stepCount; s++) {
      const t = s / stepCount;
      // North edge
      this.sidewalkNodes.push(new THREE.Vector3(x1 + t * (x2 - x1), curbHeight, z1));
      // South edge
      this.sidewalkNodes.push(new THREE.Vector3(x1 + t * (x2 - x1), curbHeight, z2));
      // West edge
      this.sidewalkNodes.push(new THREE.Vector3(x1, curbHeight, z1 + t * (z2 - z1)));
      // East edge
      this.sidewalkNodes.push(new THREE.Vector3(x2, curbHeight, z1 + t * (z2 - z1)));
    }
  }

  populateBlockWithBuildings(cx, cz, innerW, innerD) {
    const isSkyscraperBlock = Math.random() > 0.2;
    const subDivide = Math.random() > 0.4 ? 4 : 2;

    if (subDivide === 2) {
      // 2 tall buildings
      const bW = innerW * 0.9;
      const bD = (innerD / 2) * 0.88;
      [-innerD / 4, innerD / 4].forEach((offsetZ, idx) => {
        const height = 28 + Math.random() * 45;
        this.createSkyscraper(cx, height / 2, cz + offsetZ, bW, height, bD, idx);
      });
    } else {
      // 4 buildings
      const bW = (innerW / 2) * 0.88;
      const bD = (innerD / 2) * 0.88;
      [-innerW / 4, innerW / 4].forEach((offsetX, idxX) => {
        [-innerD / 4, innerD / 4].forEach((offsetZ, idxZ) => {
          const height = 22 + Math.random() * 40;
          this.createSkyscraper(cx + offsetX, height / 2, cz + offsetZ, bW, height, bD, (idxX * 2 + idxZ));
        });
      });
    }
  }

  createSkyscraper(x, y, z, w, h, d, matIdx) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = this.buildingMaterials[matIdx % this.buildingMaterials.length];
    const building = new THREE.Mesh(geo, mat);
    building.position.set(x, y, z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);

    // Roof rooftop structure & antenna
    const roofGeo = new THREE.BoxGeometry(w * 0.6, 2.5, d * 0.6);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(x, y + h / 2 + 1.25, z);
    this.scene.add(roof);

    // Glowing antenna
    const antGeo = new THREE.CylinderGeometry(0.15, 0.25, 8, 8);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.6 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.set(x, y + h / 2 + 6.5, z);
    this.scene.add(ant);

    // Register physics collider
    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(w + 0.6, h, d + 0.6));
    this.colliders.push(box);
  }

  /* =========================================================================
     PLAYER'S SPAWN HOUSE (خانه کاراکتر)
     ========================================================================= */
  createPlayerHouse() {
    const px = this.playerHousePosition.x;
    const pz = this.playerHousePosition.z;

    // Stylish modern house architecture
    const houseGroup = new THREE.Group();

    // Grass garden lawn
    const lawnGeo = new THREE.BoxGeometry(45, 0.25, 45);
    const lawn = new THREE.Mesh(lawnGeo, this.grassMaterial);
    lawn.position.set(px, 0.12, pz);
    lawn.receiveShadow = true;
    this.scene.add(lawn);

    // House main body (white / modern dark grey panels)
    const bodyGeo = new THREE.BoxGeometry(22, 9, 18);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xededed,
      roughness: 0.4,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(px, 4.5, pz - 2);
    body.castShadow = true;
    body.receiveShadow = true;
    houseGroup.add(body);

    // 2nd Floor Balcony Suite
    const topGeo = new THREE.BoxGeometry(16, 6, 12);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x22262d,
      roughness: 0.3,
      metalness: 0.2,
    });
    const topFloor = new THREE.Mesh(topGeo, topMat);
    topFloor.position.set(px - 2, 12, pz - 4);
    topFloor.castShadow = true;
    topFloor.receiveShadow = true;
    houseGroup.add(topFloor);

    // Glass Panoramic Windows
    const glassGeo = new THREE.PlaneGeometry(10, 4);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x004466,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    const frontGlass = new THREE.Mesh(glassGeo, glassMat);
    frontGlass.position.set(px, 4.5, pz + 7.02);
    houseGroup.add(frontGlass);

    // Front Entrance Porch / Door
    const doorGeo = new THREE.BoxGeometry(3, 5, 0.5);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.7 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(px + 6, 2.5, pz + 7.02);
    houseGroup.add(door);

    // Porch roof overhang
    const porchGeo = new THREE.BoxGeometry(8, 0.5, 5);
    const porchMat = new THREE.MeshStandardMaterial({ color: 0x11141a });
    const porch = new THREE.Mesh(porchGeo, porchMat);
    porch.position.set(px + 6, 5.2, pz + 8.5);
    houseGroup.add(porch);

    // Driveway paving (for parking car)
    const driveGeo = new THREE.PlaneGeometry(8, 16);
    const driveMat = new THREE.MeshStandardMaterial({ color: 0x33373e, roughness: 0.9 });
    const drive = new THREE.Mesh(driveGeo, driveMat);
    drive.rotation.x = -Math.PI / 2;
    drive.position.set(px - 7, 0.26, pz + 12);
    houseGroup.add(drive);

    // Garden modern fence
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x4a505b, metalness: 0.5, roughness: 0.4 });
    const fenceGeoX = new THREE.BoxGeometry(45, 1.2, 0.3);
    const fenceFront = new THREE.Mesh(fenceGeoX, fenceMat);
    fenceFront.position.set(px, 0.6, pz + 22.5);
    houseGroup.add(fenceFront);

    // Garden decorative trees & lights
    this.createTree(px + 16, 0.2, pz + 8);
    this.createTree(px + 16, 0.2, pz - 12);
    this.createTree(px - 16, 0.2, pz - 12);

    this.scene.add(houseGroup);

    // Collider for house
    const houseBox = new THREE.Box3();
    houseBox.setFromCenterAndSize(new THREE.Vector3(px, 7, pz - 2), new THREE.Vector3(23, 15, 19));
    this.colliders.push(houseBox);
  }

  /* =========================================================================
     GUN SHOP (مغازه تفنگ فروشی)
     ========================================================================= */
  createGunShop() {
    const gx = this.gunShopPosition.x;
    const gz = this.gunShopPosition.z;

    const shopGroup = new THREE.Group();

    // Sidewalk base for shop
    const baseGeo = new THREE.BoxGeometry(45, 0.25, 45);
    const base = new THREE.Mesh(baseGeo, this.sidewalkMaterial);
    base.position.set(gx, 0.12, gz);
    base.receiveShadow = true;
    this.scene.add(base);

    // Store building
    const storeGeo = new THREE.BoxGeometry(26, 12, 22);
    const storeMat = new THREE.MeshStandardMaterial({
      color: 0x120c1f,
      roughness: 0.4,
      metalness: 0.6,
    });
    const store = new THREE.Mesh(storeGeo, storeMat);
    store.position.set(gx, 6, gz - 4);
    store.castShadow = true;
    store.receiveShadow = true;
    shopGroup.add(store);

    // Glowing Cyberpunk Signboard above entrance
    const signTex = TextureGenerator.createGunShopSignTexture();
    const signGeo = new THREE.PlaneGeometry(16, 8);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.2,
      emissive: 0x331144,
      emissiveIntensity: 0.5,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(gx, 10, gz + 7.05);
    shopGroup.add(sign);

    // Storefront Counter / Display
    const counterGeo = new THREE.BoxGeometry(10, 2.2, 2);
    const counterMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x004455,
      metalness: 0.8,
      roughness: 0.2,
    });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(gx, 1.1, gz + 4.5);
    shopGroup.add(counter);

    // Stationary Shopkeeper NPC mesh (immobile, invincible)
    const keeper = this.createShopkeeperNPC(this.gunShopKeeperPosition.x, 0, this.gunShopKeeperPosition.z);
    shopGroup.add(keeper);

    this.scene.add(shopGroup);

    // Collider for shop building
    const shopBox = new THREE.Box3();
    shopBox.setFromCenterAndSize(new THREE.Vector3(gx, 6, gz - 4), new THREE.Vector3(27, 13, 23));
    this.colliders.push(shopBox);
  }

  createShopkeeperNPC(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const legGeo = new THREE.CylinderGeometry(0.18, 0.16, 1.6, 8);
    const lLeg = new THREE.Mesh(legGeo, legMat);
    lLeg.position.set(-0.25, 0.8, 0);
    const rLeg = new THREE.Mesh(legGeo, legMat);
    rLeg.position.set(0.25, 0.8, 0);
    group.add(lLeg);
    group.add(rLeg);

    // Torso (Cyberpunk tactical armored vest)
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.3, 0.45);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      roughness: 0.5,
      metalness: 0.4,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 2.25, 0);
    group.add(torso);

    // Arms & Hands
    const armGeo = new THREE.CylinderGeometry(0.14, 0.12, 1.1, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const lArm = new THREE.Mesh(armGeo, armMat);
    lArm.position.set(-0.55, 2.1, 0);
    const rArm = new THREE.Mesh(armGeo, armMat);
    rArm.position.set(0.55, 2.1, 0);
    group.add(lArm);
    group.add(rArm);

    // Head with sunglasses / cyber headset
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd69e7e, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 3.15, 0);
    group.add(head);

    // Glasses
    const glassGeo = new THREE.BoxGeometry(0.38, 0.12, 0.2);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 });
    const glasses = new THREE.Mesh(glassGeo, glassMat);
    glasses.position.set(0, 3.2, 0.22);
    group.add(glasses);

    // Cyberpunk armory sign indicator above head
    const markerGeo = new THREE.ConeGeometry(0.35, 0.6, 6);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0xf5b041,
      emissive: 0xf5b041,
      emissiveIntensity: 0.9,
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.rotation.x = Math.PI;
    marker.position.set(0, 4.2, 0);
    group.add(marker);

    return group;
  }

  /* =========================================================================
     CITY PROPS: Trees, Street Lights, Benches
     ========================================================================= */
  createCityProps() {
    const halfCity = this.citySize / 2;
    const step = this.blockSize + this.roadWidth;
    const coords = [];
    for (let p = -halfCity + step / 2; p <= halfCity - step / 2; p += step) {
      coords.push(p);
    }

    // Street lamps and trees along all road borders
    coords.forEach(x => {
      coords.forEach(z => {
        // Street lamp at each corner
        this.createStreetLamp(x + 9, 0, z + 9);
        this.createStreetLamp(x - 9, 0, z - 9);

        // Trees on sidewalks
        this.createTree(x + 22, 0.22, z + 8.5);
        this.createTree(x - 22, 0.22, z - 8.5);
      });
    });
  }

  createTree(x, y, z) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.38, 3.8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.9;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Foliage (double tier sphere canopy for lush look & shadow)
    const fMat = new THREE.MeshStandardMaterial({
      color: 0x1f6d2a,
      roughness: 0.8,
      metalness: 0.05,
    });

    const f1Geo = new THREE.SphereGeometry(2.2, 8, 8);
    const f1 = new THREE.Mesh(f1Geo, fMat);
    f1.position.y = 4.2;
    f1.castShadow = true;
    f1.receiveShadow = true;
    treeGroup.add(f1);

    const f2Geo = new THREE.SphereGeometry(1.6, 8, 8);
    const f2 = new THREE.Mesh(f2Geo, fMat);
    f2.position.y = 5.6;
    f2.castShadow = true;
    f2.receiveShadow = true;
    treeGroup.add(f2);

    this.scene.add(treeGroup);
  }

  createStreetLamp(x, y, z) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, y, z);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 6.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c333d, metalness: 0.8, roughness: 0.3 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.25;
    pole.castShadow = true;
    lampGroup.add(pole);

    // Arm
    const armGeo = new THREE.BoxGeometry(1.4, 0.1, 0.1);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0.6, 6.4, 0);
    lampGroup.add(arm);

    // Light head
    const headGeo = new THREE.BoxGeometry(0.6, 0.2, 0.4);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffaed,
      emissiveIntensity: 1.0,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(1.1, 6.3, 0);
    lampGroup.add(head);

    this.scene.add(lampGroup);
  }

  /* =========================================================================
     BOUNDARY WALLS (دیوار نامرئی انتهای شهر)
     ========================================================================= */
  createBoundaryWalls() {
    const half = this.citySize / 2;
    const wallH = 40;
    const wallThick = 6;

    // 4 invisible collider boxes around the perimeter
    const bounds = [
      { center: new THREE.Vector3(0, wallH / 2, half + wallThick / 2), size: new THREE.Vector3(this.citySize + 20, wallH, wallThick) },
      { center: new THREE.Vector3(0, wallH / 2, -half - wallThick / 2), size: new THREE.Vector3(this.citySize + 20, wallH, wallThick) },
      { center: new THREE.Vector3(half + wallThick / 2, wallH / 2, 0), size: new THREE.Vector3(wallThick, wallH, this.citySize + 20) },
      { center: new THREE.Vector3(-half - wallThick / 2, wallH / 2, 0), size: new THREE.Vector3(wallThick, wallH, this.citySize + 20) },
    ];

    bounds.forEach(b => {
      const box = new THREE.Box3();
      box.setFromCenterAndSize(b.center, b.size);
      this.colliders.push(box);
    });
  }
}
