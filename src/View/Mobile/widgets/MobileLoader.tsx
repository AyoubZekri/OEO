import React from 'react';
import './MobileLoader.css';

// Same look as the desktop "premium" loader: three spinning rings, a pulsing dot and gradient text
export const MobileLoader: React.FC<{ text: string }> = ({ text }) => (
  <div className="m-loader" role="status" aria-live="polite">
    <div className="m-loader-rings" aria-hidden="true">
      <span className="m-loader-ring" />
      <span className="m-loader-ring" />
      <span className="m-loader-ring" />
      <span className="m-loader-dot" />
    </div>
    <p className="m-loader-text">{text}</p>
  </div>
);
