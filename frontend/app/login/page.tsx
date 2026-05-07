'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { setTokens, setUser } from '@/lib/auth';
import { Eye, EyeOff, Home, Shield, Users, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

const features = [
  { icon: Users,     text: 'Manage all your tenants in one place'   },
  { icon: Building2, text: 'Track properties and availability'       },
  { icon: Shield,    text: 'Secure, role-based access control'       },
  { icon: CheckCircle2, text: 'Property checklists and inspections'  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(email, password);
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      if (data.user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/client/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid email or password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel (hero) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-gradient-to-br from-slate-900 via-primary-950 to-primary-900 flex-col justify-between p-12">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">SupportHome</span>
        </div>

        {/* Middle content */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
            Social Support<br />
            <span className="text-primary-300">Accommodation</span><br />
            Management
          </h1>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            A complete platform for housing officers to manage tenants, properties, tickets, and compliance in one place.
          </p>
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary-300" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer text */}
        <p className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} SupportHome · UK Social Support Platform
        </p>
      </div>

      {/* ── Right panel (form) ────────────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 font-bold text-xl">SupportHome</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-7 pt-7 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 mb-3">New to SupportHome?</p>
            <a
              href="/register"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border-2 border-primary-200 text-primary-700 font-semibold text-sm hover:border-primary-400 hover:bg-primary-50 transition-all duration-150"
            >
              <Users className="w-4 h-4" />
              Create a tenant account
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
