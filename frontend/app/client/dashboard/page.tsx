'use client';
import { useEffect, useState } from 'react';
import { clientAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import { Ticket, MapPin, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { getUser } from '@/lib/auth';

interface Dashboard {
  openTickets: number;
  recentTickets: Array<{ id: string; title: string; priority: string; status: string; created_at: string }>;
  currentProperty: { address: string; suburb: string; state: string; property_type: string } | null;
  accountStatus: string;
  moveInDate?: string;
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
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your accommodation support summary</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{data?.openTickets || 0}</p>
            <p className="text-xs text-gray-500">Open tickets</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {data?.currentProperty ? `${data.currentProperty.address}` : 'Not allocated'}
            </p>
            <p className="text-xs text-gray-500">Current property</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
            <Ticket className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div>{statusBadge(data?.accountStatus || 'pending')}</div>
            <p className="text-xs text-gray-500 mt-1">Account status</p>
          </div>
        </div>
      </div>

      {/* Property details */}
      {data?.currentProperty && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-500" /> Your Property
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              ['Address', `${data.currentProperty.address}, ${data.currentProperty.suburb}`],
              ['State', data.currentProperty.state],
              ['Type', data.currentProperty.property_type],
              ['Move-in Date', data.moveInDate ? format(new Date(data.moveInDate), 'dd MMM yyyy') : '—'],
            ].map(([l, v]) => (
              <div key={l}><p className="text-gray-500">{l}</p><p className="font-medium text-gray-900">{v}</p></div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tickets */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
          <Link href="/client/tickets/new" className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {data?.recentTickets?.length === 0 && (
            <div className="px-6 py-10 text-center">
              <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No tickets yet</p>
              <Link href="/client/tickets/new" className="btn-primary inline-flex items-center gap-1 mt-3 text-sm">
                <Plus className="w-3.5 h-3.5" /> Submit a request
              </Link>
            </div>
          )}
          {data?.recentTickets?.map((t) => (
            <Link key={t.id} href={`/client/tickets/${t.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-medium text-gray-900 text-sm">{t.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{format(new Date(t.created_at), 'dd MMM yyyy')}</p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(t.priority)}
                {statusBadge(t.status)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
