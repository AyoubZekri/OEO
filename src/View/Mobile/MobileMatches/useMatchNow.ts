import { useEffect, useState } from 'react';

/** "Now", refreshed every minute so the live and countdown states stay right */
export const useMatchNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};
