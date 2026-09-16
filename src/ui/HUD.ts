import * as THREE from 'three';
import { Bike } from '../entities/Bike';
import { Car } from '../entities/Car';
import { RoadSystem } from '../world/RoadSystem';

export interface Landmark {
  id: string;
  name: string;
  sub: string;
  icon: string;
  x: number;
  z: number;
  desc: string;
}

export class HUD {
  private speedoValEl: HTMLElement | null;
  private vehicleLabelEl: HTMLElement | null;
  private vehicleSubLabelEl: HTMLElement | null;
  private promptEl: HTMLElement | null;
  private promptLabelEl: HTMLElement | null;
  private bannerEl: HTMLElement | null;
  private bannerTitleEl: HTMLElement | null;
  private bannerDescEl: HTMLElement | null;

  // Full World Map elements
  private worldMapModal: HTMLElement | null;
  private bigMapCanvas: HTMLCanvasElement | null;
  private bigMapCtx: CanvasRenderingContext2D | null;
  private landmarkListEl: HTMLElement | null;
  private btnCloseMap: HTMLElement | null;
  private btnToggleMap: HTMLElement | null;
  public isMapOpen: boolean = false;

  private currentRegion: string = '';
  private bannerTimeout: number | null = null;
  public onFastTravelCallback: ((x: number, z: number) => void) | null = null;

  public landmarks: Landmark[] = [
    {
      id: 'kacherippadi',
      name: 'Kacherippadi Town Center',
      sub: 'Main crossroads & town center',
      icon: '🏙️',
      x: 0,
      z: 0,
      desc: 'Central bustling crossroads connecting all major highways'
    },
    {
      id: 'igbt',
      name: 'Indira Gandhi Bus Terminal',
      sub: 'New Bus Stand & KSRTC bays',
      icon: '🚌',
      x: 100,
      z: -35,
      desc: 'Central transport hub with extensive bus departure platforms'
    },
    {
      id: 'old_bus_stand',
      name: 'Old Bus Stand & Market',
      sub: 'Commercial core & shopping arcade',
      icon: '🛍️',
      x: -115,
      z: 60,
      desc: 'Historic shopping district with fresh markets and tea stalls'
    },
    {
      id: 'court',
      name: 'District & Sessions Court',
      sub: 'Court Road administrative complex',
      icon: '⚖️',
      x: 42,
      z: 165,
      desc: 'Judicial headquarters and Head Post Office on Court Hill'
    },
    {
      id: 'med_college',
      name: 'Govt. Medical College Hospital',
      sub: 'Melakkam health campus (24h ER)',
      icon: '🏥',
      x: -270,
      z: -175,
      desc: 'Major tertiary hospital & medical college serving Malabar'
    },
    {
      id: 'cherupuzha',
      name: 'Cherupuzha River Bridge',
      sub: 'Anakkayam Road crossing',
      icon: '🌉',
      x: 0,
      z: 310,
      desc: 'Scenic river crossing over the Kadalundi river tributary'
    },
    {
      id: 'vettekkode',
      name: 'Vettekkode Hill Viewpoint',
      sub: 'Scenic hilltop summit (78m)',
      icon: '⛰️',
      x: 330,
      z: 160,
      desc: 'Panoramic hilltop overlooking the rolling Manjeri town valley'
    }
  ];

  constructor() {
    this.speedoValEl = document.getElementById('speedo-val');
    this.vehicleLabelEl = document.getElementById('vehicle-label');
    this.vehicleSubLabelEl = document.getElementById('vehicle-sublabel');
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptLabelEl = document.getElementById('prompt-label');
    this.bannerEl = document.getElementById('location-banner');
    this.bannerTitleEl = document.getElementById('banner-title');
    this.bannerDescEl = document.getElementById('banner-desc');

    this.worldMapModal = document.getElementById('world-map-modal');
    this.bigMapCanvas = document.getElementById('big-map-canvas') as HTMLCanvasElement;
    this.bigMapCtx = this.bigMapCanvas?.getContext('2d') || null;
    this.landmarkListEl = document.getElementById('landmark-list');
    this.btnCloseMap = document.getElementById('btn-close-map');
    this.btnToggleMap = document.getElementById('btn-toggle-map');

    this.setupMapListeners();
    this.populateLandmarkSidebar();

    setTimeout(() => {
      this.showRegionBanner('Kacherippadi • Manjeri', 'Welcome to Manjeri, Malappuram');
    }, 1200);
  }

