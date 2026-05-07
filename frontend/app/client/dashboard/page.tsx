'use client';
import { useEffect, useState, useRef } from 'react';
import { clientAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import { MapPin, Plus, ArrowRight, AlertCircle, Ticket } from 'lucide-react';
import Link from 'next/link';
import { getUser } from '@/lib/auth';

const fmtDate = (d?: string) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

interface Dashboard {
  openTickets: number;
  recentTickets: Array<{ id: string; title: string; priority: string; status: string; created_at: string }>;
  currentProperty: { address: string; town_city: string; county?: string; postcode: string; property_type: string } | null;
  accountStatus: string;
  move_in_date?: string;
}

function Counter({ to }: { to: number }) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!to) { setCount(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / 900, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * to));
      if (p < 1) raf.current = requestAnimationFrame(step);
      else setCount(to);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <>{count}</>;
}

export default function ClientDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    clientAPI.getDashboard()
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl animate-float">🏡</div>
        <div className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }}/>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 animate-fade-up"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Gold top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}/>
        {/* Glow blob */}
        <div className="absolute top-0 left-0 w-64 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(201,168,92,0.08) 0%, transparent 70%)' }}/>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gold)', opacity: 0.7 }}>Welcome back</p>
            <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {data?.currentProperty
                ? `${data.currentProperty.address}, ${data.currentProperty.town_city}`
                : 'No property allocated yet'}
            </p>
          </div>
          <div className="text-5xl opacity-25 animate-float select-none hidden sm:block">🏡</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Open tickets */}
        <div className="relative rounded-2xl p-5 overflow-hidden animate-fade-up stagger-1"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,92,0.4), transparent)' }}/>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(201,168,92,0.12)', border: '1px solid rgba(201,168,92,0.25)' }}>
            <AlertCircle className="w-4.5 h-4.5" style={{ color: 'var(--gold)', width: 18, height: 18 }}/>
          </div>
          <p className="text-3xl font-extrabold mb-1 tabular-nums" style={{ color: 'var(--text)' }}>
            <Counter to={data?.openTickets || 0}/>
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Open tickets</p>
        </div>

        {/* Property */}
        <div className="relative rounded-2xl p-5 overflow-hidden animate-fade-up stagger-2"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(20,184,166,0.4), transparent)' }}/>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)' }}>
            <MapPin className="w-4.5 h-4.5" style={{ color: '#14b8a6', width: 18, height: 18 }}/>
          </div>
          <p className="font-bold text-base leading-tight mb-1 truncate" style={{ color: 'var(--text)' }}>
            {data?.currentProperty ? data.currentProperty.address : 'Not allocated'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Current property</p>
        </div>

        {/* Account status */}
        <div className="relative rounded-2xl p-5 overflow-hidden animate-fade-up stagger-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)' }}/>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Ticket className="w-4.5 h-4.5" style={{ color: '#3b82f6', width: 18, height: 18 }}/>
          </div>
          <div className="mb-1">{statusBadge(data?.accountStatus || 'pending')}</div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Account status</p>
        </div>
      </div>

      {/* Property detail */}
      {data?.currentProperty && (
        <div className="rounded-2xl p-5 animate-fade-up stagger-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-bold text-sm flex items-center gap-2 mb-5" style={{ color: 'var(--text)' }}>
            <MapPin className="w-4 h-4" style={{ color: 'var(--gold)' }}/> Your Property
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              ['Address',     data.currentProperty.address],
              ['Town / City', data.currentProperty.town_city],
              ['Type',        data.currentProperty.property_type],
              ['Move-in',     fmtDate(data.move_in_date)],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>{l}</p>
                <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up stagger-4">
        <Link href="/client/tickets/new"
          className="group flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(201,168,92,0.35)';
            el.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'var(--border)';
            el.style.transform = 'translateY(0)';
          }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,168,92,0.10)', border: '1px solid rgba(201,168,92,0.2)' }}>
            <Plus className="w-4 h-4" style={{ color: 'var(--gold)' }}/>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>New Request</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Submit a support ticket</p>
          </div>
        </Link>
        <Link href="/client/payments"
          className="group flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(20,184,166,0.35)';
            el.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'var(--border)';
            el.style.transform = 'translateY(0)';
          }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.2)' }}>
            💷
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Payments</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>View benefit history</p>
          </div>
        </Link>
      </div>

      {/* Recent tickets */}
      <div className="rounded-2xl overflow-hidden animate-fade-up stagger-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Recent Tickets</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Your latest support requests</p>
          </div>
          <Link href="/client/tickets/new" className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5"/> New
          </Link>
        </div>

        <div>
          {(!data?.recentTickets || data.recentTickets.length === 0) ? (
            <div className="px-6 py-14 text-center">
              <div className="text-4xl mb-3 animate-float">✨</div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>No tickets yet</p>
              <Link href="/client/tickets/new" className="btn-primary text-sm inline-flex">
                <Plus className="w-3.5 h-3.5"/> Submit your first request
              </Link>
            </div>
          ) : data.recentTickets.map((t, i) => (
            <Link key={t.id} href={`/client/tickets/${t.id}`}
              className="group flex items-center justify-between px-6 py-4 transition-colors"
              style={{ borderBottom: i < data.recentTickets.length - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div className="min-w-0 mr-4">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{t.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fmtDate(t.created_at)}</p>
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
