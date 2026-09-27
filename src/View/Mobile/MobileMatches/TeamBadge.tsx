import React from 'react';

// Club logo in a rounded tile, or its short name when there is no logo
export const TeamBadge: React.FC<{ logo?: string; short: string; className?: string }> = ({ logo, short, className = '' }) => (
  <span className={`mmt-logo ${logo ? '' : 'empty'} ${className}`}>
    {logo ? <img src={logo} alt="" /> : short}
  </span>
);
