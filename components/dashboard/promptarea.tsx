"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Sparkles, Paperclip, ImageIcon, X, Copy, Check, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const MAX_FILES = 10
const MAX_SIZE_BYTES = 5 * 1024 * 1024

export interface AttachedImage {
  id: string
  dataUrl: string
  mimeType: string
  name: string
}

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3"
export type ImageStyle = "Realistic" | "3D" | "Art" | "Anime"

interface PopoverThumb {
  id: string
  prompt: string
  signedUrl: string
}

interface PromptAreaProps {
  onGenerate?: (
    prompt: string,
    attachments: AttachedImage[],
    ratio: AspectRatio,
    style: ImageStyle
  ) => void
  isGenerating?: boolean
}

const RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:3"]
const STYLES: ImageStyle[] = ["Realistic", "3D", "Art", "Anime"]

/* ── Design tokens ───────────────────────────────── */
const T = {
  cardBg:          'rgba(22,26,45,0.75)',
  cardBorder:      '1px solid rgba(96,165,250,0.13)',
  cardShadow:      '0 0 0 1px rgba(96,165,250,0.04), 0 8px 32px rgba(0,0,0,0.55), 0 0 60px rgba(99,102,241,0.05)',
  inputBg:         'rgba(10,12,24,0.7)',
  inputBorder:     '1px solid rgba(255,255,255,0.08)',
  inputFocusBorder:'1px solid rgba(96,165,250,0.45)',
  inputFocusShadow:'0 0 0 3px rgba(96,165,250,0.08), 0 0 20px rgba(96,165,250,0.1)',
  chipInactive:    'rgba(255,255,255,0.05)',
  chipBorderInact: 'rgba(255,255,255,0.09)',
  neonBlue:        '#60a5fa',
  neonPurple:      '#a78bfa',
  textMuted:       'rgba(255,255,255,0.38)',
  textSubtle:      'rgba(255,255,255,0.22)',
}

