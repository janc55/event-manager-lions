'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import type { CreateParticipantDto } from '@/types';

export default function NewParticipantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateParticipantDto>({
    firstName: '', lastName: '', country: '', email: '', participantType: 'delegado',
  });

  const set = (field: keyof CreateParticipantDto, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/participants', form);
      router.push('/participants');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear participante');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/participants" className="p-2 rounded-xl transition-colors hover:bg-[var(--color-bg-card)]">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nuevo Participante</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Registrar un nuevo participante</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl p-6 space-y-5"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-light)' }}>Datos personales</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Nombres *</label>
              <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Apellidos *</label>
              <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Nombre para credencial</label>
              <input value={form.badgeName || ''} onChange={(e) => set('badgeName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle}
                placeholder="Nombre que aparecerá en la credencial (opcional)" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Documento de identidad</label>
              <input value={form.documentNumber || ''} onChange={(e) => set('documentNumber', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email *</label>
              <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Celular</label>
              <input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
            </div>
          </div>

          <p className="text-sm font-semibold pt-4" style={{ color: 'var(--color-primary-light)' }}>Datos de la organización</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>País *</label>
              <input required value={form.country} onChange={(e) => set('country', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Distrito</label>
              <input value={form.district || ''} onChange={(e) => set('district', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Club</label>
              <input value={form.club || ''} onChange={(e) => set('club', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Cargo / Rol</label>
              <input value={form.roleTitle || ''} onChange={(e) => set('roleTitle', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Tipo de participante *</label>
              <select value={form.participantType} onChange={(e) => set('participantType', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer" style={inputStyle}>
                <option value="delegado">Delegado</option>
                <option value="invitado">Invitado</option>
                <option value="acompanante">Acompañante</option>
                <option value="organizador">Organizador</option>
                <option value="prensa">Prensa</option>
              </select>
            </div>
          </div>

          <p className="text-sm font-semibold pt-4" style={{ color: 'var(--color-primary-light)' }}>Información adicional</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Requerimientos especiales</label>
              <textarea value={form.specialRequirements || ''} onChange={(e) => set('specialRequirements', e.target.value)}
                rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none resize-none" style={inputStyle}
                placeholder="Dieta especial, accesibilidad, etc." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Observaciones</label>
              <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)}
                rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none resize-none" style={inputStyle} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/participants"
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            Cancelar
          </Link>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar participante'}
          </button>
        </div>
      </form>
    </div>
  );
}
