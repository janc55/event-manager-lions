'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Upload, X, ImageIcon, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import type { CreateParticipantDto, Activity } from '@/types';
import { RegistrationType } from '@/types';
import { useEffect } from 'react';
import { formatDate } from '@/lib/utils';

export default function NewParticipantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateParticipantDto>({
    firstName: '', lastName: '', country: '', email: '', participantType: 'delegado',
    lionNumber: '', photoUrl: '', registrationType: RegistrationType.FULL,
    accessRights: [],
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    api.get<Activity[]>('/activities').then(setActivities).catch(console.error);
  }, []);

  const set = (field: keyof CreateParticipantDto, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleActivity = (id: string) => {
    const current = form.accessRights || [];
    if (current.includes(id)) {
      set('accessRights', current.filter((a) => a !== id));
    } else {
      set('accessRights', [...current, id]);
    }
  };

  const calculatePrice = () => {
    const isSocio = form.participantType.toLowerCase().includes('socio') || form.participantType.toLowerCase().includes('león') || form.participantType === 'delegado';
    if (form.registrationType === RegistrationType.FULL) return isSocio ? 660 : 750;
    const count = form.accessRights?.length || 0;
    if (count === 0) return 0;
    if (isSocio) {
      if (count === 1) return 260;
      if (count === 2) return 500;
      return 660;
    } else {
      if (count === 1) return 290;
      if (count === 2) return 560;
      return 750;
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

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const res = await api.upload<{ url: string }>('/media/upload', file);
      set('photoUrl', res.url);
    } catch (err) {
      setError('Error al subir imagen');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    set('photoUrl', '');
    setPreview(null);
  };

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
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>ID/Número de León</label>
              <input value={form.lionNumber || ''} onChange={(e) => set('lionNumber', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle}
                placeholder="Número de membresía" />
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
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Tipo de registro *</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => set('registrationType', RegistrationType.FULL)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all border"
                  style={{ 
                    background: form.registrationType === RegistrationType.FULL ? 'rgba(218, 165, 32, 0.1)' : 'var(--color-bg-elevated)',
                    borderColor: form.registrationType === RegistrationType.FULL ? 'var(--color-primary-light)' : 'var(--color-border)',
                    color: form.registrationType === RegistrationType.FULL ? 'var(--color-primary-light)' : 'var(--color-text-secondary)'
                  }}>
                  {form.registrationType === RegistrationType.FULL ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  Completo
                </button>
                <button type="button" onClick={() => set('registrationType', RegistrationType.PARTIAL)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all border"
                  style={{ 
                    background: form.registrationType === RegistrationType.PARTIAL ? 'rgba(218, 165, 32, 0.1)' : 'var(--color-bg-elevated)',
                    borderColor: form.registrationType === RegistrationType.PARTIAL ? 'var(--color-primary-light)' : 'var(--color-border)',
                    color: form.registrationType === RegistrationType.PARTIAL ? 'var(--color-primary-light)' : 'var(--color-text-secondary)'
                  }}>
                  {form.registrationType === RegistrationType.PARTIAL ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  Parcial (Eventos)
                </button>
              </div>
            </div>
          </div>

          {form.registrationType === RegistrationType.PARTIAL && (
            <div className="space-y-3 pt-2 animate-slide-up">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Seleccionar Actividades *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activities.map((activity) => (
                  <button key={activity.id} type="button" onClick={() => toggleActivity(activity.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={{ 
                      background: form.accessRights?.includes(activity.id) ? 'rgba(255, 255, 255, 0.05)' : 'var(--color-bg-elevated)',
                      borderColor: form.accessRights?.includes(activity.id) ? 'var(--color-primary-light)' : 'var(--color-border)',
                    }}>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${form.accessRights?.includes(activity.id) ? 'bg-[var(--color-primary-light)] border-[var(--color-primary-light)]' : 'border-[var(--color-border)]'}`}>
                      {form.accessRights?.includes(activity.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{activity.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{formatDate(activity.date)} {activity.startTime}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-4 rounded-xl" 
              style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Costo estimado de inscripción</p>
                <p className="text-lg font-bold text-white">Bs. {calculatePrice().toLocaleString()}</p>
              </div>
              {form.registrationType === RegistrationType.PARTIAL && (
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Eventos seleccionados</p>
                  <p className="text-sm font-medium text-[var(--color-primary-light)]">{form.accessRights?.length || 0} de {activities.length}</p>
                </div>
              )}
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Foto del participante</label>
              <div className="flex items-center gap-4">
                {preview || form.photoUrl ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2" style={{ borderColor: 'var(--color-border)' }}>
                    <img src={preview || api.getFileUrl(form.photoUrl)} alt="Preview" className="w-full h-full object-cover" />
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
                <div className="text-xs space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                  <p>Máximo 2MB</p>
                  <p>Formatos: JPG, PNG</p>
                  {uploading && <p className="text-[var(--color-primary-light)] animate-pulse font-medium">Subiendo...</p>}
                </div>
              </div>
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
