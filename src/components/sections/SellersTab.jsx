import { Badge, StatCard, btnDanger, btnPrimary, btnSecondary } from "../ui";
import { fmtBRL } from "../../utils/sales";
import { AppIcon } from "../icons";

function fmtMonthLabel(value) {
  if (!value) return "";
  const [year, month] = value.split("-");
  return `${month}/${year}`;
}

function getRoleLabel(role) {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Administrador";
  return "Vendedor";
}

function getRoleColor(role) {
  if (role === "superadmin") return "#0EA5E9";
  if (role === "admin") return "#DA291C";
  return "#EF4444";
}

export default function SellersTab({ userSummaries, currentCycleMonth, onOpenSellerModal, onDeleteSeller, onEditUser, onManageSellerAdmins, canManageAdmins = false }) {
  const sellerSummaries = userSummaries.filter((item) => item.role === "seller");
  const adminCount = userSummaries.filter((item) => item.role === "admin").length;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div
        className="panel-surface"
        style={{
          borderRadius: 16,
          padding: 24,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
        >
        <div>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 26, color: "#FFFFFF", marginBottom: 4 }}>
            {canManageAdmins ? "Usuários cadastrados" : "Vendedores cadastrados"}
          </div>
          <div style={{ color: "#A1A1AA", fontSize: 14 }}>
            Visão mensal {fmtMonthLabel(currentCycleMonth)} da equipe e vendas vinculadas.
          </div>
        </div>
        <button onClick={onOpenSellerModal} style={btnPrimary}>
          {canManageAdmins ? "+ Novo usuário" : "+ Novo vendedor"}
        </button>
      </div>

      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatCard icon={<AppIcon name="users" size={18} />} label={canManageAdmins ? "Usuários" : "Vendedores"} value={userSummaries.length} color="#DA291C" />
        <StatCard icon={<AppIcon name="tools" size={18} />} label={canManageAdmins ? "Administradores" : "Vendedores ativos"} value={canManageAdmins ? adminCount : sellerSummaries.length} color="#DA291C" />
        <StatCard icon={<AppIcon name="sales" size={18} />} label="Vendas da Equipe" value={sellerSummaries.reduce((sum, seller) => sum + seller.vendas, 0)} color="#DA291C" />
        <StatCard icon={<AppIcon name="check" size={18} />} label="Ativas" value={sellerSummaries.reduce((sum, seller) => sum + seller.ativas, 0)} color="#22C55E" />
        <StatCard icon={<AppIcon name="hourglass" size={18} />} label="Pendentes" value={sellerSummaries.reduce((sum, seller) => sum + seller.pendentes, 0)} color="#FACC15" />
      </div>

      {userSummaries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#2A2A2E" }}>
          <div style={{ width: 58, height: 58, margin: "0 auto 12px", display: "grid", placeItems: "center", color: "#52525B" }}>
            <AppIcon name="users" size={42} strokeWidth={1.5} />
          </div>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#A1A1AA", marginBottom: 6 }}>
            {canManageAdmins ? "Nenhum usuário cadastrado" : "Nenhum vendedor cadastrado"}
          </p>
          <button onClick={onOpenSellerModal} style={{ ...btnPrimary, marginTop: 12 }}>
            {canManageAdmins ? "+ Cadastrar usuário" : "+ Cadastrar vendedor"}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {userSummaries.map((seller) => (
            <div
              key={seller.id}
              className="panel-surface seller-summary-card"
              style={{
                borderRadius: 16,
                padding: 20,
                display: "grid",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>{String(seller.nome || "").toUpperCase()}</div>
                  </div>
                  <div style={{ color: "#A1A1AA", fontSize: 13 }}>Login: {seller.username}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Badge color={getRoleColor(seller.role)}>
                    {getRoleLabel(seller.role)}
                  </Badge>
                  <button onClick={() => onEditUser(seller.id)} style={{ ...btnSecondary, padding: "8px 14px", fontSize: 12 }}>
                    Editar nome
                  </button>
                  {canManageAdmins && seller.role === "seller" && (
                    <button onClick={() => onManageSellerAdmins?.(seller.id)} style={{ ...btnSecondary, padding: "8px 14px", fontSize: 12 }}>
                      Mover para admins
                    </button>
                  )}
                  {seller.role !== "superadmin" && (
                    <button onClick={() => onDeleteSeller(seller.id)} style={{ ...btnDanger, padding: "8px 14px", fontSize: 12 }}>
                      Excluir
                    </button>
                  )}
                </div>
              </div>

              <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
                <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
                  <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total</div>
                  <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700 }}>{seller.vendas}</div>
                </div>
                <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
                  <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Ativas</div>
                  <div style={{ color: "#22C55E", fontSize: 22, fontWeight: 700 }}>{seller.ativas}</div>
                </div>
                <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
                  <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Pendentes</div>
                  <div style={{ color: "#FACC15", fontSize: 22, fontWeight: 700 }}>{seller.pendentes}</div>
                </div>
                <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
                  <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Receita ativa</div>
                  <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700 }}>{fmtBRL(seller.receita)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
