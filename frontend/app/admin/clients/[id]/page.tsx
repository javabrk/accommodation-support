'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Building2, Ticket, FileText } from 'lucide-react';
import Link from 'next/link';

const fmtDate = (d?: string) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '—'; } };
const fmtMonth = (d?: string) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }); } catch { return '—'; } };

interface ClientDetail {
  id: string; email: string; first_name: string; last_name: string;
  is_active: boolean; created_at: string; client_id: string;
  phone?: string; date_of_birth?: string; gender?: string;
  nhs_number?: string; support_needs?: string; status?: string; notes?: string;
  move_in_date?: string; move_out_date?: string;
  address_line1?: string; town_city?: string; county?: string; postcode?: string;
  emergency_contact_name?: string; emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allocations: Array<{ id: string; address: string; town_city: string; county?: string; postcode: string; start_date: string; end_date?: string; status: string; property_type: string }>;
  tickets: Array<{ id: string; title: string; priority: string; status: string; created_at: string }>;
  reports: Array<{ id: string; title: string; report_type: string; created_at: string; created_by_name: string }>;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI.getClient(id)
      .then(({ data }) => {
        setClient(data);
        setForm({
          firstName: data.first_name, lastName: data.last_name, email: data.email,
          phone: data.phone || '', dateOfBirth: data.date_of_birth?.split('T')[0] || '',
          gender: data.gender || '', nhsNumber: data.nhs_number || '',
          supportNeeds: data.support_needs || '', status: data.status || 'active',
          emergencyContactName: data.emergency_contact_name || '',
          emergencyContactPhone: data.emergency_contact_phone || '',
          emergencyContactRelationship: data.emergency_contact_relationship || '',
          notes: data.notes || '',
          moveInDate: data.move_in_date?.split('T')[0] || '',
          moveOutDate: data.move_out_date?.split('T')[0] || '',
        });
      })
      .catch(() => toast.error('Failed to load client'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.updateClient(id, form);
      toast.success('Client updated');
      setEditOpen(false);
      const { data } = await adminAPI.getClient(id);
      setClient(data);
    } catch { toast.error('Failed to update client'); }
    finally { setSaving(false); }
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!client) return <div className="text-center py-20 text-gray-500">Client not found</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{client.first_name} {client.last_name}</h1>
          <p className="text-gray-500 text-sm">{client.email}</p>
        </div>
        <button onClick={() => setEditOpen(true)} className="btn-primary flex items-center gap-2">
          <Edit className="w-4 h-4" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                ['Status',        statusBadge(client.status || 'active')],
                ['Phone',         client.phone || '—'],
                ['Date of Birth', fmtDate(client.date_of_birth)],
                ['Gender',        client.gender || '—'],
                ['NHS Number',    client.nhs_number || '—'],
                ['Move-in Date',  fmtDate(client.move_in_date)],
                ['Move-out Date', fmtDate(client.move_out_date)],
                ['Member Since',  fmtDate(client.created_at)],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-gray-500 font-medium">{label}</dt>
                  <dd className="text-gray-900 mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
            {client.support_needs && (
              <div className="mt-4">
                <dt className="text-sm text-gray-500 font-medium">Support Needs</dt>
                <dd className="text-sm text-gray-900 mt-1 whitespace-pre-line">{client.support_needs}</dd>
              </div>
            )}
            {(client.address_line1 || client.town_city) && (
              <div className="mt-4">
                <dt className="text-sm text-gray-500 font-medium">Address</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {[client.address_line1, client.town_city, client.county, client.postcode].filter(Boolean).join(', ')}
                </dd>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Emergency Contact</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                ['Name',         client.emergency_contact_name || '—'],
                ['Phone',        client.emergency_contact_phone || '—'],
                ['Relationship', client.emergency_contact_relationship || '—'],
              ].map(([l, v]) => (
                <div key={l}><dt className="text-gray-500 font-medium">{l}</dt><dd className="text-gray-900 mt-0.5">{v}</dd></div>
              ))}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Allocations</h2>
            </div>
            {client.allocations.length === 0
              ? <p className="text-sm text-gray-400">No allocations</p>
              : client.allocations.map((a) => (
                <div key={a.id} className="text-sm border-l-2 border-primary-300 pl-3 mb-3">
                  <p className="font-medium text-gray-900">{a.address}</p>
                  <p className="text-gray-500">{a.town_city}{a.county ? `, ${a.county}` : ''} · {a.postcode}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{fmtMonth(a.start_date)} – {a.end_date ? fmtMonth(a.end_date) : 'Current'}</p>
                  {statusBadge(a.status)}
                </div>
              ))}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
              </div>
              <Link href="/admin/tickets" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
            {client.tickets.length === 0
              ? <p className="text-sm text-gray-400">No tickets</p>
              : client.tickets.map((t) => (
                <div key={t.id} className="text-sm mb-3">
                  <p className="font-medium text-gray-900 truncate">{t.title}</p>
                  <div className="flex gap-1 mt-1">{statusBadge(t.priority)}{statusBadge(t.status)}</div>
                </div>
              ))}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Recent Reports</h2>
              </div>
              <Link href="/admin/reports" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
            {client.reports.length === 0
              ? <p className="text-sm text-gray-400">No reports</p>
              : client.reports.map((r) => (
                <div key={r.id} className="text-sm mb-3">
                  <p className="font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-gray-500 text-xs">{r.report_type} · {r.created_by_name}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Client" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'First Name',              key: 'firstName',                type: 'text'  },
              { label: 'Last Name',               key: 'lastName',                 type: 'text'  },
              { label: 'Email',                   key: 'email',                    type: 'email' },
              { label: 'Phone',                   key: 'phone',                    type: 'tel'   },
              { label: 'Date of Birth',           key: 'dateOfBirth',              type: 'date'  },
              { label: 'NHS Number',              key: 'nhsNumber',                type: 'text'  },
              { label: 'Move-in Date',            key: 'moveInDate',               type: 'date'  },
              { label: 'Move-out Date',           key: 'moveOutDate',              type: 'date'  },
              { label: 'Emergency Contact Name',  key: 'emergencyContactName',     type: 'text'  },
              { label: 'Emergency Contact Phone', key: 'emergencyContactPhone',    type: 'tel'   },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} className="input-field" value={form[key] || ''} onChange={f(key)} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select className="input-field" value={form.gender} onChange={f('gender')}>
                <option value="">Select…</option>
                <option>Male</option><option>Female</option>
                <option>Non-binary</option><option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={f('status')}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="exited">Exited</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Support Needs</label>
            <textarea className="input-field" rows={3} value={form.supportNeeds || ''} onChange={f('supportNeeds')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes || ''} onChange={f('notes')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
