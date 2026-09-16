import React from 'react';

interface LoadingOverlayProps {
  status: string;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status, message }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner"></div>
        <h2 className="loading-title">Entering Manjeri, Kerala</h2>
        <p className="loading-status">{message || 'Streaming Google Photorealistic 3D Tiles...'}</p>
        <div className="loading-progress-bar">
          <div className="loading-progress-indeterminate"></div>
        </div>
        <span className="loading-badge">Google Photorealistic 3D Tiles • CesiumJS</span>
      </div>
    </div>
  );
};
