/**
 * CharacterCustomizer.js
 * Wardrobe, colors, and mesh builder for Boy & Girl characters.
 * 20 total outfit options (5 shirts + 5 pants for boys, 5 shirts + 5 pants for girls).
 */

import * as THREE from 'three';

export const OUTFIT_DATA = {
  boy: {
    shirts: [
      { name: 'هودی سایبر مشکی', color: '#16181d', decal: '#00f0ff', sleeveColor: '#16181d' },
      { name: 'تیشرت چرم قرمز', color: '#8b0000', decal: '#ffffff', sleeveColor: '#d69e7e' },
      { name: 'ژاکت نئونی بنفش', color: '#3d1257', decal: '#ff007f', sleeveColor: '#280c3a' },
      { name: 'پیراهن خیابانی ارتشی', color: '#3b4d3c', decal: '#f5b041', sleeveColor: '#3b4d3c' },
      { name: 'کت اسپرت طلایی سایبر', color: '#c99700', decal: '#111111', sleeveColor: '#222222' }
    ],
    pants: [
      { name: 'شلوار اسلش مشکی', color: '#111317' },
      { name: 'شلوار جین تیره', color: '#1f2b3e' },
      { name: 'شلوار کارگو خاکی', color: '#544c3d' },
      { name: 'شلوار چرم براق', color: '#222222' },
      { name: 'شلوار سایبرپانک زرد', color: '#997300' }
    ]
  },
  girl: {
    shirts: [
      { name: 'کراپ تاپ سایبر صورتی', color: '#d1116c', decal: '#00ffff', sleeveColor: '#d69e7e' },
      { name: 'کت چرم اسپرت مشکی', color: '#1a1a1a', decal: '#ff0055', sleeveColor: '#1a1a1a' },
      { name: 'تاپ فیروزه‌ای نئونی', color: '#009999', decal: '#ffffff', sleeveColor: '#d69e7e' },
      { name: 'هودی گانگستری بنفش', color: '#5e1b88', decal: '#ffff00', sleeveColor: '#431262' },
      { name: 'ژاکت سفید مسابقه‌ای', color: '#e8e8e8', decal: '#ff3333', sleeveColor: '#e8e8e8' }
    ],
    pants: [
      { name: 'لگینگ چرم مشکی', color: '#0f0f11' },
      { name: 'شلوار جین اسلیم آبی', color: '#2b4263' },
      { name: 'شلوار کارگو طوسی اسپرت', color: '#444850' },
      { name: 'شورت جین گانگستری', color: '#1a273b' },
      { name: 'شلوار اسلش نئونی بنفش', color: '#4d196f' }
    ]
  },
  skinTones: ['#f5d0b5', '#d69e7e', '#a86f44', '#663b19', '#e0b89b'],
  hairColors: ['#111111', '#5c3a21', '#a07844', '#b82601', '#e8e8e8', '#00f0ff', '#ff007f']
};

