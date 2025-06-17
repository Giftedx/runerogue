/**
 * Error Boundary Component
 * Displays error messages and retry options
 */

import React from "react";

interface ErrorBoundaryProps {
  error: string;
  onRetry: () => void;
  showDiscordStatus?: boolean;
  discordInitialized?: boolean;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  error,
  onRetry,
  showDiscordStatus = false,
  discordInitialized = false,
}) => {
  return (
    <div className="error-boundary">
      <div className="error-container">
        {/* Error Icon */}
        <div className="error-icon">⚠️</div>

        {/* Error Title */}
        <h2 className="error-title">Connection Failed</h2>

        {/* Error Message */}
        <div className="error-message">
          <p>{error}</p>
        </div>

        {/* Discord Status (if applicable) */}
        {showDiscordStatus && (
          <div className="discord-status">
            <p>
              Discord Integration:{" "}
              <span
                className={
                  discordInitialized ? "status-success" : "status-warning"
                }
              >
                {discordInitialized ? "✅ Connected" : "⚠️ Not Connected"}
              </span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="error-actions">
          <button className="retry-button" onClick={onRetry}>
            🔄 Retry Connection
          </button>

          <button
            className="help-button"
            onClick={() =>
              window.open(
                "https://github.com/your-repo/runerogue/issues",
                "_blank"
              )
            }
          >
            💬 Get Help
          </button>
        </div>

        {/* Troubleshooting Tips */}
        <div className="troubleshooting">
          <h3>Troubleshooting Tips:</h3>
          <ul>
            <li>Check your internet connection</li>
            <li>Make sure the game server is running</li>
            <li>Try refreshing the page</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .error-boundary {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(
            135deg,
            #2d1b2e 0%,
            #1a0e1a 50%,
            #0f0615 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          color: #ffffff;
          z-index: 9999;
        }

        .error-container {
          text-align: center;
          max-width: 500px;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-title {
          font-size: 2rem;
          font-weight: bold;
          margin: 0 0 1rem 0;
          color: #ff6b6b;
        }

        .error-message {
          margin: 1.5rem 0;
          padding: 1rem;
          background: rgba(255, 107, 107, 0.1);
          border-radius: 8px;
          border-left: 4px solid #ff6b6b;
        }

        .error-message p {
          margin: 0;
          font-size: 1rem;
          line-height: 1.5;
        }

        .discord-status {
          margin: 1rem 0;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .status-success {
          color: #4ecdc4;
        }

        .status-warning {
          color: #ffc107;
        }

        .error-actions {
          margin: 2rem 0;
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .retry-button,
        .help-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }

        .retry-button {
          background: linear-gradient(45deg, #4ecdc4, #44a08d);
          color: white;
        }

        .retry-button:hover {
          background: linear-gradient(45deg, #44a08d, #4ecdc4);
          transform: translateY(-2px);
        }

        .help-button {
          background: transparent;
          color: #b0c4de;
          border: 1px solid rgba(176, 196, 222, 0.3);
        }

        .help-button:hover {
          background: rgba(176, 196, 222, 0.1);
          border-color: rgba(176, 196, 222, 0.5);
        }

        .troubleshooting {
          margin-top: 2rem;
          text-align: left;
          opacity: 0.8;
        }

        .troubleshooting h3 {
          font-size: 1.1rem;
          margin: 0 0 1rem 0;
          color: #ffc107;
          text-align: center;
        }

        .troubleshooting ul {
          margin: 0;
          padding-left: 1.5rem;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .troubleshooting li {
          margin-bottom: 0.5rem;
          color: #b0c4de;
        }
      `}</style>
    </div>
  );
};
