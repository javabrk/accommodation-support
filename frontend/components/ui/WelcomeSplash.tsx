'use client';
import { useEffect, useState } from 'react';

export default function WelcomeSplash() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    // Start fading after 2.2 s, fully gone at 2.9 s
    const fadeTimer  = setTimeout(() => setPhase('fading'), 2200);
    const goneTimer  = setTimeout(() => setPhase('gone'),   2900);
    return () => { clearTimeout(fadeTimer); clearTimeout(goneTimer); };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          9999,
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        background:      'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f766e 100%)',
        transition:      'opacity 0.7s ease',
        opacity:         phase === 'fading' ? 0 : 1,
        pointerEvents:   phase === 'fading' ? 'none' : 'all',
      }}
    >
      {/* House icon */}
      <div style={{
        fontSize:     '3.5rem',
        marginBottom: '1.25rem',
        animation:    'splashFloat 2s ease-in-out infinite',
      }}>
        🏠
      </div>

      {/* Company name */}
      <h1 style={{
        margin:        0,
        color:         '#ffffff',
        fontSize:      'clamp(1.6rem, 5vw, 2.6rem)',
        fontWeight:    800,
        letterSpacing: '0.04em',
        textAlign:     'center',
        lineHeight:    1.15,
        animation:     'splashFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        SS<span style={{ color: '#2dd4bf' }}>ACCOMMODATIONS</span>
      </h1>

      {/* Tagline */}
      <p style={{
        margin:        '0.65rem 0 0',
        color:         'rgba(148,163,184,0.85)',
        fontSize:      '0.82rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        animation:     'splashFadeUp 0.6s 0.15s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        Housing Management Platform
      </p>

      {/* Thin progress bar */}
      <div style={{
        position:     'absolute',
        bottom:       0,
        left:         0,
        height:       '3px',
        background:   '#2dd4bf',
        animation:    'splashBar 2.2s linear forwards',
        borderRadius: '0 2px 2px 0',
      }}/>

      <style>{`
        @keyframes splashFloat {
          0%,100% { transform: translateY(0);    }
          50%      { transform: translateY(-8px); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes splashBar {
          from { width: 0%;    }
          to   { width: 100%;  }
        }
      `}</style>
    </div>
  );
}
