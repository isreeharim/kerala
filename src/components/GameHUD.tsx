import React from 'react';

interface GameHUDProps {
  stats: {
    speedKmH: number;
    lat: number;
    lon: number;
    alt: number;
  };
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  isPointerLocked,
  onRequestPointerLock
}) => {
  return (
    <div className="game-hud-layer pointer-events-none select-none">
      {/* Top-Left: Location & Title */}
      <div className="hud-top-left">
        <div className="hud-title-badge">
          <span className="hud-pin-icon">📍</span>
          <div>
            <h1 className="hud-title">MANJERI, KERALA</h1>
            <p className="hud-subtitle">MALAPPURAM DISTRICT • INDIA</p>
          </div>
        </div>

        <div className="hud-coords-pill">
          <span>{stats.lat.toFixed(4)}° N, {stats.lon.toFixed(4)}° E</span>
          <span className="hud-pill-divider">•</span>
          <span>Alt: {Math.round(stats.alt)}m</span>
          <span className="hud-pill-divider">•</span>
          <span>{stats.speedKmH} km/h</span>
        </div>
      </div>

      {/* Top-Right: Mouse Lock Guide */}
      <div className="hud-top-right pointer-events-auto">
        {!isPointerLocked ? (
          <button
            onClick={onRequestPointerLock}
            className="hud-lock-btn"
            title="Click to lock mouse for smooth 3D camera rotation"
          >
            🖱️ Click Canvas to Lock Mouse
          </button>
        ) : (
          <div className="hud-locked-badge">
            <span className="hud-dot-pulse"></span> Mouse Locked (Esc to release)
          </div>
        )}
      </div>

      {/* Bottom-Left: Controls Reference */}
      <div className="hud-bottom-left">
        <div className="hud-controls-card">
          <div className="hud-control-row">
            <span className="hud-key">W A S D</span>
            <span className="hud-desc">Move</span>
          </div>
          <div className="hud-control-row">
            <span className="hud-key">SHIFT</span>
            <span className="hud-desc">Run</span>
          </div>
          <div className="hud-control-row">
            <span className="hud-key">SPACE</span>
            <span className="hud-desc">Jump</span>
          </div>
          <div className="hud-control-row">
            <span className="hud-key">Mouse</span>
            <span className="hud-desc">Look / Orbit</span>
          </div>
          <div className="hud-control-row">
            <span className="hud-key">Scroll</span>
            <span className="hud-desc">Zoom In/Out</span>
          </div>
        </div>
      </div>
    </div>
  );
};
