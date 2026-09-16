import * as Cesium from 'cesium';

export interface GoogleTilesetOptions {
  apiKey?: string;
  maximumScreenSpaceError?: number;
}

/**
 * Loads the Google Photorealistic 3D Tiles tileset via CesiumJS.
 *
 * Requirements:
 * 1. A valid Google Maps Platform API key with "Map Tiles API" enabled.
 * 2. Does NOT hardcode the key in code (reads from VITE_GOOGLE_MAPS_API_KEY).
 * 3. Keeps Google's required attribution visible.
 */
export async function loadGooglePhotorealistic3DTileset(
  options: GoogleTilesetOptions = {}
): Promise<Cesium.Cesium3DTileset> {
  const apiKey = (
    options.apiKey ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || apiKey.length < 5) {
    throw new Error(
      'Google Maps Platform API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.'
    );
  }

  const sse = options.maximumScreenSpaceError ?? 2;

  try {
    // Official CesiumJS factory for Google Photorealistic 3D Tiles
    // In CesiumJS 1.107+, createGooglePhotorealistic3DTileset accepts string or object with key
    let tileset: Cesium.Cesium3DTileset;

    if (typeof Cesium.createGooglePhotorealistic3DTileset === 'function') {
      try {
        tileset = await Cesium.createGooglePhotorealistic3DTileset({ key: apiKey });
      } catch {
        // Some Cesium versions accept string directly: createGooglePhotorealistic3DTileset(apiKey)
        tileset = await (Cesium.createGooglePhotorealistic3DTileset as unknown as (key: string) => Promise<Cesium.Cesium3DTileset>)(apiKey);
      }
    } else {
      // Direct 3D Tiles endpoint fallback
      const tilesUrl = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${encodeURIComponent(apiKey)}`;
      tileset = await Cesium.Cesium3DTileset.fromUrl(tilesUrl, {
        maximumScreenSpaceError: sse
      });
    }

    // Performance and visual fidelity optimizations for game exploration
    tileset.maximumScreenSpaceError = sse;
    tileset.dynamicScreenSpaceError = true;
    tileset.dynamicScreenSpaceErrorDensity = 0.00278;
    tileset.dynamicScreenSpaceErrorFactor = 4.0;
    tileset.preloadWhenHidden = true;

    return tileset;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error loading Google Photorealistic 3D Tiles:', err);
    throw new Error(
      `Failed to load Google Photorealistic 3D Tiles (${message}). Please verify that the "Map Tiles API" is enabled for your Google Maps API key.`
    );
  }
}
