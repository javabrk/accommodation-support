'use client';
import { useEffect, useState, useRef } from 'react';
import { clientAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import { MapPin, Plus, ArrowRight, AlertCircle, Ticket } from 'lucide-react';
import Link from 'next/link';
import { getUser } from '@/lib/auth';

const fmtDate = (d?: string) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); } catch { return '—'; } };

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
      <div className="flex flex-col items-center gap-3">
        <div className="text-4xl animate-bounce-sm">🏡</div>
        <div className="animate-spin w-6 h-6 border-[3px] border-teal-500 border-t-transparent rounded-full"/>
      </div>
    </div>
  );

  return (
    <div>
      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6 p-6 animate-fade-up"
        style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)' }}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/2 translate-x-1/4 opacity-15"
          style={{ background: 'rgba(255,255,255,0.4)' }}/>
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full translate-y-1/2 opacity-10"
          style={{ background: 'rgba(255,255,255,0.3)' }}/>
        <div className="relative z-10">
          <p className="text-teal-100 text-sm font-medium mb-1">Welcome back 👋</p>
          <h1 className="text-2xl font-extrabold text-white mb-1">{user?.firstName} {user?.lastName}</h1>
          <p className="text-teal-200/80 text-sm">Here's your accommodation summary</p>
        </div>
        {/* House emoji decoration */}
        <div className="absolute right-6 bottom-4 text-5xl opacity-30 animate-float">🏡</div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Open tickets */}
        <div className="card p-5 animate-fade-up stagger-1">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#b45309,#f59e0b)' }}>
              <AlertCircle className="w-5 h-5 text-white"/>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mb-0.5">
            <Counter to={data?.openTickets || 0}/>
          </p>
          <p className="text-sm text-gray-500">Open tickets</p>
        </div>

        {/* Current property */}
        <div className="card p-5 animate-fade-up stagger-2">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}>
              <MapPin className="w-5 h-5 text-white"/>
            </div>
          </div>
          <p className="font-extrabold text-gray-900 text-base leading-tight mb-0.5 truncate">
            {data?.currentProperty ? data.currentProperty.address : 'Not allocated'}
          </p>
          <p className="text-sm text-gray-500">Current property</p>
        </div>

        {/* Account status */}
        <div className="card p-5 animate-fade-up stagger-3">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
              <Ticket className="w-5 h-5 text-white"/>
            </div>
          </div>
          <div className="mb-0.5">{statusBadge(data?.accountStatus || 'pending')}</div>
          <p className="text-sm text-gray-500 mt-1">Account status</p>
        </div>
      </div>

      {/* Property detail */}
      {data?.currentProperty && (
        <div className="card p-5 mb-6 animate-fade-up stagger-4 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-4xl opacity-8">🏠</div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-sm">
            <MapPin className="w-4 h-4 text-teal-600"/> Your Property
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Address',    data.currentProperty.address],
              ['Town / City', data.currentProperty.town_city],
              ['Type',       data.currentProperty.property_type],
              ['Move-in',    fmtDate(data.move_in_date)],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{l}</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-up stagger-4">
        <Link href="/client/tickets/new"
          className="card-interactive flex items-center gap-3 p-4 border border-teal-100">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
            <Plus className="w-4 h-4 text-teal-600"/>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">New Request</p>
            <p className="text-xs text-gray-400">Submit a support ticket</p>
          </div>
        </Link>
        <Link href="/client/payments"
          className="card-interactive flex items-center gap-3 p-4 border border-amber-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <span className="text-lg">💷</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Payments</p>
            <p className="text-xs text-gray-400">View benefit history</p>
          </div>
        </Link>
      </div>

      {/* Recent tickets */}
      <div className="card overflow-hidden animate-fade-up stagger-5">
        <div className="section-header">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <span>🎫</span> Recent Tickets
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Your latest support requests</p>
          </div>
          <Link href="/client/tickets/new" className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5"/> New
          </Link>
        </div>

        <div className="divide-y divide-gray-50">
          {(!data?.recentTickets || data.recentTickets.length === 0) ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-gray-500 text-sm mb-4">No tickets yet</p>
              <Link href="/client/tickets/new" className="btn-primary text-sm inline-flex">
                <Plus className="w-3.5 h-3.5"/> Submit your first request
              </Link>
            </div>
          ) : data.recentTickets.map((t, i) => (
            <Link key={t.id} href={`/client/tickets/${t.id}`}
              className={`flex items-center justify-between px-6 py-4 hover:bg-warm-50 transition-colors group animate-fade-up stagger-${Math.min(i+1,6)}`}>
              <div className="min-w-0 mr-4">
                <p className="font-semibold text-gray-900 text-sm truncate">{t.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(t.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {statusBadge(t.priority)}
                {statusBadge(t.status)}
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors"/>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
