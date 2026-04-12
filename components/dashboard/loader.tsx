import type React from "react"

const Loader: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '52px 0',
        borderRadius: 16,
        background: 'rgba(22,26,45,0.6)',
        border: '1px solid rgba(96,165,250,0.12)',
        boxShadow: '0 0 40px rgba(96,165,250,0.04)',
      }}
    >
      {/* Spinning rings */}
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid rgba(96,165,250,0.12)',
          borderTopColor: '#60a5fa',
          animation: 'loaderSpin 0.9s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 7, borderRadius: '50%',
          border: '2px solid rgba(139,92,246,0.12)',
          borderTopColor: '#a78bfa',
          animation: 'loaderSpin 0.7s linear infinite reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          boxShadow: '0 0 16px rgba(96,165,250,0.25)',
        }} />
      </div>
      <p style={{
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        letterSpacing: '0.08em',
        margin: 0,
      }}>
        Generating thumbnail...
      </p>
      <style>{`@keyframes loaderSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default Loader
