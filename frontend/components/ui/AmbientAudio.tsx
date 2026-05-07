'use client';
import { useState, useRef, useCallback } from 'react';

/* ── Web Audio ambient soundscape ───────────────────────────────────
   Layered sine drones + LFO tremolo + filtered noise.
   All generated in-browser — no external files needed.
─────────────────────────────────────────────────────────────────── */

function buildSoundscape(ctx: AudioContext): GainNode {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 4);
  master.connect(ctx.destination);

  // Drone layers: A-minor pentatonic voicing spread over 3 octaves
  const layers = [
    { freq: 55.00, amp: 0.30, lfo: 0.07, detune:  3 },  // A1
    { freq: 82.41, amp: 0.20, lfo: 0.11, detune: -4 },  // E2
    { freq: 110.0, amp: 0.14, lfo: 0.09, detune:  5 },  // A2
    { freq: 130.8, amp: 0.09, lfo: 0.06, detune: -2 },  // C3
    { freq: 164.8, amp: 0.06, lfo: 0.13, detune:  6 },  // E3
    { freq: 220.0, amp: 0.04, lfo: 0.05, detune: -5 },  // A3
  ];

  layers.forEach(({ freq, amp, lfo: lfoRate, detune }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lpf  = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detune;

    // Slow tremolo via LFO
    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = lfoRate;
    lfoGain.gain.value  = amp * 0.28;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    lpf.type = 'lowpass';
    lpf.frequency.value = 500;
    lpf.Q.value = 0.4;

    gain.gain.value = amp;
    osc.connect(lpf);
    lpf.connect(gain);
    gain.connect(master);
    osc.start();
  });

  // Textural filtered noise — very low level
  const SR = ctx.sampleRate;
  const buf = ctx.createBuffer(1, SR * 3, SR);
  const ch  = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop   = true;

  const nbpf = ctx.createBiquadFilter();
  nbpf.type = 'bandpass';
  nbpf.frequency.value = 90;
  nbpf.Q.value = 0.5;

  const ng = ctx.createGain();
  ng.gain.value = 0.03;

  noise.connect(nbpf);
  nbpf.connect(ng);
  ng.connect(master);
  noise.start();

  return master;
}

/* ── Animated bars icon ─────────────────────────────────────────── */
function SoundBars() {
  return (
    <div className="flex items-end gap-[3px] h-4">
      {[0.4, 0.9, 0.6, 1.0, 0.7].map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: 'rgba(255,255,255,0.75)',
            height: `${h * 100}%`,
            animation: `audioBar 0.7s ease-in-out ${i * 0.11}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export default function AmbientAudio() {
  const [playing,  setPlaying]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const ctxRef    = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const toggle = useCallback(() => {
    if (loading) return;

    if (!playing) {
      setLoading(true);
      const ctx = new AudioContext();
      ctxRef.current    = ctx;
      masterRef.current = buildSoundscape(ctx);
      setLoading(false);
      setPlaying(true);
    } else {
      const ctx    = ctxRef.current;
      const master = masterRef.current;
      if (ctx && master) {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
        setTimeout(async () => {
          await ctx.close();
          ctxRef.current    = null;
          masterRef.current = null;
          setPlaying(false);
        }, 1300);
      }
    }
  }, [playing, loading]);

  return (
    <button
      onClick={toggle}
      title={playing ? 'Pause ambient audio' : 'Play ambient audio'}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-300 select-none"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border:     '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(12px)',
        color: 'rgba(255,255,255,0.65)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.06em',
      }}
    >
      {loading ? (
        <div className="w-4 h-4 rounded-full border border-white/30 border-t-white/80 animate-spin" />
      ) : playing ? (
        <SoundBars />
      ) : (
        /* Muted speaker icon */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      )}
      <span style={{ fontSize: 11 }}>{playing ? 'AMBIENT' : 'SOUND'}</span>
    </button>
  );
}
