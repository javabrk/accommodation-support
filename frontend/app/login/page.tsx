'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { setTokens, setUser } from '@/lib/auth';
import { Eye, EyeOff, Home } from 'lucide-react';

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
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-800 to-teal-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Home className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">SupportHome</h1>
          <p className="text-primary-200 mt-1">Social Support Accommodation Portal</p>
        </div>

        {/* Form card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 text-base"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700 mb-2">Test Credentials</p>
            <p>📧 <span className="font-medium">Admin email:</span> admin@accommodation.com</p>
            <p>🔑 <span className="font-medium">Admin password:</span> Admin@123</p>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Are you a tenant?</p>
            <a
              href="/register"
              className="inline-block w-full py-2.5 text-center rounded-lg border-2 border-primary-600 text-primary-600 font-semibold hover:bg-primary-50 transition-colors"
            >
              Create a tenant account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
