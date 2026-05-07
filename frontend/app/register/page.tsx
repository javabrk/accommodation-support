'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { setTokens, setUser } from '@/lib/auth';
import { Eye, EyeOff, Home, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    addressLine1: '',
    townCity: '',
    county: '',
    postcode: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email && !form.phone) {
      toast.error('Please provide an email address or phone number');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        firstName:    form.firstName,
        lastName:     form.lastName,
        email:        form.email || undefined,
        phone:        form.phone || undefined,
        password:     form.password,
        confirmPassword: form.confirmPassword,
        addressLine1: form.addressLine1 || undefined,
        townCity:     form.townCity     || undefined,
        county:       form.county       || undefined,
        postcode:     form.postcode     || undefined,
      });
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      toast.success(`Welcome, ${data.user.firstName}! Your account has been created.`);
      router.push('/client/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg mb-3">
            <Home className="w-7 h-7 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">SupportHome</h1>
          <p className="text-teal-200 text-sm mt-1">Create your tenant account</p>
        </div>

        <div className="card p-8">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/login" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="text-lg font-semibold text-gray-800">Register as a Tenant</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input className="input-field" value={form.firstName} onChange={set('firstName')} required placeholder="Sarah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input className="input-field" value={form.lastName} onChange={set('lastName')} required placeholder="Mitchell" />
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-gray-400 font-normal">(or phone below)</span>
              </label>
              <input type="email" className="input-field" value={form.email} onChange={set('email')}
                placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-gray-400 font-normal">(or email above)</span>
              </label>
              <input type="tel" className="input-field" value={form.phone} onChange={set('phone')}
                placeholder="07700 900000" autoComplete="tel" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-10"
                  value={form.password} onChange={set('password')}
                  required minLength={8} placeholder="Min. 8 characters" autoComplete="new-password" />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input type="password" className="input-field" value={form.confirmPassword}
                onChange={set('confirmPassword')} required placeholder="Repeat your password"
                autoComplete="new-password" />
            </div>

            {/* Address */}
            <div className="pt-1 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3 mt-2">Your Current Address</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input className="input-field" value={form.addressLine1} onChange={set('addressLine1')}
                    placeholder="14 Ashdown Crescent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Town / City</label>
                    <input className="input-field" value={form.townCity} onChange={set('townCity')}
                      placeholder="Manchester" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      County <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input className="input-field" value={form.county} onChange={set('county')}
                      placeholder="Greater Manchester" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                  <input className="input-field" value={form.postcode} onChange={set('postcode')}
                    placeholder="M4 1LT" style={{ textTransform: 'uppercase' }} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-teal w-full py-2.5 text-base" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-teal-600 font-medium hover:underline">Sign in</Link>
          </p>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-xs text-amber-700 border border-amber-100">
            <strong>Note:</strong> Your account will be reviewed by a housing officer before being activated.
            You&apos;ll be able to submit support tickets immediately after registering.
          </div>
        </div>
      </div>
    </div>
  );
}
