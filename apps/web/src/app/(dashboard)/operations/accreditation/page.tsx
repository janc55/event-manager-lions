'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ScanLine, CheckCircle2, AlertTriangle, XCircle, Search, User } from 'lucide-react';
import type { Participant, ScanResponse } from '@/types';
import { formatMoney } from '@/lib/utils';

export default function AccreditationPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ name: string; time: string; success: boolean }[]>([]);

  // Manual search
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Participant[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [result]);

  const handleScan = useCallback(async (code: string) => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post<ScanResponse>('/operations/scan/general-attendance', { qrCode: code.trim() });
      setResult(res);
      setHistory((h) => [
        { name: res.participant ? `${res.participant.firstName} ${res.participant.lastName}` : code, time: new Date().toLocaleTimeString(), success: res.success !== false },
        ...h.slice(0, 19),
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de escaneo';
      setResult({ success: false, message: msg });
      setHistory((h) => [{ name: code, time: new Date().toLocaleTimeString(), success: false }, ...h.slice(0, 19)]);
    } finally {
      setLoading(false);
      setQrInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan(qrInput);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const all = await api.get<Participant[]>('/participants');
      const q = searchQuery.toLowerCase();
      setSearchResults(
        (Array.isArray(all) ? all : []).filter((p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.documentNumber?.toLowerCase().includes(q) ||
          p.registrationCode.toLowerCase().includes(q)
        ).slice(0, 10)
      );
    } catch { setSearchResults([]); }
  };

  const scanByParticipant = (p: Participant) => {
    setSearchMode(false);
    setSearchResults([]);
    setSearchQuery('');
    handleScan(p.qrCode);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Acreditación General</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Escanee el código QR del participante</p>
        </div>
        <button onClick={() => setSearchMode(!searchMode)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
          <Search className="w-4 h-4" /> Buscar manual
        </button>
      </div>

      {/* QR Input */}
      {!searchMode && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 animate-pulse-gold"
            style={{ background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.15), rgba(218, 165, 32, 0.1))', border: '2px solid var(--color-primary)' }}>
            <ScanLine className="w-10 h-10" style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <p className="text-white font-medium mb-4">Esperando escaneo...</p>
          <input
            ref={inputRef}
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="El lector QR ingresará el código aquí"
            autoFocus
            className="w-full max-w-md mx-auto px-6 py-4 rounded-xl text-center text-lg text-white outline-none transition-all"
            style={{ background: 'var(--color-bg-elevated)', border: '2px solid var(--color-border)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>
      )}

      {/* Manual Search */}
      {searchMode && (
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary-light)' }}>Búsqueda manual</p>
          <div className="flex gap-3">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nombre, documento o código de registro"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }} />
            <button onClick={handleSearch}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
              Buscar
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((p) => (
                <button key={p.id} onClick={() => scanByParticipant(p)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-[var(--color-bg-hover)]"
                  style={{ border: '1px solid var(--color-border)' }}>
                  <User className="w-5 h-5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                  <div>
                    <p className="text-sm text-white font-medium">{p.firstName} {p.lastName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.registrationCode} · {p.club || p.country}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-2xl p-8 animate-slide-in"
          style={{
            background: result.success !== false
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02))'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))',
            border: `2px solid ${result.success !== false ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: result.success !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
              {result.success !== false
                ? <CheckCircle2 className="w-7 h-7" style={{ color: '#22c55e' }} />
                : <XCircle className="w-7 h-7" style={{ color: '#ef4444' }} />}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-white">{result.message}</p>
              {result.participant && (
                <div className="mt-3 space-y-1">
                  <p className="text-xl font-bold text-white">{result.participant.firstName} {result.participant.lastName}</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {result.participant.club || ''} {result.participant.district ? `· ${result.participant.district}` : ''} · {result.participant.country}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Tipo: {result.participant.participantType}</p>
                  {result.participant.specialRequirements && (
                    <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <p className="text-xs font-medium" style={{ color: '#f59e0b' }}>⚠ {result.participant.specialRequirements}</p>
                    </div>
                  )}
                </div>
              )}
              {result.warning && (
                <div className="flex items-center gap-2 mt-3 p-2 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                  <p className="text-sm" style={{ color: '#f59e0b' }}>{result.warning}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary-light)' }}>Historial reciente</h3>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 text-sm">
                {h.success ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#22c55e' }} /> : <XCircle className="w-4 h-4 shrink-0" style={{ color: '#ef4444' }} />}
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
