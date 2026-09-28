import React, { useState } from 'react';
import { BasemapType, BASEMAP_DEFINITIONS } from '../geolibre/GeoLibreBasemap';

interface GeoLibreLayerControlProps {
  currentBasemap: BasemapType;
  onSelectBasemap: (type: BasemapType) => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  hasGoogleKey: boolean;
  onOpenKeyModal: () => void;
}

export const GeoLibreLayerControl: React.FC<GeoLibreLayerControlProps> = ({
  currentBasemap,
  onSelectBasemap,
  showMinimap,
  onToggleMinimap,
  hasGoogleKey,
  onOpenKeyModal
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="geolibre-layer-control-container pointer-events-auto">
      {/* Floating Toggle Button */}
      <button
        className={`geolibre-control-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="GeoLibre GIS Layer Switcher"
      >
        <span className="geolibre-icon">🌍</span>
        <span className="geolibre-btn-label">GIS Layers</span>
      </button>

      {/* Layer Panel */}
      {isOpen && (
        <div className="geolibre-layer-panel">
          <div className="panel-header">
            <div className="panel-brand">
              <span className="brand-badge">GeoLibre</span>
              <h3>Map &amp; Imagery Layers</h3>
            </div>
            <button className="btn-close-panel" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="basemap-section">
            <h4 className="section-label">3D &amp; 2D Basemaps</h4>
            <div className="basemap-options">
              {BASEMAP_DEFINITIONS.map((bm) => {
                const isSelected = currentBasemap === bm.id;
                const isLocked = bm.requiresKey && !hasGoogleKey;

                return (
                  <div
                    key={bm.id}
                    className={`basemap-option-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                    onClick={() => {
                      if (isLocked) {
                        onOpenKeyModal();
                      } else {
                        onSelectBasemap(bm.id);
                      }
                    }}
                  >
                    <div className="card-header">
                      <span className="bm-name">{bm.name}</span>
                      {isSelected && <span className="check-badge">✓ Active</span>}
                      {isLocked && <span className="key-badge">🔑 Key Req</span>}
                    </div>
                    <p className="bm-desc">{bm.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel-divider"></div>

          {/* Minimap Toggle */}
          <div className="tool-toggle-row">
            <div>
              <span className="toggle-title">MapLibre 2D GPS Minimap</span>
              <p className="toggle-desc">OpenFreeMap Liberty vector tiles in corner</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={showMinimap}
                onChange={onToggleMinimap}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="panel-footer">
            <span>Powered by GeoLibre &amp; CesiumJS</span>
          </div>
        </div>
      )}
    </div>
  );
};
