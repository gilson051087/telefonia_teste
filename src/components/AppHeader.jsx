import { btnSecondary } from "./ui";
import Logo from "./Logo";
import { AppIcon } from "./icons";

export default function AppHeader({ currentUser, tab, onTabChange, onOpenSellerModal, onOpenPasswordModal, onLogout, canManageUsers = false, manageButtonLabel = "+ Vendedor" }) {
  const tabs = [
    ["vendas", "sales", "Vendas"],
    ["pendencias", "clock", "Pendências"],
    ["planos", "image", "Planos"],
    ["relatorios", "chart", "Relatórios"],
    ["metas", "target", "Metas"],
    ...(currentUser.role !== "seller" ? [["vendedores", "users", "Vendedores"]] : []),
  ];

  return (
    <div
      className="app-header"
      style={{
        background: "#0B0B0C",
        borderBottom: "1px solid #2A2A2E",
        boxShadow: "0 8px 22px rgba(0,0,0,0.4)",
        padding: "10px 18px",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          minHeight: 74,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <div className="app-brand" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo
            size={40}
            className="brand-logo-img"
            alt={currentUser.role === "seller" ? "Claro Painel de Vendas Individual" : "Claro Painel de Vendas Geral"}
          />
        </div>

        <div
          className="app-nav"
          style={{
            display: "flex",
            gap: 6,
            padding: 5,
            borderRadius: 12,
            background: "rgba(20,20,22,0.95)",
            border: "1px solid #2A2A2E",
          }}
        >
          {tabs.map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              style={{
                background: tab === key ? "linear-gradient(135deg, rgba(198,40,40,0.24), rgba(169,27,27,0.34))" : "transparent",
                color: tab === key ? "#ffffff" : "#A1A1AA",
                border: tab === key ? "1px solid var(--brand,#C62828)" : "1px solid transparent",
                borderRadius: 9,
                padding: "8px 14px",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: tab === key ? "0 8px 18px rgba(198,40,40,0.22)" : "none",
                transition: "all .16s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <AppIcon name={icon} size={15} strokeWidth={2.1} />
              {label}
            </button>
          ))}
        </div>

        <div className="app-user-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div className="app-user-meta" style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{String(currentUser.nome || "").toUpperCase()}</div>
            <div style={{ fontSize: 11, color: "#A1A1AA" }}>
              {currentUser.role === "superadmin" ? "Superadmin" : currentUser.role === "admin" ? "Administrador" : "Vendedor"}
            </div>
          </div>
          {canManageUsers && (
            <button onClick={onOpenSellerModal} style={{ ...btnSecondary, padding: "9px 14px", borderRadius: 10 }}>
              {manageButtonLabel}
            </button>
          )}
          <button
            onClick={onOpenPasswordModal}
            style={{
              ...btnSecondary,
              padding: "9px 14px",
              borderRadius: 10,
            }}
          >
            Minha conta
          </button>
          <button onClick={onLogout} style={{ ...btnSecondary, padding: "9px 14px", borderRadius: 10 }}>
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
