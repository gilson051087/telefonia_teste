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
        background: "linear-gradient(180deg,rgba(10,21,36,0.98),rgba(7,14,28,0.98))",
        borderBottom: "1px solid rgba(51,65,85,0.65)",
        boxShadow: "0 10px 24px rgba(2,6,23,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 32px",
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

      <div
        className="app-nav"
        style={{
          display: "flex",
          gap: 8,
          padding: 6,
          borderRadius: 14,
          background: "rgba(15,23,42,0.75)",
          border: "1px solid rgba(51,65,85,0.7)",
          boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.45)",
        }}
      >
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              background: tab === key ? "linear-gradient(135deg, rgba(8,145,178,0.26), rgba(14,116,144,0.22))" : "transparent",
              color: tab === key ? "#67e8f9" : "#94a3b8",
              border: tab === key ? "1px solid rgba(34,211,238,0.45)" : "1px solid transparent",
              borderRadius: 10,
              padding: "8px 18px",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: tab === key ? "0 8px 16px rgba(6,182,212,0.2)" : "none",
              transition: "all .16s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="app-user-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <div className="app-user-meta" style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{currentUser.nome}</div>
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
  );
}
