'use client';
import { useEffect, useState, useRef } from 'react';
import { adminAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import { Users, Building2, Ticket, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface RecentTicket { id: string; title: string; priority: string; status: string; client_name?: string; created_at: string; }
interface DashboardStats { activeClients: number; availableProperties: number; activeTickets: number; openTickets: number; recentTickets: RecentTicket[]; }
const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); } catch { return ''; } };

/* ── Animated counter ──────────────────────────────────────────────── */
function Counter({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!to) { setCount(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setCount(Math.floor(ease * to));
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setCount(to);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);
  return <>{count}</>;
}

/* ── Stat card ─────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string; value: number; icon: React.ElementType;
  gradient: string; delay?: string; href: string; trend?: string;
}
function StatCard({ label, value, icon: Icon, gradient, delay = '0ms', href, trend }: StatCardProps) {
  return (
    <Link href={href}
      className="group relative rounded-2xl p-5 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-stat transition-all duration-300 animate-fade-up"
      style={{ background: gradient, animationDelay: delay }}>
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20"
        style={{ background: 'rgba(255,255,255,0.15)' }}/>
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full translate-y-1/2 -translate-x-1/2 opacity-10"
        style={{ background: 'rgba(255,255,255,0.2)' }}/>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white"/>
          </div>
          {trend && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3"/> {trend}
            </span>
          )}
        </div>
        <p className="text-3xl font-extrabold text-white tabular-nums mb-0.5">
          <Counter to={value} duration={900}/>
        </p>
        <p className="text-white/70 text-sm font-medium">{label}</p>
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
        <ArrowRight className="w-4 h-4 text-white/70"/>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl animate-bounce-sm">🏠</div>
        <div className="animate-spin w-6 h-6 border-[3px] border-primary-500 border-t-transparent rounded-full"/>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">👋</span>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <p className="text-gray-500 text-sm ml-11">Here's what's happening with your accommodation services today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Clients"       value={stats?.activeClients || 0}
          icon={Users}      gradient="linear-gradient(135deg,#1d4ed8,#3b82f6)"  delay="0ms"   href="/admin/clients"/>
        <StatCard label="Available Properties" value={stats?.availableProperties || 0}
          icon={Building2}  gradient="linear-gradient(135deg,#0f766e,#14b8a6)"  delay="60ms"  href="/admin/properties"/>
        <StatCard label="Active Tickets"       value={stats?.activeTickets || 0}
          icon={Ticket}     gradient="linear-gradient(135deg,#b45309,#f59e0b)"  delay="120ms" href="/admin/tickets"/>
        <StatCard label="Open Tickets"         value={stats?.openTickets || 0}
          icon={AlertCircle} gradient="linear-gradient(135deg,#be123c,#f43f5e)" delay="180ms" href="/admin/tickets"/>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-fade-up stagger-3">
        {[
          { label: 'Add Client',    href: '/admin/clients',    emoji: '👤', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100'   },
          { label: 'Add Property',  href: '/admin/properties', emoji: '🏠', bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-100'   },
          { label: 'View Payments', href: '/admin/payments',   emoji: '💷', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100'  },
          { label: 'New Report',    href: '/admin/reports',    emoji: '📄', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' },
        ].map(({ label, href, emoji, bg, text, border }, i) => (
          <Link key={href} href={href}
            className={`card-interactive flex items-center gap-3 px-4 py-3 border ${border} stagger-${i+1} animate-fade-up`}>
            <span className="text-xl">{emoji}</span>
            <span className={`text-sm font-semibold ${text}`}>{label}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${text} ml-auto opacity-50`}/>
          </Link>
        ))}
      </div>

      {/* Recent tickets */}
      <div className="card overflow-hidden animate-fade-up stagger-4">
        <div className="section-header">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <span>🎫</span> Recent Tickets
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Latest support requests from tenants</p>
          </div>
          <Link href="/admin/tickets" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3"/>
          </Link>
        </div>

        <div className="divide-y divide-gray-50">
          {(!stats?.recentTickets || stats.recentTickets.length === 0) ? (
            <div className="px-6 py-12 text-center">
              <span className="text-4xl block mb-3">🎉</span>
              <p className="text-gray-500 text-sm">No tickets yet — all quiet!</p>
            </div>
          ) : stats.recentTickets.map((t, i) => (
            <Link key={t.id} href={`/admin/tickets`}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-4 hover:bg-warm-50 transition-colors animate-fade-up stagger-${Math.min(i+1,6)}`}>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{t.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.client_name && <span className="font-medium text-gray-500">{t.client_name} · </span>}
                  {fmtDate(t.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {statusBadge(t.priority)}
                {statusBadge(t.status)}
                <ArrowRight className="w-3.5 h-3.5 text-gray-300"/>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
