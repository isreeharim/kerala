import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameStatus } from './game/GameEngine';
import { GameHUD } from './components/GameHUD';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AttributionBar } from './components/AttributionBar';
import { GeoLibreLayerControl } from './components/GeoLibreLayerControl';
import { MinimapWidget } from './components/MinimapWidget';
import { BasemapType } from './geolibre/GeoLibreBasemap';
import { hasGoogleMapsApiKey } from './cesium/GoogleTileset';
import { MANJERI_CENTER } from './utils/coordinates';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStatus>('INITIALIZING');
  const [statusMessage, setStatusMessage] = useState<string>('Initializing Cesium & GeoLibre...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>(
    hasGoogleMapsApiKey() ? 'google-3d' : 'esri-satellite'
  );

  const [playerStats, setPlayerStats] = useState({
    speedKmH: 0,
    lat: MANJERI_CENTER.latitude,
    lon: MANJERI_CENTER.longitude,
    alt: MANJERI_CENTER.height,
    headingDeg: 0,
    activeBasemap: activeBasemap
  });

  const launchEngine = useCallback(() => {
    if (!containerRef.current) return;

    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    setErrorMessage(null);
    setGameStatus('INITIALIZING');

    const engine = new GameEngine(containerRef.current, {
      onStatusChange: (status, message) => {
        setGameStatus(status);
        if (message) setStatusMessage(message);
      },
      onError: (error) => {
        // If critical failure, show error
        setGameStatus('ERROR');
        setErrorMessage(error.message);
      },
      onPlayerStats: (stats) => {
        setPlayerStats(stats);
        setActiveBasemap(stats.activeBasemap);
      },
      onBasemapChange: (bm) => {
        setActiveBasemap(bm);
      }
    });

    engineRef.current = engine;
    engine.start();
  }, []);

  useEffect(() => {
    launchEngine();

    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current);
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [launchEngine]);

  const handleRequestPointerLock = () => {
    engineRef.current?.requestPointerLock();
  };

  const handleSelectBasemap = async (type: BasemapType) => {
    if (!engineRef.current) return;
    try {
      await engineRef.current.switchBasemap(type);
      setActiveBasemap(type);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (type === 'google-3d') {
        setIsKeyModalOpen(true);
      } else {
        alert(msg);
      }
    }
  };

  const handleRetryWithKey = (key: string) => {
    (import.meta.env as Record<string, string>).VITE_GOOGLE_MAPS_API_KEY = key;
    setIsKeyModalOpen(false);
    launchEngine();
  };

  return (
    <div className="game-root-viewport">
      {/* Cesium 3D Globe Canvas Container */}
      <div
        id="cesium-container"
        ref={containerRef}
        className="cesium-canvas-container"
      />

      {/* Loading Overlay */}
      {(gameStatus === 'INITIALIZING' ||
        gameStatus === 'LOADING_TILES' ||
        gameStatus === 'SPAWNING_PLAYER') && (
        <LoadingOverlay status={gameStatus} message={statusMessage} />
      )}

      {/* Error Modal (for fatal errors) */}
      {gameStatus === 'ERROR' && (
        <ApiKeyModal
          errorMessage={errorMessage || undefined}
          onRetryWithKey={handleRetryWithKey}
        />
      )}

      {/* Optional API Key Modal opened from layer switcher */}
      {isKeyModalOpen && (
        <div style={{ position: 'relative', zIndex: 110 }}>
          <ApiKeyModal
            errorMessage="To view photorealistic 3D buildings from Google, enter your Google Maps API key below or switch back to GeoLibre Satellite."
            onRetryWithKey={handleRetryWithKey}
          />
        </div>
      )}

      {/* Gameplay HUD */}
      {gameStatus === 'READY' && (
        <>
          <GameHUD
            stats={playerStats}
            isPointerLocked={isPointerLocked}
            onRequestPointerLock={handleRequestPointerLock}
          />

          {/* GeoLibre Floating Layer Controller */}
          <GeoLibreLayerControl
            currentBasemap={activeBasemap}
            onSelectBasemap={handleSelectBasemap}
            showMinimap={showMinimap}
            onToggleMinimap={() => setShowMinimap(!showMinimap)}
            hasGoogleKey={hasGoogleMapsApiKey()}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
          />

          {/* MapLibre 2D GPS Minimap in bottom right */}
          {showMinimap && (
            <MinimapWidget
              longitude={playerStats.lon}
              latitude={playerStats.lat}
              headingDeg={playerStats.headingDeg}
            />
          )}
        </>
      )}

      {/* Dynamic Attribution Bar */}
      <AttributionBar activeBasemap={activeBasemap} />
    </div>
  );
};

export default App;
