import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameStatus } from './game/GameEngine';
import { GameHUD } from './components/GameHUD';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AttributionBar } from './components/AttributionBar';
import { MANJERI_CENTER } from './utils/coordinates';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStatus>('INITIALIZING');
  const [statusMessage, setStatusMessage] = useState<string>('Initializing Cesium...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

  const [playerStats, setPlayerStats] = useState({
    speedKmH: 0,
    lat: MANJERI_CENTER.latitude,
    lon: MANJERI_CENTER.longitude,
    alt: MANJERI_CENTER.height
  });

  const launchEngine = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up existing engine instance if any
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
        setGameStatus('ERROR');
        setErrorMessage(error.message);
      },
      onPlayerStats: (stats) => {
        setPlayerStats(stats);
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

  const handleRetryWithKey = (key: string) => {
    // Set in session storage or override env for immediate testing
    (import.meta.env as Record<string, string>).VITE_GOOGLE_MAPS_API_KEY = key;
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

      {/* Error / Missing API Key Modal */}
      {gameStatus === 'ERROR' && (
        <ApiKeyModal
          errorMessage={errorMessage || undefined}
          onRetryWithKey={handleRetryWithKey}
        />
      )}

      {/* Gameplay HUD */}
      {gameStatus === 'READY' && (
        <GameHUD
          stats={playerStats}
          isPointerLocked={isPointerLocked}
          onRequestPointerLock={handleRequestPointerLock}
        />
      )}

      {/* Google Attribution Bar (always visible) */}
      <AttributionBar />
    </div>
  );
};
export default App;
