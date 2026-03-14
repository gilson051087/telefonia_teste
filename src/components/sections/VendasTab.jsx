import { PLANOS, PLANO_COLORS, PLANO_ICONS, PLANO_LABELS, STATUS_COLORS, STATUS_OPTIONS } from "../../constants/sales";
import { fmtBRL, fmtDate, fmtMonth } from "../../utils/sales";
import { Badge, btnPrimary, btnSecondary, inputStyle } from "../ui";

function SortArrow({ col, sortBy, sortDir }) {
  return <span style={{ opacity: 0.5 }}>{sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}</span>;
}

export default function VendasTab({
  currentUser,
  sellers,
  search,
  setSearch,
  fPlano,
  setFPlano,
  fStatus,
  setFStatus,
  fVendedor,
  setFVendedor,
  fMes,
  setFMes,
  fDia,
  setFDia,
  filtered,
  paginated,
  page,
  setPage,
  totalPages,
  sortBy,
  sortDir,
  onToggleSort,
  onOpenNew,
  onView,
  onEdit,
  onDelete,
  onClearFilters,
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 26, color: "#f1f5f9", marginBottom: 4 }}>Lancamentos de vendas</div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Registre novas vendas e acompanhe os lancamentos da equipe.</div>
        </div>
        <button onClick={onOpenNew} style={{ ...btnPrimary, padding: "10px 22px" }}>
          + Nova Venda
        </button>
      </div>

      <div
        className="filters-bar"
        style={{
          background: "#0d1526",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: "14px 18px",
          marginBottom: 14,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="🔍 Buscar cliente, plano, vendedor..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          style={{ ...inputStyle, width: 280 }}
        />
        <select
          value={fPlano}
          onChange={(event) => {
            setFPlano(event.target.value);
            setPage(1);
          }}
          style={{ ...inputStyle, width: 190, appearance: "none" }}
        >
          <option>Todos</option>
          {PLANOS.map((plano) => (
            <option key={plano} value={plano}>
              {PLANO_LABELS[plano]}
            </option>
          ))}
        </select>
        <select
          value={fStatus}
          onChange={(event) => {
            setFStatus(event.target.value);
            setPage(1);
          }}
          style={{ ...inputStyle, width: 140, appearance: "none" }}
        >
          <option>Todos</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <input
          type="month"
          value={fMes}
          onChange={(event) => {
            setFMes(event.target.value);
            setPage(1);
          }}
          style={{ ...inputStyle, width: 170 }}
        />
        <input
          type="date"
          value={fDia}
          onChange={(event) => {
            setFDia(event.target.value);
            setPage(1);
          }}
          style={{ ...inputStyle, width: 170 }}
        />
        {currentUser.role === "admin" && (
          <select
            value={fVendedor}
            onChange={(event) => {
              setFVendedor(event.target.value);
              setPage(1);
            }}
            style={{ ...inputStyle, width: 200, appearance: "none" }}
          >
            <option value="Todos">Todos vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.nome}
              </option>
            ))}
          </select>
        )}
        <button onClick={onClearFilters} style={{ ...btnSecondary, padding: "10px 14px" }}>
          Limpar filtros
        </button>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#475569" }}>{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      {(fMes || fDia) && (
        <div style={{ marginBottom: 14, color: "#94a3b8", fontSize: 13 }}>
          {fDia ? `Separando vendas do dia ${fmtDate(fDia)}` : `Separando vendas do mes ${fmtMonth(fMes)}`}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📡</div>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#94a3b8", marginBottom: 6 }}>Nenhum lancamento encontrado</p>
          <button onClick={onOpenNew} style={{ ...btnPrimary, marginTop: 12 }}>
            + Nova Venda
          </button>
        </div>
      ) : (
        <div style={{ background: "#0d1526", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden" }}>
          <div className="desktop-table" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 980 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {[["cliente", "Cliente"], ["plano", "Plano"], ["descricao", "Descricao"], ["valor", "Valor"], ["data", "Data"], ["vendedor", "Vendedor"], ["status", "Status"]].map(([col, label]) => (
                    <th
                      key={col}
                      onClick={() => onToggleSort(col)}
                      style={{
                        padding: "13px 14px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        color: sortBy === col ? "#818cf8" : "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        cursor: "pointer",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                      <SortArrow col={col} sortBy={sortBy} sortDir={sortDir} />
                    </th>
                  ))}
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {paginated.map((venda, index) => (
                  <tr key={venda.id} style={{ borderBottom: "1px solid #1e293b", background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#f1f5f9" }}>{venda.cliente}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge color={PLANO_COLORS[venda.plano] || "#6366f1"}>
                        {PLANO_ICONS[venda.plano]} {PLANO_LABELS[venda.plano] || venda.plano}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#94a3b8", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{venda.descricao || "—"}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#10b981", fontFamily: "'Crimson Pro',serif", fontSize: 15 }}>{fmtBRL(venda.valor)}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{fmtDate(venda.data)}</td>
                    <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{venda.vendedor || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge color={STATUS_COLORS[venda.status] || "#10b981"}>{venda.status}</Badge>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button title="Ver detalhes" onClick={() => onView(venda)} style={{ background: "rgba(6,182,212,0.1)", border: "none", color: "#06b6d4", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                          👁️
                        </button>
                        <button title="Editar" onClick={() => onEdit(venda)} style={{ background: "rgba(99,102,241,0.1)", border: "none", color: "#818cf8", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                          ✏️
                        </button>
                        <button title="Excluir" onClick={() => onDelete(venda.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#f87171", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-cards" style={{ display: "none", gap: 12, padding: 12 }}>
            {paginated.map((venda) => (
              <div key={venda.id} style={{ border: "1px solid #1e293b", borderRadius: 14, padding: 14, background: "linear-gradient(180deg,#111b31,#0d1526)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 15, marginBottom: 6 }}>{venda.cliente}</div>
                    <Badge color={PLANO_COLORS[venda.plano] || "#6366f1"}>
                      {PLANO_ICONS[venda.plano]} {PLANO_LABELS[venda.plano] || venda.plano}
                    </Badge>
                  </div>
                  <Badge color={STATUS_COLORS[venda.status] || "#10b981"}>{venda.status}</Badge>
                </div>

                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Valor</span>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>{fmtBRL(venda.valor)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Data</span>
                    <span style={{ color: "#e2e8f0" }}>{fmtDate(venda.data)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Vendedor</span>
                    <span style={{ color: "#e2e8f0" }}>{venda.vendedor || "—"}</span>
                  </div>
                  {venda.descricao ? (
                    <div style={{ fontSize: 13 }}>
                      <div style={{ color: "#64748b", marginBottom: 4 }}>Descricao</div>
                      <div style={{ color: "#94a3b8", lineHeight: 1.5 }}>{venda.descricao}</div>
                    </div>
                  ) : null}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  <button title="Ver detalhes" onClick={() => onView(venda)} style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4", borderRadius: 10, padding: "10px 8px", cursor: "pointer" }}>
                    Ver
                  </button>
                  <button title="Editar" onClick={() => onEdit(venda)} style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: 10, padding: "10px 8px", cursor: "pointer" }}>
                    Editar
                  </button>
                  <button title="Excluir" onClick={() => onDelete(venda.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 10, padding: "10px 8px", cursor: "pointer" }}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{ padding: "12px 20px", display: "flex", justifyContent: "center", gap: 6, borderTop: "1px solid #1e293b" }}>
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} style={{ ...btnSecondary, padding: "6px 14px", opacity: page === 1 ? 0.4 : 1 }}>
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                <button key={value} onClick={() => setPage(value)} style={{ ...(value === page ? btnPrimary : btnSecondary), padding: "6px 14px" }}>
                  {value}
                </button>
              ))}
              <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} style={{ ...btnSecondary, padding: "6px 14px", opacity: page === totalPages ? 0.4 : 1 }}>
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
