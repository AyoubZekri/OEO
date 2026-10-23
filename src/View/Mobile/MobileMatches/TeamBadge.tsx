import { Shield } from 'lucide-react';
import React from 'react';

// Club logo in a rounded tile, or its short name when there is no logo
export const TeamBadge: React.FC<{ logo?: string; short: string; className?: string }> = ({ logo, short, className = '' }) => (
  <span className={`mmt-logo ${logo ? '' : 'empty'} ${className}`}>
    {/* No logo (every opponent): the one shield icon */}
    {logo ? <img src={logo} alt="" /> : <Shield size={className.includes('xl') ? 30 : className.includes('big') ? 24 : 18} aria-label={short} />}
  </span>
);
