import React from 'react';
import { MANJERI_LANDMARKS } from '../utils/coordinates';

interface GameHUDProps {
  stats: {
    speedKmH: number;
    lat: number;
    lon: number;
    alt: number;
  };
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
  onTeleport?: (lon: number, lat: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  isPointerLocked,
  onRequestPointerLock,
  onTeleport
}) => {
  return (
    <div className="game-hud-layer pointer-events-none select-none">
      {/* Top-Left: Location, Coords & Fast Travel */}
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
        </div>

        {/* Fast Travel Quick Pills */}
        <div className="hud-fast-travel pointer-events-auto">
          <span className="fast-travel-label">⚡ Fast Travel:</span>
          <div className="fast-travel-buttons">
            {MANJERI_LANDMARKS.map((lm) => (
              <button
                key={lm.name}
                className="btn-fast-travel-pill"
                onClick={() => onTeleport?.(lm.longitude, lm.latitude)}
                title={`Teleport directly to ${lm.name} (${lm.description})`}
              >
                {lm.name.replace(' Junction', '').replace(' Hospital', '')}
              </button>
            ))}
          </div>
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

      {/* Bottom-Left: Speedometer & Controls Reference */}
      <div className="hud-bottom-left">
        <div className="hud-speedometer-badge">
          <span className="speedo-number">{stats.speedKmH}</span>
          <div className="speedo-unit-col">
            <span className="speedo-unit">KM/H</span>
            <span className="speedo-sub">{stats.speedKmH > 6 ? 'Sprinting' : stats.speedKmH > 0.5 ? 'Walking' : 'Idle'}</span>
          </div>
        </div>

        <div className="hud-controls-card pointer-events-auto">
          <div className="hud-control-row">
            <span className="hud-key">W A S D</span>
            <span className="hud-desc">Move</span>
          </div>
          <div className="hud-control-row">
            <span className="hud-key">SHIFT</span>
            <span className="hud-desc">Sprint Run</span>
          </div>
          <div className="hud-control-row">
            <span className="hud-key">SPACE</span>
            <span className="hud-desc">Jump</span>
          </div>
          <div className="hud-control-row">
            <span className="hud-key">Mouse / Drag</span>
            <span className="hud-desc">Orbit Camera</span>
          </div>
          <div className="hud-control-row">
            <span className="hud-key">Scroll</span>
            <span className="hud-desc">Zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
};
