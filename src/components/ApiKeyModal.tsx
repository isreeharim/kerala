import React, { useState } from 'react';

interface ApiKeyModalProps {
  errorMessage?: string;
  onRetryWithKey?: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  errorMessage,
  onRetryWithKey
}) => {
  const [inputKey, setInputKey] = useState('');

  const isMissingKey =
    !errorMessage ||
    errorMessage.includes('Google Maps Platform API key is missing') ||
    errorMessage.includes('API key is missing');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim() && onRetryWithKey) {
      onRetryWithKey(inputKey.trim());
    }
  };

  return (
    <div className="api-key-modal-backdrop">
      <div className="api-key-modal-card">
        <div className="modal-icon-badge">🗺️</div>

        <h2 className="modal-title">Google Maps Platform API Key Required</h2>

        <div className="modal-error-banner">
          <span className="modal-error-icon">⚠️</span>
          <p className="modal-error-text">
            {isMissingKey
              ? 'Google Maps Platform API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.'
              : errorMessage}
          </p>
        </div>

        <div className="modal-instructions">
          <h3>How to configure:</h3>
          <ol>
            <li>
              Go to the{' '}
              <a
                href="https://console.cloud.google.com/google/maps-apis/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="modal-link"
              >
                Google Cloud Console
              </a>
              .
            </li>
            <li>
              Enable the <strong>Map Tiles API</strong> for your project.
            </li>
            <li>Create or copy your Google Maps API Key.</li>
            <li>
              Add the key to your <code>.env</code> file:
              <pre className="modal-code-block">
                VITE_GOOGLE_MAPS_API_KEY=your_actual_key_here
              </pre>
            </li>
          </ol>
        </div>

        {onRetryWithKey && (
          <form onSubmit={handleSubmit} className="modal-form">
            <label htmlFor="temp-key-input" className="modal-label">
              Or test directly in this browser session:
            </label>
            <div className="modal-input-row">
              <input
                id="temp-key-input"
                type="text"
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="modal-input"
              />
              <button
                type="submit"
                disabled={!inputKey.trim()}
                className="modal-submit-btn"
              >
                Launch
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
