'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Download, QrCode, RefreshCw, Pencil, Save, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import type { Participant, Payment, CreateParticipantDto } from '@/types';
import { formatDate, formatMoney } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pre_registered: { label: 'Pre-registro', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  confirmed: { label: 'Confirmado', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  checked_in: { label: 'Acreditado', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
};

const paymentStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  partial: { label: 'Parcial', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  paid: { label: 'Pagado', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  waived: { label: 'Exonerado', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
};

export default function ParticipantDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editing, setEditing] = useState(searchParams.get('edit') === 'true');
  const [form, setForm] = useState<Partial<CreateParticipantDto>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<Participant>(`/participants/${id}`),
      api.get<Payment[]>('/payments').then((all) =>
        Array.isArray(all) ? all.filter((p) => p.participantId === id) : []
      ).catch(() => []),
    ]).then(([p, pays]) => {
      setParticipant(p);
      setPayments(pays);
      setForm({
        firstName: p.firstName, lastName: p.lastName, badgeName: p.badgeName || '',
        documentNumber: p.documentNumber || '', country: p.country, district: p.district || '',
        club: p.club || '', roleTitle: p.roleTitle || '', email: p.email, phone: p.phone || '',
        participantType: p.participantType, specialRequirements: p.specialRequirements || '',
        notes: p.notes || '', lionNumber: p.lionNumber || '', photoUrl: p.photoUrl || '',
      });

      // Fetch QR image
      api.getPdf(`/participants/${id}/qr`)
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setQrUrl(url);
        })
        .catch(err => console.error('Error loading QR image:', err));

    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.patch<Participant>(`/participants/${id}`, form);
      setParticipant(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!confirm('¿Regenerar QR? El anterior dejará de funcionar.')) return;
    try {
      const updated = await api.post<Participant>(`/participants/${id}/regenerate-qr`);
      setParticipant(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al regenerar QR');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar los 2MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const res = await api.upload<{ url: string }>('/media/upload', file);
      setForm((prev) => ({ ...prev, photoUrl: res.url }));
    } catch (err) {
      setError('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setForm((prev) => ({ ...prev, photoUrl: '' }));
  };

  const handleDownloadBadge = async () => {
    try {
      const blob = await api.getPdf(`/participants/${id}/badge`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credencial-${participant?.registrationCode || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar credencial');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  if (!participant) return <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>Participante no encontrado</p>;

  const st = statusLabels[participant.status] || statusLabels.pre_registered;
  const inputStyle = { background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.paidAmount), 0);
  const totalExpected = payments.reduce((sum, p) => sum + Number(p.expectedAmount), 0);
  const balance = totalExpected - totalPaid;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/participants" className="p-2 rounded-xl transition-colors hover:bg-[var(--color-bg-card)]">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{participant.firstName} {participant.lastName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>{participant.registrationCode}</span>
              {participant.lionNumber && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ color: 'var(--color-primary-light)', background: 'rgba(218, 165, 32, 0.1)' }}>
                  🦁 {participant.lionNumber}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium" style={{ color: st.color, background: st.bg }}>{st.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                <X className="w-4 h-4" />
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                <Pencil className="w-4 h-4" /> Editar
              </button>
              <button onClick={handleRegenerateQr}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                <RefreshCw className="w-4 h-4" /> Regenerar QR
              </button>
              <button onClick={handleDownloadBadge}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                <Download className="w-4 h-4" /> Credencial PDF
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Datos personales</h2>
              {participant.photoUrl && !editing && (
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2" style={{ borderColor: 'var(--color-border)' }}>
                  <img src={api.getFileUrl(participant.photoUrl)} alt="Foto" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Nombres', key: 'firstName' },
                  { label: 'Apellidos', key: 'lastName' },
                  { label: 'Credencial', key: 'badgeName' },
                  { label: 'Documento', key: 'documentNumber' },
                  { label: 'Email', key: 'email' },
                  { label: 'Celular', key: 'phone' },
                  { label: 'País', key: 'country' },
                  { label: 'Distrito', key: 'district' },
                  { label: 'Club', key: 'club' },
                  { label: 'Cargo', key: 'roleTitle' },
                  { label: 'Número de León', key: 'lionNumber' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{f.label}</label>
                    <input value={(form as Record<string, string>)[f.key] || ''} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none" style={inputStyle} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Foto del participante</label>
                  <div className="flex items-center gap-4">
                    {form.photoUrl ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2" style={{ borderColor: 'var(--color-border)' }}>
                        <img src={api.getFileUrl(form.photoUrl)} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={removePhoto}
                          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors"
                        style={{ borderColor: 'var(--color-border)' }}>
                        <ImageIcon className="w-8 h-8 mb-1" style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-[10px] text-center" style={{ color: 'var(--color-text-muted)' }}>Subir foto</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                      </label>
                    )}
                    <div className="text-[10px] space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                      <p>Máximo 2MB</p>
                      <p>Formatos: JPG, PNG</p>
                      {uploading && <p className="text-[var(--color-primary-light)] animate-pulse font-medium">Subiendo...</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                {[
                  { label: 'Email', value: participant.email },
                  { label: 'Celular', value: participant.phone || '—' },
                  { label: 'Documento', value: participant.documentNumber || '—' },
                  { label: 'País', value: participant.country },
                  { label: 'Distrito', value: participant.district || '—' },
                  { label: 'Club', value: participant.club || '—' },
                  { label: 'Cargo', value: participant.roleTitle || '—' },
                  { label: 'Tipo', value: participant.participantType },
                  { label: 'Credencial', value: participant.badgeName || participant.firstName + ' ' + participant.lastName },
                  { label: 'Número de León', value: participant.lionNumber || '—' },
                  { label: 'Registro', value: formatDate(participant.createdAt) },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.label}</p>
                    <p className="text-sm text-white font-medium">{f.value}</p>
                  </div>
                ))}
              </div>
            )}
            {participant.specialRequirements && (
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#f59e0b' }}>Requerimientos especiales</p>
                <p className="text-sm text-white">{participant.specialRequirements}</p>
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-primary-light)' }}>Historial de pagos</h2>
            {payments.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>Sin pagos registrados</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Concepto', 'Esperado', 'Pagado', 'Estado', 'Fecha'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const ps = paymentStatusLabels[p.status] || paymentStatusLabels.pending;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td className="px-3 py-2 text-white">{p.concept}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--color-text-secondary)' }}>{formatMoney(p.expectedAmount)}</td>
                        <td className="px-3 py-2 text-white font-medium">{formatMoney(p.paidAmount)}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-medium" style={{ color: ps.color, background: ps.bg }}>{ps.label}</span>
                        </td>
                        <td className="px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>{formatDate(p.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR */}
          <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary-light)' }}>Código QR</h3>
            <div className="w-40 h-40 mx-auto rounded-xl flex items-center justify-center p-2" style={{ background: 'white' }}>
              {qrUrl ? (
                <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-24 h-24 text-gray-300 animate-pulse" />
              )}
            </div>
            <p className="text-xs font-mono mt-3 break-all" style={{ color: 'var(--color-text-muted)' }}>{participant.qrCode}</p>
          </div>

          {/* Financial summary */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-primary-light)' }}>Estado financiero</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total esperado</span>
                <span className="text-sm text-white font-medium">{formatMoney(totalExpected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total pagado</span>
                <span className="text-sm font-medium" style={{ color: '#22c55e' }}>{formatMoney(totalPaid)}</span>
              </div>
              <div className="h-px" style={{ background: 'var(--color-border)' }} />
              <div className="flex justify-between">
                <span className="text-sm font-medium text-white">Saldo</span>
                <span className="text-sm font-bold" style={{ color: balance > 0 ? '#ef4444' : '#22c55e' }}>
                  {formatMoney(balance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
