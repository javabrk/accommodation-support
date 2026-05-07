'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Ticket, FileText, LogOut,
  Menu, X, ClipboardCheck, PoundSterling,
} from 'lucide-react';
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { clearTokens, clearUser, getUser, getRefreshToken } from '@/lib/auth';
import toast from 'react-hot-toast';

const links = [
  { href: '/admin/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/clients',    label: 'Clients',      icon: Users           },
  { href: '/admin/properties', label: 'Properties',   icon: Building2       },
  { href: '/admin/payments',   label: 'Payments',     icon: PoundSterling   },
  { href: '/admin/checklists', label: 'Checklists',   icon: ClipboardCheck  },
  { href: '/admin/tickets',    label: 'Tickets',      icon: Ticket          },
  { href: '/admin/reports',    label: 'Reports',      icon: FileText        },
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
    <div className="space-y-0.5 px-3">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} onClick={onNav}
            className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={active ? {
              background: 'rgba(201,168,92,0.12)',
              color: 'var(--gold)',
              borderLeft: '2px solid var(--gold)',
            } : {
              color: 'var(--text-muted)',
              borderLeft: '2px solid transparent',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <Icon className="w-4 h-4 flex-shrink-0" style={active ? { color: 'var(--gold)' } : {}}/>
            <span className="flex-1">{label}</span>
            {active && (
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--gold)' }}/>
            )}
          </Link>
        );
      })}
    </div>
  );

  const SidebarInner = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'rgba(201,168,92,0.12)', border: '1px solid rgba(201,168,92,0.25)' }}>
            🏠
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>SupportHome</p>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mt-0.5" style={{ color: 'var(--gold)', opacity: 0.7 }}>Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 mb-5 h-px" style={{ background: 'var(--border)' }}/>

      {/* Nav label */}
      <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Navigation</p>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto">
        <NavLinks onNav={mobile ? () => setOpen(false) : undefined}/>
      </nav>

      {/* Divider */}
      <div className="mx-5 mt-5 mb-4 h-px" style={{ background: 'var(--border)' }}/>

      {/* User block */}
      <div className="px-3 pb-6">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
            style={{ background: 'rgba(201,168,92,0.15)', color: 'var(--gold)', border: '1px solid rgba(201,168,92,0.3)' }}>
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text)' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
          <LogOut className="w-4 h-4"/>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-[var(--sidebar-w)] min-h-screen flex-shrink-0"
        style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--border)' }}>
        <SidebarInner />
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4"
        style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🏠</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>SupportHome</span>
        </div>
        <button onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
          {open ? <X className="w-4 h-4"/> : <Menu className="w-4 h-4"/>}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}/>
          <div className="relative w-72 flex flex-col pt-14"
            style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--border)' }}>
            <SidebarInner mobile/>
          </div>
        </div>
      )}
    </>
  );
}
