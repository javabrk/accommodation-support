'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { setTokens, setUser } from '@/lib/auth';
import { Eye, EyeOff, ArrowRight, Users, ShieldCheck, Star } from 'lucide-react';

/* ── Inline SVG city silhouette ───────────────────────────────────── */
function CitySilhouette() {
  return (
    <svg viewBox="0 0 900 260" preserveAspectRatio="xMidYMax meet"
      className="absolute bottom-0 left-0 w-full" aria-hidden="true">
      {/* Sky glow */}
      <defs>
        <radialGradient id="moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="bldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f"/>
          <stop offset="100%" stopColor="#0a1520"/>
        </linearGradient>
        <linearGradient id="bldgLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#243b55"/>
          <stop offset="100%" stopColor="#0d1f33"/>
        </linearGradient>
      </defs>

      {/* Moon glow */}
      <circle cx="750" cy="55" r="60" fill="url(#moon)" opacity="0.6"/>
      <circle cx="750" cy="55" r="24" fill="#fde68a" opacity="0.85"/>
      <circle cx="750" cy="55" r="18" fill="#fef3c7"/>

      {/* Stars */}
      {[
        [80,35],[160,20],[300,45],[420,18],[530,38],[620,22],[820,40],[860,15],
        [130,60],[380,30],[680,50],[200,10],[450,55],[700,28],
      ].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={Math.random() > 0.5 ? 1.5 : 1} fill="white" opacity={0.6 + (i % 4) * 0.1}/>
      ))}

      {/* Far background buildings */}
      <rect x="0"   y="160" width="70"  height="100" fill="url(#bldg)" opacity="0.5"/>
      <rect x="60"  y="140" width="50"  height="120" fill="url(#bldg)" opacity="0.5"/>
      <rect x="200" y="150" width="80"  height="110" fill="url(#bldg)" opacity="0.5"/>
      <rect x="600" y="145" width="60"  height="115" fill="url(#bldg)" opacity="0.5"/>
      <rect x="720" y="155" width="90"  height="105" fill="url(#bldg)" opacity="0.5"/>
      <rect x="820" y="140" width="80"  height="120" fill="url(#bldg)" opacity="0.5"/>

      {/* Mid buildings */}
      <rect x="10"  y="130" width="55" height="130" fill="url(#bldgLight)"/>
      <rect x="55"  y="100" width="45" height="160" fill="url(#bldgLight)"/>
      <rect x="90"  y="120" width="60" height="140" fill="url(#bldgLight)"/>
      <rect x="280" y="110" width="70" height="150" fill="url(#bldgLight)"/>
      <rect x="340" y="90"  width="50" height="170" fill="url(#bldgLight)"/>
      <rect x="580" y="115" width="65" height="145" fill="url(#bldgLight)"/>
      <rect x="640" y="95"  width="55" height="165" fill="url(#bldgLight)"/>
      <rect x="750" y="125" width="80" height="135" fill="url(#bldgLight)"/>
      <rect x="820" y="108" width="80" height="152" fill="url(#bldgLight)"/>

      {/* Lit windows (amber) */}
      {[
        [18,140],[28,140],[18,160],[28,160],[18,180],[28,180],
        [62,110],[72,110],[62,130],[72,130],[62,150],[72,150],
        [98,130],[110,130],[98,150],[110,150],
        [288,120],[300,120],[288,140],[300,140],[288,160],[300,160],
        [348,100],[360,100],[348,120],[360,120],[348,140],[360,140],
        [588,125],[600,125],[588,145],[600,145],
        [648,105],[660,105],[648,125],[660,125],
        [758,135],[770,135],[758,155],[770,155],
        [828,115],[840,115],[828,135],[840,135],[828,155],[840,155],
      ].map(([x,y],i) => (
        <rect key={i} x={x} y={y} width="7" height="5" rx="1"
          fill={i % 5 === 0 ? '#fde68a' : i % 3 === 0 ? '#fbbf24' : '#fef3c7'}
          opacity={0.8 + (i % 3) * 0.07}/>
      ))}

      {/* Foreground houses */}
      {/* House 1 */}
      <rect x="145" y="175" width="75" height="85" fill="#0f2744"/>
      <polygon points="145,175 182,140 220,175" fill="#0d2038"/>
      <rect x="168" y="200" width="18" height="22" rx="2" fill="#fbbf24" opacity="0.85"/>
      {/* chimney */}
      <rect x="200" y="148" width="8" height="20" fill="#0d2038"/>
      {/* door */}
      <rect x="168" y="220" width="18" height="5" rx="1" fill="#1a3a5c"/>

      {/* House 2 */}
      <rect x="455" y="165" width="90" height="95" fill="#0f2744"/>
      <polygon points="455,165 500,122 545,165" fill="#0d2038"/>
      <rect x="480" y="195" width="20" height="25" rx="2" fill="#fde68a" opacity="0.9"/>
      <rect x="465" y="185" width="14" height="12" rx="1" fill="#fbbf24" opacity="0.7"/>
      <rect x="516" y="185" width="14" height="12" rx="1" fill="#fbbf24" opacity="0.7"/>
      <rect x="504" y="215" width="12" height="6" rx="1" fill="#1a3a5c"/>

      {/* House 3 */}
      <rect x="880" y="170" width="20" height="90" fill="#0f2744"/>
      <rect x="860" y="185" width="55" height="75" fill="#0f2744"/>
      <polygon points="860,185 887,155 915,185" fill="#0d2038"/>
      <rect x="875" y="205" width="15" height="18" rx="1" fill="#fde68a" opacity="0.8"/>

      {/* Road */}
      <rect x="0" y="255" width="900" height="8" fill="#071018"/>
      {/* Dotted centre line */}
      {[0,80,160,240,320,400,480,560,640,720,800].map((x,i) => (
        <rect key={i} x={x+25} y="257" width="30" height="3" rx="1.5" fill="#1a3a5c"/>
      ))}
    </svg>
  );
}

