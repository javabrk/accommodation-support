'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Ticket, FileText, LogOut, Home, Menu, X, ClipboardCheck,
} from 'lucide-react';
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { clearTokens, clearUser, getUser, getRefreshToken } from '@/lib/auth';
import toast from 'react-hot-toast';

const links = [
  { href: '/admin/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/clients',      label: 'Clients',       icon: Users           },
  { href: '/admin/properties',   label: 'Properties',    icon: Building2       },
  { href: '/admin/checklists',   label: 'Checklists',    icon: ClipboardCheck  },
  { href: '/admin/tickets',      label: 'Tickets',       icon: Ticket          },
  { href: '/admin/reports',      label: 'Reports',       icon: FileText        },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const user = getUser();

  const handleLogout = async () => {
    try {
      await authAPI.logout(getRefreshToken() || '');
    } catch {}
    clearTokens();
    clearUser();
    toast.success('Logged out');
    router.push('/login');
  };

  const NavLinks = () => (
    <>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-primary-700 text-white'
                : 'text-primary-100 hover:bg-primary-700/50 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary-800 min-h-screen">
        <div className="p-6 border-b border-primary-700">
          <div className="flex items-center gap-2">
            <Home className="w-7 h-7 text-white" />
            <div>
              <p className="text-white font-bold text-lg leading-tight">SupportHome</p>
              <p className="text-primary-300 text-xs">Admin Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-primary-700">
          <div className="px-4 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-primary-300 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-primary-100 hover:bg-primary-700/50 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-primary-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-white" />
          <span className="text-white font-bold">SupportHome</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-white">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-64 bg-primary-800 flex flex-col pt-16">
            <nav className="flex-1 p-4 space-y-1">
              <NavLinks />
            </nav>
            <div className="p-4 border-t border-primary-700">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-primary-100 hover:bg-primary-700/50 transition-colors"
              >
                <LogOut className="w-5 h-5" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
