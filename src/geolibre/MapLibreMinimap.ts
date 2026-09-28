import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MANJERI_CENTER, MANJERI_LANDMARKS } from '../utils/coordinates';

export class MapLibreMinimap {
  private map: maplibregl.Map | null = null;
  private marker: maplibregl.Marker | null = null;
  private markerEl: HTMLDivElement | null = null;
  private container: HTMLElement;
  private landmarkMarkers: maplibregl.Marker[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.initMap();
  }

  private initMap(): void {
    try {
      this.map = new maplibregl.Map({
        container: this.container,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [MANJERI_CENTER.longitude, MANJERI_CENTER.latitude],
        zoom: 15,
        pitch: 30,
        bearing: 0,
        interactive: false,
        attributionControl: false
      });

      this.map.on('load', () => {
        this.addPlayerMarker();
        this.addLandmarkMarkers();
      });
    } catch (err) {
      console.warn('MapLibre minimap init fallback:', err);
    }
  }

  private addPlayerMarker(): void {
    if (!this.map) return;

    this.markerEl = document.createElement('div');
    this.markerEl.className = 'maplibre-player-marker';
    this.markerEl.innerHTML = `
      <div class="player-arrow-cone"></div>
      <div class="player-center-dot"></div>
    `;

    this.marker = new maplibregl.Marker({
      element: this.markerEl,
      rotationAlignment: 'map'
    })
      .setLngLat([MANJERI_CENTER.longitude, MANJERI_CENTER.latitude])
      .addTo(this.map);
  }

  private addLandmarkMarkers(): void {
    if (!this.map) return;

    for (const landmark of MANJERI_LANDMARKS) {
      const el = document.createElement('div');
      el.className = 'maplibre-poi-marker';
      el.title = landmark.name;
      el.innerHTML = `<span>📍</span>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([landmark.longitude, landmark.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(
            `<strong>${landmark.name}</strong><br/><small>${landmark.description}</small>`
          )
        )
        .addTo(this.map);

      this.landmarkMarkers.push(marker);
    }
  }

  public updatePlayer(longitude: number, latitude: number, headingRad: number): void {
    if (!this.map || !this.marker) return;

    const headingDeg = (headingRad * 180) / Math.PI;

    // Pan map to follow player
    this.map.setCenter([longitude, latitude]);
    this.marker.setLngLat([longitude, latitude]);

    // Rotate marker arrow to match player heading
    if (this.markerEl) {
      const arrow = this.markerEl.querySelector('.player-arrow-cone') as HTMLElement;
      if (arrow) {
        arrow.style.transform = `rotate(${headingDeg}deg)`;
      }
    }
  }

  public resize(): void {
    this.map?.resize();
  }

  public destroy(): void {
    this.landmarkMarkers.forEach((m) => m.remove());
    this.marker?.remove();
    this.map?.remove();
    this.map = null;
  }
}
