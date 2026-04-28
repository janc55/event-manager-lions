'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, Download, Eye, Pencil, QrCode } from 'lucide-react';
import Link from 'next/link';
import type { Participant, ParticipantStatus } from '@/types';
import { formatDate } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pre_registered: { label: 'Pre-registro', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  confirmed: { label: 'Confirmado', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  checked_in: { label: 'Acreditado', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
};

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filtered, setFiltered] = useState<Participant[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Participant[]>('/participants')
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setParticipants(list);
        setFiltered(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = participants;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s) ||
        p.documentNumber?.toLowerCase().includes(s) ||
        p.club?.toLowerCase().includes(s) ||
        p.registrationCode.toLowerCase().includes(s)
      );
    }
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, participants]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Participantes</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {participants.length} registrados
          </p>
        </div>
        <Link href="/participants/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
          <Plus className="w-4 h-4" /> Nuevo participante
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, email, documento, club..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-500 outline-none transition-all"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <option value="">Todos los estados</option>
          <option value="pre_registered">Pre-registro</option>
          <option value="confirmed">Confirmado</option>
          <option value="checked_in">Acreditado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Código', 'Nombre', 'Club', 'Distrito', 'País', 'Tipo', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: 'var(--color-bg-elevated)', width: `${60 + j * 10}px` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <p style={{ color: 'var(--color-text-muted)' }}>No se encontraron participantes</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const st = statusLabels[p.status] || statusLabels.pre_registered;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-[var(--color-bg-hover)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{p.registrationCode}</td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{p.firstName} {p.lastName}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.email}</div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{p.club || '—'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{p.district || '—'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{p.country}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{p.participantType}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/participants/${p.id}`}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-elevated)]"
                            title="Ver detalle">
                            <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                          </Link>
                          <button 
                            onClick={async () => {
                              try {
                                const blob = await api.getPdf(`/participants/${p.id}/badge`);
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `credencial-${p.registrationCode}.pdf`;
                                a.click();
                                URL.revokeObjectURL(url);
                              } catch (err) {
                                alert('Error al descargar credencial');
                              }
                            }}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-elevated)]"
                            title="Descargar Credencial">
                            <Download className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                          </button>
                          <Link href={`/participants/${p.id}?edit=true`}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-elevated)]"
                            title="Editar">
                            <Pencil className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
