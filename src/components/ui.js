import { PLANO_COLORS } from "../constants/sales";
import Logo from "./Logo";

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
  background: "linear-gradient(135deg, #DA291C, #7A0F0F)",
  color: "#fff",
  border: "1px solid #DA291C",
  boxShadow: "0 10px 30px rgba(218,41,28,0.2)",
});

export const btnSecondary = btn({
  background: "linear-gradient(180deg, rgba(20,20,22,0.95), rgba(16,16,18,0.95))",
  color: "var(--text,#FFFFFF)",
  border: "1px solid var(--line,#2A2A2E)",
});

export const btnDanger = btn({
  background: "linear-gradient(135deg, #dc2626, #b91c1c)",
  border: "1px solid #ef4444",
  color: "#fff",
});

export const inputStyle = {
  background: "linear-gradient(180deg, rgba(20,20,22,0.95), rgba(16,16,18,0.95))",
  border: "1px solid var(--line,#2A2A2E)",
  borderRadius: 12,
  color: "var(--text,#FFFFFF)",
  padding: "13px 14px",
  minHeight: 48,
  fontFamily: "'DM Sans',sans-serif",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color .2s ease, box-shadow .2s ease",
};

export const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--muted,#A1A1AA)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 5,
};

export function Badge({ color, children }) {
  const badgeColor = color || "var(--brand,#DA291C)";
  return (
    <span
      style={{
        background: badgeColor,
        border: `1px solid ${badgeColor}`,
        color: "#fff",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 10,
        fontWeight: 700,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 10px rgba(218,41,28,0.3)",
      }}
    >
      {children}
    </span>
  );
}

export function StatCard({ icon, label, value, sub, color = PLANO_COLORS["Plano Controle"], featured = false }) {
  const featuredGlow = `${color}22`;
  const isCompactCard = !featured;
  const valueStyle = featured
    ? {
        fontSize: "clamp(34px, 4.8vw, 52px)",
        fontFamily: "'Crimson Pro',Georgia,serif",
        color: "#ffffff",
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "0.01em",
        textShadow: "0 2px 0 rgba(0,0,0,0.42), 0 8px 16px rgba(218,41,28,0.2)",
      }
    : {
        fontSize: "clamp(18px, 2.1vw, 26px)",
        fontFamily: "'Crimson Pro',Georgia,serif",
        color: "var(--text,#FFFFFF)",
        fontWeight: 800,
      };
  return (
    <div
      className="panel-surface stat-card lift-hover"
      style={{
        padding: featured ? "clamp(18px, 2vw, 28px) clamp(18px, 2.3vw, 30px)" : "16px 16px",
        position: "relative",
        overflow: "hidden",
        display: featured ? "grid" : isCompactCard ? "grid" : "block",
        alignContent: featured ? "start" : isCompactCard ? "center" : "normal",
        justifyItems: featured ? "start" : isCompactCard ? "center" : "start",
        gap: featured ? 10 : isCompactCard ? 6 : 0,
        textAlign: featured ? "left" : isCompactCard ? "center" : "left",
        borderColor: featured ? `${color}66` : undefined,
        boxShadow: featured ? `0 10px 22px ${featuredGlow}` : undefined,
        background: featured
          ? "linear-gradient(135deg, #DA291C, #7A0F0F)"
          : "#141416",
        gridColumn: featured ? "1 / -1" : undefined,
      }}
    >
      {featured ? (
        <Logo
          size="clamp(42px, 4.8vw, 62px)"
          opacity={0.08}
          alt="Claro marca d'agua"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ) : (
        <div />
      )}
      {icon ? (
        <div
          style={{
            fontSize: featured ? "clamp(16px, 1.4vw, 22px)" : "16px",
            lineHeight: 1,
            marginBottom: featured ? 6 : 6,
            transform: featured ? "scaleX(0.72)" : "none",
            transformOrigin: featured ? "left center" : "center center",
            display: "inline-block",
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))",
            position: "relative",
            zIndex: 1,
          }}
        >
          {icon}
        </div>
      ) : null}
      <div
        style={{
          fontSize: featured ? "clamp(14px, 1.2vw, 18px)" : "11px",
          color: featured ? "#FFFFFF" : "var(--muted,#A1A1AA)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: featured ? 6 : 6,
          maxWidth: isCompactCard ? 140 : "none",
          lineHeight: 1.25,
          position: "relative",
          zIndex: 1,
        }}
      >
        {label}
      </div>
      <div style={{ ...valueStyle, position: "relative", zIndex: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: featured ? "clamp(11px, 0.95vw, 13px)" : "clamp(9px, 0.8vw, 11px)", color: "var(--muted,#A1A1AA)", marginTop: featured ? 6 : 3, position: "relative", zIndex: 1 }}>{sub}</div>}
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
        background: "rgba(0,0,0,0.74)",
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
          background: "linear-gradient(180deg,rgba(20,20,22,0.98),rgba(16,16,18,0.98))",
          border: "1px solid var(--line,#2A2A2E)",
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
          <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "var(--text,#FFFFFF)", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted,#A1A1AA)", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>
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
      {error && <span style={{ color: "var(--accent-danger,#EF4444)", fontSize: 11, marginTop: 3, display: "block" }}>{error}</span>}
    </div>
  );
}

export function ToastStack({ items = [], onDismiss }) {
  if (!items.length) return null;

  const palette = {
    success: { bg: "rgba(34,197,94,0.16)", border: "rgba(34,197,94,0.45)", title: "Sucesso", icon: "✓" },
    error: { bg: "rgba(239,68,68,0.16)", border: "rgba(239,68,68,0.45)", title: "Erro", icon: "!" },
    info: { bg: "rgba(218,41,28,0.16)", border: "rgba(218,41,28,0.5)", title: "Aviso", icon: "i" },
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
              background: `linear-gradient(180deg, ${color.bg}, rgba(20,20,22,0.96))`,
              boxShadow: "0 12px 24px rgba(0,0,0,0.38)",
              padding: "10px 12px",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text,#FFFFFF)", fontSize: 12, fontWeight: 700 }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(11,11,12,0.75)", border: "1px solid var(--line,#2A2A2E)" }}>
                  {color.icon}
                </span>
                <span>{color.title}</span>
              </div>
              <button
                onClick={() => onDismiss?.(toast.id)}
                aria-label="Fechar notificação"
                style={{ border: "none", background: "transparent", color: "var(--muted,#A1A1AA)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ color: "var(--text,#FFFFFF)", fontSize: 13, lineHeight: 1.35 }}>{toast.message}</div>
          </div>
        );
      })}
    </div>
  );
}
