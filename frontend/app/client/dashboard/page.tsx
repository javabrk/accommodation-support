'use client';
import { useEffect, useState } from 'react';
import { clientAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import { Ticket, MapPin, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getUser } from '@/lib/auth';

const fmtDate = (d?: string) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '—'; } };

interface Dashboard {
  openTickets: number;
  recentTickets: Array<{ id: string; title: string; priority: string; status: string; created_at: string }>;
  currentProperty: { address: string; town_city: string; county?: string; postcode: string; property_type: string } | null;
  accountStatus: string;
  move_in_date?: string;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-[3px] border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Welcome back, {user?.firstName}!</h1>
        <p className="page-subtitle">Here&apos;s your accommodation support summary</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Open tickets */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-0.5">{data?.openTickets || 0}</p>
          <p className="text-sm text-gray-500">Open tickets</p>
        </div>

        {/* Property */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <p className="font-bold text-gray-900 text-base leading-tight mb-0.5 truncate">
            {data?.currentProperty ? data.currentProperty.address : 'Not allocated'}
          </p>
          <p className="text-sm text-gray-500">Current property</p>
        </div>

        {/* Account status */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <div className="mb-0.5">{statusBadge(data?.accountStatus || 'pending')}</div>
          <p className="text-sm text-gray-500 mt-1">Account status</p>
        </div>
      </div>

      {/* Property detail card */}
      {data?.currentProperty && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-teal-500" />
            Your Property
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              ['Address',    data.currentProperty.address],
              ['Town / City', data.currentProperty.town_city],
              ['Type',       data.currentProperty.property_type],
              ['Move-in',    fmtDate(data.move_in_date)],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{l}</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tickets */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <div>
            <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
            <p className="text-xs text-gray-500 mt-0.5">Your latest support requests</p>
          </div>
          <Link href="/client/tickets/new" className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {(!data?.recentTickets || data.recentTickets.length === 0) ? (
            <div className="px-6 py-12 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm mb-4">No tickets yet. Need help?</p>
              <Link href="/client/tickets/new" className="btn-primary inline-flex items-center gap-1.5 text-sm">
                <Plus className="w-3.5 h-3.5" /> Submit a request
              </Link>
            </div>
          ) : (
            data.recentTickets.map((t) => (
              <Link key={t.id} href={`/client/tickets/${t.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                <div className="min-w-0 mr-3">
                  <p className="font-medium text-gray-900 text-sm truncate">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(t.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusBadge(t.priority)}
                  {statusBadge(t.status)}
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors ml-1" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
