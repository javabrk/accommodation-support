'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { MessageSquare, Filter, Send } from 'lucide-react';

const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; } };
const fmtDateTime = (d: string) => { try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

interface AdminUser { id: string; first_name: string; last_name: string; }
interface Message { id: string; message: string; sender_name: string; sender_role: string; is_internal: boolean; created_at: string; }
interface TicketRow {
  id: string; title: string; category: string; priority: string; status: string;
  description: string; client_name: string; assigned_to?: string;
  created_at: string; updated_at: string; messages?: Message[];
}

export default function AdminTicketsPage() {
  const [tickets, setTickets]       = useState<TicketRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ status: '', priority: '', category: '' });
  const [selected, setSelected]     = useState<TicketRow | null>(null);
  const [admins, setAdmins]         = useState<AdminUser[]>([]);
  const [replyText, setReplyText]   = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', priority: '', assignedTo: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.status)   params.status   = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      const [{ data: t }, { data: a }] = await Promise.all([
        adminAPI.getTickets(params),
        adminAPI.getAdmins(),
      ]);
      setTickets(t);
      setAdmins(a);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openTicket = async (t: TicketRow) => {
    try {
      const { data } = await adminAPI.getTicket(t.id);
      setSelected(data);
      setUpdateForm({ status: data.status, priority: data.priority, assignedTo: data.assigned_to || '' });
      setReplyText('');
    } catch { toast.error('Failed to load ticket'); }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      await adminAPI.updateTicket(selected.id, updateForm);
      toast.success('Ticket updated');
      load();
      setSelected(null);
    } catch { toast.error('Failed to update ticket'); }
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await adminAPI.addTicketMessage(selected.id, { message: replyText, isInternal });
      toast.success('Reply sent');
      const { data } = await adminAPI.getTicket(selected.id);
      setSelected(data);
      setReplyText('');
    } catch { toast.error('Failed to send reply'); }
    finally { setSendingReply(false); }
  };

  const fFilter = (k: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilters(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-500 text-sm mt-1">{tickets.length} tickets</p>
      </div>

      <div className="card p-4 mb-6 flex flex-wrap gap-3">
        <Filter className="w-4 h-4 text-gray-400 self-center" />
        {[
          { key: 'status',   opts: ['open','in_progress','pending_client','resolved','closed'] },
          { key: 'priority', opts: ['low','medium','high','urgent'] },
          { key: 'category', opts: ['maintenance','financial','support','complaint','general','emergency'] },
        ].map(({ key, opts }) => (
          <select key={key} className="input-field w-auto flex-1 min-w-32"
            value={filters[key as keyof typeof filters]} onChange={fFilter(key)}>
            <option value="">All {key}s</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Subject','Client','Category','Priority','Status','Created',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>}
              {!loading && tickets.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No tickets found</td></tr>}
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openTicket(t)}>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{t.title}</td>
                  <td className="px-4 py-3 text-gray-600">{t.client_name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{t.category}</td>
                  <td className="px-4 py-3">{statusBadge(t.priority)}</td>
                  <td className="px-4 py-3">{statusBadge(t.status)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(t.created_at)}</td>
                  <td className="px-4 py-3"><MessageSquare className="w-4 h-4 text-primary-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} size="xl">
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
                ['Client',       selected.client_name],
                ['Category',     selected.category],
                ['Created',      fmtDateTime(selected.created_at)],
                ['Last updated', fmtDateTime(selected.updated_at)],
              ].map(([l, v]) => (
                <div key={l}><p className="text-gray-500 font-medium">{l}</p><p className="text-gray-900">{v}</p></div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
              {selected.description}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-blue-50 rounded-lg">
              {[
                { label: 'Status',   key: 'status',   opts: ['open','in_progress','pending_client','resolved','closed'] },
                { label: 'Priority', key: 'priority', opts: ['low','medium','high','urgent'] },
              ].map(({ label, key, opts }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <select className="input-field" value={updateForm[key as keyof typeof updateForm]}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, [key]: e.target.value }))}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assign to</label>
                <select className="input-field" value={updateForm.assignedTo}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, assignedTo: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {admins.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button onClick={handleUpdate} className="btn-primary text-sm">Update Ticket</button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Conversation</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {(!selected.messages || selected.messages.length === 0) && (
                  <p className="text-sm text-gray-400">No messages yet</p>
                )}
                {selected.messages?.map((m) => (
                  <div key={m.id} className={`flex gap-3 ${m.sender_role === 'admin' ? 'flex-row-reverse' : ''}`}>
                    <div className={`max-w-[75%] rounded-xl p-3 text-sm ${
                      m.is_internal ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                      m.sender_role === 'admin' ? 'bg-primary-100 text-primary-900' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="font-medium text-xs opacity-70 mb-1">{m.sender_name} {m.is_internal ? '(internal)' : ''}</p>
                      <p className="whitespace-pre-line">{m.message}</p>
                      <p className="text-xs opacity-50 mt-1">{fmtDateTime(m.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <textarea className="input-field mb-2" rows={3} placeholder="Type your reply…"
                value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                  Internal note (not visible to client)
                </label>
                <button onClick={handleReply} disabled={sendingReply || !replyText.trim()}
                  className="btn-primary flex items-center gap-2">
                  <Send className="w-4 h-4" /> {sendingReply ? 'Sending…' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
