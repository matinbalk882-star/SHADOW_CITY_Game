/**
 * TextureGenerator.js
 * Procedural canvas-based textures for realistic asphalt roads, crosswalks,
 * modern building facades, shop signs, weapon renders, blood decals, grass, concrete.
 */

import * as THREE from 'three';

export class TextureGenerator {
  static createRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dark asphalt base with subtle noise
    ctx.fillStyle = '#1c1f24';
    ctx.fillRect(0, 0, 1024, 1024);

    // Asphalt grain
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Yellow double center dashed line
    ctx.strokeStyle = '#f5b041';
    ctx.lineWidth = 14;
    ctx.setLineDash([60, 40]);
    ctx.beginPath();
    ctx.moveTo(502, 0);
    ctx.lineTo(502, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(522, 0);
    ctx.lineTo(522, 1024);
    ctx.stroke();

    // White outer shoulder lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 10;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(80, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(944, 0);
    ctx.lineTo(944, 1024);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createIntersectionTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1d22';
    ctx.fillRect(0, 0, 1024, 1024);

    // Asphalt noise
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Crosswalks on 4 sides (Zebra stripes)
    ctx.fillStyle = '#ffffff';
    // Top zebra
    for (let x = 120; x < 900; x += 55) {
      ctx.fillRect(x, 40, 32, 100);
    }
    // Bottom zebra
    for (let x = 120; x < 900; x += 55) {
      ctx.fillRect(x, 884, 32, 100);
    }
    // Left zebra
    for (let y = 120; y < 900; y += 55) {
      ctx.fillRect(40, y, 100, 32);
    }
    // Right zebra
    for (let y = 120; y < 900; y += 55) {
      ctx.fillRect(884, y, 100, 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  static createSidewalkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#9aa0a6';
    ctx.fillRect(0, 0, 512, 512);

    // Pavement grid pattern
    ctx.strokeStyle = '#6f747b';
    ctx.lineWidth = 4;
    for (let x = 0; x <= 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  static createBuildingFacadeTexture(style = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const themes = [
      { bg: '#1e2430', winOn: '#ffea79', winOff: '#0b111e', neon: '#00f0ff' },
      { bg: '#2b233a', winOn: '#a6e3e9', winOff: '#151020', neon: '#ff007f' },
      { bg: '#1c2826', winOn: '#ff9966', winOff: '#0f1615', neon: '#39ff14' },
      { bg: '#26292e', winOn: '#d1f4fa', winOff: '#111316', neon: '#f5b041' },
    ];
    const theme = themes[style % themes.length];

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, 512, 1024);

    // Vertical structural panels
    ctx.strokeStyle = '#111419';
    ctx.lineWidth = 6;
    for (let x = 0; x <= 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }

    // Windows
    const rows = 20;
    const cols = 6;
    const winW = 44;
    const winH = 32;
    const gapX = 38;
    const gapY = 18;
    const startY = 80;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 30 + c * (winW + gapX);
        const y = startY + r * (winH + gapY);

        const isLit = Math.random() > 0.45;
        ctx.fillStyle = isLit ? theme.winOn : theme.winOff;
        ctx.fillRect(x, y, winW, winH);

        // Window frame
        ctx.strokeStyle = '#05070a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, winW, winH);

        // Interior glow
        if (isLit) {
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(x + 4, y + 4, winW - 8, winH / 2);
        }
      }
    }

    // Ground floor storefront
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 920, 512, 104);
    ctx.fillStyle = theme.neon;
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CYBER PLAZA', 256, 980);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createGunShopSignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark cyberpunk metallic background
    const grad = ctx.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, '#0a0518');
    grad.addColorStop(1, '#1b082e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Glowing border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 16;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 30;
    ctx.strokeRect(20, 20, 984, 472);

    // Neon text Persian & English
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 25;
    ctx.font = 'bold 74px "Vazirmatn", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ اسلحه فروشی سایبر ⚡', 512, 180);

    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('SHADOW WEAPONS ARMORY', 512, 280);

    ctx.fillStyle = '#f5b041';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('PISTOL • AK-47 • LMG • SNIPER • RPG', 512, 380);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  static createBloodSplatterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#8a0303';

    // Main pool
    ctx.beginPath();
    ctx.arc(128, 128, 48, 0, Math.PI * 2);
    ctx.fill();

    // Splatters & droplets
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 85;
      const r = 4 + Math.random() * 12;
      const x = 128 + Math.cos(angle) * dist;
      const y = 128 + Math.sin(angle) * dist;

      ctx.fillStyle = Math.random() > 0.3 ? '#660000' : '#aa0000';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Generates weapon icons for the weapon wheel and shop UI
   */
  static getWeaponData() {
    return [
      {
        id: 'bat',
        nameFa: 'چماق',
        nameEn: 'Baseball Bat',
        price: 0,
        killReward: 350,
        hitsToKill: 3,
        range: 3.0,
        fireRate: 450,
        type: 'melee',
        ammo: Infinity,
        descFa: 'سلاح سرد اولیه. با ۳ ضربه دشمن را میکشد و ۳۵۰ سکه جایزه میدهد.',
        icon: '🏏'
      },
      {
        id: 'pistol',
        nameFa: 'پیستول',
        nameEn: 'Combat Pistol',
        price: 1000,
        killReward: 500,
        hitsToKill: 3,
        range: 45,
        fireRate: 350,
        type: 'gun',
        ammo: 999,
        descFa: 'کلت کمری سریع و دقیق. با کشتن هر NPC ۵۰۰ سکه جایزه میدهد.',
        icon: '🔫'
      },
      {
        id: 'ak47',
        nameFa: 'کلاشینکف',
        nameEn: 'AK-47 Assault Rifle',
        price: 4100,
        killReward: 1000,
        hitsToKill: 2,
        range: 65,
        fireRate: 150,
        type: 'gun',
        ammo: 999,
        descFa: 'کلاشینکف قدرتمند. با ۲ گلوله آدم را از بین میبرد و ۱۰۰۰ سکه میدهد.',
        icon: '💥'
      },
      {
        id: 'lmg',
        nameFa: 'صد تیر',
        nameEn: 'Heavy 100-Round LMG',
        price: 15900,
        killReward: 2300,
        hitsToKill: 2,
        range: 75,
        fireRate: 110,
        type: 'gun',
        ammo: 999,
        descFa: 'مسلسل سنگین صدتیر. با ۲ گلوله میکشد و ۲۳۰۰ سکه جایزه میدهد.',
        icon: '⚡'
      },
      {
        id: 'sniper',
        nameFa: 'اسنایپ',
        nameEn: 'Sniper Rifle',
        price: 30000,
        killReward: 30000, // as required
        hitsToKill: 1,
        range: 160,
        fireRate: 850,
        type: 'sniper',
        ammo: 999,
        descFa: 'تک تیرانداز دوربرد با زوم اپتیکال. با ۱ تیر هدشات و نابود میکند.',
        icon: '🎯'
      },
      {
        id: 'rpg',
        nameFa: 'آرپیچی',
        nameEn: 'RPG Rocket Launcher',
        price: 89000,
        killReward: 10000, // per victim / vehicle in 10m radius
        hitsToKill: 1,
        range: 120,
        fireRate: 1200,
        type: 'explosive',
        ammo: 999,
        descFa: 'پرتابگر راکت انفجاری با شعاع تخریب ۱۰ متری. تمام افراد و ماشین‌ها پودر میشوند و حداقل ۱۰۰۰۰ سکه میدهد.',
        icon: '🚀'
      }
    ];
  }
}
