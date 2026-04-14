'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Ticket, CheckCircle2, XCircle, Search, User, Camera, CameraOff } from 'lucide-react';
import type { Activity, Participant, ScanResponse } from '@/types';
import QrScanner from '@/components/qr-scanner';

export default function ActivityScanPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ name: string; time: string; success: boolean }[]>([]);
  
  // Scanner mode
  const [cameraMode, setCameraMode] = useState(false);
  
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Participant[]>([]);

  useEffect(() => {
    api.get<Activity[]>('/activities')
      .then((d) => { const list = Array.isArray(d) ? d.filter((a) => a.status === 'active') : []; setActivities(list); if (list.length > 0) setSelectedActivity(list[0].id); })
      .catch(console.error);
  }, []);

  useEffect(() => { 
    if (!cameraMode && !searchMode) {
      inputRef.current?.focus(); 
    }
  }, [result, selectedActivity, cameraMode, searchMode]);

  const handleScan = useCallback(async (code: string) => {
    if (!code.trim() || !selectedActivity || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post<ScanResponse>('/operations/scan/activity-attendance', { qrCode: code.trim(), activityId: selectedActivity });
      setResult(res);
      setHistory((h) => [{ name: res.participant ? `${res.participant.firstName} ${res.participant.lastName}` : code, time: new Date().toLocaleTimeString(), success: res.success !== false }, ...h.slice(0, 19)]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setResult({ success: false, message: msg });
      setHistory((h) => [{ name: code, time: new Date().toLocaleTimeString(), success: false }, ...h.slice(0, 19)]);
    } finally {
      setLoading(false);
      setQrInput('');
      setTimeout(() => { if (!cameraMode) inputRef.current?.focus(); }, 100);
    }
  }, [loading, selectedActivity, cameraMode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const all = await api.get<Participant[]>('/participants');
      const q = searchQuery.toLowerCase();
      setSearchResults((Array.isArray(all) ? all : []).filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.documentNumber?.toLowerCase().includes(q) || p.registrationCode.toLowerCase().includes(q)).slice(0, 10));
    } catch { setSearchResults([]); }
  };

  const toggleCamera = () => {
    setCameraMode(!cameraMode);
    setSearchMode(false);
    if (!cameraMode) {
      setQrInput('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Control por Actividad</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Registrar asistencia a una actividad específica</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={toggleCamera}
            disabled={!selectedActivity}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              cameraMode ? 'text-white' : 'disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            style={{ 
              background: cameraMode ? 'var(--color-primary)' : 'var(--color-bg-card)',
              border: '1px solid var(--color-border)'
            }}
          >
            {cameraMode ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {cameraMode ? 'Cámara activa' : 'Usar cámara'}
          </button>
          <button 
            onClick={() => { setSearchMode(!searchMode); setCameraMode(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            <Search className="w-4 h-4" /> Buscar manual
          </button>
        </div>
      </div>

      {/* Activity selector */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-primary-light)' }}>Actividad activa</label>
        {activities.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No hay actividades activas</p>
        ) : (
          <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
            {activities.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.location}</option>)}
          </select>
        )}
      </div>

      {/* QR Scanner */}
      {cameraMode && selectedActivity && (
        <QrScanner
          isActive={cameraMode}
          onToggle={toggleCamera}
          onScanSuccess={handleScan}
        />
      )}

      {/* QR Input */}
      {!cameraMode && !searchMode && selectedActivity && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <Ticket className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-primary-light)' }} />
          <p className="text-white font-medium mb-4">Escanee QR para registrar asistencia</p>
          <input ref={inputRef} type="text" value={qrInput} onChange={(e) => setQrInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleScan(qrInput))}
            placeholder="QR Code" autoFocus
            className="w-full max-w-md mx-auto px-6 py-4 rounded-xl text-center text-lg text-white outline-none"
            style={{ background: 'var(--color-bg-elevated)', border: '2px solid var(--color-border)' }} />
        </div>
      )}

      {/* Manual Search */}
      {searchMode && (
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex gap-3">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nombre, documento o código" className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }} />
            <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>Buscar</button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((p) => (
                <button key={p.id} onClick={() => { setSearchMode(false); handleScan(p.qrCode); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-[var(--color-bg-hover)]"
                  style={{ border: '1px solid var(--color-border)' }}>
                  <User className="w-5 h-5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                  <div><p className="text-sm text-white font-medium">{p.firstName} {p.lastName}</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.registrationCode}</p></div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-2xl p-6 animate-slide-in" style={{ background: result.success !== false ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', border: `2px solid ${result.success !== false ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          <div className="flex items-center gap-4">
            {result.success !== false ? <CheckCircle2 className="w-10 h-10" style={{ color: '#22c55e' }} /> : <XCircle className="w-10 h-10" style={{ color: '#ef4444' }} />}
            <div>
              <p className="text-lg font-bold text-white">{result.message}</p>
              {result.participant && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{result.participant.firstName} {result.participant.lastName}</p>}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary-light)' }}>Historial</h3>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 text-sm">
                {h.success ? <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} /> : <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />}
                <span className="text-white">{h.name}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}