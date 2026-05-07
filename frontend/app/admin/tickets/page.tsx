'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import {
  MessageSquare, Filter, Send, X, CheckCircle2,
  XCircle, Clock, RotateCcw, ChevronRight, User,
} from 'lucide-react';

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};
const fmtDateTime = (d: string) => {
  try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

interface AdminUser { id: string; first_name: string; last_name: string; }
interface Message { id: string; message: string; sender_name: string; sender_role: string; is_internal: boolean; created_at: string; }
interface TicketRow {
  id: string; title: string; category: string; priority: string; status: string;
  description: string; client_name: string; assigned_to?: string; assigned_to_name?: string;
  created_at: string; updated_at: string; messages?: Message[];
}

const STATUS_OPTS   = ['open', 'in_progress', 'pending_client', 'resolved', 'closed'];
const PRIORITY_OPTS = ['low', 'medium', 'high', 'urgent'];

export default function AdminTicketsPage() {
  const [tickets, setTickets]         = useState<TicketRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filters, setFilters]         = useState({ status: '', priority: '', category: '' });
  const [selected, setSelected]       = useState<TicketRow | null>(null);
  const [admins, setAdmins]           = useState<AdminUser[]>([]);
  const [replyText, setReplyText]     = useState('');
  const [isInternal, setIsInternal]   = useState(false);
  const [sendingReply, setSendingReply]   = useState(false);
  const [updating, setUpdating]       = useState(false);
  const [status, setStatus]           = useState('');
  const [priority, setPriority]       = useState('');
  const [assignedTo, setAssignedTo]   = useState('');

  /* ── Load tickets ─────────────────────────────────────────────── */
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.status)   params.status   = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      const { data } = await adminAPI.getTickets(params);
      setTickets(data);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /* ── Load admins separately — doesn't block ticket list ────────── */
  const loadAdmins = useCallback(async () => {
    try {
      const { data } = await adminAPI.getAdmins();
      setAdmins(data);
    } catch {
      // silently fail — assign dropdown just won't populate
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  /* ── Open a ticket ────────────────────────────────────────────── */
  const openTicket = async (t: TicketRow) => {
    try {
      const { data } = await adminAPI.getTicket(t.id);
      setSelected(data);
      setStatus(data.status);
      setPriority(data.priority);
      setAssignedTo(data.assigned_to || '');
      setReplyText('');
      setIsInternal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load ticket';
      toast.error(msg);
    }
  };

  /* ── Update ticket (status / priority / assignee) ─────────────── */
  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await adminAPI.updateTicket(selected.id, { status, priority, assignedTo });
      toast.success('Ticket updated');
      // Refresh list + reload this ticket
      await loadTickets();
      const { data } = await adminAPI.getTicket(selected.id);
      setSelected(data);
      setStatus(data.status);
      setPriority(data.priority);
      setAssignedTo(data.assigned_to || '');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update ticket';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  /* ── Quick status change ──────────────────────────────────────── */
  const quickStatus = async (newStatus: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await adminAPI.updateTicket(selected.id, { status: newStatus, priority, assignedTo });
      toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
      setStatus(newStatus);
      await loadTickets();
      const { data } = await adminAPI.getTicket(selected.id);
      setSelected(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update ticket';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  /* ── Send reply ───────────────────────────────────────────────── */
  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await adminAPI.addTicketMessage(selected.id, { message: replyText, isInternal });
      toast.success(isInternal ? 'Internal note added' : 'Reply sent');
      const { data } = await adminAPI.getTicket(selected.id);
      setSelected(data);
      setReplyText('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send reply';
      toast.error(msg);
    } finally {
      setSendingReply(false);
    }
  };

  const closePanel = () => setSelected(null);

  return (
    <div className="flex gap-0 h-full">
      {/* ── Ticket list ────────────────────────────────────────── */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ${selected ? 'hidden xl:block xl:w-1/2' : 'w-full'}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {[
            { key: 'status',   label: 'Status',   opts: STATUS_OPTS   },
            { key: 'priority', label: 'Priority', opts: PRIORITY_OPTS },
            { key: 'category', label: 'Category', opts: ['maintenance','financial','support','complaint','general','emergency'] },
          ].map(({ key, label, opts }) => (
            <select key={key} className="input-field w-auto flex-1 min-w-[120px]"
              value={filters[key as keyof typeof filters]}
              onChange={e => setFilters(prev => ({ ...prev, [key]: e.target.value }))}>
              <option value="">All {label}s</option>
              {opts.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
            </select>
          ))}
          <button onClick={loadTickets} className="btn-secondary text-xs py-2 px-3">Refresh</button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Subject', 'Client', 'Category', 'Priority', 'Status', 'Created', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
                      Loading tickets…
                    </div>
                  </td></tr>
                )}
                {!loading && tickets.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400">No tickets found</td></tr>
                )}
                {!loading && tickets.map((t) => (
                  <tr key={t.id}
                    className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selected?.id === t.id ? 'bg-blue-50/60' : ''}`}
                    onClick={() => openTicket(t)}>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{t.title}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.client_name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize whitespace-nowrap">{t.category}</td>
                    <td className="px-4 py-3">{statusBadge(t.priority)}</td>
                    <td className="px-4 py-3">{statusBadge(t.status)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <ChevronRight className={`w-4 h-4 transition-colors ${selected?.id === t.id ? 'text-primary-500' : 'text-gray-300'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Ticket detail panel ─────────────────────────────────── */}
      {selected && (
        <div className="w-full xl:w-[520px] xl:ml-6 flex-shrink-0">
          <div className="card overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 80px)' }}>

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 text-base leading-snug truncate">{selected.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {selected.category} · {selected.client_name} · {fmtDate(selected.created_at)}
                </p>
              </div>
              <button onClick={closePanel}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">

              {/* Current status & priority */}
              <div className="flex items-center gap-3 flex-wrap">
                {statusBadge(selected.status)}
                {statusBadge(selected.priority)}
                {selected.assigned_to_name && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3.5 h-3.5"/> {selected.assigned_to_name}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line">
                {selected.description}
              </div>

              {/* ── Update controls ──────────────────────────────── */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Update Ticket</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                    <select className="input-field" value={status}
                      onChange={e => setStatus(e.target.value)}>
                      {STATUS_OPTS.map(o => (
                        <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Priority</label>
                    <select className="input-field" value={priority}
                      onChange={e => setPriority(e.target.value)}>
                      {PRIORITY_OPTS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assign To</label>
                  <select className="input-field" value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {admins.map(a => (
                      <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                    ))}
                  </select>
                </div>

                <button onClick={handleUpdate} disabled={updating}
                  className="btn-primary w-full py-2.5 text-sm">
                  {updating ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                      Saving…
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>

              {/* ── Quick actions ─────────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {selected.status !== 'resolved' && (
                    <button disabled={updating} onClick={() => quickStatus('resolved')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-green-50 text-green-700 border border-green-200
                                 hover:bg-green-100 transition-colors disabled:opacity-50">
                      <CheckCircle2 className="w-3.5 h-3.5"/> Mark Resolved
                    </button>
                  )}
                  {selected.status !== 'closed' && (
                    <button disabled={updating} onClick={() => quickStatus('closed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-red-50 text-red-700 border border-red-200
                                 hover:bg-red-100 transition-colors disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5"/> Close Ticket
                    </button>
                  )}
                  {selected.status !== 'in_progress' && selected.status !== 'open' && (
                    <button disabled={updating} onClick={() => quickStatus('in_progress')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-blue-50 text-blue-700 border border-blue-200
                                 hover:bg-blue-100 transition-colors disabled:opacity-50">
                      <Clock className="w-3.5 h-3.5"/> Set In Progress
                    </button>
                  )}
                  {(selected.status === 'resolved' || selected.status === 'closed') && (
                    <button disabled={updating} onClick={() => quickStatus('open')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-amber-50 text-amber-700 border border-amber-200
                                 hover:bg-amber-100 transition-colors disabled:opacity-50">
                      <RotateCcw className="w-3.5 h-3.5"/> Re-open
                    </button>
                  )}
                </div>
              </div>

              {/* ── Conversation ──────────────────────────────────── */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400"/> Conversation
                </h3>
                <div className="space-y-3 mb-4">
                  {(!selected.messages || selected.messages.length === 0) ? (
                    <p className="text-sm text-gray-400 italic">No messages yet</p>
                  ) : selected.messages.map((m) => (
                    <div key={m.id} className={`flex gap-2.5 ${m.sender_role === 'admin' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        m.sender_role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {m.sender_name?.[0]?.toUpperCase()}
                      </div>
                      <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                        m.is_internal
                          ? 'bg-amber-50 border border-amber-200 text-amber-800'
                          : m.sender_role === 'admin'
                          ? 'bg-primary-50 border border-primary-100 text-gray-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-[11px] font-semibold opacity-60 mb-1">
                          {m.sender_name}{m.is_internal ? ' · internal note' : ''}
                        </p>
                        <p className="whitespace-pre-line leading-relaxed">{m.message}</p>
                        <p className="text-[11px] opacity-40 mt-1.5">{fmtDateTime(m.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply box */}
                <div className="border-t border-gray-100 pt-4">
                  <textarea
                    className="input-field mb-2.5 resize-none"
                    rows={3}
                    placeholder="Type your reply to the tenant…"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                      <input type="checkbox" className="rounded"
                        checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                      <span className="text-xs">Internal note only</span>
                    </label>
                    <button
                      onClick={handleReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="btn-primary text-sm flex items-center gap-2">
                      <Send className="w-3.5 h-3.5" />
                      {sendingReply ? 'Sending…' : isInternal ? 'Add Note' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
