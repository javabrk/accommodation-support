'use client';
import { useEffect, useState, useRef } from 'react';
import { adminAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import { Users, Building2, Ticket, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RecentTicket { id: string; title: string; priority: string; status: string; client_name?: string; created_at: string; }
interface DashboardStats { activeClients: number; availableProperties: number; activeTickets: number; openTickets: number; recentTickets: RecentTicket[]; }

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};

/* ── Animated counter ────────────────────────────────────────────── */
function Counter({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!to) { setCount(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * to));
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setCount(to);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);
  return <>{count}</>;
}

/* ── Stat card ───────────────────────────────────────────────────── */
interface StatCardProps {
  label: string; value: number; icon: React.ElementType;
  accent: string; delay?: string; href: string; sub?: string;
}
function StatCard({ label, value, icon: Icon, accent, delay = '0ms', href, sub }: StatCardProps) {
  return (
    <Link href={href}
      className="group relative rounded-2xl p-5 overflow-hidden transition-all duration-300 animate-fade-up"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        animationDelay: delay,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = `${accent}33`;
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--border)';
        el.style.transform = 'translateY(0)';
      }}>

      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }}/>

      <div className="flex items-start justify-between mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}33` }}>
          <Icon className="w-4.5 h-4.5" style={{ color: accent, width: 18, height: 18 }}/>
        </div>
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0" style={{ color: accent }}/>
      </div>

      <p className="text-3xl font-extrabold tabular-nums mb-1" style={{ color: 'var(--text)' }}>
        <Counter to={value} duration={900}/>
      </p>
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{sub}</p>}
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
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl animate-float">🏠</div>
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}/>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Dashboard</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Overview of your accommodation services
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Clients"        value={stats?.activeClients || 0}
          icon={Users}       accent="#3b82f6" delay="0ms"   href="/admin/clients"    sub="Currently housed"/>
        <StatCard label="Available Properties"  value={stats?.availableProperties || 0}
          icon={Building2}   accent="#14b8a6" delay="60ms"  href="/admin/properties" sub="Ready to allocate"/>
        <StatCard label="Active Tickets"        value={stats?.activeTickets || 0}
          icon={Ticket}      accent="#c9a85c" delay="120ms" href="/admin/tickets"    sub="In progress"/>
        <StatCard label="Open Tickets"          value={stats?.openTickets || 0}
          icon={AlertCircle} accent="#f43f5e" delay="180ms" href="/admin/tickets"    sub="Awaiting review"/>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up stagger-3">
        {[
          { label: 'Add Client',    href: '/admin/clients',    emoji: '👤', accent: '#3b82f6' },
          { label: 'Add Property',  href: '/admin/properties', emoji: '🏠', accent: '#14b8a6' },
          { label: 'View Payments', href: '/admin/payments',   emoji: '💷', accent: '#c9a85c' },
          { label: 'New Report',    href: '/admin/reports',    emoji: '📄', accent: '#a78bfa' },
        ].map(({ label, href, emoji, accent }) => (
          <Link key={href} href={href}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = `${accent}44`;
              el.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'var(--border)';
              el.style.transform = 'translateY(0)';
            }}>
            <span className="text-xl">{emoji}</span>
            <span className="text-sm font-semibold flex-1" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: accent }}/>
          </Link>
        ))}
      </div>

      {/* Recent tickets */}
      <div className="rounded-2xl overflow-hidden animate-fade-up stagger-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Recent Tickets</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest support requests from tenants</p>
          </div>
          <Link href="/admin/tickets" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            View all <ArrowRight className="w-3 h-3"/>
          </Link>
        </div>

        <div>
          {(!stats?.recentTickets || stats.recentTickets.length === 0) ? (
            <div className="px-6 py-14 text-center">
              <span className="text-4xl block mb-3 animate-float">🎉</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tickets yet — all quiet!</p>
            </div>
          ) : stats.recentTickets.map((t, i) => (
            <Link key={t.id} href="/admin/tickets"
              className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-4 transition-colors"
              style={{ borderBottom: i < stats.recentTickets.length - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{t.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {t.client_name && <span className="font-medium" style={{ color: 'var(--gold)', opacity: 0.8 }}>{t.client_name} · </span>}
                  {fmtDate(t.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {statusBadge(t.priority)}
                {statusBadge(t.status)}
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: 'var(--text-muted)' }}/>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
