'use client';
import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let rafId  = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) setVisible(true);
    };
    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);

    // Grow ring on interactive elements
    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const interactive = el.closest('a,button,input,textarea,select,[role="button"]');
      setHovering(!!interactive);
    };

    const loop = () => {
      // Dot snaps to cursor
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX - 5}px, ${mouseY - 5}px)`;
      }
      // Ring lags behind with lerp
      ringX += (mouseX - ringX) * 0.10;
      ringY += (mouseY - ringY) * 0.10;
      if (ringRef.current) {
        const size = hovering ? 56 : 36;
        ringRef.current.style.transform = `translate(${ringX - size / 2}px, ${ringY - size / 2}px)`;
        ringRef.current.style.width  = `${size}px`;
        ringRef.current.style.height = `${size}px`;
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover',  onOver);
    document.documentElement.addEventListener('mouseenter', onEnter);
    document.documentElement.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover',  onOver);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, [hovering, visible]);

  // Only show on non-touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null;

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full mix-blend-difference"
        style={{
          width: 10, height: 10,
          background: '#ffffff',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s',
          willChange: 'transform',
        }}
      />
      {/* Lagging ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full mix-blend-difference"
        style={{
          border: '1.5px solid rgba(255,255,255,0.6)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s, width 0.25s ease, height 0.25s ease',
          willChange: 'transform, width, height',
        }}
      />
    </>
  );
}
