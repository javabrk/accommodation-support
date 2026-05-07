'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import {
  PoundSterling, TrendingDown, Clock, CheckCircle2, AlertTriangle,
  Plus, X, ChevronDown, RefreshCw, Settings, Calendar, User,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt  = (d?: string | null) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); } catch { return '—'; } };
const fmtP = (n: number | string) => `£${parseFloat(String(n || 0)).toFixed(2)}`;
const weekRange = (s: string, e: string) => `${fmt(s)} – ${fmt(e)}`;

const BENEFIT_TYPES = [
  { value: 'housing_benefit',   label: 'Housing Benefit (LHA)' },
  { value: 'universal_credit',  label: 'Universal Credit (Housing)' },
  { value: 'discretionary',     label: 'Discretionary Housing Payment' },
];
const PAYMENT_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const STATUSES = ['pending','due','received','partial','overdue','not_applicable'];

// ── Types ──────────────────────────────────────────────────────────────────────
interface PaymentRow {
  id: string; client_name: string; payment_type: string;
  amount_expected: number; amount_received: number;
  week_start_date: string; week_end_date: string;
  due_date: string; paid_date?: string; status: string;
  reference?: string; notes?: string; property_address?: string;
  client_id: string;
}
interface HBClient {
  client_id: string; client_name: string; email: string;
  client_status: string; property_address?: string;
  hb_setting_id?: string; weekly_amount?: number;
  benefit_type?: string; payment_day?: string;
  reference_number?: string; hb_active?: boolean;
  hb_start_date?: string;
}
interface Stats {
  monthlyExpected: number; monthlyReceived: number;
  overdueCount: number; overdueShortfall: number; pendingCount: number;
}
interface MarkModal { payment: PaymentRow; amountReceived: string; paidDate: string; reference: string; notes: string; status: string; }
interface HBModal { client: HBClient; weeklyAmount: string; benefitType: string; paymentDay: string; referenceNumber: string; startDate: string; notes: string; isActive: boolean; }
interface AddModal { clientId: string; weekStart: string; weekEnd: string; amountExpected: string; paymentType: string; notes: string; }

const statusColor: Record<string, string> = {
  received:       'bg-green-50 text-green-700 border border-green-200',
  partial:        'bg-blue-50 text-blue-700 border border-blue-200',
  pending:        'bg-gray-50 text-gray-600 border border-gray-200',
  due:            'bg-amber-50 text-amber-700 border border-amber-200',
  overdue:        'bg-red-50 text-red-700 border border-red-200',
  not_applicable: 'bg-gray-50 text-gray-400 border border-gray-100',
};
const statusLabel: Record<string, string> = {
  received: 'Received', partial: 'Partial', pending: 'Pending',
  due: 'Due', overdue: 'Overdue', not_applicable: 'N/A',
};

