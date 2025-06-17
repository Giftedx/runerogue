/**
 * Loading Screen Component
 * Displays a loading animation and status messages
 */

import React from "react";

interface LoadingScreenProps {
  message: string;
  subtitle?: string;
  progress?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  subtitle,
  progress,
}) => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        {/* RuneRogue Logo/Title */}
        <div className="logo">
          <h1>RuneRogue</h1>
          <p className="tagline">OSRS-Inspired Multiplayer Adventure</p>
        </div>

        {/* Loading Animation */}
        <div className="loading-animation">
          <div className="spinner"></div>
        </div>

        {/* Status Messages */}
        <div className="loading-messages">
          <p className="main-message">{message}</p>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>

        {/* Progress Bar (if provided) */}
        {progress !== undefined && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}

        {/* Loading Tips */}
        <div className="loading-tips">
          <p>💡 Tip: Use WASD to move around the world</p>
        </div>
      </div>

      <style jsx>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(
            135deg,
            #1a1a2e 0%,
            #16213e 50%,
            #0f3460 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          color: #ffffff;
          z-index: 9999;
        }

        .loading-container {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
        }

        .logo h1 {
          font-size: 3rem;
          font-weight: bold;
          margin: 0;
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }

        .tagline {
          font-size: 0.9rem;
          opacity: 0.8;
          margin: 0.5rem 0 2rem 0;
          color: #b0c4de;
        }

        .loading-animation {
          margin: 2rem 0;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left: 4px solid #ffd700;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loading-messages {
          margin: 2rem 0;
        }

        .main-message {
          font-size: 1.2rem;
          font-weight: 500;
          margin: 0 0 0.5rem 0;
          color: #ffffff;
        }

        .subtitle {
          font-size: 0.9rem;
          opacity: 0.7;
          margin: 0;
          color: #b0c4de;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          margin: 1.5rem 0;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd700, #ffed4e);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .loading-tips {
          margin-top: 3rem;
          opacity: 0.6;
          font-size: 0.85rem;
          animation: fadeInOut 3s infinite;
        }

        @keyframes fadeInOut {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }

        .loading-tips p {
          margin: 0;
          color: #90ee90;
        }
      `}</style>
    </div>
  );
};
