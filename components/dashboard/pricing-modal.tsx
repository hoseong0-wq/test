"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Zap, Star, ArrowRight } from "lucide-react"
import { BorderBeam } from "./border-beam"

interface PricingModalProps {
  onClose: () => void
}

const PLANS = [
  {
    key: "pro",
    name: "Pro",
    price: 5,
    credits: 100,
    icon: Zap,
    color: "#60a5fa",
    colorRgb: "96,165,250",
    gradientFrom: "#22d3ee",
    gradientTo: "#6366f1",
    desc: "Perfect for getting started",
  },
  {
    key: "ultra",
    name: "Ultra",
    price: 20,
    credits: 300,
    icon: Star,
    color: "#a78bfa",
    colorRgb: "167,139,250",
    gradientFrom: "#a855f7",
    gradientTo: "#ec4899",
    desc: "Best value for power users",
  },
]

export function PricingModal({ onClose }: PricingModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const handleCheckout = async (planKey: string) => {
    if (loading) return
    setLoading(planKey)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create checkout")
      window.location.href = data.url
    } catch (err) {
      console.error(err)
      setLoading(null)
    }
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(5,6,14,0.85)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        animation: "fadeIn 0.18s ease",
      }}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%", maxWidth: 560,
          borderRadius: 24,
          background: "rgba(14,16,30,0.97)",
          backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
          boxShadow: "0 0 0 1px rgba(96,165,250,0.06), 0 24px 80px rgba(0,0,0,0.85), 0 0 80px rgba(99,102,241,0.07)",
          padding: "36px 32px 32px",
          animation: "slideUp 0.22s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}
      >
        <BorderBeam size={220} duration={5} colorFrom="#22d3ee" colorTo="#a855f7" borderWidth={1.5} radius={24} />
        <BorderBeam size={160} duration={7} delay={2.5} colorFrom="#a855f7" colorTo="#22d3ee" reverse borderWidth={1.5} radius={24} />

        {/* Header */}
        <div style={{ marginBottom: 28, paddingRight: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(96,165,250,0.6)", textTransform: "uppercase", margin: "0 0 8px" }}>
            Plans &amp; Pricing
          </p>
          <h2 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Choose your plan
          </h2>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 20, right: 20, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.12)"; el.style.color = "#fff" }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.05)"; el.style.color = "rgba(255,255,255,0.4)" }}
        >
          <X size={14} />
        </button>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isLoading = loading === plan.key
            return (
              <div
                key={plan.name}
                style={{ borderRadius: 18, background: `rgba(${plan.colorRgb}, 0.04)`, border: `1px solid rgba(${plan.colorRgb}, 0.18)`, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20, transition: "border-color 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `rgba(${plan.colorRgb}, 0.38)`; el.style.boxShadow = `0 0 28px rgba(${plan.colorRgb}, 0.08)` }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `rgba(${plan.colorRgb}, 0.18)`; el.style.boxShadow = "none" }}
              >
                {/* Icon + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${plan.gradientFrom}, ${plan.gradientTo})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px rgba(${plan.colorRgb}, 0.35)`, flexShrink: 0 }}>
                    <Icon size={16} color="#fff" />
                  </div>
                  <span style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 700 }}>{plan.name}</span>
                </div>

                {/* Price */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 16, fontWeight: 500 }}>$</span>
                    <span style={{ color: "#f1f5f9", fontSize: 42, fontWeight: 800, lineHeight: 1 }}>{plan.price}</span>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "4px 0 0" }}>one-time</p>
                </div>

                {/* Credits */}
                <div style={{ padding: "12px 16px", borderRadius: 10, background: `rgba(${plan.colorRgb}, 0.07)`, border: `1px solid rgba(${plan.colorRgb}, 0.12)` }}>
                  <p style={{ margin: 0, color: plan.color, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{plan.credits}</p>
                  <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.38)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Credits</p>
                </div>

                {/* Desc */}
                <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 12, lineHeight: 1.5 }}>{plan.desc}</p>

                {/* CTA button */}
                <button
                  onClick={() => handleCheckout(plan.key)}
                  disabled={!!loading}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    width: "100%", padding: "11px 0", borderRadius: 12,
                    background: isLoading
                      ? `rgba(${plan.colorRgb}, 0.1)`
                      : `linear-gradient(135deg, ${plan.gradientFrom}, ${plan.gradientTo})`,
                    border: "none",
                    color: "#fff",
                    fontSize: 13, fontWeight: 700, letterSpacing: "0.02em",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading && !isLoading ? 0.45 : 1,
                    boxShadow: !loading ? `0 0 20px rgba(${plan.colorRgb}, 0.3)` : "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { if (!loading) { const el = e.currentTarget as HTMLElement; el.style.opacity = "0.88"; el.style.transform = "translateY(-1px)" } }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "1"; el.style.transform = "none" }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                      Redirecting...
                    </>
                  ) : (
                    <>Get started <ArrowRight size={13} /></>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes slideUp { from { opacity:0; transform:translateY(12px) scale(0.97) } to { opacity:1; transform:none } }
          @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        `}</style>
      </div>
    </div>,
    document.body
  )
}
