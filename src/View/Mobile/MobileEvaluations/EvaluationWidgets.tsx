import React from 'react';
import { gradeOf } from './evaluationShared';

// Circular score (0-100) coloured by grade
export const ScoreRing: React.FC<{ score: number; size?: number; stroke?: number; showLabel?: boolean }> = ({ score, size = 72, stroke = 7, showLabel = false }) => {
  const radius = (100 - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const grade = gradeOf(score);
  return (
    <div className={`me-ring grade-${grade}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100">
        <circle className="me-ring-bg" cx="50" cy="50" r={radius} strokeWidth={stroke} />
        <circle
          className="me-ring-value"
          cx="50" cy="50" r={radius}
          strokeWidth={stroke}
          strokeDasharray={length}
          strokeDashoffset={length - (length * Math.min(100, Math.max(0, score))) / 100}
        />
      </svg>
      <div className="me-ring-text">
        <strong style={{ fontSize: size * 0.3 }}>{score}</strong>
        {showLabel && <span>من 100</span>}
      </div>
    </div>
  );
};

// iOS-style switch used by the program and contract review pages
export const MobileToggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`me-toggle ${checked ? 'on' : ''}`}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
  >
    <span className="me-toggle-track"><span className="me-toggle-thumb" /></span>
    <span className="me-toggle-label">{label}</span>
  </button>
);
