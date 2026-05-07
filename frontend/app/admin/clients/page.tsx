'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Eye } from 'lucide-react';
import Link from 'next/link';

interface ClientRow {
  id: string; email: string; first_name: string; last_name: string;
  phone?: string; status?: string; nhs_number?: string;
  move_in_date?: string; property_address?: string; property_town?: string;
}

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
  gender: '', nhsNumber: '', supportNeeds: '', emergencyContactName: '',
  emergencyContactPhone: '', emergencyContactRelationship: '', notes: '', status: 'active',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const { data } = await adminAPI.getClients(params);
      setClients(data);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.createClient(form);
      toast.success('Client created successfully');
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create client';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} total records</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="exited">Exited</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Phone', 'NHS No.', 'Property', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
              )}
              {!loading && clients.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No clients found</td></tr>
              )}
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.nhs_number || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.property_address ? `${c.property_address}, ${c.property_town}` : '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(c.status || 'pending')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/clients/${c.id}`} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium">
                      <Eye className="w-4 h-4" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create client modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Client" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'First Name *',       key: 'firstName',             type: 'text',  required: true },
              { label: 'Last Name *',         key: 'lastName',              type: 'text',  required: true },
              { label: 'Email *',             key: 'email',                 type: 'email', required: true },
              { label: 'Phone',               key: 'phone',                 type: 'tel' },
              { label: 'Date of Birth',       key: 'dateOfBirth',           type: 'date' },
              { label: 'NHS Number',          key: 'nhsNumber',             type: 'text' },
              { label: 'Emergency Contact',   key: 'emergencyContactName',  type: 'text' },
              { label: 'Emergency Phone',     key: 'emergencyContactPhone', type: 'tel' },
            ].map(({ label, key, type, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  className="input-field"
                  value={form[key as keyof typeof form]}
                  onChange={f(key as keyof typeof form)}
                  required={required}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select className="input-field" value={form.gender} onChange={f('gender')}>
              <option value="">Select…</option>
              <option>Male</option><option>Female</option>
              <option>Non-binary</option><option>Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Support Needs</label>
            <textarea className="input-field" rows={3} value={form.supportNeeds} onChange={f('supportNeeds')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={f('notes')} />
          </div>
          <p className="text-xs text-gray-500">Default password: <code>Welcome@123</code> — client should change on first login</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
