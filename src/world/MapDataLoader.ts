import keralaRoadsData from '../../data/roads/kerala_roads.json';
import keralaWaterwaysData from '../../data/waterways/kerala_waterways.json';
import keralaBuildingsData from '../../data/buildings/kerala_buildings.json';
import keralaElevationData from '../../data/terrain/kerala_elevation.json';

export const WORLD_CONFIG = {
  region: "Kerala",
  center: {
    lat: 10.0889,
    lon: 76.2711
  },
  worldSizeKm: 20
};

export interface OSMFeature<G, P> {
  type: string;
  properties: P;
  geometry: G;
}

export interface OSMLineStringGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lon, lat]
}

export interface OSMPointGeometry {
  type: 'Point';
  coordinates: [number, number]; // [lon, lat]
}

export interface RoadProperties {
  id: string;
  name: string;
  type: 'Highway' | 'MainRoad' | 'VillageRoad' | 'HillRoad';
  surface?: string;
  bridge?: boolean;
  maxspeed?: number;
}

export interface WaterProperties {
  id: string;
  name: string;
  waterway: 'canal' | 'river' | 'stream';
  width: number;
}

export interface BuildingProperties {
  id: string;
  name: string;
  building: string;
  category: 'Tharavadu' | 'Thattukada' | 'BusShelter' | 'BanyanPlatform' | 'Houseboat' | 'Viewpoint';
  levels?: number;
}

export interface LocalPoint2D {
  x: number;
  z: number;
}

export class MapDataLoader {
  private static readonly METERS_PER_DEGREE_LAT = 111320;
  // Visual game scale factor mapping OSM delta to world meters (fits the 900m exploration terrain)
  private static readonly COORDINATE_SCALE = 0.085;

  /**
   * Converts GPS (longitude, latitude) to local 3D Cartesian coordinates (x, z) in meters.
   * In Three.js:
   * +X is East, -X is West
   * -Z is North (increasing latitude), +Z is South (decreasing latitude)
   */
  public static projectLatLonToGameMeters(lon: number, lat: number): LocalPoint2D {
    const latRad = (WORLD_CONFIG.center.lat * Math.PI) / 180;
    const metersPerDegreeLon = this.METERS_PER_DEGREE_LAT * Math.cos(latRad);

    const deltaLon = lon - WORLD_CONFIG.center.lon;
    const deltaLat = lat - WORLD_CONFIG.center.lat;

    const meterX = deltaLon * metersPerDegreeLon * this.COORDINATE_SCALE;
    const meterZ = -deltaLat * this.METERS_PER_DEGREE_LAT * this.COORDINATE_SCALE;

    return { x: meterX, z: meterZ };
  }

  /**
   * Converts local game coordinates (x, z) back to GPS (longitude, latitude).
   */
  public static projectGameMetersToLatLon(x: number, z: number): { lon: number; lat: number } {
    const latRad = (WORLD_CONFIG.center.lat * Math.PI) / 180;
    const metersPerDegreeLon = this.METERS_PER_DEGREE_LAT * Math.cos(latRad);

    const deltaLon = x / (metersPerDegreeLon * this.COORDINATE_SCALE);
    const deltaLat = -z / (this.METERS_PER_DEGREE_LAT * this.COORDINATE_SCALE);

    return {
      lon: WORLD_CONFIG.center.lon + deltaLon,
      lat: WORLD_CONFIG.center.lat + deltaLat
    };
  }

  public static loadRoads(): { properties: RoadProperties; points: LocalPoint2D[] }[] {
    const features = (keralaRoadsData as unknown as { features: OSMFeature<OSMLineStringGeometry, RoadProperties>[] }).features;
    return features.map((feat) => {
      const points = feat.geometry.coordinates.map(([lon, lat]) =>
        this.projectLatLonToGameMeters(lon, lat)
      );
      return {
        properties: feat.properties,
        points
      };
    });
  }

  public static loadWaterways(): { properties: WaterProperties; points: LocalPoint2D[] }[] {
    const features = (keralaWaterwaysData as unknown as { features: OSMFeature<OSMLineStringGeometry, WaterProperties>[] }).features;
    return features.map((feat) => {
      const points = feat.geometry.coordinates.map(([lon, lat]) =>
        this.projectLatLonToGameMeters(lon, lat)
      );
      return {
        properties: feat.properties,
        points
      };
    });
  }

  public static loadBuildings(): { properties: BuildingProperties; position: LocalPoint2D }[] {
    const features = (keralaBuildingsData as unknown as { features: OSMFeature<OSMPointGeometry, BuildingProperties>[] }).features;
    return features.map((feat) => {
      const [lon, lat] = feat.geometry.coordinates;
      const position = this.projectLatLonToGameMeters(lon, lat);
      return {
        properties: feat.properties,
        position
      };
    });
  }

  public static getElevationMetadata() {
    return keralaElevationData;
  }
}
