import { useEffect, useRef } from 'react';

/**
 * useMotionController
 * Reads DeviceMotion / DeviceOrientation events from the phone browser
 * and emits lightweight gesture events over the provided socket at a
 * controlled rate (max ~10 events/sec to keep payload low).
 *
 * Usage (on the phone controller page):
 *   const socket = useSocket(sessionId);
 *   useMotionController(socket, sessionId);
 */
export default function useMotionController(socket, sessionId) {
  const lastEmitRef = useRef(0);
  const MIN_INTERVAL_MS = 100; // 10 Hz max

  useEffect(() => {
    if (!socket || !sessionId) return;

    function handleMotion(event) {
      const now = Date.now();
      if (now - lastEmitRef.current < MIN_INTERVAL_MS) return;
      lastEmitRef.current = now;

      const { accelerationIncludingGravity, rotationRate } = event;
      socket.emit('controller:motion', {
        sessionId,
        timestamp: now,
        ax: accelerationIncludingGravity?.x ?? 0,
        ay: accelerationIncludingGravity?.y ?? 0,
        az: accelerationIncludingGravity?.z ?? 0,
        alpha: rotationRate?.alpha ?? 0,
        beta: rotationRate?.beta ?? 0,
        gamma: rotationRate?.gamma ?? 0,
      });
    }

    // iOS 13+ requires permission
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      DeviceMotionEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') window.addEventListener('devicemotion', handleMotion);
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [socket, sessionId]);
}
