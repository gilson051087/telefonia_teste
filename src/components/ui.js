import { PLANO_COLORS } from "../constants/sales";

const btn = (extra = {}) => ({
  fontFamily: "'DM Sans',sans-serif",
  fontWeight: 600,
  fontSize: 13,
  borderRadius: 9,
  padding: "9px 18px",
  cursor: "pointer",
  border: "none",
  transition: "all 0.18s",
  ...extra,
});

export const btnPrimary = btn({
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  color: "#fff",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
});

export const btnSecondary = btn({
  background: "transparent",
  color: "#94a3b8",
  border: "1px solid #334155",
});

export const btnDanger = btn({
  background: "linear-gradient(135deg,#ef4444,#dc2626)",
  color: "#fff",
});

export const inputStyle = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#e2e8f0",
  padding: "10px 14px",
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
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 5,
};

export function Badge({ color, children }) {
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function StatCard({ icon, label, value, sub, color = PLANO_COLORS["Plano Controle"] }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg,#0f172a,#1a2744)",
        border: "1px solid #1e293b",
        borderRadius: 14,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -12,
          right: -12,
          width: 72,
          height: 72,
          background: color,
          borderRadius: "50%",
          opacity: 0.12,
        }}
      />
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontFamily: "'Crimson Pro',Georgia,serif", color: "#f1f5f9", fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{sub}</div>}
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
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(5px)",
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
          background: "#0d1526",
          border: "1px solid #1e293b",
          borderRadius: 16,
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