/* ── Floating stat card ──────────────────────────────────────────── */
function FloatCard({ icon, value, label, delay = '0s', className = '' }: {
  icon: string; value: string; label: string; delay?: string; className?: string;
}) {
  return (
    <div className={`absolute glass-card px-4 py-3 flex items-center gap-3 animate-float ${className}`}
      style={{ animationDelay: delay }}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-white font-bold text-sm leading-none">{value}</p>
        <p className="text-white/60 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

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

      {/* ── Left hero panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a1520 0%, #0f2744 45%, #142d55 70%, #0d1f38 100%)' }}>

        {/* Subtle animated gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full animate-float-slow pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)' }}/>
        <div className="absolute top-40 right-10 w-56 h-56 rounded-full animate-float pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', animationDelay: '1.5s' }}/>
        <div className="absolute bottom-40 left-1/3 w-48 h-48 rounded-full animate-float-slow pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.14) 0%, transparent 70%)', animationDelay: '0.8s' }}/>

        {/* City silhouette */}
        <CitySilhouette />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-up">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}>
              <span className="text-white text-xl">🏠</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-none">SupportHome</p>
              <p className="text-blue-300/70 text-xs">UK Social Support Housing</p>
            </div>
          </div>

          {/* Main heading */}
          <div className="mt-14 mb-8 animate-fade-up stagger-1">
            <h1 className="text-5xl font-extrabold leading-tight mb-5"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 60%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Every home,<br />every tenant,<br />one platform.
            </h1>
            <p className="text-blue-200/70 text-lg leading-relaxed max-w-sm">
              Comprehensive accommodation management for housing officers and support workers across the UK.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 animate-fade-up stagger-2">
            {[
              { icon: '🏡', label: 'Properties' },
              { icon: '👥', label: 'Tenants' },
              { icon: '💷', label: 'Benefits' },
              { icon: '🎫', label: 'Tickets' },
              { icon: '📋', label: 'Inspections' },
            ].map(({ icon, label }) => (
              <div key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 border border-white/10"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>

          {/* Floating stat cards */}
          <FloatCard icon="🏘️" value="Properties"    label="Track availability"  delay="0s"    className="bottom-52 right-8  animate-fade-up stagger-3" />
          <FloatCard icon="✅" value="Benefits"       label="Weekly HB tracking"  delay="0.5s"  className="bottom-36 right-28 animate-fade-up stagger-4" />
          <FloatCard icon="🔑" value="Secure"         label="Role-based access"   delay="1s"    className="bottom-20 right-6  animate-fade-up stagger-5" />
        </div>

        {/* Bottom accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, #2563eb, #14b8a6, #f59e0b, #2563eb)', backgroundSize: '200% 100%' }}/>
      </div>

      {/* ── Right form panel ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-warm-50 relative overflow-hidden">

        {/* Subtle background pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%230f172a\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")'}}/>

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8 animate-fade-up">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-xl shadow-glow-blue">🏠</div>
            <div>
              <p className="font-bold text-gray-900">SupportHome</p>
              <p className="text-xs text-gray-400">UK Social Support Housing</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 animate-fade-up stagger-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500">Sign in to manage your accommodation services</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-up stagger-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="animate-fade-up stagger-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-11"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <div className="animate-fade-up stagger-4">
              <button type="submit" disabled={loading}
                className="btn-primary btn-shimmer w-full py-3 text-base rounded-xl">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Signing in…
                  </>
                ) : (
                  <>Sign in <ArrowRight className="w-4 h-4"/></>
                )}
              </button>
            </div>
          </form>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-6 animate-fade-up stagger-5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500"/> Secure login
            </div>
            <div className="w-px h-3 bg-gray-200"/>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400"/> UK Housing Platform
            </div>
          </div>

          {/* Divider + Register */}
          <div className="mt-7 pt-7 border-t border-gray-200 animate-fade-up stagger-6">
            <p className="text-center text-sm text-gray-500 mb-3">New tenant? Create your account</p>
            <a href="/register"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-primary-200 text-primary-700 font-semibold text-sm hover:border-primary-400 hover:bg-primary-50 hover:-translate-y-px transition-all duration-150">
              <Users className="w-4 h-4"/> Create a tenant account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
