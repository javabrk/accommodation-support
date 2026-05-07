'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import { Property } from '@/types';
import { statusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit, Home } from 'lucide-react';

const emptyForm = {
  address: '', townCity: '', county: '', postcode: '', propertyType: 'terraced',
  bedrooms: '1', bathrooms: '1', capacity: '1', status: 'available',
  monthlyRent: '', description: '',
};

const UK_PROPERTY_TYPES = [
  'terraced', 'semi-detached', 'detached', 'flat', 'bungalow',
  'studio', 'bedsit', 'maisonette', 'house', 'apartment',
];

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
      address: p.address,
      townCity: (p as any).town_city || (p as any).townCity || '',
      county: (p as any).county || '',
      postcode: p.postcode,
      propertyType: (p as any).property_type || p.propertyType,
      bedrooms: String(p.bedrooms),
      bathrooms: String(p.bathrooms),
      capacity: String(p.capacity),
      status: p.status,
      monthlyRent: String((p as any).monthly_rent || p.monthlyRent || ''),
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
                  <p className="text-xs text-gray-500">
                    {(p as any).town_city || (p as any).townCity}{(p as any).county ? `, ${(p as any).county}` : ''} · {p.postcode}
                  </p>
                </div>
              </div>
              {statusBadge(p.status)}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-3">
              <div><p className="font-semibold text-gray-700 text-sm">{p.bedrooms}</p><p>Beds</p></div>
              <div><p className="font-semibold text-gray-700 text-sm">{p.bathrooms}</p><p>Baths</p></div>
              <div><p className="font-semibold text-gray-700 text-sm">{p.currentOccupants ?? 0}/{p.capacity}</p><p>Occupied</p></div>
            </div>
            {((p as any).monthly_rent || p.monthlyRent) && (
              <p className="text-sm font-medium text-gray-700 mb-3">
                £{Number((p as any).monthly_rent || p.monthlyRent).toLocaleString('en-GB')}/mo
              </p>
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
            <input type="text" className="input-field" placeholder="e.g. 12 Oak Street" value={form.address} onChange={f('address')} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Town / City *</label>
              <input type="text" className="input-field" placeholder="e.g. Manchester" value={form.townCity} onChange={f('townCity')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
              <input type="text" className="input-field" placeholder="e.g. Greater Manchester" value={form.county} onChange={f('county')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
              <input type="text" className="input-field" placeholder="e.g. M4 1LT" value={form.postcode} onChange={f('postcode')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select className="input-field" value={form.propertyType} onChange={f('propertyType')}>
                {UK_PROPERTY_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
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
                {['available','occupied','maintenance','inactive'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (£)</label>
              <input type="number" className="input-field" placeholder="e.g. 850" value={form.monthlyRent} onChange={f('monthlyRent')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={f('description')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Update Property' : 'Create Property'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
