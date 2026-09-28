import * as Cesium from 'cesium';

export type BasemapType = 'google-3d' | 'esri-satellite' | 'osm-streets' | 'carto-voyager';

export interface BasemapDefinition {
  id: BasemapType;
  name: string;
  category: '3d-mesh' | 'satellite' | 'streets';
  description: string;
  attribution: string;
  requiresKey: boolean;
}

export const BASEMAP_DEFINITIONS: BasemapDefinition[] = [
  {
    id: 'google-3d',
    name: 'Google 3D Tiles',
    category: '3d-mesh',
    description: 'Photorealistic 3D mesh buildings & photogrammetry from Google',
    attribution: 'Imagery & 3D Tiles © Google',
    requiresKey: true
  },
  {
    id: 'esri-satellite',
    name: 'Esri World Imagery (GeoLibre)',
    category: 'satellite',
    description: 'High-resolution global aerial satellite imagery (Keyless)',
    attribution: 'Tiles © Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
    requiresKey: false
  },
  {
    id: 'osm-streets',
    name: 'OpenStreetMap',
    category: 'streets',
    description: 'Community-driven global street and road network (Keyless)',
    attribution: 'Map data © OpenStreetMap contributors',
    requiresKey: false
  },
  {
    id: 'carto-voyager',
    name: 'CartoDB Voyager',
    category: 'streets',
    description: 'Clean vector-styled street map with detailed building labels (Keyless)',
    attribution: '© CARTO, © OpenStreetMap contributors',
    requiresKey: false
  }
];

export class GeoLibreBasemapManager {
  private viewer: Cesium.Viewer;
  private currentBasemap: BasemapType = 'esri-satellite';
  private activeImageryLayers: Cesium.ImageryLayer[] = [];
  private googleTileset: Cesium.Cesium3DTileset | null = null;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  public setGoogleTileset(tileset: Cesium.Cesium3DTileset | null): void {
    this.googleTileset = tileset;
  }

  public getCurrentBasemap(): BasemapType {
    return this.currentBasemap;
  }

  /**
   * Applies the requested basemap to the Cesium globe.
   * If Google 3D Tiles are active, it manages its visibility.
   * For 2D raster basemaps, it injects GeoLibre keyless imagery providers.
   */
  public async switchBasemap(type: BasemapType): Promise<void> {
    this.currentBasemap = type;

    // 1. Manage Google 3D Tiles visibility
    if (this.googleTileset) {
      this.googleTileset.show = (type === 'google-3d');
    }

    // 2. Remove any previously added GeoLibre imagery layers
    for (const layer of this.activeImageryLayers) {
      this.viewer.imageryLayers.remove(layer, true);
    }
    this.activeImageryLayers = [];

    // If Google 3D tiles is active, 3D tiles cover the surface; we keep Esri as underlying base
    if (type === 'google-3d') {
      const fallbackLayer = await this.createEsriSatelliteLayer();
      this.viewer.imageryLayers.add(fallbackLayer, 0);
      this.activeImageryLayers.push(fallbackLayer);
      return;
    }

    // 3. Add the selected GeoLibre 2D raster imagery provider
    let layer: Cesium.ImageryLayer;

    switch (type) {
      case 'osm-streets':
        layer = this.createOsmLayer();
        break;
      case 'carto-voyager':
        layer = this.createCartoVoyagerLayer();
        break;
      case 'esri-satellite':
      default:
        layer = await this.createEsriSatelliteLayer();
        break;
    }

    this.viewer.imageryLayers.add(layer, 0);
    this.activeImageryLayers.push(layer);
  }

  /**
   * Creates Esri World Imagery (GeoLibre keyless satellite provider)
   */
  private async createEsriSatelliteLayer(): Promise<Cesium.ImageryLayer> {
    try {
      const provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
        { enablePickFeatures: false }
      );
      return new Cesium.ImageryLayer(provider);
    } catch {
      // Last-resort fallback to OpenStreetMap if Esri server is unreachable
      return this.createOsmLayer();
    }
  }

  /**
   * Creates OpenStreetMap Standard Imagery Layer
   */
  private createOsmLayer(): Cesium.ImageryLayer {
    const provider = new Cesium.OpenStreetMapImageryProvider({
      url: 'https://tile.openstreetmap.org/'
    });
    return new Cesium.ImageryLayer(provider);
  }

  /**
   * Creates CartoDB Voyager Imagery Layer
   */
  private createCartoVoyagerLayer(): Cesium.ImageryLayer {
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      credit: '© CARTO, © OpenStreetMap contributors',
      maximumLevel: 19
    });
    return new Cesium.ImageryLayer(provider);
  }
}
