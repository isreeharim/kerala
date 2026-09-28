import React from 'react';
import { BasemapType } from '../geolibre/GeoLibreBasemap';

interface AttributionBarProps {
  activeBasemap?: BasemapType;
}

export const AttributionBar: React.FC<AttributionBarProps> = ({ activeBasemap = 'esri-satellite' }) => {
  return (
    <div className="attribution-bar pointer-events-auto">
      {activeBasemap === 'google-3d' ? (
        <>
          <span className="google-logo-text">Google</span>
          <span className="attribution-divider">•</span>
          <span>Imagery &amp; 3D Tiles © Google</span>
          <span className="attribution-divider">•</span>
          <a
            href="https://developers.google.com/maps/documentation/tile/3d-tiles"
            target="_blank"
            rel="noopener noreferrer"
            className="attribution-link"
          >
            Google Maps Platform
          </a>
        </>
      ) : activeBasemap === 'esri-satellite' ? (
        <>
          <span className="geolibre-brand-text">GeoLibre</span>
          <span className="attribution-divider">•</span>
          <span>Imagery © Esri, Maxar, Earthstar Geographics</span>
        </>
      ) : activeBasemap === 'osm-streets' ? (
        <>
          <span className="geolibre-brand-text">GeoLibre</span>
          <span className="attribution-divider">•</span>
          <span>Map data © OpenStreetMap contributors</span>
        </>
      ) : (
        <>
          <span className="geolibre-brand-text">GeoLibre</span>
          <span className="attribution-divider">•</span>
          <span>© CARTO • © OpenStreetMap contributors</span>
        </>
      )}

      <span className="attribution-divider">•</span>
      <span>CesiumJS</span>
      <span className="attribution-divider">•</span>
      <span>OpenFreeMap</span>
    </div>
  );
};
