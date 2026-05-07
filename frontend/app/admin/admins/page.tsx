'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Shield, ShieldCheck, UserPlus, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface Admin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  last_login: string | null;
  created_at: string;
}

export default function AdminsPage() {
  const [admins, setAdmins]   = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm]       = useState({ firstName: '', lastName: '', email: '', password: '' });

  const currentUser = getUser();
  const isSuperAdmin = (currentUser as { isSuperAdmin?: boolean })?.isSuperAdmin;

  const load = async () => {
    try {
      const { data } = await adminAPI.getAdmins();
      setAdmins(data);
    } catch { toast.error('Failed to load admins'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error('All fields are required'); return;
    }
    setSaving(true);
    try {
      await adminAPI.createAdmin(form as Record<string, unknown>);
      toast.success(`Admin account created for ${form.firstName} ${form.lastName}`);
      setForm({ firstName: '', lastName: '', email: '', password: '' });
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create admin';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (admin: Admin) => {
    if (!confirm(`Deactivate ${admin.first_name} ${admin.last_name}? They will lose access immediately.`)) return;
    try {
      await adminAPI.deactivateAdmin(admin.id);
      toast.success('Admin deactivated');
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed';
      toast.error(msg);
    }
  };

  const handleReactivate = async (admin: Admin) => {
    try {
      await adminAPI.reactivateAdmin(admin.id);
      toast.success('Admin reactivated');
      load();
    } catch { toast.error('Failed'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!isSuperAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Shield className="w-12 h-12 text-gray-300 mb-3" />
      <h2 className="text-lg font-semibold text-gray-700">Super Admin Only</h2>
      <p className="text-gray-500 text-sm mt-1">Only the super admin can manage admin accounts.</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Team</h1>
          <p className="text-gray-500 text-sm mt-1">{admins.length} admin account{admins.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <UserPlus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Login</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                      ${admin.is_super_admin ? 'bg-primary-600' : 'bg-gray-400'}`}>
                      {admin.first_name[0]}{admin.last_name[0]}
                    </div>
                    <span className="font-medium text-gray-900">{admin.first_name} {admin.last_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                <td className="px-4 py-3">
                  {admin.is_super_admin ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {admin.last_login
                    ? format(new Date(admin.last_login), 'dd MMM yyyy, HH:mm')
                    : <span className="text-gray-300">Never</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    admin.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!admin.is_super_admin && admin.id !== currentUser?.id && (
                    admin.is_active ? (
                      <button
                        onClick={() => handleDeactivate(admin)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors">
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(admin)}
                        className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors">
                        Reactivate
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Admin</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input className="input-field" value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input className="input-field" value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input type="email" className="input-field" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input-field pr-10"
                    value={form.password} minLength={8}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                    placeholder="Min. 8 characters" />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                The new admin will receive these credentials and should change their password after first login.
              </p>
              <div className="flex gap-3 pt-1">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
