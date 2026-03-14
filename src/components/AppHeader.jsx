import { btnSecondary } from "./ui";

export default function AppHeader({ currentUser, tab, onTabChange, onOpenSellerModal, onOpenPasswordModal, onLogout }) {
  const tabs = [
    ["vendas", "📋 Vendas"],
    ["relatorios", "📊 Relatorios"],
    ...(currentUser.role === "admin" ? [["vendedores", "👥 Vendedores"]] : []),
  ];

  return (
    <div
      className="app-header"
      style={{
        background: "linear-gradient(180deg,#0d1b2e,#070e1c)",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 32px",
        minHeight: 76,
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div className="app-brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div className="brand-title" style={{ fontFamily: "'Crimson Pro',serif", fontSize: 21, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>
            PAINEL DE VENDAS
          </div>
          <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", fontWeight: 600 }}>
            {currentUser.role === "admin" ? "PAINEL GERAL DA EQUIPE" : "PAINEL INDIVIDUAL DO VENDEDOR"}
          </div>
        </div>
      </div>

      <div className="app-nav" style={{ display: "flex", gap: 4 }}>
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              background: tab === key ? "rgba(99,102,241,0.15)" : "transparent",
              color: tab === key ? "#818cf8" : "#64748b",
              border: tab === key ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
              borderRadius: 8,
              padding: "7px 18px",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="app-user-actions" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <div className="app-user-meta" style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{currentUser.nome}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{currentUser.role === "admin" ? "Administrador" : "Vendedor"}</div>
        </div>
        {currentUser.role === "admin" && (
          <button onClick={onOpenSellerModal} style={btnSecondary}>
            + Vendedor
          </button>
        )}
        <button onClick={onOpenPasswordModal} style={btnSecondary}>
          Senha
        </button>
        <button onClick={onLogout} style={btnSecondary}>
          Sair
        </button>
      </div>
    </div>
  );
}
