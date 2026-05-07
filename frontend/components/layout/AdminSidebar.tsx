'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Ticket, FileText, LogOut,
  Menu, X, ClipboardCheck, PoundSterling, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { clearTokens, clearUser, getUser, getRefreshToken } from '@/lib/auth';
import toast from 'react-hot-toast';

const links = [
  { href: '/admin/dashboard',  label: 'Dashboard',   icon: LayoutDashboard, color: 'text-blue-400'   },
  { href: '/admin/clients',    label: 'Clients',      icon: Users,           color: 'text-violet-400' },
  { href: '/admin/properties', label: 'Properties',   icon: Building2,       color: 'text-teal-400'   },
  { href: '/admin/payments',   label: 'Payments',     icon: PoundSterling,   color: 'text-amber-400'  },
  { href: '/admin/checklists', label: 'Checklists',   icon: ClipboardCheck,  color: 'text-green-400'  },
  { href: '/admin/tickets',    label: 'Tickets',      icon: Ticket,          color: 'text-orange-400' },
  { href: '/admin/reports',    label: 'Reports',      icon: FileText,        color: 'text-pink-400'   },
];

function getInitials(first?: string, last?: string) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'A';
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const user = getUser();

  const handleLogout = async () => {
    try { await authAPI.logout(getRefreshToken() || ''); } catch {}
    clearTokens(); clearUser();
    toast.success('Logged out');
    router.push('/login');
  };

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <div className="space-y-0.5">
      {links.map(({ href, label, icon: Icon, color }, i) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} onClick={onNav}
            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              active
                ? 'text-white nav-active-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={active ? {
              background: 'linear-gradient(90deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.06) 100%)',
              borderLeft: '3px solid rgba(255,255,255,0.5)',
            } : { animationDelay: `${i * 40}ms` }}>

            {/* Icon container */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
            }`}>
              <Icon className={`w-4 h-4 ${active ? 'text-white' : color}`} />
            </div>

            <span className="flex-1">{label}</span>
            {active && <ChevronRight className="w-3.5 h-3.5 opacity-60"/>}

            {/* Hover glow */}
            {!active && (
              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(255,255,255,0.04)' }}/>
            )}
          </Link>
        );
      })}
    </div>
  );

  const SidebarInner = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 0 16px rgba(37,99,235,0.45)' }}>
            🏠
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight">SupportHome</p>
            <p className="text-slate-400 text-[11px] font-medium tracking-wide">ADMIN PORTAL</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}/>

      {/* Nav label */}
      <p className="px-5 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Menu</p>

      {/* Links */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
        <NavLinks onNav={mobile ? () => setOpen(false) : undefined}/>
      </nav>

      {/* Divider */}
      <div className="mx-4 mt-4 mb-3 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}/>

      {/* User block */}
      <div className="px-3 pb-5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs text-white"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-200 hover:bg-white/6 transition-all duration-150">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <LogOut className="w-3.5 h-3.5"/>
          </div>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen flex-shrink-0 relative"
        style={{ background: 'var(--sidebar-bg)' }}>
        {/* Subtle window-pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 40px)' }}/>
        <div className="relative z-10 flex flex-col h-full"><SidebarInner /></div>
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b border-white/8"
        style={{ background: 'var(--sidebar-bg)' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏠</span>
          <span className="text-white font-bold text-sm">SupportHome</span>
        </div>
        <button onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          {open ? <X className="w-4 h-4"/> : <Menu className="w-4 h-4"/>}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}/>
          <div className="relative w-72 flex flex-col pt-14" style={{ background: 'var(--sidebar-bg)' }}>
            <SidebarInner mobile/>
          </div>
        </div>
      )}
    </>
  );
}
