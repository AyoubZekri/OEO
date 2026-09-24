import { useEffect, useState } from 'react';

// Same breakpoint as the CSS media queries; `change` fires whenever the screen crosses it
export const MOBILE_QUERY = '(max-width: 768px)';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
};