export default function AdminPaymentsPage() {
  const [tab, setTab]           = useState<'payments' | 'hb'>('payments');
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [hbClients, setHbClients] = useState<HBClient[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterClient,  setFilterClient]  = useState('');
  const [filterWeek,    setFilterWeek]    = useState('');

  // Modals
  const [markModal, setMarkModal] = useState<MarkModal | null>(null);
  const [hbModal,   setHbModal]   = useState<HBModal | null>(null);
  const [addModal,  setAddModal]  = useState<AddModal | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterClient) params.clientId = filterClient;
      if (filterWeek)   params.weekStart = filterWeek;
      const [pRes, sRes] = await Promise.all([
        adminAPI.getPayments(params),
        adminAPI.getPaymentStats(),
      ]);
      setPayments(pRes.data);
      setStats(sRes.data);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [filterStatus, filterClient, filterWeek]);

  const loadHB = useCallback(async () => {
    try {
      const { data } = await adminAPI.getHBSettings();
      setHbClients(data);
    } catch { toast.error('Failed to load HB settings'); }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);
  useEffect(() => { if (tab === 'hb') loadHB(); }, [tab, loadHB]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await adminAPI.generateWeeklyPayments({ weeksAhead: 8 });
      toast.success(data.message);
      loadPayments();
    } catch { toast.error('Failed to generate payments'); }
    finally { setGenerating(false); }
  };

  const handleMarkSubmit = async () => {
    if (!markModal) return;
    try {
      const received = parseFloat(markModal.amountReceived);
      let status = markModal.status;
      if (!status) {
        if (received >= parseFloat(String(markModal.payment.amount_expected))) status = 'received';
        else if (received > 0) status = 'partial';
        else status = 'overdue';
      }
      await adminAPI.updatePayment(markModal.payment.id, {
        amountReceived: received,
        status,
        paidDate: markModal.paidDate || new Date().toISOString(),
        reference: markModal.reference,
        notes: markModal.notes,
      });
      toast.success('Payment updated');
      setMarkModal(null);
      loadPayments();
    } catch { toast.error('Failed to update payment'); }
  };

  const handleHBSubmit = async () => {
    if (!hbModal) return;
    try {
      await adminAPI.upsertHBSetting({
        clientId:        hbModal.client.client_id,
        weeklyAmount:    parseFloat(hbModal.weeklyAmount),
        benefitType:     hbModal.benefitType,
        paymentDay:      hbModal.paymentDay,
        referenceNumber: hbModal.referenceNumber,
        startDate:       hbModal.startDate,
        notes:           hbModal.notes,
        isActive:        hbModal.isActive,
      });
      toast.success('Housing Benefit settings saved');
      setHbModal(null);
      loadHB();
    } catch { toast.error('Failed to save HB settings'); }
  };

  const handleAddSubmit = async () => {
    if (!addModal) return;
    try {
      await adminAPI.createPayment({
        clientId:       addModal.clientId,
        weekStartDate:  addModal.weekStart,
        weekEndDate:    addModal.weekEnd,
        amountExpected: parseFloat(addModal.amountExpected),
        paymentType:    addModal.paymentType,
        notes:          addModal.notes,
        status:         'pending',
      });
      toast.success('Payment record created');
      setAddModal(null);
      loadPayments();
    } catch { toast.error('Failed to create payment'); }
  };

  const openMarkModal = (p: PaymentRow) => setMarkModal({
    payment: p,
    amountReceived: String(p.amount_expected),
    paidDate: new Date().toISOString().slice(0, 10),
    reference: p.reference || '',
    notes: p.notes || '',
    status: '',
  });

  const openHBModal = (c: HBClient) => setHbModal({
    client:          c,
    weeklyAmount:    String(c.weekly_amount || ''),
    benefitType:     c.benefit_type || 'housing_benefit',
    paymentDay:      c.payment_day || 'Monday',
    referenceNumber: c.reference_number || '',
    startDate:       c.hb_start_date ? c.hb_start_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    notes:           '',
    isActive:        c.hb_active !== false,
  });

  // Unique clients from payments for filter dropdown
  const clientOptions = Array.from(new Map(payments.map(p => [p.client_id, p.client_name])).entries());

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Housing benefit & rent payment tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            Generate Weeks
          </button>
          <button
            onClick={() => setAddModal({ clientId: '', weekStart: '', weekEnd: '', amountExpected: '', paymentType: 'housing_benefit', notes: '' })}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Expected This Month', value: fmtP(stats.monthlyExpected),   icon: Calendar,    bg: 'bg-primary-50',  ic: 'text-primary-600' },
            { label: 'Received This Month', value: fmtP(stats.monthlyReceived),   icon: CheckCircle2, bg: 'bg-green-50',    ic: 'text-green-600'   },
            { label: 'Overdue Shortfall',   value: fmtP(stats.overdueShortfall),  icon: TrendingDown, bg: 'bg-red-50',      ic: 'text-red-500'     },
            { label: 'Pending Records',     value: String(stats.pendingCount),    icon: Clock,        bg: 'bg-amber-50',    ic: 'text-amber-600'   },
          ].map(({ label, value, icon: Icon, bg, ic }) => (
            <div key={label} className="card p-5">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${ic}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {([['payments','Payment Records'], ['hb','Benefit Configuration']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Payment Records tab ─────────────────────────────────── */}
      {tab === 'payments' && (
        <>
          {/* Filters */}
          <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
            <select className="input-field w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s] || s}</option>)}
            </select>
            <select className="input-field w-auto" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
              <option value="">All clients</option>
              {clientOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <input type="date" className="input-field w-auto" value={filterWeek}
              onChange={e => setFilterWeek(e.target.value)}
              placeholder="Week from" title="Show weeks starting from this date" />
            {(filterStatus || filterClient || filterWeek) && (
              <button onClick={() => { setFilterStatus(''); setFilterClient(''); setFilterWeek(''); }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <span className="ml-auto text-xs text-gray-400">{payments.length} records</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-7 h-7 border-[3px] border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : payments.length === 0 ? (
            <div className="card py-16 text-center">
              <PoundSterling className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-3">No payment records found</p>
              <p className="text-xs text-gray-400">Use "Generate Weeks" to auto-create records from Housing Benefit settings</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Week</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expected</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Received</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid On</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">{p.client_name}</p>
                          {p.property_address && <p className="text-xs text-gray-400 truncate max-w-[140px]">{p.property_address}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">
                          {weekRange(p.week_start_date, p.week_end_date)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-500">
                            {BENEFIT_TYPES.find(b => b.value === p.payment_type)?.label?.split(' (')[0] || p.payment_type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-gray-900 tabular-nums">
                          {fmtP(p.amount_expected)}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <span className={parseFloat(String(p.amount_received)) > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'}>
                            {fmtP(p.amount_received)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[p.status] || 'bg-gray-50 text-gray-600'}`}>
                            {statusLabel[p.status] || p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          {fmt(p.paid_date)}
                        </td>
                        <td className="px-4 py-3.5">
                          {p.status !== 'received' && p.status !== 'not_applicable' && (
                            <button
                              onClick={() => openMarkModal(p)}
                              className="text-xs font-semibold text-primary-600 hover:text-primary-800 whitespace-nowrap"
                            >
                              {p.status === 'partial' ? 'Update' : 'Mark received'}
                            </button>
                          )}
                          {p.status === 'received' && (
                            <button onClick={() => openMarkModal(p)} className="text-xs text-gray-400 hover:text-gray-600">Edit</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HB Configuration tab ────────────────────────────────── */}
      {tab === 'hb' && (
        <div className="card overflow-hidden">
          <div className="section-header">
            <div>
              <h2 className="font-semibold text-gray-900">Housing Benefit Configuration</h2>
              <p className="text-xs text-gray-500 mt-0.5">Set weekly entitlement amounts per tenant</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {hbClients.length === 0 ? (
              <p className="px-6 py-10 text-center text-gray-400 text-sm">No clients found</p>
            ) : hbClients.map(c => (
              <div key={c.client_id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                    {c.client_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{c.client_name}</p>
                    <p className="text-xs text-gray-400">{c.property_address || 'No property allocated'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  {c.hb_setting_id ? (
                    <>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{fmtP(c.weekly_amount || 0)}<span className="text-xs font-normal text-gray-400"> /week</span></p>
                        <p className="text-xs text-gray-400">{BENEFIT_TYPES.find(b=>b.value===c.benefit_type)?.label?.split(' (')[0] || c.benefit_type}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-0.5">Payment day</p>
                        <p className="text-sm font-semibold text-gray-700">{c.payment_day}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${c.hb_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.hb_active ? 'Active' : 'Inactive'}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Not configured</span>
                  )}
                  <button onClick={() => openHBModal(c)}
                    className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3">
                    <Settings className="w-3.5 h-3.5" />
                    {c.hb_setting_id ? 'Edit' : 'Set up'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mark Received Modal ──────────────────────────────────── */}
      {markModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMarkModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Update Payment</h3>
              <button onClick={() => setMarkModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm">
              <p className="font-semibold text-gray-900">{markModal.payment.client_name}</p>
              <p className="text-gray-500 text-xs mt-0.5">Week: {weekRange(markModal.payment.week_start_date, markModal.payment.week_end_date)}</p>
              <p className="text-gray-500 text-xs">Expected: <span className="font-semibold text-gray-700">{fmtP(markModal.payment.amount_expected)}</span></p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount Received (£)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                  value={markModal.amountReceived}
                  onChange={e => setMarkModal(m => m ? {...m, amountReceived: e.target.value} : null)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select className="input-field" value={markModal.status}
                  onChange={e => setMarkModal(m => m ? {...m, status: e.target.value} : null)}>
                  <option value="">Auto (based on amount)</option>
                  <option value="received">Received in full</option>
                  <option value="partial">Partial payment</option>
                  <option value="overdue">Overdue / not received</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date Received</label>
                <input type="date" className="input-field" value={markModal.paidDate}
                  onChange={e => setMarkModal(m => m ? {...m, paidDate: e.target.value} : null)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reference (optional)</label>
                <input className="input-field" placeholder="e.g. LHA-2025-001" value={markModal.reference}
                  onChange={e => setMarkModal(m => m ? {...m, reference: e.target.value} : null)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea className="input-field" rows={2} value={markModal.notes}
                  onChange={e => setMarkModal(m => m ? {...m, notes: e.target.value} : null)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMarkModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleMarkSubmit} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HB Settings Modal ────────────────────────────────────── */}
      {hbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHbModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Housing Benefit Settings</h3>
              <button onClick={() => setHbModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                {hbModal.client.client_name?.[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{hbModal.client.client_name}</p>
                <p className="text-xs text-gray-400">{hbModal.client.property_address || 'No property'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Benefit Type</label>
                <select className="input-field" value={hbModal.benefitType}
                  onChange={e => setHbModal(m => m ? {...m, benefitType: e.target.value} : null)}>
                  {BENEFIT_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Weekly Amount (£)</label>
                <input type="number" step="0.01" min="0" className="input-field"
                  placeholder="e.g. 125.50" value={hbModal.weeklyAmount}
                  onChange={e => setHbModal(m => m ? {...m, weeklyAmount: e.target.value} : null)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Payment Day</label>
                <select className="input-field" value={hbModal.paymentDay}
                  onChange={e => setHbModal(m => m ? {...m, paymentDay: e.target.value} : null)}>
                  {PAYMENT_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Council Reference</label>
                <input className="input-field" placeholder="e.g. HB-2025-00123" value={hbModal.referenceNumber}
                  onChange={e => setHbModal(m => m ? {...m, referenceNumber: e.target.value} : null)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Benefit Start Date</label>
                <input type="date" className="input-field" value={hbModal.startDate}
                  onChange={e => setHbModal(m => m ? {...m, startDate: e.target.value} : null)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea className="input-field" rows={2} placeholder="Any additional notes…"
                  value={hbModal.notes}
                  onChange={e => setHbModal(m => m ? {...m, notes: e.target.value} : null)} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-primary-600"
                  checked={hbModal.isActive}
                  onChange={e => setHbModal(m => m ? {...m, isActive: e.target.checked} : null)} />
                <span className="text-sm font-semibold text-gray-700">Benefit is currently active</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setHbModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleHBSubmit} className="btn-primary flex-1">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Payment Record Modal ─────────────────────────────── */}
      {addModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Add Payment Record</h3>
              <button onClick={() => setAddModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client</label>
                <select className="input-field" value={addModal.clientId}
                  onChange={e => setAddModal(m => m ? {...m, clientId: e.target.value} : null)}>
                  <option value="">Select a client…</option>
                  {hbClients.map(c => <option key={c.client_id} value={c.client_id}>{c.client_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Type</label>
                <select className="input-field" value={addModal.paymentType}
                  onChange={e => setAddModal(m => m ? {...m, paymentType: e.target.value} : null)}>
                  {BENEFIT_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  <option value="personal_contribution">Personal Contribution</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Week Start</label>
                  <input type="date" className="input-field" value={addModal.weekStart}
                    onChange={e => setAddModal(m => m ? {...m, weekStart: e.target.value} : null)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Week End</label>
                  <input type="date" className="input-field" value={addModal.weekEnd}
                    onChange={e => setAddModal(m => m ? {...m, weekEnd: e.target.value} : null)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Amount (£)</label>
                <input type="number" step="0.01" min="0" className="input-field" placeholder="0.00"
                  value={addModal.amountExpected}
                  onChange={e => setAddModal(m => m ? {...m, amountExpected: e.target.value} : null)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea className="input-field" rows={2} value={addModal.notes}
                  onChange={e => setAddModal(m => m ? {...m, notes: e.target.value} : null)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setAddModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAddSubmit} className="btn-primary flex-1">Create Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
