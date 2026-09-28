import React, { useEffect, useRef } from 'react';
import { MapLibreMinimap } from '../geolibre/MapLibreMinimap';

interface MinimapWidgetProps {
  longitude: number;
  latitude: number;
  headingDeg: number;
}

export const MinimapWidget: React.FC<MinimapWidgetProps> = ({
  longitude,
  latitude,
  headingDeg
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const minimapInstance = useRef<MapLibreMinimap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const minimap = new MapLibreMinimap(containerRef.current);
    minimapInstance.current = minimap;

    return () => {
      minimap.destroy();
      minimapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (minimapInstance.current) {
      const headingRad = (headingDeg * Math.PI) / 180;
      minimapInstance.current.updatePlayer(longitude, latitude, headingRad);
    }
  }, [longitude, latitude, headingDeg]);

  return (
    <div className="minimap-widget-wrapper pointer-events-auto">
      <div className="minimap-header">
        <span className="minimap-title">📍 Manjeri GPS</span>
        <span className="minimap-tag">MapLibre</span>
      </div>
      <div ref={containerRef} className="minimap-canvas-container" />
    </div>
  );
};
