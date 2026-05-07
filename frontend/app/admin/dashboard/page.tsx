'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { DashboardStats } from '@/types';
import { statusBadge } from '@/components/ui/Badge';
import { Users, Building2, Ticket, AlertCircle } from 'lucide-react';
const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; } };

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="card p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your accommodation services</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Clients"       value={stats?.activeClients || 0}       icon={Users}       color="bg-primary-500" />
        <StatCard label="Available Properties" value={stats?.availableProperties || 0} icon={Building2}   color="bg-teal-500"    />
        <StatCard label="Active Tickets"       value={stats?.activeTickets || 0}       icon={Ticket}      color="bg-yellow-500"  />
        <StatCard label="Open Tickets"         value={stats?.openTickets || 0}         icon={AlertCircle} color="bg-red-500"     />
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {stats?.recentTickets?.length === 0 && (
            <p className="px-6 py-8 text-center text-gray-400">No tickets yet</p>
          )}
          {stats?.recentTickets?.map((t) => (
            <div key={t.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.client_name} · {fmtDate(t.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(t.priority)}
                {statusBadge(t.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
