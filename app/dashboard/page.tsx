'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, LogOut, RotateCcw, X, Layers, ImageOff, CreditCard } from 'lucide-react';
import Image from 'next/image';
import {
  PromptArea,
  CopyPromptButton,
  type AttachedImage,
  type AspectRatio,
  type ImageStyle,
} from '@/components/dashboard/promptarea';
import Loader from '@/components/dashboard/loader';
import { PricingModal } from '@/components/dashboard/pricing-modal';
import { createClient } from '@/lib/supabase/client';

const BG         = '#10101a';
const CARD_SHADOW = '0 0 0 1px rgba(96,165,250,0.04), 0 8px 40px rgba(0,0,0,0.55), 0 0 60px rgba(99,102,241,0.05)';

type RecentThumb = { id: string; prompt: string; signedUrl: string };
type Phase = 'idle' | 'generating' | 'success' | 'error';

const SIDEBAR_W = 272;

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  const [phase, setPhase]                   = useState<Phase>('idle');
  const [generatedImage, setGeneratedImage] = useState<{ src: string; prompt: string; enhancedPrompt?: string } | null>(null);
  const [generateError, setGenerateError]   = useState<string | null>(null);
  const [showEnhanced, setShowEnhanced]     = useState(false);
  const [hoveredThumb, setHoveredThumb]     = useState<string | null>(null);

  const [recentThumbs, setRecentThumbs] = useState<RecentThumb[]>([]);
  const [lightbox, setLightbox]         = useState<RecentThumb | null>(null);
  const [pricingOpen, setPricingOpen]   = useState(false);
  const [plan, setPlan]                 = useState<string>('free');
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchRecentThumbs = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('thumbnail').select('id, prompt, image_path')
      .order('created_at', { ascending: false }).limit(20);
    if (!data?.length) return;
    const withUrls = await Promise.all(data.map(async (t) => {
      const { data: signed } = await supabase.storage.from('keep_img').createSignedUrl(t.image_path, 3600);
      return { id: t.id, prompt: t.prompt ?? '', signedUrl: signed?.signedUrl ?? '' };
    }));
    setRecentThumbs(withUrls.filter((t) => t.signedUrl));
  }, []);

  const fetchPlan = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('users').select('plan').single();
    if (data?.plan) setPlan(data.plan);
  }, []);

  useEffect(() => { if (!isLoading && !user) router.replace('/auth'); }, [user, isLoading, router]);
  useEffect(() => { if (user) { fetchRecentThumbs(); fetchPlan(); } }, [user, fetchRecentThumbs, fetchPlan]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/portal');
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleGenerate = async (
    prompt: string, attachments: AttachedImage[], ratio: AspectRatio, style: ImageStyle
  ) => {
    setPhase('generating'); setGeneratedImage(null); setGenerateError(null);
    try {
      const attachData = attachments.slice(0, 3).map((a) => ({
        mimeType: a.mimeType, data: a.dataUrl.split(',')[1],
      }));
      const res  = await fetch('/api/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, attachments: attachData, ratio, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setGeneratedImage({
        src: `data:${data.mimeType};base64,${data.imageData}`,
        prompt,
        enhancedPrompt: data.enhancedPrompt,
      });
      setShowEnhanced(false);
      setPhase('success');
      setTimeout(fetchRecentThumbs, 1500);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('error');
    }
  };

  const downloadFromUrl = async (url: string, filename: string) => {
    const res = await fetch(url); const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = blobUrl; a.download = filename; a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleSignOut = async () => { await signOut(); router.replace('/'); };

  if (isLoading || !user) {
    return (
      <div style={{ width: '100%', height: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(96,165,250,0.2)', borderTopColor: '#60a5fa', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <main style={{ position: 'fixed', inset: 0, background: BG, display: 'flex', overflow: 'hidden' }}>

      {/* ── Mesh gradient ─────────── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: [
          'radial-gradient(ellipse 70% 55% at 10% 5%, rgba(99,102,241,0.13) 0%, transparent 55%)',
          'radial-gradient(ellipse 55% 65% at 92% 90%, rgba(96,165,250,0.09) 0%, transparent 55%)',
          'radial-gradient(ellipse 65% 45% at 82% 8%, rgba(139,92,246,0.08) 0%, transparent 50%)',
          'radial-gradient(ellipse 40% 50% at 15% 85%, rgba(34,211,238,0.05) 0%, transparent 50%)',
        ].join(', '),
      }} />

      {/* ── Grid texture ─────────── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.022,
        backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      {/* ══════════════════════════════════════════════
          LEFT SIDEBAR — logo + gallery + user
         ══════════════════════════════════════════════ */}
      <aside style={{
        width: SIDEBAR_W, flexShrink: 0,
        position: 'relative', zIndex: 20,
        display: 'flex', flexDirection: 'column',
        background: 'rgba(14,16,30,0.72)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(96,165,250,0.08)',
      }}>

        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #60a5fa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(99,102,241,0.5)',
            }}>
              <Layers size={13} color="#fff" />
            </div>
            <span className="font-bangers" style={{ fontSize: 20, color: '#f1f5f9', letterSpacing: '0.1em', lineHeight: 1 }}>
              TRY OUT
            </span>
          </div>
        </div>

        {/* Recent Generations (fills remaining height, scrollable) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Section header */}
          <div style={{ padding: '14px 20px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', boxShadow: '0 0 6px rgba(96,165,250,0.6)' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase' }}>
                Recent
              </span>
            </div>
            {recentThumbs.length > 0 && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '1px 7px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {recentThumbs.length}
              </span>
            )}
          </div>

          {/* Vertical thumbnail list */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '0 12px 12px', minHeight: 0,
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(96,165,250,0.15) transparent',
          }}>
            {recentThumbs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 0', color: 'rgba(255,255,255,0.18)' }}>
                <ImageOff size={22} strokeWidth={1.2} />
                <p style={{ fontSize: 11, margin: 0, textAlign: 'center', lineHeight: 1.55 }}>
                  생성한 썸네일이<br />여기에 나타납니다
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentThumbs.map((thumb, idx) => (
                  <motion.div
                    key={thumb.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    onClick={() => setLightbox(thumb)}
                    onMouseEnter={() => setHoveredThumb(thumb.id)}
                    onMouseLeave={() => setHoveredThumb(null)}
                    style={{
                      position: 'relative',
                      width: '100%', aspectRatio: '16/9',
                      borderRadius: 9, overflow: 'hidden',
                      cursor: 'pointer', flexShrink: 0,
                      border: hoveredThumb === thumb.id
                        ? '1px solid rgba(96,165,250,0.42)'
                        : '1px solid rgba(255,255,255,0.07)',
                      transform: hoveredThumb === thumb.id ? 'scale(1.025)' : 'scale(1)',
                      transition: 'transform 0.22s ease, border-color 0.22s, box-shadow 0.22s',
                      boxShadow: hoveredThumb === thumb.id
                        ? '0 0 14px rgba(96,165,250,0.18), 0 4px 18px rgba(0,0,0,0.5)'
                        : '0 2px 10px rgba(0,0,0,0.35)',
                    }}
                  >
                    <Image
                      src={thumb.signedUrl}
                      alt={thumb.prompt}
                      fill
                      sizes={`${SIDEBAR_W - 24}px`}
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                    {/* Hover overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(10,12,24,0.9) 0%, rgba(10,12,24,0.15) 55%, transparent 100%)',
                      opacity: hoveredThumb === thumb.id ? 1 : 0,
                      transition: 'opacity 0.22s',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      padding: '6px 8px', gap: 4,
                    }}>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9.5, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                        {thumb.prompt}
                      </p>
                      <CopyPromptButton prompt={thumb.prompt} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User profile */}
        <div style={{ padding: '13px 16px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            {user.user_metadata?.avatar_url ? (
              <Image src={user.user_metadata.avatar_url} alt="avatar" width={30} height={30}
                style={{ borderRadius: '50%', border: '1px solid rgba(96,165,250,0.3)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.7), rgba(96,165,250,0.7))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <p style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.user_metadata?.full_name || 'User'}
                </p>
                {plan === 'ultra' && (
                  <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '1px 6px', borderRadius: 4, background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.12))', border: '1px solid rgba(251,191,36,0.35)', color: '#fbbf24', textTransform: 'uppercase' }}>
                    Ultra
                  </span>
                )}
                {plan === 'pro' && (
                  <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '1px 6px', borderRadius: 4, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.12))', border: '1px solid rgba(99,102,241,0.4)', color: '#a78bfa', textTransform: 'uppercase' }}>
                    Pro
                  </span>
                )}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </p>
            </div>
          </div>
          {plan !== 'free' ? (
            <button onClick={handleManageSubscription} disabled={portalLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 11px', borderRadius: 9, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)', color: 'rgba(165,148,252,0.85)', cursor: portalLoading ? 'default' : 'pointer', fontSize: 12, transition: 'all 0.18s', marginBottom: 7, opacity: portalLoading ? 0.6 : 1 }}
              onMouseEnter={(e) => { if (!portalLoading) { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(99,102,241,0.18)'; el.style.borderColor = 'rgba(99,102,241,0.42)'; el.style.color = '#c4b5fd'; } }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(99,102,241,0.08)'; el.style.borderColor = 'rgba(99,102,241,0.22)'; el.style.color = 'rgba(165,148,252,0.85)'; }}
            >
              <CreditCard size={12} /><span>{portalLoading ? 'Loading…' : 'Manage Subscription'}</span>
            </button>
          ) : (
            <button onClick={() => setPricingOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 11px', borderRadius: 9, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)', color: 'rgba(165,148,252,0.85)', cursor: 'pointer', fontSize: 12, transition: 'all 0.18s', marginBottom: 7 }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(99,102,241,0.18)'; el.style.borderColor = 'rgba(99,102,241,0.42)'; el.style.color = '#c4b5fd'; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(99,102,241,0.08)'; el.style.borderColor = 'rgba(99,102,241,0.22)'; el.style.color = 'rgba(165,148,252,0.85)'; }}
            >
              <CreditCard size={12} /><span>Upgrade Plan</span>
            </button>
          )}
          <button onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.36)', cursor: 'pointer', fontSize: 12, transition: 'all 0.18s' }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = 'rgba(248,113,113,0.9)'; el.style.borderColor = 'rgba(248,113,113,0.2)'; el.style.background = 'rgba(248,113,113,0.06)'; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = 'rgba(255,255,255,0.36)'; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <LogOut size={12} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT — result + prompt (centered, fixed height)
         ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 40px',
          gap: 18,
          overflow: 'hidden',
        }}>
          <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Result area — only when not idle */}
            <AnimatePresence mode="wait">
              {phase === 'generating' && (
                <motion.div key="loader"
                  initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.28, ease: [0.4,0,0.2,1] }}>
                  <Loader />
                </motion.div>
              )}

              {phase === 'success' && generatedImage && (
                <motion.div key="image"
                  initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.4,0,0.2,1] }}>

                  <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(96,165,250,0.2)', boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 0 120px rgba(96,165,250,0.06), 0 24px 60px rgba(0,0,0,0.6)', position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={generatedImage.src} alt={generatedImage.prompt} style={{ width: '100%', display: 'block' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(10,12,24,0.95), transparent)', padding: '34px 16px 14px', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                      <p style={{ flex: 1, color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {generatedImage.prompt}
                      </p>
                      <button
                        onClick={() => { const a = document.createElement('a'); a.href = generatedImage.src; a.download = 'thumbnail.jpg'; a.click(); }}
                        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 9, background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.45)', color: '#a5b4fc', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.38)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.25)'; }}
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>

                  {/* Gemini prompt inspector */}
                  {generatedImage.enhancedPrompt && (
                    <div style={{ marginTop: 8, borderRadius: 10, border: '1px solid rgba(96,165,250,0.12)', overflow: 'hidden', background: 'rgba(14,18,32,0.85)' }}>
                      <button
                        onClick={() => setShowEnhanced((v) => !v)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(96,165,250,0.65)', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}
                      >
                        <span>🔍 Gemini Enhanced Prompt</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', display: 'inline-block', transition: 'transform 0.2s', transform: showEnhanced ? 'rotate(180deg)' : 'none' }}>▾</span>
                      </button>
                      {showEnhanced && (
                        <p style={{ margin: 0, padding: '10px 13px 12px', fontSize: 11, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          {generatedImage.enhancedPrompt}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {phase === 'error' && generateError && (
                <motion.div key="error"
                  initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4,0,0.2,1] }}>
                  <div style={{ borderRadius: 16, padding: '40px 28px', background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.1)', boxShadow: CARD_SHADOW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={18} color="rgba(248,113,113,0.9)" />
                    </div>
                    <div style={{ textAlign: 'center', maxWidth: 400 }}>
                      <p style={{ color: 'rgba(252,165,165,0.95)', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Generation Failed</p>
                      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13, margin: 0, lineHeight: 1.65 }}>{generateError}</p>
                    </div>
                    <button onClick={() => setPhase('idle')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.38)', fontSize: 13, cursor: 'pointer', transition: 'all 0.18s' }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.color = 'rgba(255,255,255,0.7)'; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = 'rgba(255,255,255,0.38)'; }}
                    >
                      <RotateCcw size={12} /> Try again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PromptArea — always centered */}
            <PromptArea isGenerating={phase === 'generating'} onGenerate={handleGenerate} />

          </div>
        </div>
      </div>

      {/* ── Lightbox ────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div key="lightbox"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(5,6,14,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4,0,0.2,1] }}
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'relative', width: '100%', maxWidth: 900, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(96,165,250,0.2)', boxShadow: '0 0 80px rgba(99,102,241,0.15), 0 32px 80px rgba(0,0,0,0.85)' }}
            >
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                <Image src={lightbox.signedUrl} alt={lightbox.prompt} fill sizes="900px" style={{ objectFit: 'cover' }} unoptimized priority />
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(10,12,24,0.97), transparent)', padding: '44px 22px 20px', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <p style={{ flex: 1, color: 'rgba(255,255,255,0.48)', fontSize: 13, margin: 0, lineHeight: 1.55 }}>{lightbox.prompt}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <CopyPromptButton prompt={lightbox.prompt} />
                  <button
                    onClick={() => downloadFromUrl(lightbox.signedUrl, 'thumbnail.jpg')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.45)', color: '#a5b4fc', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.4)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.25)'; }}
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
              <button
                onClick={() => setLightbox(null)}
                style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(10,12,24,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.15)'; el.style.color = '#fff'; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(10,12,24,0.7)'; el.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                <X size={14} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(96,165,250,0.15);border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(96,165,250,0.3)}
      `}</style>
    </main>
  );
}
