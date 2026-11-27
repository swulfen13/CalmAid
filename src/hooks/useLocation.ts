import { useCallback, useEffect, useRef, useState } from 'react';

export interface Fix {
  lat: number;
  lon: number;
  accuracy: number;
  at: number;
}

/** GPS position for the emergency call. Works offline (no map or address lookup). */
export function useLocation(auto = false) {
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const [fix, setFix] = useState<Fix | null>(null);
  const [status, setStatus] = useState<'idle' | 'locating' | 'ok' | 'denied' | 'error'>('idle');
  const watchRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!supported || watchRef.current !== null) return;
    setStatus('locating');
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        setFix({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: Math.round(p.coords.accuracy), at: Date.now() });
        setStatus('ok');
      },
      (e) => setStatus(e.code === e.PERMISSION_DENIED ? 'denied' : 'error'),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
  }, [supported]);

  useEffect(() => {
    if (auto) start();
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    };
  }, [auto, start]);

  return { supported, fix, status, start };
}

/** "48.13743° N, 11.57549° E" — the format dispatchers can read back easily. */
export function formatFix(f: Fix) {
  const lat = `${Math.abs(f.lat).toFixed(5)}° ${f.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(f.lon).toFixed(5)}° ${f.lon >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lon}`;
}
