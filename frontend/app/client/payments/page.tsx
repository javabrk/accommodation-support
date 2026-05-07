'use client';
import { useEffect, useState, type ElementType } from 'react';
import { clientAPI } from '@/lib/api';
import { PoundSterling, CheckCircle2, AlertTriangle, Clock, Info } from 'lucide-react';

const fmt  = (d?: string | null) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); } catch { return '—'; } };
const fmtP = (n: number | string) => `£${parseFloat(String(n || 0)).toFixed(2)}`;
const weekRange = (s: string, e: string) => `${fmt(s)} – ${fmt(e)}`;

const BENEFIT_LABELS: Record<string, string> = {
  housing_benefit:  'Housing Benefit (LHA)',
  universal_credit: 'Universal Credit (Housing)',
  discretionary:    'Discretionary Housing Payment',
};

interface Payment {
  id: string; payment_type: string;
  amount_expected: number; amount_received: number;
  week_start_date: string; week_end_date: string;
  due_date: string; paid_date?: string; status: string;
  reference?: string; notes?: string; property_address?: string;
}
interface HBSetting {
  weekly_amount: number; benefit_type: string; payment_day: string;
  reference_number?: string; is_active: boolean; start_date: string;
}
interface Stats {
  received_count: string; overdue_count: string; pending_count: string; partial_count: string;
  total_expected: string; total_received: string;
}

const statusStyle: Record<string, { bg: string; text: string; icon: ElementType; label: string }> = {
  received:       { bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle2,  label: 'Received'  },
  partial:        { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: Info,          label: 'Partial'   },
  pending:        { bg: 'bg-gray-50',   text: 'text-gray-500',   icon: Clock,         label: 'Pending'   },
  due:            { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Clock,         label: 'Due'       },
  overdue:        { bg: 'bg-red-50',    text: 'text-red-600',    icon: AlertTriangle, label: 'Overdue'   },
  not_applicable: { bg: 'bg-gray-50',   text: 'text-gray-400',   icon: Info,          label: 'N/A'       },
};

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [hbSetting, setHbSetting] = useState<HBSetting | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filterStatus) params.status = filterStatus;
    clientAPI.getMyPayments(params)
      .then(({ data }) => {
        setPayments(data.payments || []);
        setHbSetting(data.hbSetting || null);
        setStats(data.stats || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterStatus]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-[3px] border-teal-500 border-t-transparent rounded-full" />
    </div>
  );

  const shortfall = stats
    ? parseFloat(stats.total_expected) - parseFloat(stats.total_received)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">My Payments</h1>
        <p className="page-subtitle">Your housing benefit and payment history</p>
      </div>

      {/* HB Entitlement card */}
      {hbSetting ? (
        <div className="card p-6 mb-6 border-l-4 border-teal-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PoundSterling className="w-4 h-4 text-teal-600" />
                <h2 className="font-semibold text-gray-900">Your Housing Benefit Entitlement</h2>
              </div>
              <p className="text-xs text-gray-500">
                {BENEFIT_LABELS[hbSetting.benefit_type] || hbSetting.benefit_type}
                {hbSetting.reference_number && ` · Ref: ${hbSetting.reference_number}`}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-teal-700">{fmtP(hbSetting.weekly_amount)}</p>
                <p className="text-xs text-gray-400">per week</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{fmtP(parseFloat(String(hbSetting.weekly_amount)) * 52 / 12)}</p>
                <p className="text-xs text-gray-400">per month (est.)</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">{hbSetting.payment_day}s</p>
                <p className="text-xs text-gray-400">payment day</p>
              </div>
            </div>
          </div>
          {hbSetting.start_date && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
              <span>Started: <span className="font-medium text-gray-600">{fmt(hbSetting.start_date)}</span></span>
              <span className={`px-2 py-0.5 rounded-full font-semibold ${hbSetting.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {hbSetting.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-5 mb-6 flex items-start gap-3 bg-amber-50 border border-amber-100">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">No housing benefit configured</p>
            <p className="text-xs text-amber-700 mt-0.5">Your housing officer will set up your housing benefit entitlement. Contact them if you believe this is an error.</p>
          </div>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Received',  value: stats.received_count, sub: fmtP(stats.total_received), color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending',   value: stats.pending_count,  sub: 'not yet due',               color: 'text-gray-500',  bg: 'bg-gray-50'  },
            { label: 'Overdue',   value: stats.overdue_count,  sub: 'need attention',            color: 'text-red-600',   bg: 'bg-red-50'   },
            { label: 'Shortfall', value: fmtP(shortfall),      sub: 'all time',                  color: shortfall > 0 ? 'text-red-600' : 'text-green-600', bg: shortfall > 0 ? 'bg-red-50' : 'bg-green-50' },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} className="card p-4">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payment history */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <div>
            <h2 className="font-semibold text-gray-900">Payment History</h2>
            <p className="text-xs text-gray-500 mt-0.5">Weekly housing benefit records</p>
          </div>
          <select className="input-field w-auto text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            <option value="received">Received</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {payments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <PoundSterling className="w-7 h-7 text-gray-200" />
            </div>
            <p className="text-gray-500 text-sm">No payment records yet</p>
            <p className="text-xs text-gray-400 mt-1">Your housing officer will add records once payments are tracked</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map(p => {
              const s = statusStyle[p.status] || statusStyle.pending;
              const Icon = s.icon;
              const isOverdue = p.status === 'overdue';
              const diff = parseFloat(String(p.amount_received)) - parseFloat(String(p.amount_expected));
              return (
                <div key={p.id} className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                      <Icon className={`w-4 h-4 ${s.text}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{weekRange(p.week_start_date, p.week_end_date)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {BENEFIT_LABELS[p.payment_type] || p.payment_type}
                        {p.reference && ` · ${p.reference}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Expected</p>
                      <p className="text-sm font-bold text-gray-900">{fmtP(p.amount_expected)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Received</p>
                      <p className={`text-sm font-bold ${parseFloat(String(p.amount_received)) > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                        {fmtP(p.amount_received)}
                      </p>
                    </div>
                    {p.status === 'received' || p.status === 'partial' ? (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Received on</p>
                        <p className="text-xs font-medium text-gray-700">{fmt(p.paid_date)}</p>
                      </div>
                    ) : null}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                      <Icon className="w-3 h-3" />
                      {s.label}
                    </span>
                    {diff < 0 && p.status !== 'pending' && (
                      <span className="text-xs text-red-600 font-semibold hidden sm:block">
                        {fmtP(Math.abs(diff))} short
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overdue notice */}
      {stats && parseInt(stats.overdue_count) > 0 && (
        <div className="mt-5 card p-4 flex items-start gap-3 bg-red-50 border border-red-100">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {stats.overdue_count} overdue payment{parseInt(stats.overdue_count) > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Please contact your housing officer if you&apos;re experiencing issues with your housing benefit payments.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