export function PromptArea({ onGenerate, isGenerating = false }: PromptAreaProps) {
  const [promptText, setPromptText]     = useState("")
  const [attachments, setAttachments]   = useState<AttachedImage[]>([])
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("16:9")
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>("Realistic")
  const [inputFocused, setInputFocused] = useState(false)
  const [popoverOpen, setPopoverOpen]   = useState(false)
  const [popoverThumbs, setPopoverThumbs] = useState<PopoverThumb[]>([])
  const [popoverLoading, setPopoverLoading] = useState(false)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const hideTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canGenerate = promptText.trim().length > 0 && !isGenerating

  /* ── Popover ─────────────────────────────────────── */
  const fetchPopoverThumbs = useCallback(async () => {
    setPopoverLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("thumbnail")
      .select("id, prompt, image_path")
      .order("created_at", { ascending: false })
      .limit(12)
    if (data?.length) {
      const withUrls = await Promise.all(
        data.map(async (t) => {
          const { data: signed } = await supabase.storage.from("keep_img").createSignedUrl(t.image_path, 3600)
          return { id: t.id, prompt: t.prompt ?? "", signedUrl: signed?.signedUrl ?? "" }
        })
      )
      setPopoverThumbs(withUrls.filter((t) => t.signedUrl))
    }
    setPopoverLoading(false)
  }, [])

  const openPopover   = () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); if (!popoverOpen) fetchPopoverThumbs(); setPopoverOpen(true) }
  const scheduleClose = () => { hideTimerRef.current = setTimeout(() => setPopoverOpen(false), 180) }
  const cancelClose   = () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }

  const attachFromPopover = async (thumb: PopoverThumb) => {
    if (attachments.some((a) => a.id === thumb.id) || attachments.length >= MAX_FILES) return
    const res  = await fetch(thumb.signedUrl)
    const blob = await res.blob()
    const reader = new FileReader()
    reader.onload = (ev) => setAttachments((prev) => [...prev, { id: thumb.id, dataUrl: ev.target?.result as string, mimeType: blob.type || "image/jpeg", name: thumb.prompt.slice(0, 30) || "thumbnail" }])
    reader.readAsDataURL(blob)
    setPopoverOpen(false)
  }

  /* ── File upload ─────────────────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files   = Array.from(e.target.files ?? [])
    const slots   = MAX_FILES - attachments.length
    const accepted: File[] = []
    for (const file of files) {
      if (accepted.length >= slots) break
      if (file.size > MAX_SIZE_BYTES) { alert(`"${file.name}"이 5 MB를 초과합니다.`); continue }
      accepted.push(file)
    }
    accepted.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => setAttachments((prev) => [...prev, { id: crypto.randomUUID(), dataUrl: ev.target?.result as string, mimeType: file.type, name: file.name }])
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id))

  /* ── Generate ────────────────────────────────────── */
  const handleGenerate = () => { if (canGenerate) onGenerate?.(promptText, attachments, selectedRatio, selectedStyle) }
  const handleKeyDown  = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); handleGenerate() } }

  /* ── Chip helper ─────────────────────────────────── */
  const chipStyle = (active: boolean, color: 'blue' | 'purple'): React.CSSProperties => ({
    padding: '5px 11px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.18s',
    letterSpacing: '0.02em',
    ...(active ? {
      background: color === 'blue' ? 'rgba(96,165,250,0.15)' : 'rgba(167,139,250,0.15)',
      borderColor: color === 'blue' ? 'rgba(96,165,250,0.5)' : 'rgba(167,139,250,0.5)',
      color: color === 'blue' ? '#93c5fd' : '#c4b5fd',
      boxShadow: color === 'blue' ? '0 0 12px rgba(96,165,250,0.2)' : '0 0 12px rgba(167,139,250,0.2)',
    } : {
      background: T.chipInactive,
      borderColor: T.chipBorderInact,
      color: T.textMuted,
    }),
  })

  /* ── Render ──────────────────────────────────────── */
  return (
    <div style={{
      borderRadius: 20,
      background: T.cardBg,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: T.cardBorder,
      boxShadow: T.cardShadow,
      padding: '28px 28px 24px',
      position: 'relative',
    }}>
      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.4), rgba(167,139,250,0.4), transparent)',
        borderRadius: '0 0 4px 4px',
      }} />

      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Zap size={13} style={{ color: T.neonBlue, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: T.textMuted, textTransform: 'uppercase' }}>
          Describe your thumbnail
        </span>
      </div>

      {/* Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          placeholder="Enter prompt here... (e.g. 'shocked gamer, neon lights, bold text INSANE PLAY')"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          rows={3}
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: 12,
            background: T.inputBg,
            border: inputFocused ? T.inputFocusBorder : T.inputBorder,
            boxShadow: inputFocused ? T.inputFocusShadow : 'none',
            color: '#f1f5f9',
            fontSize: 14,
            lineHeight: 1.65,
            resize: 'none',
            outline: 'none',
            transition: 'border 0.2s, box-shadow 0.2s',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Chips row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        {/* Ratio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: T.textSubtle, letterSpacing: '0.06em', marginRight: 4 }}>RATIO</span>
          {RATIOS.map((r) => (
            <button key={r} onClick={() => setSelectedRatio(r)} style={chipStyle(selectedRatio === r, 'blue')}>{r}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: T.textSubtle, letterSpacing: '0.06em', marginRight: 4 }}>STYLE</span>
          {STYLES.map((s) => (
            <button key={s} onClick={() => setSelectedStyle(s)} style={chipStyle(selectedStyle === s, 'purple')}>{s}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 11, color: T.textSubtle, whiteSpace: 'nowrap', userSelect: 'none' }}>
          Shift + Enter to generate
        </span>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {attachments.map((att) => (
            <div key={att.id} style={{ position: 'relative', width: 52, height: 52, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(96,165,250,0.2)', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={att.dataUrl} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button onClick={() => removeAttachment(att.id)} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <X size={8} />
              </button>
            </div>
          ))}
          <span style={{ alignSelf: 'center', fontSize: 11, color: T.textSubtle }}>{attachments.length}/{MAX_FILES}</span>
        </div>
      )}

      {/* Action row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>

        {/* Reference popover */}
        <div style={{ position: 'relative' }} onMouseEnter={openPopover} onMouseLeave={scheduleClose}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px',
            borderRadius: 9, border: `1px solid ${popoverOpen ? 'rgba(96,165,250,0.35)' : 'rgba(255,255,255,0.09)'}`,
            background: popoverOpen ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.04)',
            color: popoverOpen ? '#93c5fd' : T.textMuted,
            cursor: 'pointer', fontSize: 12, transition: 'all 0.18s', whiteSpace: 'nowrap',
          }}>
            <ImageIcon size={12} /> 참조
          </button>

          {popoverOpen && (
            <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose} style={{
              position: 'absolute', bottom: 'calc(100% + 10px)', left: 0, width: 292,
              borderRadius: 16, padding: 12, zIndex: 200,
              background: 'rgba(12,14,28,0.98)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(96,165,250,0.12)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 40px rgba(96,165,250,0.05)',
            }}>
              <p style={{ color: T.textSubtle, fontSize: 10, margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>기존 썸네일 선택</p>
              {popoverLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(96,165,250,0.2)', borderTopColor: '#60a5fa', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : popoverThumbs.length === 0 ? (
                <p style={{ color: T.textSubtle, fontSize: 12, margin: 0, textAlign: 'center', padding: '14px 0' }}>아직 생성된 썸네일이 없습니다</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {popoverThumbs.map((thumb) => {
                    const already = attachments.some((a) => a.id === thumb.id)
                    const full    = !already && attachments.length >= MAX_FILES
                    return (
                      <button key={thumb.id} onClick={() => !already && !full && attachFromPopover(thumb)} title={thumb.prompt}
                        style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 7, overflow: 'hidden', padding: 0, border: `1px solid ${already ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.09)'}`, cursor: already || full ? 'default' : 'pointer', opacity: full ? 0.35 : 1, background: 'rgba(255,255,255,0.03)', transition: 'border-color 0.18s' }}>
                        <Image src={thumb.signedUrl} alt={thumb.prompt} fill sizes="90px" style={{ objectFit: 'cover' }} unoptimized />
                        {already && <div style={{ position: 'absolute', inset: 0, background: 'rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#60a5fa', fontSize: 14, fontWeight: 700 }}>✓</span></div>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attach */}
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= MAX_FILES}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px',
            borderRadius: 9, border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.04)',
            color: attachments.length >= MAX_FILES ? 'rgba(255,255,255,0.18)' : T.textMuted,
            cursor: attachments.length >= MAX_FILES ? 'not-allowed' : 'pointer',
            fontSize: 12, opacity: attachments.length >= MAX_FILES ? 0.5 : 1, transition: 'all 0.18s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { if (attachments.length < MAX_FILES) { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(167,139,250,0.35)'; el.style.color = '#c4b5fd'; el.style.background = 'rgba(167,139,250,0.07)' } }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.09)'; el.style.color = T.textMuted; el.style.background = 'rgba(255,255,255,0.04)' }}
        >
          <Paperclip size={12} />
          첨부
          {attachments.length > 0 && <span style={{ background: 'rgba(167,139,250,0.25)', color: '#c4b5fd', borderRadius: 10, padding: '1px 6px', fontSize: 10, marginLeft: 2 }}>{attachments.length}</span>}
        </button>

        <div style={{ flex: 1 }} />

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 28px', borderRadius: 12,
            background: isGenerating
              ? 'rgba(255,255,255,0.06)'
              : canGenerate
              ? 'linear-gradient(135deg, #6366f1, #60a5fa, #a78bfa)'
              : 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(96,165,250,0.35), rgba(167,139,250,0.35))',
            border: 'none',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            color: '#fff',
            fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
            boxShadow: (!isGenerating && canGenerate)
              ? '0 0 24px rgba(99,102,241,0.4), 0 0 48px rgba(96,165,250,0.15), 0 4px 16px rgba(0,0,0,0.4)'
              : 'none',
            opacity: (!canGenerate && !isGenerating) ? 0.55 : 1,
            transition: 'all 0.2s',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { if (canGenerate) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 0 32px rgba(99,102,241,0.55), 0 0 64px rgba(96,165,250,0.2), 0 4px 20px rgba(0,0,0,0.5)'; el.style.transform = 'translateY(-1px)' } }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = canGenerate ? '0 0 24px rgba(99,102,241,0.4), 0 0 48px rgba(96,165,250,0.15), 0 4px 16px rgba(0,0,0,0.4)' : 'none'; el.style.transform = 'none' }}
        >
          {isGenerating ? (
            <><div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />Generating...</>
          ) : (
            <><Sparkles size={15} />Generate</>
          )}
        </button>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/* ── Copy-prompt button ───────────────────────────── */
export function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={copy} title="Copy prompt" style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6,
      background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.14)',
      color: copied ? '#6ee7b7' : 'rgba(255,255,255,0.55)',
      fontSize: 10, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)',
      transition: 'all 0.18s', letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      {copied ? <Check size={9} /> : <Copy size={9} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
