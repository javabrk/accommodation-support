'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { Property } from '@/types';
import { statusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit, Home } from 'lucide-react';

const emptyForm = {
  address: '', suburb: '', state: '', postcode: '', propertyType: 'house',
  bedrooms: '1', bathrooms: '1', capacity: '1', status: 'available',
  monthlyRent: '', description: '',
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getProperties();
      setProperties(data);
    } catch { toast.error('Failed to load properties'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: Property) => {
    setEditTarget(p);
    setForm({
      address: p.address, suburb: p.suburb, state: p.state, postcode: p.postcode,
      propertyType: p.propertyType, bedrooms: String(p.bedrooms), bathrooms: String(p.bathrooms),
      capacity: String(p.capacity), status: p.status, monthlyRent: String(p.monthlyRent || ''),
      description: p.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        await adminAPI.updateProperty(editTarget.id, form);
        toast.success('Property updated');
      } else {
        await adminAPI.createProperty(form);
        toast.success('Property created');
      }
      setModalOpen(false);
      load();
    } catch { toast.error('Failed to save property'); }
    finally { setSaving(false); }
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 text-sm mt-1">{properties.length} properties</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
        {!loading && properties.map((p) => (
          <div key={p.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{p.address}</p>
                  <p className="text-xs text-gray-500">{p.suburb}, {p.state} {p.postcode}</p>
                </div>
              </div>
              {statusBadge(p.status)}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-3">
              <div><p className="font-semibold text-gray-700 text-sm">{p.bedrooms}</p><p>Beds</p></div>
              <div><p className="font-semibold text-gray-700 text-sm">{p.bathrooms}</p><p>Baths</p></div>
              <div><p className="font-semibold text-gray-700 text-sm">{p.currentOccupants ?? 0}/{p.capacity}</p><p>Occupied</p></div>
            </div>
            {p.monthlyRent && (
              <p className="text-sm font-medium text-gray-700 mb-3">${Number(p.monthlyRent).toLocaleString()}/mo</p>
            )}
            <button onClick={() => openEdit(p)} className="btn-secondary w-full flex items-center justify-center gap-1 text-sm py-1.5">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        ))}
        {!loading && properties.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">No properties yet</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Property' : 'Add Property'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
            <input type="text" className="input-field" value={form.address} onChange={f('address')} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suburb *</label>
              <input type="text" className="input-field" value={form.suburb} onChange={f('suburb')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select className="input-field" value={form.state} onChange={f('state')} required>
                <option value="">Select…</option>
                {['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
              <input type="text" className="input-field" value={form.postcode} onChange={f('postcode')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="input-field" value={form.propertyType} onChange={f('propertyType')}>
                {['house','apartment','unit','townhouse','studio'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
              <input type="number" min="0" className="input-field" value={form.bedrooms} onChange={f('bedrooms')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
              <input type="number" min="0" className="input-field" value={form.bathrooms} onChange={f('bathrooms')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" min="1" className="input-field" value={form.capacity} onChange={f('capacity')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={f('status')}>
                {['available','occupied','maintenance','inactive'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
              <input type="number" className="input-field" value={form.monthlyRent} onChange={f('monthlyRent')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={f('description')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editTarget ? 'Update Property' : 'Create Property'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
