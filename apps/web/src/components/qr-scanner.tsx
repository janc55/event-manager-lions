'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface QrScannerProps {
  onScanSuccess: (code: string) => void;
  isActive: boolean;
  onToggle: () => void;
  fps?: number;
  qrbox?: number;
}

export default function QrScanner({ 
  onScanSuccess, 
  isActive, 
  onToggle,
  fps = 10,
  qrbox = 280 
}: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  useEffect(() => {
    if (!isActive) {
      stopScanner();
      return;
    }

    const startScanner = async () => {
      try {
        setError(null);
        
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id}` })));
          
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('trasera')
          );
          const cameraId = backCamera?.id || devices[0].id;
          setSelectedCamera(cameraId);

          await startCamera(cameraId);
        } else {
          setError('No se detectaron cámaras disponibles');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al iniciar la cámara';
        setError(message);
        console.error('Scanner init error:', err);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isActive]);

  const startCamera = async (cameraId: string) => {
    if (!containerRef.current) return;

    stopScanner();

    try {
      const scanner = new Html5Qrcode('qr-reader-container');
      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps,
          qrbox: { width: qrbox, height: qrbox },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        () => {}
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar cámara';
      setError(message);
      console.error('Camera start error:', err);
    }
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || 
            state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  }, []);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cameraId = e.target.value;
    setSelectedCamera(cameraId);
    if (isActive) {
      startCamera(cameraId);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5" style={{ color: 'var(--color-primary-light)' }} />
          <span className="text-sm font-medium text-white">Escáner QR</span>
        </div>
        <div className="flex items-center gap-3">
          {cameras.length > 1 && (
            <select
              value={selectedCamera}
              onChange={handleCameraChange}
              className="px-2 py-1 rounded text-xs text-white outline-none"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label.includes('back') || cam.label.includes('rear') 
                    ? 'Cámara trasera' 
                    : cam.label.includes('front') 
                    ? 'Cámara frontal' 
                    : `Cámara ${cam.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
            title="Cerrar escáner"
          >
            <CameraOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#ef4444' }} />
          <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Error</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
          <button
            onClick={onToggle}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Usar modo manual
          </button>
        </div>
      ) : (
        <div className="relative">
          <div 
            id="qr-reader-container"
            ref={containerRef}
            className="w-full"
            style={{ minHeight: '300px' }}
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div 
              className="border-2 rounded-lg animate-pulse"
              style={{ 
                width: qrbox, 
                height: qrbox,
                borderColor: 'var(--color-primary)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>
        </div>
      )}

      <div className="p-3 text-center border-t" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Posicione el código QR dentro del marco
        </p>
      </div>
    </div>
  );
}