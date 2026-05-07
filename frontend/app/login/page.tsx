'use client';
import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { setTokens, setUser } from '@/lib/auth';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

/* ── Particle canvas ─────────────────────────────────────────────── */
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

    const count = Math.floor((W * H) / 14000);
    const dots = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      opacity: Math.random() * 0.5 + 0.1,
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
      // Connect nearby dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(201,168,92,${0.06 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', onResize);
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ── Main login page ─────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(email, password);
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.firstName}`);
      if (data.user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/client/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg)' }}>

      {/* Particle field */}
      {mounted && <ParticleField />}

      {/* Radial glow — centre */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,92,0.045) 0%, transparent 70%)' }}/>

      {/* ── Large background text ──────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ opacity: 0.022 }}>
        <span className="text-white font-black text-[22vw] leading-none tracking-tighter whitespace-nowrap">
          SUPPORT
        </span>
        <span className="text-white font-black text-[22vw] leading-none tracking-tighter whitespace-nowrap">
          HOME
        </span>
      </div>

      {/* ── Form card ─────────────────────────────────────────── */}
      <div className={`relative z-10 w-full max-w-sm mx-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(201,168,92,0.12)', border: '1px solid rgba(201,168,92,0.25)' }}>
              🏠
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl animate-pulse-ring"
              style={{ border: '1px solid rgba(201,168,92,0.3)' }}/>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            SupportHome
          </h1>
          <p className="text-xs mt-1 tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
            Housing Management Platform
          </p>
        </div>

        {/* Form panel */}
        <div className="rounded-2xl p-7"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>

          <p className="text-sm font-semibold mb-6" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            SIGN IN
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <input type="email" className="input-field" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-11"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 mt-2 rounded-xl text-sm font-bold tracking-wide">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-dark-950/40 border-t-dark-950 animate-spin"/>
                  Signing in
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue <ArrowRight className="w-4 h-4"/>
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 divider"/>

          {/* Register CTA */}
          <div className="text-center">
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              NEW TENANT?
            </p>
            <a href="/register"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                border: '1px solid rgba(201,168,92,0.25)',
                color: 'var(--gold)',
                background: 'rgba(201,168,92,0.05)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,92,0.10)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,92,0.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,92,0.05)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,92,0.25)';
              }}>
              Create an account
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          © {new Date().getFullYear()} SUPPORTHOME · UK
        </p>
      </div>
    </div>
  );
}
