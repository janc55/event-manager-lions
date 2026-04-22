'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Search, Plus, CheckCircle, XCircle, Eye, Edit2, ExternalLink } from 'lucide-react';
import type { Payment, CreatePaymentDto, ReviewPaymentDto, UpdatePaymentDto, PaymentStatus, Participant } from '@/types';
import { formatMoney, formatDate } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  partial: { label: 'Parcial', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  paid: { label: 'Pagado', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  waived: { label: 'Exonerado', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
};

export default function PaymentsPage() {
  const { isAdmin } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filtered, setFiltered] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReview, setShowReview] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePaymentDto>({ participantId: '', concept: 'Inscripción', expectedAmount: 0 });
  const [reviewForm, setReviewForm] = useState<ReviewPaymentDto>({ status: 'paid' as PaymentStatus });
  const [updateForm, setUpdateForm] = useState<UpdatePaymentDto>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      const [pays, parts] = await Promise.all([
        api.get<Payment[]>('/payments'),
        api.get<Participant[]>('/participants'),
      ]);
      setPayments(Array.isArray(pays) ? pays : []);
      setParticipants(Array.isArray(parts) ? parts : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let result = payments;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p) =>
        `${p.participant?.firstName} ${p.participant?.lastName}`.toLowerCase().includes(s) ||
        p.concept.toLowerCase().includes(s)
      );
    }
    if (statusFilter) result = result.filter((p) => p.status === statusFilter);
    setFiltered(result);
  }, [search, statusFilter, payments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payment = await api.post<Payment>('/payments', form);
      if (voucherFile) {
        await api.upload(`/payments/${payment.id}/voucher`, voucherFile);
      }
      setShowForm(false);
      setForm({ participantId: '', concept: 'Inscripción', expectedAmount: 0 });
      setVoucherFile(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setSaving(false); }
  };

  const handleReview = async () => {
    if (!showReview) return;
    setSaving(true);
    try {
      if (isAdmin) {
        await api.patch(`/payments/${showReview}`, updateForm);
        if (voucherFile) {
          await api.upload(`/payments/${showReview}/voucher`, voucherFile);
        }
      }
      await api.patch(`/payments/${showReview}/review`, reviewForm);
      setShowReview(null);
      setVoucherFile(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setSaving(false); }
  };

  const inputStyle = { background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pagos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{payments.length} registros</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
          <Plus className="w-4 h-4" /> Registrar pago
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input type="text" placeholder="Buscar por participante o concepto..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-500 outline-none"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="partial">Parcial</option>
          <option value="paid">Pagado</option>
          <option value="waived">Exonerado</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Participante', 'Concepto', 'Esperado', 'Pagado', 'Saldo', 'Estado', 'Fecha', 'Acciones'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{ background: 'var(--color-bg-elevated)', width: `${60 + j * 8}px` }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>Sin pagos registrados</td></tr>
            ) : (
              filtered.map((p) => {
                const ps = statusLabels[p.status] || statusLabels.pending;
                const bal = Number(p.expectedAmount) - Number(p.paidAmount);
                return (
                  <tr key={p.id} className="hover:bg-[var(--color-bg-hover)] transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3 text-white font-medium">{p.participant?.firstName} {p.participant?.lastName}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{p.concept}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{formatMoney(p.expectedAmount)}</td>
                    <td className="px-4 py-3 text-white font-medium">{formatMoney(p.paidAmount)}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: bal > 0 ? '#ef4444' : '#22c55e' }}>{formatMoney(bal)}</td>
                    <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ color: ps.color, background: ps.bg }}>{ps.label}</span></td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => {
                          setShowReview(p.id);
                          setReviewForm({ status: p.status as PaymentStatus, notes: p.notes || '' });
                          setUpdateForm({
                            concept: p.concept,
                            expectedAmount: Number(p.expectedAmount),
                            paidAmount: Number(p.paidAmount),
                            notes: p.notes || '',
                          });
                        }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-elevated)]" title={isAdmin ? "Editar" : "Ver detalles"}>
                          {isAdmin ? <Edit2 className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-fade-in" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-4">Registrar pago</h2>
            {error && <p className="text-sm mb-3" style={{ color: '#ef4444' }}>{error}</p>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Participante *</label>
                <select required value={form.participantId} onChange={(e) => setForm((f) => ({ ...f, participantId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer" style={inputStyle}>
                  <option value="">Seleccionar participante</option>
                  {participants.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.registrationCode}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Concepto *</label>
                <input required value={form.concept} onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Monto esperado *</label>
                  <input type="number" step="0.01" min="0" required value={form.expectedAmount || ''} onChange={(e) => setForm((f) => ({ ...f, expectedAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Monto pagado</label>
                  <input type="number" step="0.01" min="0" value={form.paidAmount || ''} onChange={(e) => setForm((f) => ({ ...f, paidAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Voucher</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setVoucherFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-[var(--color-bg-elevated)] file:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Notas</label>
                <textarea value={form.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none resize-none" style={inputStyle} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                  {saving ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review/Edit Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowReview(null)}>
          <div className="rounded-2xl p-6 w-full max-w-lg animate-fade-in" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{isAdmin ? 'Editar pago' : 'Detalles del pago'}</h2>
              <button onClick={() => setShowReview(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Concepto</label>
                  <input disabled={!isAdmin} value={updateForm.concept || ''} onChange={(e) => setUpdateForm(f => ({ ...f, concept: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-50" style={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Esperado</label>
                    <input type="number" step="0.01" disabled={!isAdmin} value={updateForm.expectedAmount || 0} onChange={(e) => setUpdateForm(f => ({ ...f, expectedAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-50" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Pagado</label>
                    <input type="number" step="0.01" disabled={!isAdmin} value={updateForm.paidAmount || 0} onChange={(e) => setUpdateForm(f => ({ ...f, paidAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-50" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado</label>
                  <select value={reviewForm.status} onChange={(e) => setReviewForm((f) => ({ ...f, status: e.target.value as PaymentStatus }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer" style={inputStyle}>
                    <option value="pending">Pendiente</option>
                    <option value="partial">Parcial</option>
                    <option value="paid">Pagado</option>
                    <option value="waived">Exonerado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Notas/Observaciones</label>
                  <textarea value={reviewForm.notes || ''} onChange={(e) => {
                    setReviewForm((f) => ({ ...f, notes: e.target.value }));
                    if (isAdmin) setUpdateForm(f => ({ ...f, notes: e.target.value }));
                  }}
                    rows={3} className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none resize-none" style={inputStyle} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Voucher</label>
                <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center relative group">
                  {payments.find(p => p.id === showReview)?.voucherFile ? (
                    <>
                      <img src={api.getFileUrl(payments.find(p => p.id === showReview)?.voucherFile)} alt="Voucher" className="w-full h-full object-contain" />
                      <a href={api.getFileUrl(payments.find(p => p.id === showReview)?.voucherFile)} target="_blank" rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 text-sm font-medium">
                        <ExternalLink className="w-4 h-4" /> Ver original
                      </a>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sin voucher adjunto</p>
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setVoucherFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--color-bg-elevated)] file:text-white" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-[var(--color-border)]">
              <button onClick={() => setShowReview(null)} className="px-4 py-2 rounded-xl text-sm" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancelar</button>
              <button onClick={handleReview} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                {saving ? 'Guardando...' : isAdmin ? 'Guardar cambios' : 'Confirmar revisión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
