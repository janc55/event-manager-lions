'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Download, Filter, FileSpreadsheet, FileText } from 'lucide-react';
import type { 
  ReportFilters, 
  ParticipantsReportResponse, 
  PaymentsReportResponse, 
  AttendanceReportResponse,
  DeliveriesReportResponse,
  DashboardReportResponse
} from '@/types';
import { formatDate, formatMoney } from '@/lib/utils';

type Tab = 'dashboard' | 'participants' | 'payments' | 'attendance' | 'deliveries';

const PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  pre_registered: 'Pre-registrado',
  confirmed: 'Confirmado',
  checked_in: 'Acreditado',
  cancelled: 'Cancelado',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
  waived: 'Exonerado',
};

const ATTENDANCE_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  activity: 'Por Actividad',
};

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  materials: 'Materiales',
  snack: 'Refrigerio',
  kit: 'Kit',
};

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardReportResponse | null>(null);
  const [participants, setParticipants] = useState<ParticipantsReportResponse | null>(null);
  const [payments, setPayments] = useState<PaymentsReportResponse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceReportResponse | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveriesReportResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.country) queryParams.set('country', filters.country);
      if (filters.district) queryParams.set('district', filters.district);
      if (filters.club) queryParams.set('club', filters.club);
      if (filters.participantType) queryParams.set('participantType', filters.participantType);
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.paymentStatus) queryParams.set('paymentStatus', filters.paymentStatus);
      if (filters.fromDate) queryParams.set('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.set('toDate', filters.toDate);
      if (filters.search) queryParams.set('search', filters.search);
      
      const query = queryParams.toString();
      const suffix = query ? `?${query}` : '';

      switch (tab) {
        case 'dashboard':
          const dashData = await api.get<DashboardReportResponse>('/reports/dashboard');
          setDashboard(dashData);
          break;
        case 'participants':
          const partData = await api.get<ParticipantsReportResponse>(`/reports/participants${suffix}`);
          setParticipants(partData);
          break;
        case 'payments':
          const payData = await api.get<PaymentsReportResponse>(`/reports/payments${suffix}`);
          setPayments(payData);
          break;
        case 'attendance':
          const attData = await api.get<AttendanceReportResponse>(`/reports/attendance${suffix}`);
          setAttendance(attData);
          break;
        case 'deliveries':
          const delData = await api.get<DeliveriesReportResponse>(`/reports/deliveries${suffix}`);
          setDeliveries(delData);
          break;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error fetching data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tab, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (format: 'csv' | 'excel') => {
    const endpoint = `/reports/${tab}/export/${format}`;
    const filename = `${tab}_${new Date().toISOString().split('T')[0]}`;
    
    const queryParams = new URLSearchParams();
    if (filters.country) queryParams.set('country', filters.country);
    if (filters.district) queryParams.set('district', filters.district);
    if (filters.club) queryParams.set('club', filters.club);
    if (filters.participantType) queryParams.set('participantType', filters.participantType);
    if (filters.status) queryParams.set('status', filters.status);
    if (filters.paymentStatus) queryParams.set('paymentStatus', filters.paymentStatus);
    if (filters.fromDate) queryParams.set('fromDate', filters.fromDate);
    if (filters.toDate) queryParams.set('toDate', filters.toDate);
    if (filters.search) queryParams.set('search', filters.search);
    
    const query = queryParams.toString();
    const suffix = query ? `?${query}` : '';
    
    const fullEndpoint = `${endpoint}${suffix}`;
    const extension = format === 'csv' ? 'csv' : 'xlsx';
    
    try {
      await api.downloadFile(fullEndpoint, `${filename}.${extension}`);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const tabs = [
    { key: 'dashboard' as Tab, label: 'Resumen' },
    { key: 'participants' as Tab, label: 'Participantes' },
    { key: 'payments' as Tab, label: 'Pagos' },
    { key: 'attendance' as Tab, label: 'Asistencia' },
    { key: 'deliveries' as Tab, label: 'Entregas' },
  ];

  const renderStatusBadge = (status: string, labels: Record<string, string>, colorMap: Record<string, string>) => (
    <span 
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ 
        backgroundColor: `${colorMap[status] || '#6b7280'}20`, 
        color: colorMap[status] || '#6b7280' 
      }}
    >
      {labels[status] || status}
    </span>
  );

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return (count / total) * 100;
  };

  const renderDashboard = () => {
    if (!dashboard) return null;
    
    const statusColors: Record<string, string> = {
      pre_registered: '#6b7280',
      confirmed: '#3b82f6',
      checked_in: '#22c55e',
      cancelled: '#ef4444',
      pending: '#f59e0b',
      partial: '#8b5cf6',
      paid: '#22c55e',
      waived: '#06b6d4',
    };

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Participantes</div>
            <div className="text-2xl font-bold text-white mt-1">{dashboard.totalParticipants}</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Pagos</div>
            <div className="text-2xl font-bold text-white mt-1">{formatMoney(dashboard.totalPaid)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              de {formatMoney(dashboard.totalExpected)}
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Asistencias</div>
            <div className="text-2xl font-bold text-white mt-1">{dashboard.totalAttendance}</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Entregas</div>
            <div className="text-2xl font-bold text-white mt-1">{dashboard.totalDeliveries}</div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Participants by Status */}
          <div className="p-5 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="font-semibold text-white mb-4">Participantes por Estado</h3>
            <div className="space-y-2">
              {Object.entries(dashboard.participantsByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {PARTICIPANT_STATUS_LABELS[status] || status}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${getPercentage(count, dashboard.totalParticipants)}%`,
                          backgroundColor: statusColors[status] || '#6b7280'
                        }}
                      />
                    </div>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payments by Status */}
          <div className="p-5 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="font-semibold text-white mb-4">Pagos por Estado</h3>
            <div className="space-y-2">
              {Object.entries(dashboard.paymentsByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {PAYMENT_STATUS_LABELS[status] || status}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${getPercentage(count, dashboard.totalPayments)}%`,
                          backgroundColor: statusColors[status] || '#6b7280'
                        }}
                      />
                    </div>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Participants by Country */}
          <div className="p-5 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="font-semibold text-white mb-4">Participantes por País</h3>
            <div className="space-y-2">
              {Object.entries(dashboard.participantsByCountry || {}).length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)' }}>Sin datos</p>
              ) : (
                Object.entries(dashboard.participantsByCountry || {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>{country}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Participants by Type */}
          <div className="p-5 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="font-semibold text-white mb-4">Participantes por Tipo</h3>
            <div className="space-y-2">
              {Object.entries(dashboard.participantsByType || {}).length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)' }}>Sin datos</p>
              ) : (
                Object.entries(dashboard.participantsByType || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>{type}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderParticipants = () => {
    if (!participants) return null;

    const statusColors: Record<string, string> = {
      pre_registered: '#6b7280',
      confirmed: '#3b82f6',
      checked_in: '#22c55e',
      cancelled: '#ef4444',
    };

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total</div>
            <div className="text-2xl font-bold text-white">{participants.total}</div>
          </div>
          {Object.entries(participants.summary?.byStatus || {}).map(([status, count]) => (
            <div key={status} className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{PARTICIPANT_STATUS_LABELS[status] || status}</div>
              <div className="text-2xl font-bold" style={{ color: statusColors[status] || '#fff' }}>{count}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Código', 'Nombre', 'Email', 'País', 'Club', 'Tipo', 'Estado'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Sin datos</td></tr>
                ) : participants.items.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--color-bg-hover)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{p.registrationCode}</td>
                    <td className="px-4 py-2.5 text-white">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.email}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.country}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.club || '—'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.participantType}</td>
                    <td className="px-4 py-2.5">{renderStatusBadge(p.status, PARTICIPANT_STATUS_LABELS, statusColors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
            Total: {participants.total} participantes
          </div>
        </div>
      </div>
    );
  };

  const renderPayments = () => {
    if (!payments) return null;

    const statusColors: Record<string, string> = {
      pending: '#f59e0b',
      partial: '#8b5cf6',
      paid: '#22c55e',
      waived: '#06b6d4',
    };

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Registros</div>
            <div className="text-2xl font-bold text-white">{payments.total}</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Esperado</div>
            <div className="text-xl font-bold text-white">{formatMoney(payments.totalExpected)}</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Pagado</div>
            <div className="text-xl font-bold text-white">{formatMoney(payments.totalPaid)}</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Saldo</div>
            <div className="text-xl font-bold text-white">{formatMoney(payments.totalBalance)}</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Porcentaje</div>
            <div className="text-xl font-bold text-white">
              {payments.totalExpected > 0 ? Math.round((payments.totalPaid / payments.totalExpected) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Participante', 'Concepto', 'Esperado', 'Pagado', 'Saldo', 'Estado'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Sin datos</td></tr>
                ) : payments.items.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--color-bg-hover)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2.5 text-white">{p.participant?.firstName} {p.participant?.lastName}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{p.concept}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{formatMoney(p.expectedAmount)}</td>
                    <td className="px-4 py-2.5 text-white font-medium">{formatMoney(p.paidAmount)}</td>
                    <td className="px-4 py-2.5 font-medium" style={{ color: Number(p.balance) > 0 ? '#ef4444' : '#22c55e' }}>
                      {formatMoney(p.balance)}
                    </td>
                    <td className="px-4 py-2.5">{renderStatusBadge(p.status, PAYMENT_STATUS_LABELS, statusColors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
            Total: {payments.total} registros · Pagado: {formatMoney(payments.totalPaid)} de {formatMoney(payments.totalExpected)}
          </div>
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    if (!attendance) return null;

    const typeColors: Record<string, string> = {
      general: '#3b82f6',
      activity: '#8b5cf6',
    };

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total</div>
            <div className="text-2xl font-bold text-white">{attendance.total}</div>
          </div>
          {Object.entries(attendance.summary?.byType || {}).map(([type, count]) => (
            <div key={type} className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{ATTENDANCE_TYPE_LABELS[type] || type}</div>
              <div className="text-2xl font-bold" style={{ color: typeColors[type] || '#fff' }}>{count}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Participante', 'Email', 'Tipo', 'Actividad', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendance.items.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Sin datos</td></tr>
                ) : attendance.items.map(a => (
                  <tr key={a.id} className="hover:bg-[var(--color-bg-hover)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2.5 text-white">{a.participant?.firstName} {a.participant?.lastName}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{a.participant?.email}</td>
                    <td className="px-4 py-2.5">{renderStatusBadge(a.attendanceType, ATTENDANCE_TYPE_LABELS, typeColors)}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{a.activity?.name || 'General'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(a.scannedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
            Total: {attendance.total} registros
          </div>
        </div>
      </div>
    );
  };

  const renderDeliveries = () => {
    if (!deliveries) return null;

    const typeColors: Record<string, string> = {
      materials: '#3b82f6',
      snack: '#f59e0b',
      kit: '#22c55e',
    };

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total</div>
            <div className="text-2xl font-bold text-white">{deliveries.total}</div>
          </div>
          {Object.entries(deliveries.summary?.byType || {}).map(([type, count]) => (
            <div key={type} className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{DELIVERY_TYPE_LABELS[type] || type}</div>
              <div className="text-2xl font-bold" style={{ color: typeColors[type] || '#fff' }}>{count}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Participante', 'Email', 'Tipo', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries.items.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Sin datos</td></tr>
                ) : deliveries.items.map(d => (
                  <tr key={d.id} className="hover:bg-[var(--color-bg-hover)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2.5 text-white">{d.participant?.firstName} {d.participant?.lastName}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{d.participant?.email}</td>
                    <td className="px-4 py-2.5">{renderStatusBadge(d.deliveryType, DELIVERY_TYPE_LABELS, typeColors)}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(d.deliveredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
            Total: {deliveries.total} registros
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <svg className="animate-spin h-8 w-8 mx-auto" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center">
          <div className="p-4 rounded-lg" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="font-medium" style={{ color: '#dc2626' }}>Error al cargar datos</p>
            <p className="text-sm mt-1" style={{ color: '#991b1b' }}>{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: '#dc2626' }}
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    switch (tab) {
      case 'dashboard': return renderDashboard();
      case 'participants': return renderParticipants();
      case 'payments': return renderPayments();
      case 'attendance': return renderAttendance();
      case 'deliveries': return renderDeliveries();
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Consultas, estadísticas y exportación de datos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-90"
            style={{ 
              background: showFilters ? 'rgba(184, 134, 11, 0.2)' : 'var(--color-bg-card)', 
              border: '1px solid var(--color-border)',
              color: showFilters ? 'var(--color-primary-light)' : 'var(--color-text-secondary)'
            }}
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={tab === 'dashboard'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              tab === 'dashboard' ? 'opacity-50 cursor-not-allowed' : 'text-white hover:opacity-90'
            }`}
            style={{ 
              background: tab === 'dashboard' ? 'var(--color-bg-secondary)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: '1px solid var(--color-border)'
            }}
            title={tab === 'dashboard' ? 'Exportación no disponible en dashboard' : ''}
          >
            <FileText className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={tab === 'dashboard'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              tab === 'dashboard' ? 'opacity-50 cursor-not-allowed' : 'text-white hover:opacity-90'
            }`}
            style={{ 
              background: tab === 'dashboard' ? 'var(--color-bg-secondary)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: '1px solid var(--color-border)'
            }}
            title={tab === 'dashboard' ? 'Exportación no disponible en dashboard' : ''}
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>País</label>
              <input
                type="text"
                value={filters.country || ''}
                onChange={(e) => setFilters({ ...filters, country: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'white' }}
                placeholder="Filtrar por país"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Distrito</label>
              <input
                type="text"
                value={filters.district || ''}
                onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'white' }}
                placeholder="Filtrar por distrito"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Club</label>
              <input
                type="text"
                value={filters.club || ''}
                onChange={(e) => setFilters({ ...filters, club: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'white' }}
                placeholder="Filtrar por club"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Tipo Participante</label>
              <input
                type="text"
                value={filters.participantType || ''}
                onChange={(e) => setFilters({ ...filters, participantType: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'white' }}
                placeholder="Ej: Delegado, Invitado"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Estado</label>
              <input
                type="text"
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'white' }}
                placeholder="pre_registered, confirmed..."
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Estado Pago</label>
              <input
                type="text"
                value={filters.paymentStatus || ''}
                onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'white' }}
                placeholder="pending, paid, partial..."
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Desde</label>
              <input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'white' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Hasta</label>
              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'white' }}
              />
            </div>
          </div>
          {(filters.country || filters.district || filters.club || filters.participantType || filters.status || filters.paymentStatus || filters.fromDate || filters.toDate) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({})}
                className="text-sm px-3 py-1 rounded"
                style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)' }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 rounded-xl p-1" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1"
            style={{
              background: tab === t.key ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.15), rgba(218, 165, 32, 0.1))' : 'transparent',
              color: tab === t.key ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              border: tab === t.key ? '1px solid rgba(184, 134, 11, 0.2)' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        {renderContent()}
      </div>
    </div>
  );
}