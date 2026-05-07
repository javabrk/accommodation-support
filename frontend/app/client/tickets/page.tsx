'use client';
import { useEffect, useState, useCallback } from 'react';
import { clientAPI } from '@/lib/api';
import { Ticket } from '@/types';
import { statusBadge } from '@/components/ui/Badge';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ClientTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      const { data } = await clientAPI.getTickets(params);
      setTickets(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">Track your support requests</p>
        </div>
        <Link href="/client/tickets/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Request
        </Link>
      </div>

      <div className="card p-4 mb-6">
        <select className="input-field w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All tickets</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending_client">Awaiting your reply</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="card py-16 text-center">
          <TicketIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No tickets found</p>
          <Link href="/client/tickets/new" className="btn-primary inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Submit your first request
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/client/tickets/${t.id}`}
              className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-shadow block">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 uppercase font-medium">{t.category}</span>
                </div>
                <p className="font-semibold text-gray-900">{t.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Opened {format(new Date(t.createdAt), 'dd MMM yyyy')}
                  {t.updatedAt !== t.createdAt ? ` · Updated ${format(new Date(t.updatedAt), 'dd MMM')}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {statusBadge(t.priority)}
                {statusBadge(t.status)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
