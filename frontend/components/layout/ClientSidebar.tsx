'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Ticket, User, LogOut, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { clearTokens, clearUser, getUser, getRefreshToken } from '@/lib/auth';
import toast from 'react-hot-toast';

const links = [
  { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client/tickets',   label: 'My Tickets', icon: Ticket          },
  { href: '/client/profile',   label: 'My Profile',  icon: User            },
];

export default function ClientSidebar() {
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
                ? 'bg-teal-600 text-white'
                : 'text-teal-100 hover:bg-teal-600/50 hover:text-white'
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
      <aside className="hidden lg:flex flex-col w-64 bg-teal-700 min-h-screen">
        <div className="p-6 border-b border-teal-600">
          <div className="flex items-center gap-2">
            <Home className="w-7 h-7 text-white" />
            <div>
              <p className="text-white font-bold text-lg leading-tight">SupportHome</p>
              <p className="text-teal-200 text-xs">Client Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-teal-600">
          <div className="px-4 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-teal-200 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-teal-100 hover:bg-teal-600/50 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-teal-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-white" />
          <span className="text-white font-bold">SupportHome</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-white">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-64 bg-teal-700 flex flex-col pt-16">
            <nav className="flex-1 p-4 space-y-1"><NavLinks /></nav>
            <div className="p-4 border-t border-teal-600">
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-teal-100 hover:bg-teal-600/50 transition-colors">
                <LogOut className="w-5 h-5" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
