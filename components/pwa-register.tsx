'use client';
import { useEffect } from 'react';
export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(registration => registration.update())
      .catch(error => console.warn('GramCare offline support could not update:', error));
  }, []);
  return null;
}
