import React from 'react';
import { MobileLoader } from '../../../Mobile/widgets/MobileLoader';

/** The app's loader, as on the other pages: three spinning rings (desktop) or the phone loader */
export const TaskLoader: React.FC<{ mobile: boolean; text?: string }> = ({ mobile, text = 'جاري تحميل المهام...' }) => (
  mobile ? <MobileLoader text={text} /> : (
    <div className="loading-container">
      <div className="premium-loader">
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-dot"></div>
      </div>
      <p className="loading-text">{text}</p>
    </div>
  )
);
