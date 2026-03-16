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
  background: "linear-gradient(135deg,#0ea5e9,#0284c7 55%,#0369a1)",
  color: "#fff",
  boxShadow: "0 10px 24px rgba(14,165,233,0.34)",
});

export const btnSecondary = btn({
  background: "linear-gradient(180deg,rgba(30,41,59,0.88),rgba(15,23,42,0.88))",
  color: "#cbd5e1",
  border: "1px solid rgba(71,85,105,0.9)",
});

export const btnDanger = btn({
  background: "linear-gradient(135deg,#ef4444,#dc2626)",
  color: "#fff",
});

export const inputStyle = {
  background: "linear-gradient(180deg,rgba(30,41,59,0.95),rgba(22,30,45,0.95))",
  border: "1px solid rgba(71,85,105,0.9)",
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
  color: "#64748b",
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

export function StatCard({ icon, label, value, sub, color = PLANO_COLORS["Plano Controle"] }) {
  return (
    <div
      style={{
        background: "linear-gradient(155deg,rgba(15,23,42,0.96),rgba(13,21,38,0.96) 58%,rgba(9,18,34,0.96))",
        border: "1px solid rgba(71,85,105,0.55)",
        borderRadius: 16,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 24px rgba(2,6,23,0.34)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -12,
          right: -12,
          width: 72,
          height: 72,
          background: "#94a3b8",
          borderRadius: "50%",
          opacity: 0.1,
        }}
      />
      <div style={{ fontSize: 24, marginBottom: 8, filter: "drop-shadow(0 4px 10px rgba(2,6,23,0.4))" }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontFamily: "'Crimson Pro',Georgia,serif", color: "#f1f5f9", fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
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
