import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScan: (data: string) => void;
  active: boolean;
}

export default function QrScanner({ onScan, active }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const containerId = 'qr-reader';

  useEffect(() => {
    if (!active) {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
      return;
    }

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    // Discover available camera devices
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras || cameras.length === 0) {
          setError('No camera detected on this device. Use the 1-Click Fast Tap buttons below.');
          return;
        }

        // Prefer rear camera if available, otherwise first camera
        const cameraId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;

        scanner
          .start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (text) => {
              onScan(text);
              if (scanner.isScanning) {
                scanner.stop().catch(() => {});
              }
            },
            () => {}
          )
          .catch((err) => {
            console.warn('Camera start error:', err);
            setError('Camera permission denied or camera in use. Use the 1-Click Fast Tap passes below.');
          });
      })
      .catch((err) => {
        console.warn('GetCameras error:', err);
        setError('Camera unavailable. Use the 1-Click Fast Tap passes below.');
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [active]);

  return (
    <div className="p-3 bg-slate-900 rounded-xl text-center">
      <div id={containerId} className="rounded-lg overflow-hidden mx-auto max-w-sm" />
      {error ? (
        <div className="mt-3 p-3 bg-red-950/80 border border-red-800/80 rounded-lg text-xs text-red-200">
          <p className="font-semibold mb-1">📷 {error}</p>
          <p className="text-slate-400">You can also use the 1-Click Fast Tap buttons below to board any passenger instantly.</p>
        </div>
      ) : (
        <p className="text-xs text-slate-400 mt-2">Point camera at the passenger's Smart Pass QR code</p>
      )}
    </div>
  );
}
