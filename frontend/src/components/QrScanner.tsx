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
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
      return;
    }

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text) => {
        onScan(text);
        scanner.stop().catch(() => {});
      },
      () => {},
    ).catch((err) => {
      setError(typeof err === 'string' ? err : 'Camera access denied. Please allow camera permissions.');
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [active]);

  return (
    <div>
      <div id={containerId} className="rounded-lg overflow-hidden" />
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