export class CharacterMeshBuilder {
  static buildCharacter(config, isNPC = false) {
    const group = new THREE.Group();
    const gender = config.gender || 'boy';
    const skinColor = config.skinColor || '#d69e7e';
    const hairColor = config.hairColor || '#111111';

    const genderOutfits = OUTFIT_DATA[gender] || OUTFIT_DATA.boy;
    const shirt = genderOutfits.shirts[config.shirtIndex % genderOutfits.shirts.length] || genderOutfits.shirts[0];
    const pants = genderOutfits.pants[config.pantsIndex % genderOutfits.pants.length] || genderOutfits.pants[0];

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65, metalness: 0.05 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirt.color, roughness: 0.5, metalness: 0.1 });
    const sleeveMat = new THREE.MeshStandardMaterial({ color: shirt.sleeveColor || skinColor, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pants.color, roughness: 0.6, metalness: 0.1 });
    const shoesMat = new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.4, metalness: 0.2 });

    // === HIPS / ROOT PIVOT ===
    const hips = new THREE.Group();
    hips.position.y = 0.95;
    group.add(hips);

    // Pelvis
    const pelvisGeo = new THREE.BoxGeometry(gender === 'girl' ? 0.44 : 0.46, 0.25, 0.28);
    const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvis.castShadow = true;
    hips.add(pelvis);

    // === TORSO ===
    const spine = new THREE.Group();
    spine.position.y = 0.15;
    hips.add(spine);

    const torsoW = gender === 'girl' ? 0.42 : 0.48;
    const torsoH = 0.55;
    const torsoD = 0.26;
    const torsoGeo = new THREE.BoxGeometry(torsoW, torsoH, torsoD);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = torsoH / 2;
    torso.castShadow = true;
    spine.add(torso);

    // === HEAD & NECK ===
    const neck = new THREE.Group();
    neck.position.y = torsoH;
    spine.add(neck);

    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    neck.add(headGroup);

    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.22;
    head.castShadow = true;
    headGroup.add(head);

    // Hair
    if (gender === 'girl') {
      const hairGeo = new THREE.SphereGeometry(0.2, 16, 16);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 0.24, -0.04);
      hair.scale.set(1.02, 1.1, 1.15);
      headGroup.add(hair);

      // Long ponytail
      const tailGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.45, 8);
      const tail = new THREE.Mesh(tailGeo, hairMat);
      tail.position.set(0, 0.12, -0.22);
      tail.rotation.x = -0.3;
      headGroup.add(tail);
    } else {
      // Boy stylish hair
      const hairGeo = new THREE.BoxGeometry(0.38, 0.16, 0.38);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 0.34, 0);
      headGroup.add(hair);
    }

    // === ARMS & HANDS (Detailed hands holding weapons) ===
    const armRadius = gender === 'girl' ? 0.065 : 0.08;
    const armLength = 0.35;

    // Left Shoulder
    const lShoulder = new THREE.Group();
    lShoulder.position.set(-(torsoW / 2 + armRadius), torsoH - 0.05, 0);
    spine.add(lShoulder);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8), sleeveMat);
    lUpperArm.position.y = -armLength / 2;
    lUpperArm.castShadow = true;
    lShoulder.add(lUpperArm);

    const lElbow = new THREE.Group();
    lElbow.position.y = -armLength;
    lShoulder.add(lElbow);

    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.8, armLength, 8), skinMat);
    lForearm.position.y = -armLength / 2;
    lForearm.castShadow = true;
    lElbow.add(lForearm);

    // Left Hand
    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skinMat);
    lHand.position.y = -armLength;
    lHand.scale.set(0.8, 1.2, 0.8);
    lElbow.add(lHand);

    // Right Shoulder
    const rShoulder = new THREE.Group();
    rShoulder.position.set(torsoW / 2 + armRadius, torsoH - 0.05, 0);
    spine.add(rShoulder);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8), sleeveMat);
    rUpperArm.position.y = -armLength / 2;
    rUpperArm.castShadow = true;
    rShoulder.add(rUpperArm);

    const rElbow = new THREE.Group();
    rElbow.position.y = -armLength;
    rShoulder.add(rElbow);

    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.8, armLength, 8), skinMat);
    rForearm.position.y = -armLength / 2;
    rForearm.castShadow = true;
    rElbow.add(rForearm);

    // Right Hand (Holder for weapons)
    const rHand = new THREE.Group();
    rHand.position.y = -armLength;
    const rHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skinMat);
    rHandMesh.scale.set(0.8, 1.2, 0.8);
    rHand.add(rHandMesh);
    rElbow.add(rHand);

    // === LEGS & FEET ===
    const legRadius = 0.09;
    const legLength = 0.42;

    // Left Leg
    const lHip = new THREE.Group();
    lHip.position.set(-0.14, -0.1, 0);
    hips.add(lHip);

    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius * 0.85, legLength, 8), pantsMat);
    lThigh.position.y = -legLength / 2;
    lThigh.castShadow = true;
    lHip.add(lThigh);

    const lKnee = new THREE.Group();
    lKnee.position.y = -legLength;
    lHip.add(lKnee);

    const lShin = new THREE.Mesh(new THREE.CylinderGeometry(legRadius * 0.85, legRadius * 0.75, legLength, 8), pantsMat);
    lShin.position.y = -legLength / 2;
    lShin.castShadow = true;
    lKnee.add(lShin);

    const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), shoesMat);
    lFoot.position.set(0, -legLength, 0.05);
    lFoot.castShadow = true;
    lKnee.add(lFoot);

    // Right Leg
    const rHip = new THREE.Group();
    rHip.position.set(0.14, -0.1, 0);
    hips.add(rHip);

    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius * 0.85, legLength, 8), pantsMat);
    rThigh.position.y = -legLength / 2;
    rThigh.castShadow = true;
    rHip.add(rThigh);

    const rKnee = new THREE.Group();
    rKnee.position.y = -legLength;
    rHip.add(rKnee);

    const rShin = new THREE.Mesh(new THREE.CylinderGeometry(legRadius * 0.85, legRadius * 0.75, legLength, 8), pantsMat);
    rShin.position.y = -legLength / 2;
    rShin.castShadow = true;
    rKnee.add(rShin);

    const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.26), shoesMat);
    rFoot.position.set(0, -legLength, 0.05);
    rFoot.castShadow = true;
    rKnee.add(rFoot);

    return {
      mesh: group,
      bones: {
        hips,
        spine,
        neck,
        headGroup,
        lShoulder,
        lElbow,
        lHand,
        rShoulder,
        rElbow,
        rHand,
        lHip,
        lKnee,
        rHip,
        rKnee
      }
    };
  }
}
