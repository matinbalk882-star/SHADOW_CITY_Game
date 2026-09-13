/**
 * MiniMap.js
 * 2D Canvas Radar Mini-map showing roads, player, house, gun store, NPCs, traffic cars.
 */

export class MiniMap {
  constructor(game) {
    this.game = game;
    this.canvas = null;
    this.ctx = null;
    this.size = 150; // pixels
    this.mapScale = 0.55; // meter to pixel

    this.initCanvas();
  }

  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'minimap-canvas';
    this.canvas.width = this.size * 2; // high-dpi
    this.canvas.height = this.size * 2;
    this.canvas.style.width = `${this.size}px`;
    this.canvas.style.height = `${this.size}px`;
    this.ctx = this.canvas.getContext('2d');

    const wrapper = document.createElement('div');
    wrapper.id = 'minimap-wrapper';
    wrapper.className = 'minimap-container';
    wrapper.appendChild(this.canvas);

    // Mini-map border badge
    const badge = document.createElement('div');
    badge.className = 'minimap-badge';
    badge.textContent = 'SHADOW GPS';
    wrapper.appendChild(badge);

    document.body.appendChild(wrapper);
  }

  update() {
    if (!this.ctx || !this.game.player) return;

    const ctx = this.ctx;
    const center = this.size; // center of radar (in 2x canvas coords)
    const pPos = this.game.player.getPosition();
    const pYaw = this.game.player.rotation ? this.game.player.rotation.y : 0;

    // Clear background
    ctx.clearRect(0, 0, this.size * 2, this.size * 2);

    // Circular radar clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center - 6, 0, Math.PI * 2);
    ctx.clip();

    // Dark radar background
    ctx.fillStyle = 'rgba(12, 17, 24, 0.88)';
    ctx.fillRect(0, 0, this.size * 2, this.size * 2);

    // Concentric grid circles
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center, center, center * 0.4, 0, Math.PI * 2);
    ctx.arc(center, center, center * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    // Transform world to radar coordinates (centered on player)
    const worldToRadar = (wx, wz) => {
      const dx = (wx - pPos.x) * this.mapScale;
      const dz = (wz - pPos.z) * this.mapScale;
      return {
        x: center + dx,
        y: center + dz
      };
    };

    // 1. Draw Road Grid
    if (this.game.city && this.game.city.roadSegments) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (const seg of this.game.city.roadSegments) {
        if (seg.type === 'NS') {
          const p1 = worldToRadar(seg.x, seg.zStart);
          const p2 = worldToRadar(seg.x, seg.zEnd);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        } else {
          const p1 = worldToRadar(seg.xStart, seg.z);
          const p2 = worldToRadar(seg.xEnd, seg.z);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
      ctx.stroke();
    }

    // 2. Draw House Icon (Green Home)
    if (this.game.city) {
      const hPos = worldToRadar(this.game.city.playerHousePosition.x, this.game.city.playerHousePosition.z);
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(hPos.x, hPos.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('🏠', hPos.x - 8, hPos.y + 6);
    }

    // 3. Draw Gun Shop Icon (Red Pistol / Armory)
    if (this.game.city) {
      const gPos = worldToRadar(this.game.city.gunShopPosition.x, this.game.city.gunShopPosition.z);
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(gPos.x, gPos.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('🔫', gPos.x - 8, gPos.y + 6);
    }

    // 4. Draw Traffic Cars (Orange Rectangles)
    if (this.game.vehicleManager && this.game.vehicleManager.trafficCars) {
      ctx.fillStyle = '#f5b041';
      ctx.shadowBlur = 0;
      for (const car of this.game.vehicleManager.trafficCars) {
        if (car.isDestroyed) continue;
        const cPos = worldToRadar(car.position.x, car.position.z);
        if (cPos.x > 0 && cPos.x < this.size * 2 && cPos.y > 0 && cPos.y < this.size * 2) {
          ctx.fillRect(cPos.x - 2, cPos.y - 2, 4, 4);
        }
      }
    }

    // 5. Draw NPCs (Cyan / White dots)
    if (this.game.npcManager && this.game.npcManager.npcs) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
      for (const npc of this.game.npcManager.npcs) {
        if (npc.isDead) continue;
        const nPos = worldToRadar(npc.position.x, npc.position.z);
        if (nPos.x > 0 && nPos.x < this.size * 2 && nPos.y > 0 && nPos.y < this.size * 2) {
          ctx.fillRect(nPos.x - 1.5, nPos.y - 1.5, 3, 3);
        }
      }
    }

    // 6. Draw Player Indicator (Glowing Blue/White Arrow at Center)
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(pYaw);

    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.restore(); // restore clip

    // Radar Glass Outer Border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(center, center, center - 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}
