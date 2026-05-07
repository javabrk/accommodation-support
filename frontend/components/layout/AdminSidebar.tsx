'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Ticket, FileText, LogOut, Home, Menu, X, ClipboardCheck, ChevronRight, PoundSterling,
} from 'lucide-react';
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { clearTokens, clearUser, getUser, getRefreshToken } from '@/lib/auth';
import toast from 'react-hot-toast';

const links = [
  { href: '/admin/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/clients',      label: 'Clients',      icon: Users           },
  { href: '/admin/properties',   label: 'Properties',   icon: Building2       },
  { href: '/admin/payments',     label: 'Payments',     icon: PoundSterling   },
  { href: '/admin/checklists',   label: 'Checklists',   icon: ClipboardCheck  },
  { href: '/admin/tickets',      label: 'Tickets',      icon: Ticket          },
  { href: '/admin/reports',      label: 'Reports',      icon: FileText        },
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
    clearTokens();
    clearUser();
    toast.success('Logged out');
    router.push('/login');
  };

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <div className="space-y-0.5">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNav}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              active
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
              active ? 'bg-white/20' : 'group-hover:bg-white/10'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="flex-1">{label}</span>
            {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
          </Link>
        );
      })}
    </div>
  );

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">SupportHome</p>
            <p className="text-slate-400 text-xs font-medium">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-4 border-t border-white/10" />

      {/* Nav label */}
      <p className="px-5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Navigation
      </p>

      {/* Links */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <NavLinks onNav={mobile ? () => setOpen(false) : undefined} />
      </nav>

      {/* Divider */}
      <div className="mx-4 mt-4 mb-3 border-t border-white/10" />

      {/* User */}
      <div className="px-3 pb-5">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg bg-white/8">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{getInitials(user?.firstName, user?.lastName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/8 hover:text-slate-100 transition-all duration-150"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 px-4 h-14 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">SupportHome</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-slate-900 flex flex-col pt-14 shadow-2xl">
            <SidebarContent mobile />
          </div>
        </div>
      )}
    </>
  );
}
