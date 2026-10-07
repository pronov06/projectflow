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
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm text-amber-900">
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You're offline. Changes can't be saved until your connection is back.
    </div>
  );
}
