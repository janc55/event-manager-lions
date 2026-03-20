'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  ScanLine,
  BarChart3,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Ticket,
  Package,
  Coffee,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Participantes', href: '/participants', icon: <Users className="w-5 h-5" /> },
  { label: 'Pagos', href: '/payments', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Actividades', href: '/activities', icon: <Calendar className="w-5 h-5" /> },
];

const operationsNav: NavItem[] = [
  { label: 'Acreditación', href: '/operations/accreditation', icon: <ScanLine className="w-5 h-5" /> },
  { label: 'Actividades', href: '/operations/activity-scan', icon: <Ticket className="w-5 h-5" /> },
  { label: 'Materiales', href: '/operations/materials', icon: <Package className="w-5 h-5" /> },
  { label: 'Refrigerios', href: '/operations/snacks', icon: <Coffee className="w-5 h-5" /> },
];

const adminNav: NavItem[] = [
  { label: 'Reportes', href: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Usuarios', href: '/users', icon: <UserCog className="w-5 h-5" />, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    if (item.adminOnly && !isAdmin) return null;
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
        style={{
          background: active ? 'linear-gradient(135deg, rgba(184, 134, 11, 0.15), rgba(218, 165, 32, 0.1))' : 'transparent',
          color: active ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
          border: active ? '1px solid rgba(184, 134, 11, 0.2)' : '1px solid transparent',
        }}
        title={collapsed ? item.label : undefined}
      >
        <span style={{ color: active ? 'var(--color-primary-light)' : 'var(--color-text-muted)' }}
          className="group-hover:text-[var(--color-primary-light)] transition-colors">
          {item.icon}
        </span>
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40"
      style={{
        width: collapsed ? '72px' : '260px',
        background: 'var(--color-bg-card)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">Convención 75</p>
            <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>Club de Leones</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--color-text-muted)' }}>Principal</p>}
          <div className="space-y-1">
            {mainNav.map((item) => <NavLink key={item.href} item={item} />)}
          </div>
        </div>

        <div>
          {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--color-text-muted)' }}>Operaciones</p>}
          <div className="space-y-1">
            {operationsNav.map((item) => <NavLink key={item.href} item={item} />)}
          </div>
        </div>

        <div>
          {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--color-text-muted)' }}>Administración</p>}
          <div className="space-y-1">
            {adminNav.map((item) => <NavLink key={item.href} item={item} />)}
          </div>
        </div>
      </nav>

      {/* User / Collapse */}
      <div className="shrink-0 px-3 py-3 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #b8860b, #daa520)' }}>
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
              <p className="text-[10px] capitalize truncate" style={{ color: 'var(--color-text-muted)' }}>{user.role}</p>
            </div>
          </div>
        )}
        <div className="flex gap-1">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 flex-1"
            style={{ color: 'var(--color-error)' }}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && 'Salir'}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl transition-all duration-200"
            style={{ color: 'var(--color-text-muted)' }}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
