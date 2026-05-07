'use client';
import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { setTokens, setUser } from '@/lib/auth';
import { Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

/* ── Floating particle canvas (same as login, lighter density) ───── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let raf = 0;
    const count = Math.floor((W * H) / 20000);
    const dots = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.1 + 0.3,
      vx: (Math.random() - 0.5) * 0.14, vy: (Math.random() - 0.5) * 0.14,
      opacity: Math.random() * 0.4 + 0.08,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,92,${d.opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}/>;
}

const FEATURES = [
  'Submit maintenance and support tickets',
  'View your property and room details',
  'Communicate with your housing officer',
  'Track your housing benefit payments',
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '',
    addressLine1: '', townCity: '', county: '', postcode: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email && !form.phone) { toast.error('Please provide an email or phone number'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email || undefined, phone: form.phone || undefined,
        password: form.password, confirmPassword: form.confirmPassword,
        addressLine1: form.addressLine1 || undefined, townCity: form.townCity || undefined,
        county: form.county || undefined, postcode: form.postcode || undefined,
      });
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      toast.success(`Welcome, ${data.user.firstName}!`);
      router.push('/client/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex overflow-hidden" style={{ background: 'var(--bg)' }}>
      {mounted && <ParticleField />}

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(201,168,92,0.035) 0%, transparent 70%)' }}/>

      {/* ── Left feature panel (desktop) ───────────────────────── */}
      <div className="hidden lg:flex lg:w-[400px] xl:w-[460px] flex-shrink-0 relative z-10 flex-col justify-between p-12"
        style={{ borderRight: '1px solid var(--border)' }}>

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'rgba(201,168,92,0.12)', border: '1px solid rgba(201,168,92,0.25)' }}>
            🏠
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>SupportHome</p>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'var(--gold)', opacity: 0.7 }}>Tenant Portal</p>
          </div>
        </div>

        {/* Headline */}
        <div>
          <div className="mb-8">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--gold)', opacity: 0.8 }}>
              Join SupportHome
            </p>
            <h2 className="text-3xl font-black tracking-tight leading-tight mb-4" style={{ color: 'var(--text)' }}>
              Your accommodation,<br/>your control.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Get access to a personal portal where you can manage your tenancy, raise requests and stay connected.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map((item, i) => (
              <div key={item} className={`flex items-center gap-3 animate-fade-up`} style={{ animationDelay: `${i * 80}ms` }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gold)' }}/>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          © {new Date().getFullYear()} SUPPORTHOME · UK
        </p>
      </div>

      {/* ── Right: Form ─────────────────────────────────────────── */}
      <div className="flex-1 relative z-10 flex items-start justify-center p-6 sm:p-10 overflow-y-auto">
        <div className={`w-full max-w-md py-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="text-xl">🏠</span>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>SupportHome</span>
          </div>

          {/* Heading */}
          <div className="flex items-center gap-3 mb-8">
            <Link href="/login"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,92,0.35)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-muted)' }}/>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Create your account</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Register as a tenant</p>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl p-6 mb-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    First Name *
                  </label>
                  <input className="input-field" value={form.firstName} onChange={set('firstName')} required placeholder="Sarah"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                    Last Name *
                  </label>
                  <input className="input-field" value={form.lastName} onChange={set('lastName')} required placeholder="Mitchell"/>
                </div>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Email <span className="font-normal normal-case tracking-normal opacity-60">(or mobile below)</span>
                </label>
                <input type="email" className="input-field" value={form.email} onChange={set('email')}
                  placeholder="you@example.com" autoComplete="email"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Mobile <span className="font-normal normal-case tracking-normal opacity-60">(or email above)</span>
                </label>
                <input type="tel" className="input-field" value={form.phone} onChange={set('phone')}
                  placeholder="07700 900000" autoComplete="tel"/>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Password *
                </label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input-field pr-11"
                    value={form.password} onChange={set('password')}
                    required minLength={8} placeholder="Min. 8 characters" autoComplete="new-password"/>
                  <button type="button" tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Confirm Password *
                </label>
                <input type="password" className="input-field" value={form.confirmPassword}
                  onChange={set('confirmPassword')} required placeholder="Repeat your password"
                  autoComplete="new-password"/>
              </div>

              {/* Address section */}
              <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
                  Current Address <span className="font-normal">(optional)</span>
                </p>
                <div className="space-y-3">
                  <input className="input-field" value={form.addressLine1} onChange={set('addressLine1')}
                    placeholder="14 Ashdown Crescent"/>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input-field" value={form.townCity} onChange={set('townCity')} placeholder="Manchester"/>
                    <input className="input-field" value={form.county} onChange={set('county')} placeholder="Greater Manchester"/>
                  </div>
                  <input className="input-field uppercase" value={form.postcode} onChange={set('postcode')} placeholder="M4 1LT"/>
                </div>
              </div>

              {/* Notice */}
              <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(201,168,92,0.07)', border: '1px solid rgba(201,168,92,0.2)', color: 'var(--gold)', opacity: 0.85 }}>
                Your account will be reviewed by a housing officer before full activation.
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3 rounded-xl text-sm font-bold tracking-wide">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-dark-950/40 border-t-dark-950 animate-spin"/>
                    Creating account…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account <ArrowRight className="w-4 h-4"/>
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Sign-in link */}
          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--gold)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