  private setupMapListeners(): void {
    const toggle = () => this.toggleWorldMap();

    const minimapCard = document.getElementById('minimap-card');
    minimapCard?.addEventListener('click', toggle);
    this.btnToggleMap?.addEventListener('click', toggle);
    this.btnCloseMap?.addEventListener('click', () => this.closeWorldMap());

    // Only listen for Escape to close (KeyM handled centrally via InputManager to prevent double-toggle!)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isMapOpen) {
        this.closeWorldMap();
      }
    });

    this.bigMapCanvas?.addEventListener('click', (e) => {
      if (!this.bigMapCanvas) return;
      const rect = this.bigMapCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const scaleX = 800 / rect.width;
      const scaleY = 800 / rect.height;
      const canvasX = clickX * scaleX;
      const canvasY = clickY * scaleY;

      const worldX = ((canvasX - 400) / 400) * 450;
      const worldZ = ((canvasY - 400) / 400) * 450;

      this.triggerFastTravel(worldX, worldZ, 'Custom Map Destination');
    });
  }

  private populateLandmarkSidebar(): void {
    if (!this.landmarkListEl) return;
    this.landmarkListEl.innerHTML = '';

    for (const lm of this.landmarks) {
      const card = document.createElement('div');
      card.className = 'landmark-card';
      card.innerHTML = `
        <div class="landmark-card-info">
          <div class="landmark-card-name">${lm.icon} ${lm.name}</div>
          <div class="landmark-card-sub">${lm.sub}</div>
        </div>
        <button class="btn-fast-travel">Travel</button>
      `;

      card.addEventListener('click', () => {
        this.triggerFastTravel(lm.x, lm.z, lm.name);
      });

      this.landmarkListEl.appendChild(card);
    }
  }

  public toggleWorldMap(): void {
    if (this.isMapOpen) {
      this.closeWorldMap();
    } else {
      this.openWorldMap();
    }
  }

  public openWorldMap(): void {
    this.isMapOpen = true;
    this.worldMapModal?.classList.add('active');
    document.exitPointerLock?.();
  }

  public closeWorldMap(): void {
    this.isMapOpen = false;
    this.worldMapModal?.classList.remove('active');
  }

  private triggerFastTravel(x: number, z: number, name: string): void {
    if (this.onFastTravelCallback) {
      this.onFastTravelCallback(x, z);
    }
    this.showRegionBanner(`Fast Traveled: ${name}`, 'Arrived safely at location');
    this.closeWorldMap();
  }

  public updateSpeedometer(speedKmH: number, mode: 'ON_FOOT' | 'BIKE' | 'CAR'): void {
    if (this.speedoValEl) {
      this.speedoValEl.textContent = Math.abs(speedKmH).toString().padStart(3, '0');
    }

    if (this.vehicleLabelEl) {
      if (mode === 'BIKE') {
        this.vehicleLabelEl.textContent = 'CLASSIC MOTORCYCLE';
        this.vehicleLabelEl.style.color = '#34d399';
      } else if (mode === 'CAR') {
        this.vehicleLabelEl.textContent = 'VINTAGE CRUISER';
        this.vehicleLabelEl.style.color = '#38bdf8';
      } else {
        this.vehicleLabelEl.textContent = 'ON FOOT';
        this.vehicleLabelEl.style.color = '#fbbf24';
      }
    }

    if (this.vehicleSubLabelEl) {
      if (mode === 'BIKE') {
        this.vehicleSubLabelEl.textContent = '[F] Exit | [H] Horn | [L] Light';
      } else if (mode === 'CAR') {
        this.vehicleSubLabelEl.textContent = '[F] Exit | [H] Horn | [L] Light';
      } else {
        this.vehicleSubLabelEl.textContent = 'WASD Move | Shift Sprint | Space Jump';
      }
    }
  }

  public showInteractionPrompt(show: boolean, text: string = ''): void {
    if (!this.promptEl) return;
    if (show) {
      if (this.promptLabelEl) this.promptLabelEl.textContent = text;
      this.promptEl.classList.add('visible');
    } else {
      this.promptEl.classList.remove('visible');
    }
  }

  public checkRegion(x: number, z: number): void {
    let regionName = '';
    let regionDesc = '';

    if (z > 240) {
      regionName = 'Cherupuzha River Valley';
      regionDesc = 'Anakkayam road bridge & riverbank palm groves';
    } else if (x < -140 && z < -60) {
      regionName = 'Melakkam • Medical College';
      regionDesc = 'Govt. Medical College Hospital & Melakkam Ridge';
    } else if (x > 180 && z > 40) {
      regionName = 'Vettekkode Hills';
      regionDesc = 'Scenic eastern hills & panoramic viewpoint';
    } else if (z > 80 && x > 10) {
      regionName = 'Court Road • Judicial Complex';
      regionDesc = 'District & Sessions Court and Post Office';
    } else if (x < -60 && z > 20) {
      regionName = 'Old Bus Stand & Market';
      regionDesc = 'Historic commercial core & municipal shopping';
    } else if (x > 50 && z < -10) {
      regionName = 'Indira Gandhi Bus Terminal';
      regionDesc = 'New Bus Stand transport hub & KSRTC docks';
    } else {
      regionName = 'Kacherippadi Town Center';
      regionDesc = 'Central highway crossroads & Malabar tea stalls';
    }

    if (regionName !== this.currentRegion) {
      this.currentRegion = regionName;
      this.showRegionBanner(regionName, regionDesc);
    }
  }

  private showRegionBanner(title: string, desc: string): void {
    if (!this.bannerEl || !this.bannerTitleEl || !this.bannerDescEl) return;

    this.bannerTitleEl.textContent = title;
    this.bannerDescEl.textContent = desc;
    this.bannerEl.classList.add('show');

    if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
    this.bannerTimeout = window.setTimeout(() => {
      this.bannerEl?.classList.remove('show');
    }, 4500);
  }

  public renderWorldMap(
    playerPos: THREE.Vector3,
    playerHeading: number,
    bike: Bike,
    car: Car,
    roadSystem: RoadSystem
  ): void {
    if (!this.isMapOpen || !this.bigMapCtx || !this.bigMapCanvas) return;
    const ctx = this.bigMapCtx;
    const size = 800;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, size);
    bgGrad.addColorStop(0, '#12381f');
    bgGrad.addColorStop(0.45, '#194d27');
    bgGrad.addColorStop(0.75, '#1e5e32');
    bgGrad.addColorStop(1, '#1b542c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    const toMapX = (wx: number) => cx + (wx / 450) * cx;
    const toMapY = (wz: number) => cy + (wz / 450) * cy;

    // A. Munnar Tea Estate Region
    ctx.fillStyle = 'rgba(22, 101, 52, 0.4)';
    ctx.fillRect(0, toMapY(-450), size, toMapY(-90) - toMapY(-450));

    // B. Alappuzha Backwater Canal
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    for (let x = -450; x <= 450; x += 15) {
      const cz = 280 + Math.sin(x * 0.015) * 35;
      const mx = toMapX(x);
      const my = toMapY(cz - 22);
      if (x === -450) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    for (let x = 450; x >= -450; x -= 15) {
      const cz = 280 + Math.sin(x * 0.015) * 35;
      const mx = toMapX(x);
      const my = toMapY(cz + 22);
      ctx.lineTo(mx, my);
    }
    ctx.closePath();
    ctx.fill();

    // Roads: Render each segment independently!
    for (const segment of roadSystem.segments) {
      const pts = segment.sampledPoints;
      if (pts.length < 2) continue;

      // Shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const mx = toMapX(pts[i].x);
        const my = toMapY(pts[i].z);
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.stroke();

      // Asphalt
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Dashed lane line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Biome Labels
    ctx.font = '800 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(167, 243, 208, 0.45)';
    ctx.fillText('MUNNAR TEA PLANTATIONS & GHAT PASS', cx, toMapY(-280));
    ctx.fillText('KERALA HERITAGE VILLAGE & TOWN', cx, toMapY(40));
    ctx.fillText('ALAPPUZHA BACKWATERS & CANALS', cx, toMapY(380));

    // Landmark Pins
    for (const lm of this.landmarks) {
      const mx = toMapX(lm.x);
      const my = toMapY(lm.z);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(mx, my + 3, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(lm.name, mx, my - 12);
    }

    // Bike Pin
    const bmx = toMapX(bike.position.x);
    const bmy = toMapY(bike.position.z);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(bmx, bmy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText('🏍️ Bike', bmx, bmy + 16);

    // Car Pin
    const cmx = toMapX(car.position.x);
    const cmy = toMapY(car.position.z);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cmx, cmy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('🚗 Car', cmx, cmy + 16);

    // Player Pin
    const pmx = toMapX(playerPos.x);
    const pmy = toMapY(playerPos.z);

    ctx.save();
    ctx.translate(pmx, pmy);
    const mapHeading = -playerHeading;
    ctx.rotate(mapHeading);

    const fovGrad = ctx.createRadialGradient(0, 0, 5, 0, -35, 40);
    fovGrad.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
    fovGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = fovGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 40, -Math.PI / 2 - 0.4, -Math.PI / 2 + 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'center';
    ctx.fillText('YOU (Explorer)', pmx, pmy - 16);

    ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    const crX = size - 50;
    const crY = 50;
    ctx.font = 'bold 16px Space Grotesk, sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('N', crX, crY - 14);
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('S', crX, crY + 22);
    ctx.fillText('E', crX + 20, crY + 5);
    ctx.fillText('W', crX - 20, crY + 5);
  }
}
