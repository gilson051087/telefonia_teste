import { PLANO_COLORS } from "../constants/sales";

const btn = (extra = {}) => ({
  fontFamily: "'DM Sans',sans-serif",
  fontWeight: 700,
  fontSize: 14,
  borderRadius: 14,
  padding: "11px 18px",
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  border: "none",
  transition: "all 0.2s ease",
  ...extra,
});

export const btnPrimary = btn({
  background: "linear-gradient(135deg,var(--brand,#38bdf8),#0284c7 55%,#0369a1)",
  color: "#fff",
  boxShadow: "0 10px 24px rgba(14,165,233,0.34)",
});

export const btnSecondary = btn({
  background: "linear-gradient(180deg,rgba(30,41,59,0.88),rgba(15,23,42,0.88))",
  color: "#cbd5e1",
  border: "1px solid rgba(71,85,105,0.9)",
});

export const btnDanger = btn({
  background: "linear-gradient(135deg,var(--accent-danger,#ef4444),#dc2626)",
  color: "#fff",
});

export const inputStyle = {
  background: "linear-gradient(180deg,rgba(30,41,59,0.95),rgba(22,30,45,0.95))",
  border: "1px solid var(--line, rgba(71,85,105,0.9))",
  borderRadius: 12,
  color: "#f1f5f9",
  padding: "12px 14px",
  minHeight: 44,
  fontFamily: "'DM Sans',sans-serif",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

export const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--muted, #64748b)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 5,
};

export function Badge({ color, children }) {
  return (
    <span
      style={{
        background: `${color}20`,
        border: `1px solid ${color}44`,
        color,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function StatCard({ icon, label, value, sub, color = PLANO_COLORS["Plano Controle"], featured = false }) {
  const featuredGlow = `${color}33`;
  const isCompactCard = !featured;
  const valueStyle = featured
    ? {
        fontSize: "clamp(34px, 4.8vw, 52px)",
        fontFamily: "'Crimson Pro',Georgia,serif",
        color: "#ffffff",
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "0.01em",
        textShadow: "0 2px 0 rgba(2,6,23,0.55), 0 12px 28px rgba(34,211,238,0.26)",
      }
    : {
        fontSize: "clamp(16px, 2vw, 24px)",
        fontFamily: "'Crimson Pro',Georgia,serif",
        color: "#f1f5f9",
        fontWeight: 700,
      };
  return (
    <div
      className="panel-surface stat-card lift-hover"
      style={{
        padding: featured ? "clamp(14px, 1.8vw, 24px) clamp(14px, 2vw, 28px)" : "clamp(4px, 0.55vw, 8px) clamp(8px, 0.9vw, 12px)",
        position: "relative",
        overflow: "hidden",
        display: isCompactCard ? "grid" : "block",
        alignContent: isCompactCard ? "center" : "normal",
        justifyItems: isCompactCard ? "center" : "start",
        gap: isCompactCard ? 2 : 0,
        textAlign: isCompactCard ? "center" : "left",
        borderColor: featured ? `${color}66` : undefined,
        boxShadow: featured ? `0 14px 30px ${featuredGlow}` : undefined,
        background: featured
          ? `linear-gradient(145deg, ${color}26 0%, rgba(15,23,42,0.98) 48%, rgba(15,23,42,1) 100%)`
          : undefined,
        gridColumn: featured ? "1 / -1" : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -12,
          right: -12,
          width: 58,
          height: 58,
          background: "#94a3b8",
          borderRadius: "50%",
          opacity: 0.1,
        }}
      />
      <div
        style={{
          fontSize: featured ? "clamp(16px, 1.4vw, 22px)" : "clamp(12px, 1vw, 15px)",
          lineHeight: 1,
          marginBottom: featured ? 6 : 4,
          transform: featured ? "scaleX(0.72)" : "none",
          transformOrigin: featured ? "left center" : "center center",
          display: "inline-block",
          filter: "drop-shadow(0 4px 10px rgba(2,6,23,0.4))",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: featured ? "clamp(14px, 1.2vw, 18px)" : "clamp(9px, 0.8vw, 11px)",
          color: featured ? "#d1fae5" : "#cbd5e1",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: featured ? 6 : 4,
          maxWidth: isCompactCard ? 140 : "none",
          lineHeight: 1.25,
        }}
      >
        {label}
      </div>
      <div style={valueStyle}>
        {value}
      </div>
      {sub && <div style={{ fontSize: featured ? "clamp(11px, 0.95vw, 13px)" : "clamp(9px, 0.8vw, 11px)", color: featured ? "#cbd5e1" : "#94a3b8", marginTop: featured ? 6 : 3 }}>{sub}</div>}
    </div>
  );
}

export function Panel({ children, style }) {
  return (
    <div className="panel-surface" style={{ padding: 20, ...style }}>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="modal-shell"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.76)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        className="modal-panel"
        style={{
          background: "linear-gradient(180deg,rgba(14,24,41,0.98),rgba(10,17,31,0.98))",
          border: "1px solid rgba(71,85,105,0.55)",
          borderRadius: 18,
          width: "100%",
          maxWidth: wide ? 680 : 560,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 30px 70px rgba(0,0,0,0.7)",
          animation: "fadeUp 0.2s ease",
        }}
      >
        <div className="modal-head" style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#f1f5f9", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div className="modal-body" style={{ padding: 28 }}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 3, display: "block" }}>{error}</span>}
    </div>
  );
}

export function ToastStack({ items = [], onDismiss }) {
  if (!items.length) return null;

  const palette = {
    success: { bg: "rgba(16,185,129,0.16)", border: "rgba(16,185,129,0.45)", title: "Sucesso", icon: "✓" },
    error: { bg: "rgba(239,68,68,0.16)", border: "rgba(239,68,68,0.45)", title: "Erro", icon: "!" },
    info: { bg: "rgba(14,165,233,0.16)", border: "rgba(14,165,233,0.45)", title: "Aviso", icon: "i" },
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1300,
        display: "grid",
        gap: 10,
        width: "min(360px, calc(100vw - 24px))",
      }}
    >
      {items.map((toast) => {
        const color = palette[toast.type] || palette.info;
        return (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            style={{
              borderRadius: 12,
              border: `1px solid ${color.border}`,
              background: `linear-gradient(180deg, ${color.bg}, rgba(15,23,42,0.96))`,
              boxShadow: "0 12px 28px rgba(2,6,23,0.4)",
              padding: "10px 12px",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#e2e8f0", fontSize: 12, fontWeight: 700 }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.35)" }}>
                  {color.icon}
                </span>
                <span>{color.title}</span>
              </div>
              <button
                onClick={() => onDismiss?.(toast.id)}
                aria-label="Fechar notificação"
                style={{ border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.35 }}>{toast.message}</div>
          </div>
        );
      })}
    </div>
  );
}
