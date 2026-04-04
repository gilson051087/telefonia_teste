import { Badge, StatCard, btnDanger, btnPrimary } from "../ui";
import { fmtBRL } from "../../utils/sales";

function fmtMonthLabel(value) {
  if (!value) return "";
  const [year, month] = value.split("-");
  return `${month}/${year}`;
}

export default function SellersTab({ sellerSummaries, currentCycleMonth, onOpenSellerModal, onDeleteSeller }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        className="panel-surface"
        style={{
          borderRadius: 16,
          padding: 22,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 26, color: "#f1f5f9", marginBottom: 4 }}>Vendedores cadastrados</div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Visão mensal {fmtMonthLabel(currentCycleMonth)} da equipe e vendas vinculadas.</div>
        </div>
        <button onClick={onOpenSellerModal} style={btnPrimary}>
          + Novo vendedor
        </button>
      </div>

      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard icon="👥" label="Vendedores" value={sellerSummaries.length} color="#6366f1" />
        <StatCard icon="📋" label="Vendas da Equipe" value={sellerSummaries.reduce((sum, seller) => sum + seller.vendas, 0)} color="#06b6d4" />
        <StatCard icon="✅" label="Ativas" value={sellerSummaries.reduce((sum, seller) => sum + seller.ativas, 0)} color="#10b981" />
        <StatCard icon="⏳" label="Pendentes" value={sellerSummaries.reduce((sum, seller) => sum + seller.pendentes, 0)} color="#f59e0b" />
      </div>

      {sellerSummaries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>👥</div>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#94a3b8", marginBottom: 6 }}>Nenhum vendedor cadastrado</p>
          <button onClick={onOpenSellerModal} style={{ ...btnPrimary, marginTop: 12 }}>
            + Cadastrar vendedor
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {sellerSummaries.map((seller) => (
            <div
              key={seller.id}
              className="panel-surface seller-summary-card"
              style={{
                borderRadius: 16,
                padding: 18,
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>{String(seller.nome || "").toUpperCase()}</div>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>Login: {seller.username}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Badge color="#6366f1">Vendedor</Badge>
                  <button onClick={() => onDeleteSeller(seller.id)} style={{ ...btnDanger, padding: "8px 14px", fontSize: 12 }}>
                    Excluir
                  </button>
                </div>
              </div>

              <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: 14 }}>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total</div>
                  <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700 }}>{seller.vendas}</div>
                </div>
                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: 14 }}>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Ativas</div>
                  <div style={{ color: "#10b981", fontSize: 22, fontWeight: 700 }}>{seller.ativas}</div>
                </div>
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 12, padding: 14 }}>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Pendentes</div>
                  <div style={{ color: "#f59e0b", fontSize: 22, fontWeight: 700 }}>{seller.pendentes}</div>
                </div>
                <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 12, padding: 14 }}>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Receita ativa</div>
                  <div style={{ color: "#06b6d4", fontSize: 22, fontWeight: 700 }}>{fmtBRL(seller.receita)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
