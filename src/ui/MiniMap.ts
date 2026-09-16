import * as THREE from 'three';
import { Bike } from '../entities/Bike';
import { Car } from '../entities/Car';
import { RoadSystem } from '../world/RoadSystem';

export class MiniMap {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 190;
  private height: number = 190;
  private radius: number = 93;

  constructor(canvasId: string = 'minimap-canvas') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.radius = this.width / 2 - 2;
    }
  }

  public render(
    playerPos: THREE.Vector3,
    playerHeading: number,
    bike: Bike,
    car: Car,
    roadSystem: RoadSystem,
    landmarks: { name: string; x: number; z: number }[] = []
  ): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const r = this.radius;

    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Circular Mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Background terrain fill
    ctx.fillStyle = '#062c19';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Rotate with player heading so forward is UP
    ctx.translate(cx, cy);
    ctx.rotate(playerHeading);

    const scale = 0.55;

    // A. Tea Plantation Zone (Z < -90)
    const teaTopY = (-450 - playerPos.z) * scale;
    const teaBottomY = (-90 - playerPos.z) * scale;
    ctx.fillStyle = 'rgba(21, 128, 61, 0.45)';
    ctx.fillRect(-this.width * 2, teaTopY, this.width * 4, teaBottomY - teaTopY);

    // B. Backwater Canal
    ctx.fillStyle = 'rgba(14, 165, 233, 0.55)';
    ctx.beginPath();
    for (let x = -400; x <= 400; x += 20) {
      const canalZ = 280 + Math.sin(x * 0.015) * 35;
      const px = (x - playerPos.x) * scale;
      const py = (canalZ - playerPos.z) * scale;
      if (x === -400) ctx.moveTo(px, py - 18 * scale);
      else ctx.lineTo(px, py - 18 * scale);
    }
    for (let x = 400; x >= -400; x -= 20) {
      const canalZ = 280 + Math.sin(x * 0.015) * 35;
      const px = (x - playerPos.x) * scale;
      const py = (canalZ - playerPos.z) * scale;
      ctx.lineTo(px, py + 18 * scale);
    }
    ctx.closePath();
    ctx.fill();

    // C. Roads: Render each road segment independently so NO diagonal cross-screen lines appear!
    for (const segment of roadSystem.segments) {
      const pts = segment.sampledPoints;
      if (pts.length < 2) continue;

      ctx.strokeStyle = '#374151';
      ctx.lineWidth = segment.width * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      for (let i = 0; i < pts.length; i++) {
        const px = (pts[i].x - playerPos.x) * scale;
        const py = (pts[i].z - playerPos.z) * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Dashed lane marking
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // D. Landmarks
    for (const lm of landmarks) {
      const lx = (lm.x - playerPos.x) * scale;
      const ly = (lm.z - playerPos.z) * scale;
      if (Math.hypot(lx, ly) < r) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // E. Vehicles
    // Bike (Green)
    const bikeX = (bike.position.x - playerPos.x) * scale;
    const bikeY = (bike.position.z - playerPos.z) * scale;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(bikeX, bikeY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Car (Blue)
    const carX = (car.position.x - playerPos.x) * scale;
    const carY = (car.position.z - playerPos.z) * scale;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(carX, carY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // 3. Player Arrow in Center
    ctx.save();
    ctx.translate(cx, cy);

    const coneGrad = ctx.createRadialGradient(0, 0, 4, 0, -28, 30);
    coneGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    coneGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 32, -Math.PI / 2 - 0.45, -Math.PI / 2 + 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();

    // 4. Rotating Compass (N, S, E, W)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(playerHeading);

    ctx.font = 'bold 10px Space Grotesk, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ef4444';
    ctx.fillText('N', 0, -r + 10);
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('S', 0, r - 10);
    ctx.fillText('E', r - 10, 0);
    ctx.fillText('W', -r + 10, 0);

    ctx.restore();

    // 5. Border
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}
