'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { setTokens, setUser } from '@/lib/auth';
import { Eye, EyeOff, Home, ArrowLeft, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen flex" style={{ background: 'var(--page-bg)' }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-1/3 left-1/2 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">SupportHome</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Join SupportHome<br />as a Tenant</h2>
          <p className="text-teal-300/80 text-base mb-8 leading-relaxed">
            Get access to your own portal where you can track your accommodation, submit requests, and stay informed.
          </p>
          <div className="space-y-3">
            {[
              'Submit maintenance and support tickets',
              'View your property details',
              'Communicate with your housing officer',
              'Track request progress in real time',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="text-teal-200/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-teal-600/60 text-xs">
          © {new Date().getFullYear()} SupportHome · UK Social Support Platform
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-6">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 font-bold text-lg">SupportHome</span>
          </div>

          {/* Heading */}
          <div className="flex items-center gap-3 mb-7">
            <Link href="/login" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-sm text-gray-500">Register as a tenant</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name *</label>
                <input className="input-field" value={form.firstName} onChange={set('firstName')} required placeholder="Sarah" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name *</label>
                <input className="input-field" value={form.lastName} onChange={set('lastName')} required placeholder="Mitchell" />
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address <span className="text-gray-400 font-normal text-xs">(or mobile below)</span>
              </label>
              <input type="email" className="input-field" value={form.email} onChange={set('email')}
                placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mobile Number <span className="text-gray-400 font-normal text-xs">(or email above)</span>
              </label>
              <input type="tel" className="input-field" value={form.phone} onChange={set('phone')}
                placeholder="07700 900000" autoComplete="tel" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-11"
                  value={form.password} onChange={set('password')}
                  required minLength={8} placeholder="Min. 8 characters" autoComplete="new-password" />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password *</label>
              <input type="password" className="input-field" value={form.confirmPassword}
                onChange={set('confirmPassword')} required placeholder="Repeat your password"
                autoComplete="new-password" />
            </div>

            {/* Address section */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3 mt-2">Current Address <span className="text-gray-400 font-normal">(optional)</span></p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Address Line 1</label>
                  <input className="input-field" value={form.addressLine1} onChange={set('addressLine1')}
                    placeholder="14 Ashdown Crescent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Town / City</label>
                    <input className="input-field" value={form.townCity} onChange={set('townCity')}
                      placeholder="Manchester" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">County</label>
                    <input className="input-field" value={form.county} onChange={set('county')}
                      placeholder="Greater Manchester" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Postcode</label>
                  <input className="input-field uppercase" value={form.postcode} onChange={set('postcode')}
                    placeholder="M4 1LT" />
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700">
              <strong>Please note:</strong> Your account will be reviewed by a housing officer before full activation.
              You can submit support tickets straight away after registering.
            </div>

            <button type="submit"
              className="w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm hover:-translate-y-px active:translate-y-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
              disabled={loading}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
