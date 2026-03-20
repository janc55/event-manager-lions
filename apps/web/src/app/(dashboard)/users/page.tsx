'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Pencil, Shield, Save, X } from 'lucide-react';
import type { User, CreateUserDto, UpdateUserDto, UserRole } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateUserDto & { isActive?: boolean }>({ fullName: '', email: '', password: '', role: 'operator' as UserRole });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    api.get<User[]>('/users')
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (!isAdmin) return (
    <div className="text-center py-16">
      <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
      <p className="text-white font-medium">Acceso restringido</p>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Solo administradores pueden gestionar usuarios</p>
    </div>
  );

  const openCreate = () => {
    setEditId(null);
    setForm({ fullName: '', email: '', password: '', role: 'operator' as UserRole });
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditId(u.id);
    setForm({ fullName: u.fullName, email: u.email, password: '', role: u.role, isActive: u.isActive });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) {
        const update: UpdateUserDto = { fullName: form.fullName, email: form.email, role: form.role, isActive: form.isActive };
        if (form.password) update.password = form.password;
        await api.patch(`/users/${editId}`, update);
      } else {
        await api.post('/users', form);
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
          <h1 className="text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Gestión de usuarios internos</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Nombre', 'Email', 'Rol', 'Estado', 'Creado', 'Acciones'].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{ background: 'var(--color-bg-elevated)', width: '80px' }} /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>Sin usuarios</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--color-bg-hover)] transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: u.role === 'admin' ? 'linear-gradient(135deg, #b8860b, #daa520)' : 'var(--color-bg-elevated)' }}>
                        {u.fullName.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize"
                      style={{
                        color: u.role === 'admin' ? '#b8860b' : '#3b82f6',
                        background: u.role === 'admin' ? 'rgba(184, 134, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ color: u.isActive ? '#22c55e' : '#ef4444', background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-muted)' }}>{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-bg-elevated)]" title="Editar">
                      <Pencil className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-fade-in" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-4">{editId ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            {error && <p className="text-sm mb-3" style={{ color: '#ef4444' }}>{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nombre completo *</label>
                <input required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Email *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{editId ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                <input type="password" required={!editId} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Rol</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer" style={inputStyle}>
                    <option value="operator">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                {editId && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado</label>
                    <select value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer" style={inputStyle}>
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
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
