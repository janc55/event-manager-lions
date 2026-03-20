'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Download, BarChart3, Users, CreditCard, ScanLine, Package } from 'lucide-react';
import type { Participant, Payment, AttendanceRecord, DeliveryRecord } from '@/types';
import { formatDate, formatMoney } from '@/lib/utils';

type Tab = 'participants' | 'payments' | 'attendance' | 'deliveries';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('participants');
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<unknown[]>([]);
  const [deliveries, setDeliveries] = useState<unknown[]>([]);

  useEffect(() => {
    setLoading(true);
    const endpoint = `/reports/${tab}`;
    api.get<unknown[]>(endpoint)
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        if (tab === 'participants') setParticipants(arr as Participant[]);
        else if (tab === 'payments') setPayments(arr as Payment[]);
        else if (tab === 'attendance') setAttendance(arr);
        else setDeliveries(arr);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  const exportCsv = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map((row) => keys.map((k) => `"${String(row[k] ?? '')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: 'participants' as Tab, label: 'Participantes', icon: <Users className="w-4 h-4" /> },
    { key: 'payments' as Tab, label: 'Pagos', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'attendance' as Tab, label: 'Asistencia', icon: <ScanLine className="w-4 h-4" /> },
    { key: 'deliveries' as Tab, label: 'Entregas', icon: <Package className="w-4 h-4" /> },
  ];

  const handleExport = () => {
    if (tab === 'participants') {
      exportCsv(participants.map((p) => ({ Código: p.registrationCode, Nombre: `${p.firstName} ${p.lastName}`, Email: p.email, País: p.country, Distrito: p.district || '', Club: p.club || '', Tipo: p.participantType, Estado: p.status, Requerimientos: p.specialRequirements || '' })), 'participantes');
    } else if (tab === 'payments') {
      exportCsv(payments.map((p) => ({ Participante: p.participant ? `${p.participant.firstName} ${p.participant.lastName}` : '', Concepto: p.concept, Esperado: p.expectedAmount, Pagado: p.paidAmount, Saldo: Number(p.expectedAmount) - Number(p.paidAmount), Estado: p.status, Fecha: p.createdAt })), 'pagos');
    } else {
      const data = tab === 'attendance' ? attendance : deliveries;
      exportCsv(data as Record<string, unknown>[], tab);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Consultas y exportación de datos</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-xl p-1" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center"
            style={{
              background: tab === t.key ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.15), rgba(218, 165, 32, 0.1))' : 'transparent',
              color: tab === t.key ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              border: tab === t.key ? '1px solid rgba(184, 134, 11, 0.2)' : '1px solid transparent',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        {loading ? (
          <div className="p-8 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : tab === 'participants' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Código', 'Nombre', 'Email', 'País', 'Club', 'Tipo', 'Estado'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Sin datos</td></tr>
                ) : participants.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--color-bg-hover)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{p.registrationCode}</td>
                    <td className="px-4 py-2.5 text-white">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.email}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.country}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.club || '—'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.participantType}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
              Total: {participants.length} participantes
            </div>
          </div>
        ) : tab === 'payments' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Participante', 'Concepto', 'Esperado', 'Pagado', 'Saldo', 'Estado'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Sin datos</td></tr>
                ) : payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--color-bg-hover)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2.5 text-white">{p.participant?.firstName} {p.participant?.lastName}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.concept}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{formatMoney(p.expectedAmount)}</td>
                    <td className="px-4 py-2.5 text-white font-medium">{formatMoney(p.paidAmount)}</td>
                    <td className="px-4 py-2.5 font-medium" style={{ color: Number(p.expectedAmount) - Number(p.paidAmount) > 0 ? '#ef4444' : '#22c55e' }}>
                      {formatMoney(Number(p.expectedAmount) - Number(p.paidAmount))}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
              Total: {payments.length} registros · Recaudado: {formatMoney(payments.reduce((s, p) => s + Number(p.paidAmount), 0))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>Datos</th>
                </tr>
              </thead>
              <tbody>
                {(tab === 'attendance' ? attendance : deliveries).length === 0 ? (
                  <tr><td className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Sin datos</td></tr>
                ) : (tab === 'attendance' ? attendance : deliveries).map((r, i) => (
                  <tr key={i} className="hover:bg-[var(--color-bg-hover)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2.5 text-sm text-white">
                      <pre className="whitespace-pre-wrap font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {JSON.stringify(r, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
              Total: {(tab === 'attendance' ? attendance : deliveries).length} registros
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
