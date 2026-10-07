import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Shown while the browser reports that it is offline. */
export function NetworkBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-8 bg-warning-soft px-16 py-8 text-body text-warning">
      <WifiOff className="size-16" aria-hidden="true" />
      You're offline. Changes can't be saved until your connection is back.
    </div>
  );
}
