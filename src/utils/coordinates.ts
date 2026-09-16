import * as Cesium from 'cesium';

/**
 * Geographic center of Manjeri municipality, Malappuram District, Kerala, India.
 * Latitude: 11.1200° N
 * Longitude: 76.1200° E
 * Height: ~60m (central plateau above sea level)
 */
export const MANJERI_CENTER = {
  longitude: 76.1200,
  latitude: 11.1200,
  height: 60.0
};

/**
 * Key landmark reference coordinates within central Manjeri for navigation.
 */
export const MANJERI_LANDMARKS = [
  {
    name: 'Kacherippadi Junction',
    longitude: 76.1200,
    latitude: 11.1200,
    description: 'Central commercial junction & crossroads'
  },
  {
    name: 'Manjeri District Court',
    longitude: 76.1268,
    latitude: 11.1213,
    description: 'District & Sessions Court Hill'
  },
  {
    name: 'Govt. Medical College Hospital',
    longitude: 76.1188,
    latitude: 11.1274,
    description: 'Tertiary healthcare center on Melakkam ridge'
  },
  {
    name: 'KSRTC Bus Terminal',
    longitude: 76.1128,
    latitude: 11.1162,
    description: 'Intercity bus terminus'
  }
];

/**
 * Converts degrees longitude, latitude, and height to Cesium Cartesian3 (ECEF).
 */
export function degreesToCartesian(
  longitude: number,
  latitude: number,
  height: number = 0
): Cesium.Cartesian3 {
  return Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
}

/**
 * Converts a Cesium Cartesian3 position to Cartographic (longitude, latitude in degrees, height in meters).
 */
export function cartesianToDegrees(cartesian: Cesium.Cartesian3): {
  longitude: number;
  latitude: number;
  height: number;
} {
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  if (!cartographic) {
    return { longitude: MANJERI_CENTER.longitude, latitude: MANJERI_CENTER.latitude, height: 0 };
  }
  return {
    longitude: Cesium.Math.toDegrees(cartographic.longitude),
    latitude: Cesium.Math.toDegrees(cartographic.latitude),
    height: cartographic.height
  };
}
