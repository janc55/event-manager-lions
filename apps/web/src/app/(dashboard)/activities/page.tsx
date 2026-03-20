'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Pencil, Calendar, MapPin, Users as UsersIcon, X, Save } from 'lucide-react';
import type { Activity, CreateActivityDto, ActivityStatus } from '@/types';
import { formatDate } from '@/lib/utils';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Borrador', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' },
  active: { label: 'Activa', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  closed: { label: 'Cerrada', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateActivityDto>({
    name: '', date: '', startTime: '', location: '', activityType: 'plenaria',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    api.get<Activity[]>('/activities')
      .then((d) => setActivities(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', date: '', startTime: '', location: '', activityType: 'plenaria' });
    setShowForm(true);
  };

  const openEdit = (a: Activity) => {
    setEditId(a.id);
    setForm({ name: a.name, description: a.description || '', date: a.date, startTime: a.startTime, endTime: a.endTime || '', location: a.location, capacity: a.capacity || undefined, activityType: a.activityType, status: a.status });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await api.patch(`/activities/${editId}`, form);
      } else {
        await api.post('/activities', form);
      }
      setShowForm(false);
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
          <h1 className="text-2xl font-bold text-white">Actividades</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{activities.length} actividades registradas</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
          <Plus className="w-4 h-4" /> Nueva actividad
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <div className="h-5 w-3/4 rounded" style={{ background: 'var(--color-bg-elevated)' }} />
              <div className="h-4 w-1/2 rounded mt-3" style={{ background: 'var(--color-bg-elevated)' }} />
              <div className="h-4 w-2/3 rounded mt-2" style={{ background: 'var(--color-bg-elevated)' }} />
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="col-span-full text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No hay actividades registradas</p>
          </div>
        ) : (
          activities.map((a) => {
            const st = statusLabels[a.status] || statusLabels.draft;
            return (
              <div key={a.id} className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold">{a.name}</h3>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-medium shrink-0" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                </div>
                {a.description && <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{a.description}</p>}
                <div className="space-y-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{formatDate(a.date)} · {a.startTime}{a.endTime ? ` — ${a.endTime}` : ''}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{a.location}</div>
                  {a.capacity && <div className="flex items-center gap-2"><UsersIcon className="w-3.5 h-3.5" />Cupo: {a.capacity}</div>}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>{a.activityType}</span>
                  <button onClick={() => openEdit(a)} className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-elevated)]" title="Editar">
                    <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-fade-in" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-4">{editId ? 'Editar actividad' : 'Nueva actividad'}</h2>
            {error && <p className="text-sm mb-3" style={{ color: '#ef4444' }}>{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nombre *</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Descripción</label>
                <textarea value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none resize-none" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Fecha *</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Hora inicio *</label>
                  <input type="time" required value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Hora fin</label>
                  <input type="time" value={form.endTime || ''} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Cupo</label>
                  <input type="number" min="0" value={form.capacity || ''} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || undefined }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Lugar *</label>
                <input required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tipo *</label>
                  <select value={form.activityType} onChange={(e) => setForm((f) => ({ ...f, activityType: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer" style={inputStyle}>
                    <option value="plenaria">Plenaria</option>
                    <option value="sesion">Sesión</option>
                    <option value="taller">Taller</option>
                    <option value="cena">Cena</option>
                    <option value="reunion">Reunión</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                {editId && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado</label>
                    <select value={form.status || 'draft'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ActivityStatus }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer" style={inputStyle}>
                      <option value="draft">Borrador</option>
                      <option value="active">Activa</option>
                      <option value="closed">Cerrada</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
                  <Save className="w-4 h-4" /> {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
