'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, CreditCard, CheckCircle2, Package, Coffee, ScanLine, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Participant, Payment, PaymentStatus } from '@/types';

interface Stats {
  totalParticipants: number;
  paid: number;
  pending: number;
  partial: number;
  totalAttendance: number;
  totalMaterials: number;
  totalSnacks: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalParticipants: 0, paid: 0, pending: 0, partial: 0,
    totalAttendance: 0, totalMaterials: 0, totalSnacks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [participants, payments, attendance, deliveries] = await Promise.all([
          api.get<Participant[]>('/participants'),
          api.get<Payment[]>('/payments'),
          api.get<{ total: number }>('/operations/attendance').catch(() => ({ total: 0 })),
          api.get<{ materials: number; snacks: number }>('/operations/deliveries').catch(() => ({ materials: 0, snacks: 0 })),
        ]);

        const paid = payments.filter((p) => p.status === ('paid' as PaymentStatus)).length;
        const pending = payments.filter((p) => p.status === ('pending' as PaymentStatus)).length;
        const partial = payments.filter((p) => p.status === ('partial' as PaymentStatus)).length;

        setStats({
          totalParticipants: Array.isArray(participants) ? participants.length : 0,
          paid,
          pending,
          partial,
          totalAttendance: typeof attendance === 'object' && 'total' in attendance ? attendance.total : (Array.isArray(attendance) ? (attendance as unknown[]).length : 0),
          totalMaterials: typeof deliveries === 'object' && 'materials' in deliveries ? deliveries.materials : (Array.isArray(deliveries) ? (deliveries as unknown[]).length : 0),
          totalSnacks: typeof deliveries === 'object' && 'snacks' in deliveries ? deliveries.snacks : 0,
        });
      } catch (e) {
        console.error('Error loading stats:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Participantes', value: stats.totalParticipants, icon: <Users className="w-6 h-6" />, color: '#3b82f6', href: '/participants' },
    { label: 'Pagados', value: stats.paid, icon: <CheckCircle2 className="w-6 h-6" />, color: '#22c55e', href: '/payments' },
    { label: 'Pendientes', value: stats.pending, icon: <CreditCard className="w-6 h-6" />, color: '#f59e0b', href: '/payments' },
    { label: 'Asistencias', value: stats.totalAttendance, icon: <ScanLine className="w-6 h-6" />, color: '#8b5cf6', href: '/operations/accreditation' },
    { label: 'Materiales', value: stats.totalMaterials, icon: <Package className="w-6 h-6" />, color: '#06b6d4', href: '/operations/materials' },
    { label: 'Refrigerios', value: stats.totalSnacks, icon: <Coffee className="w-6 h-6" />, color: '#ec4899', href: '/operations/snacks' },
  ];

  const quickActions = [
    { label: 'Acreditación Rápida', href: '/operations/accreditation', icon: <ScanLine className="w-5 h-5" />, desc: 'Escanear QR para asistencia general' },
    { label: 'Nuevo Participante', href: '/participants/new', icon: <Users className="w-5 h-5" />, desc: 'Registrar un nuevo participante' },
    { label: 'Registrar Pago', href: '/payments', icon: <CreditCard className="w-5 h-5" />, desc: 'Documentar pago de participante' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Panel de control — 75ª Convención Nacional
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link href={card.href} key={card.label}
            className="rounded-2xl p-5 transition-all duration-200 group hover:scale-[1.02]"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
            }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${card.color}15`, color: card.color }}>
                {card.icon}
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="text-3xl font-bold text-white">
              {loading ? (
                <div className="h-9 w-16 rounded-lg animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
              ) : card.value}
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Acceso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link href={action.href} key={action.label}
              className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02] group"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
              }}>
              <div className="flex items-center gap-3 mb-2">
                <span style={{ color: 'var(--color-primary-light)' }}>{action.icon}</span>
                <span className="font-medium text-white text-sm">{action.label}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
