'use client';

import Here from '@/components/main/here';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const STREAKS = [
  { x1: 1900, y1: -60, x2: -200, y2: 1140, color: '#22d3ee', w: 1.5, op: 0.18 },
  { x1: 1680, y1: -60, x2: -420, y2: 1140, color: '#a855f7', w: 1.0, op: 0.13 },
  { x1: 2120, y1: -60, x2:   20, y2: 1140, color: '#22d3ee', w: 0.8, op: 0.10 },
  { x1: 1460, y1: -60, x2: -640, y2: 1140, color: '#a855f7', w: 1.5, op: 0.15 },
  { x1: 2340, y1: -60, x2:  240, y2: 1140, color: '#22d3ee', w: 1.0, op: 0.08 },
  { x1: 1240, y1: -60, x2: -860, y2: 1140, color: '#a855f7', w: 0.8, op: 0.10 },
  { x1: 2560, y1: -60, x2:  460, y2: 1140, color: '#22d3ee', w: 1.2, op: 0.06 },
  { x1: 1020, y1: -60, x2:-1080, y2: 1140, color: '#a855f7', w: 1.0, op: 0.07 },
];

export default function AuthPage() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMouseEnter = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.classList.remove('btn-wiggle');
    void btn.offsetWidth;
    btn.classList.add('btn-wiggle');
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    setIsLoading(false);
  };

  return (
    <main style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>

      {/* ── LAYER 0: Aurora WebGL background ── */}
      <Here />

      {/* ── LAYER 1: Neon streak overlay ── */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1920 1080"
      >
        <defs>
          <filter id="gc" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="gp" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {STREAKS.map((s, i) => (
          <line
            key={i}
            x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={s.color}
            strokeWidth={s.w}
            opacity={s.op}
            filter={s.color === '#22d3ee' ? 'url(#gc)' : 'url(#gp)'}
          />
        ))}
      </svg>

      {/* ── LAYER 2: Split layout ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex' }}>

        {/* LEFT PANEL */}
        <div style={{
          flex: 3,
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 48px 32px',
        }}>

          {/* Back */}
          <Link
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', marginBottom: 20, width: 'fit-content',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>

          {/* Video card + TRY OUT — same container, same left edge */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, maxWidth: 435, width: '100%', margin: '0 auto' }}>

            {/* Glassmorphism Video Card — cyan glow */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              borderRadius: 18, overflow: 'hidden',
              background: 'rgba(0,0,0,0.38)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(34,211,238,0.30)',
              boxShadow: '0 0 28px rgba(34,211,238,0.22), 0 0 72px rgba(34,211,238,0.08)',
            }}>

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.16)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.65)"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0, lineHeight: 1.3 }}>
                    고죠 사토루 료이키텐카이 무량공처
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.36)', fontSize: 11, margin: '2px 0 0' }}>
                    브라더
                  </p>
                </div>
              </div>

              {/* YouTube iframe — square */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
                <iframe
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', border: 'none' }}
                  src="https://www.youtube.com/embed/0n2uOC8WNqs"
                  title="Product demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Bottom bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', flexShrink: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.30))',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="18" cy="5" r="3" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                    <circle cx="6" cy="12" r="3" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                    <circle cx="18" cy="19" r="3" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                  </svg>
                  <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>0:00 / 3:42</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>다음에 보기</span>
                  <svg width="52" height="14" viewBox="0 0 90 22" xmlns="http://www.w3.org/2000/svg">
                    <rect width="90" height="22" rx="3" fill="#FF0000"/>
                    <polygon points="28,5 28,17 42,11" fill="white"/>
                    <text x="47" y="15" fill="white" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="bold">YouTube</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* TRY OUT — left-aligned with video card */}
            <div style={{ flexShrink: 0 }}>
              <span
                className="font-bangers"
                style={{
                  display: 'block',
                  fontSize: 'clamp(60px, 9vw, 148px)',
                  color: '#ffffff',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  textShadow: '0 0 80px rgba(255,255,255,0.12)',
                }}
              >
                TRY OUT
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          flex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 48px',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Login card — purple glow */}
          <div style={{
            width: '100%', maxWidth: 340,
            borderRadius: 24, padding: '36px 28px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(168,85,247,0.30)',
            boxShadow: '0 0 28px rgba(168,85,247,0.22), 0 0 72px rgba(168,85,247,0.08)',
          }}>

            {/* Heading */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
                Welcome Back
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, margin: '8px 0 0' }}>
                Sign in to create amazing thumbnails
              </p>
            </div>

            {/* Google button */}
            <button
              ref={btnRef}
              onMouseEnter={handleMouseEnter}
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: '11px 16px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1, transition: 'opacity 0.2s',
              }}
            >
              {isLoading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: 4, animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="#4285F4" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4"/>
                  <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginLeft: 4 }}>
                  <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                  <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.891772 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
                </svg>
              )}
              <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)', paddingRight: 24 }}>
                {isLoading ? 'Redirecting...' : 'Continue with Google'}
              </span>
            </button>

            {/* Disclaimer */}
            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, textAlign: 'center', lineHeight: 1.75, margin: 0 }}>
              By continuing, you agree to our<br/>
              <Link href="/terms-of-service" style={{ color: 'rgba(168,85,247,0.65)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy-policy" style={{ color: 'rgba(168,85,247,0.65)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
