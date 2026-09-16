import React from 'react';

export const AttributionBar: React.FC = () => {
  return (
    <div className="attribution-bar pointer-events-auto">
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
      <span className="attribution-divider">•</span>
      <span>CesiumJS</span>
    </div>
  );
};
