import { btnSecondary } from "./ui";

export default function AppHeader({ currentUser, tab, onTabChange, onOpenSellerModal, onOpenPasswordModal, onLogout }) {
  const tabs = [
    ["vendas", "📋 Vendas"],
    ["pendencias", "⏱ Pendências"],
    ["relatorios", "📊 Relatórios"],
    ["metas", "🎯 Metas"],
    ...(currentUser.role === "admin" ? [["vendedores", "👥 Vendedores"]] : []),
  ];

  return (
    <div
      className="app-header"
      style={{
        background: "linear-gradient(180deg,rgba(15,23,42,0.96),rgba(11,18,32,0.96))",
        borderBottom: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 6px 16px rgba(2,6,23,0.22)",
        padding: "10px 18px",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          minHeight: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          width: "100%",
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

        <div
          className="app-nav"
          style={{
            display: "flex",
            gap: 6,
            padding: 5,
            borderRadius: 12,
            background: "rgba(15,23,42,0.62)",
            border: "1px solid rgba(148,163,184,0.2)",
          }}
        >
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              style={{
                background: tab === key ? "rgba(56,189,248,0.16)" : "transparent",
                color: tab === key ? "#e2e8f0" : "#9fb0c9",
                border: tab === key ? "1px solid rgba(125,211,252,0.38)" : "1px solid transparent",
                borderRadius: 9,
                padding: "8px 14px",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: tab === key ? "0 6px 14px rgba(14,116,144,0.2)" : "none",
                transition: "all .16s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="app-user-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div className="app-user-meta" style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{String(currentUser.nome || "").toUpperCase()}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{currentUser.role === "admin" ? "Administrador" : "Vendedor"}</div>
          </div>
          {currentUser.role === "admin" && (
            <button onClick={onOpenSellerModal} style={{ ...btnSecondary, padding: "9px 14px", borderRadius: 10 }}>
              + Vendedor
            </button>
          )}
          <button onClick={onOpenPasswordModal} style={{ ...btnSecondary, padding: "9px 14px", borderRadius: 10 }}>
            Senha
          </button>
          <button onClick={onLogout} style={{ ...btnSecondary, padding: "9px 14px", borderRadius: 10 }}>
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
