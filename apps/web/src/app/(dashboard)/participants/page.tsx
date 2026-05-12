'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
  Plus, Search, Eye, Pencil, FileText, 
  Image as ImageIcon, ChevronLeft, ChevronRight, 
  ArrowUpDown, FilterX 
} from 'lucide-react';
import { generateBadgeImage } from '@/lib/badge-generator';
import Link from 'next/link';
import { Participant, ParticipantStatus, PaginatedResponse, SortOrder } from '@/types';
import { formatDate } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pre_registered: { label: 'Pre-registro', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  confirmed: { label: 'Confirmado', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  checked_in: { label: 'Acreditado', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
};

export default function ParticipantsPage() {
  const [data, setData] = useState<PaginatedResponse<Participant> | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [club, setClub] = useState('');
  const [district, setDistrict] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(status && { status }),
        ...(club && { club }),
        ...(district && { district }),
      });

      const response = await api.get<PaginatedResponse<Participant>>(`/participants?${query.toString()}`);
      setData(response);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search, status, club, district]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, search ? 400 : 0); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC);
    } else {
      setSortBy(field);
      setSortOrder(SortOrder.ASC);
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setClub('');
    setDistrict('');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder(SortOrder.DESC);
  };

  const participants = data?.data || [];
  const meta = data?.meta;

  const SortableHeader = ({ label, field }: { label: string; field: string }) => (
    <th 
      className="text-left px-4 py-3 font-medium cursor-pointer transition-colors hover:text-white group"
      style={{ color: 'var(--color-text-muted)' }}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortBy === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
      </div>
    </th>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Participantes</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {meta?.total || 0} registrados en total
          </p>
        </div>
        <Link href="/participants/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
          <Plus className="w-4 h-4" /> Nuevo participante
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Nombre, email, documento, club..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-500 outline-none transition-all"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          />
        </div>
        
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <option value="">Todos los estados</option>
          <option value="pre_registered">Pre-registro</option>
          <option value="confirmed">Confirmado</option>
          <option value="checked_in">Acreditado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <div className="flex gap-2 lg:col-span-2">
          <input
            type="text"
            placeholder="Club"
            value={club}
            onChange={(e) => { setClub(e.target.value); setPage(1); }}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-500 outline-none transition-all"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          />
          <input
            type="text"
            placeholder="Distrito"
            value={district}
            onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
            className="w-24 px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-500 outline-none transition-all"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          />
          <button 
            onClick={clearFilters}
            className="p-2.5 rounded-xl transition-colors hover:bg-[var(--color-bg-elevated)]"
            title="Limpiar filtros"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <FilterX className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                <SortableHeader label="Código" field="registrationCode" />
                <SortableHeader label="Apellido" field="lastName" />
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Nombre</th>
                <SortableHeader label="Club" field="club" />
                <SortableHeader label="Distrito" field="district" />
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Tipo</th>
                <SortableHeader label="Estado" field="status" />
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 rounded animate-pulse" style={{ background: 'var(--color-bg-elevated)', width: '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20">
                    <p style={{ color: 'var(--color-text-muted)' }}>No se encontraron participantes con los filtros aplicados</p>
                  </td>
                </tr>
              ) : (
                participants.map((p) => {
                  const st = statusLabels[p.status] || statusLabels.pre_registered;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-[var(--color-bg-hover)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-4 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{p.registrationCode}</td>
                      <td className="px-4 py-4 font-medium text-white">{p.lastName}</td>
                      <td className="px-4 py-4">
                        <div className="text-white">{p.firstName}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.email}</div>
                      </td>
                      <td className="px-4 py-4" style={{ color: 'var(--color-text-secondary)' }}>{p.club || '—'}</td>
                      <td className="px-4 py-4" style={{ color: 'var(--color-text-secondary)' }}>{p.district || '—'}</td>
                      <td className="px-4 py-4" style={{ color: 'var(--color-text-secondary)' }}>{p.participantType}</td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium inline-block" style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
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
                                alert('Error al descargar credencial PDF');
                              }
                            }}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-elevated)]"
                            title="Descargar PDF">
                            <FileText className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                const qrBlob = await api.getPdf(`/participants/${p.id}/qr`);
                                const qrDataUrl = await new Promise<string>((resolve) => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => resolve(reader.result as string);
                                  reader.readAsDataURL(qrBlob);
                                });

                                const dataUrl = await generateBadgeImage({
                                  firstName: p.firstName,
                                  lastName: p.lastName,
                                  badgeName: p.badgeName || undefined,
                                  roleTitle: p.roleTitle || undefined,
                                  participantType: p.participantType,
                                  district: p.district || undefined,
                                  registrationCode: p.registrationCode,
                                  photoUrl: p.photoUrl || undefined,
                                  qrDataUrl: qrDataUrl,
                                });
                                
                                const a = document.createElement('a');
                                a.href = dataUrl;
                                a.download = `credencial-${p.registrationCode}.png`;
                                a.click();
                              } catch (err) {
                                console.error(err);
                                alert('Error al generar imagen de la credencial');
                              }
                            }}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-elevated)]"
                            title="Descargar Imagen (PNG)">
                            <ImageIcon className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
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

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.01)' }}>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Mostrando <span className="text-white">{participants.length}</span> de <span className="text-white">{meta.total}</span> participantes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-lg transition-all disabled:opacity-30 hover:bg-[var(--color-bg-elevated)]"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, meta.lastPage) }).map((_, i) => {
                  let pageNum = i + 1;
                  // Basic logic to show pages around current page if there are many
                  if (meta.lastPage > 5 && page > 3) {
                    pageNum = page - 2 + i;
                    if (pageNum + 2 > meta.lastPage) pageNum = meta.lastPage - 4 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${page === pageNum ? 'text-white' : 'text-gray-500 hover:text-white hover:bg-[var(--color-bg-elevated)]'}`}
                      style={page === pageNum ? { background: 'var(--color-accent)', boxShadow: '0 0 10px var(--color-accent-transparent)' } : {}}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                disabled={page === meta.lastPage || loading}
                className="p-2 rounded-lg transition-all disabled:opacity-30 hover:bg-[var(--color-bg-elevated)]"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
