'use client';
import { useEffect, useState } from 'react';
import { clientAPI } from '@/lib/api';
import { statusBadge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Edit, Save, X, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string; email: string; first_name: string; last_name: string;
  client_id: string; phone?: string; date_of_birth?: string; gender?: string;
  ndis_number?: string; support_needs?: string; status?: string;
  move_in_date?: string; emergency_contact_name?: string;
  emergency_contact_phone?: string; emergency_contact_relationship?: string;
  currentAllocation?: {
    address: string; suburb: string; state: string; postcode: string;
    property_type: string; bedrooms: number; bathrooms: number;
    start_date: string;
  };
}

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await clientAPI.getProfile();
      setProfile(data);
      setForm({
        firstName: data.first_name, lastName: data.last_name, phone: data.phone || '',
        emergencyContactName: data.emergency_contact_name || '',
        emergencyContactPhone: data.emergency_contact_phone || '',
        emergencyContactRelationship: data.emergency_contact_relationship || '',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clientAPI.updateProfile(form);
      toast.success('Profile updated');
      setEditing(false);
      load();
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Your personal information</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2">
            <Edit className="w-4 h-4" /> Edit
          </button>
        ) : (
          <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-2">
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>

      {/* Property */}
      {profile?.currentAllocation && (
        <div className="card p-5 mb-5 border-l-4 border-l-teal-500">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-teal-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Current Property</h2>
          </div>
          <p className="font-medium text-gray-900">{profile.currentAllocation.address}</p>
          <p className="text-sm text-gray-500">
            {profile.currentAllocation.suburb}, {profile.currentAllocation.state} {profile.currentAllocation.postcode}
          </p>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span className="capitalize">{profile.currentAllocation.property_type}</span>
            <span>{profile.currentAllocation.bedrooms} bed · {profile.currentAllocation.bathrooms} bath</span>
            <span>Since {format(new Date(profile.currentAllocation.start_date), 'MMM yyyy')}</span>
          </div>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="card p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'First Name', key: 'firstName' },
              { label: 'Last Name',  key: 'lastName'  },
              { label: 'Phone',      key: 'phone'     },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="text" className="input-field" value={form[key as keyof typeof form]} onChange={f(key as keyof typeof form)} />
              </div>
            ))}
          </div>
          <hr className="border-gray-200" />
          <h3 className="font-medium text-gray-900 text-sm">Emergency Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Name',         key: 'emergencyContactName'         },
              { label: 'Phone',        key: 'emergencyContactPhone'        },
              { label: 'Relationship', key: 'emergencyContactRelationship' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="text" className="input-field" value={form[key as keyof typeof form]} onChange={f(key as keyof typeof form)} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            {[
              ['First Name', profile?.first_name],
              ['Last Name',  profile?.last_name],
              ['Email',      profile?.email],
              ['Phone',      profile?.phone || '—'],
              ['Date of Birth', profile?.date_of_birth ? format(new Date(profile.date_of_birth), 'dd MMM yyyy') : '—'],
              ['Gender',     profile?.gender || '—'],
              ['NDIS Number', profile?.ndis_number || '—'],
              ['Status',     statusBadge(profile?.status || 'active')],
              ['Move-in Date', profile?.move_in_date ? format(new Date(profile.move_in_date), 'dd MMM yyyy') : '—'],
            ].map(([l, v]) => (
              <div key={String(l)}>
                <p className="text-gray-500 font-medium text-xs uppercase tracking-wide mb-0.5">{l}</p>
                <div className="text-gray-900">{v}</div>
              </div>
            ))}
          </div>

          {(profile?.support_needs) && (
            <div>
              <p className="text-gray-500 font-medium text-xs uppercase tracking-wide mb-1">Support Needs</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{profile.support_needs}</p>
            </div>
          )}

          <hr className="border-gray-200" />
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-3">Emergency Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                ['Name', profile?.emergency_contact_name || '—'],
                ['Phone', profile?.emergency_contact_phone || '—'],
                ['Relationship', profile?.emergency_contact_relationship || '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-gray-500 text-xs mb-0.5">{l}</p>
                  <p className="text-gray-900">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
