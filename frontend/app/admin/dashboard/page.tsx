'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import { Users, Building2, Ticket, AlertCircle, TrendingUp } from 'lucide-react';

interface RecentTicket { id: string; title: string; priority: string; status: string; client_name?: string; created_at: string; }
interface DashboardStats { activeClients: number; availableProperties: number; activeTickets: number; openTickets: number; recentTickets: RecentTicket[]; }

const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; } };

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: string;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
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
        <div className="animate-spin w-8 h-8 border-[3px] border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your accommodation services</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Clients"
          value={stats?.activeClients || 0}
          icon={Users}
          iconBg="bg-primary-50"
          iconColor="text-primary-600"
        />
        <StatCard
          label="Available Properties"
          value={stats?.availableProperties || 0}
          icon={Building2}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          label="Active Tickets"
          value={stats?.activeTickets || 0}
          icon={Ticket}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Open Tickets"
          value={stats?.openTickets || 0}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
      </div>

      {/* Recent tickets */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <div>
            <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
            <p className="text-xs text-gray-500 mt-0.5">Latest support requests from tenants</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {(!stats?.recentTickets || stats.recentTickets.length === 0) && (
            <p className="px-6 py-10 text-center text-gray-400 text-sm">No tickets yet</p>
          )}
          {stats?.recentTickets?.map((t) => (
            <div key={t.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50/60 transition-colors">
              <div>
                <p className="font-medium text-gray-900 text-sm">{t.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.client_name && <span className="font-medium text-gray-500">{t.client_name}</span>}
                  {t.client_name && ' · '}
                  {fmtDate(t.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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
