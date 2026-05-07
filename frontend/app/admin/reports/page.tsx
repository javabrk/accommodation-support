'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit, FileText, Lock } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  content: string;
  report_type: string;
  is_confidential: boolean;
  client_id?: string;
  client_name?: string;
  created_by_name: string;
  created_at: string;
}
interface ClientOption { id: string; client_id: string; first_name: string; last_name: string; }

const emptyForm = {
  clientId: '', title: '', content: '', reportType: 'case_note', isConfidential: false,
};

const reportTypeLabel: Record<string, string> = {
  case_note: 'Case Note', incident: 'Incident', progress: 'Progress',
  assessment: 'Assessment', exit: 'Exit', other: 'Other',
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

export default function ReportsPage() {
  const [reports, setReports]     = useState<Report[]>([]);
  const [clients, setClients]     = useState<ClientOption[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [editTarget, setEditTarget] = useState<Report | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: r }, { data: c }] = await Promise.all([
        adminAPI.getReports(),
        adminAPI.getClients(),
      ]);
      setReports(r);
      setClients(c);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (r: Report) => {
    setEditTarget(r);
    setForm({
      clientId: r.client_id || '',
      title: r.title,
      content: r.content,
      reportType: r.report_type,
      isConfidential: r.is_confidential,
    });
    setViewReport(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        await adminAPI.updateReport(editTarget.id, form);
        toast.success('Report updated');
      } else {
        await adminAPI.createReport(form);
        toast.success('Report created');
      }
      setModalOpen(false);
      load();
    } catch { toast.error('Failed to save report'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">{reports.length} reports</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Report
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Title','Client','Type','Author','Date',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td></tr>}
              {!loading && reports.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No reports yet</td></tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewReport(r)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 truncate max-w-xs">{r.title}</span>
                      {r.is_confidential && <Lock className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.client_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{reportTypeLabel[r.report_type] || r.report_type}</td>
                  <td className="px-4 py-3 text-gray-600">{r.created_by_name}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                      className="text-primary-600 hover:text-primary-800">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View report modal */}
      <Modal open={!!viewReport} onClose={() => setViewReport(null)} title={viewReport?.title || ''} size="lg">
        {viewReport && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                ['Type',   reportTypeLabel[viewReport.report_type] || viewReport.report_type],
                ['Client', viewReport.client_name || '—'],
                ['Author', viewReport.created_by_name],
                ['Date',   fmtDate(viewReport.created_at)],
              ].map(([l, v]) => (
                <div key={l}><p className="text-gray-500 text-xs font-medium">{l}</p><p className="text-gray-900">{v}</p></div>
              ))}
            </div>
            {viewReport.is_confidential && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">
                <Lock className="w-4 h-4" /> Confidential Report
              </div>
            )}
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
              {viewReport.content}
            </div>
            <div className="flex justify-end">
              <button onClick={() => openEdit(viewReport)} className="btn-primary flex items-center gap-2">
                <Edit className="w-4 h-4" /> Edit Report
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Report' : 'New Report'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client (optional)</label>
            <select className="input-field" value={form.clientId}
              onChange={(e) => setForm(prev => ({ ...prev, clientId: e.target.value }))}>
              <option value="">— No specific client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.client_id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" className="input-field" required value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select className="input-field" value={form.reportType}
              onChange={(e) => setForm(prev => ({ ...prev, reportType: e.target.value }))}>
              {Object.entries(reportTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea className="input-field" rows={8} required value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isConfidential}
              onChange={(e) => setForm(prev => ({ ...prev, isConfidential: e.target.checked }))} />
            Mark as confidential
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Update Report' : 'Create Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
