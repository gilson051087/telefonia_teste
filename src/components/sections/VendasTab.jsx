import { useState } from "react";
import { PLANOS, PLANO_COLORS, PLANO_ICONS, PLANO_LABELS, STATUS_COLORS, STATUS_OPTIONS } from "../../constants/sales";
import { fmtBRL, fmtDate, fmtMonth } from "../../utils/sales";
import { Badge, btnPrimary, btnSecondary, inputStyle } from "../ui";

function SortArrow({ col, sortBy, sortDir }) {
  return <span style={{ opacity: 0.5 }}>{sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}</span>;
}

const QUICK_STATUS = ["Todos", ...STATUS_OPTIONS];

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
  setPage,
  sortBy,
  sortDir,
  onToggleSort,
  onOpenNew,
  onView,
  onEdit,
  onDelete,
  onClearFilters,
}) {
  const [openGroups, setOpenGroups] = useState({});
  const activeFilters = [fPlano !== "Todos", fStatus !== "Todos", fMes, fDia, currentUser.role === "admin" && fVendedor !== "Todos", search.trim()].filter(Boolean).length;

  const grouped = PLANOS.map((plano) => ({
    plano,
    items: filtered.filter((venda) => venda.plano === plano),
  })).filter((group) => group.items.length > 0);

  const extras = filtered.filter((venda) => !PLANOS.includes(venda.plano));
  if (extras.length > 0) {
    grouped.push({ plano: "Outros", items: extras });
  }

  function toggleGroup(groupKey) {
    setOpenGroups((current) => ({ ...current, [groupKey]: !current[groupKey] }));
  }

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
          background: "linear-gradient(135deg, rgba(8,145,178,0.16), rgba(15,23,42,0.9))",
          border: "1px solid rgba(34,211,238,0.2)",
          borderRadius: 16,
          padding: "16px 18px",
        }}
      >
        <div>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#f1f5f9", marginBottom: 4 }}>Lancamentos de vendas</div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Agora as vendas ficam separadas por categoria de plano.</div>
        </div>
        <button onClick={onOpenNew} className="touch-btn lift-hover" style={{ ...btnPrimary, padding: "12px 22px" }}>
          + Nova venda rapida
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {QUICK_STATUS.map((status) => (
          <button
            key={status}
            onClick={() => {
              setFStatus(status);
              setPage(1);
            }}
            className="quick-filter-btn"
            style={{
              border: `1px solid ${fStatus === status ? "#22d3ee" : "#334155"}`,
              borderRadius: 999,
              padding: "9px 14px",
              background: fStatus === status ? "rgba(34,211,238,0.2)" : "rgba(15,23,42,0.9)",
              color: fStatus === status ? "#67e8f9" : "#94a3b8",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              boxShadow: fStatus === status ? "0 6px 18px rgba(6,182,212,0.2)" : "none",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      <div
        className="filters-bar"
        style={{
          background: "linear-gradient(180deg, rgba(13,21,38,0.98), rgba(11,18,32,0.98))",
          border: "1px solid rgba(51,65,85,0.7)",
          borderRadius: 16,
          padding: "14px 18px",
          marginBottom: 14,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Buscar cliente, plano ou vendedor"
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
          style={{ ...inputStyle, width: 150, appearance: "none" }}
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
        <button onClick={onClearFilters} className="touch-btn" style={{ ...btnSecondary, padding: "11px 14px", background: "#0f172a", borderColor: "#334155" }}>
          Limpar filtros
        </button>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#64748b", fontWeight: 600 }}>{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      {(fMes || fDia || activeFilters > 0) && (
        <div style={{ marginBottom: 14, color: "#94a3b8", fontSize: 13 }}>
          {fDia ? `Separando vendas do dia ${fmtDate(fDia)}.` : fMes ? `Separando vendas do mes ${fmtMonth(fMes)}.` : "Usando filtros personalizados."}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📡</div>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#94a3b8", marginBottom: 6 }}>Nenhum lancamento encontrado</p>
          <button onClick={onOpenNew} className="touch-btn lift-hover" style={{ ...btnPrimary, marginTop: 12 }}>
            + Nova venda
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {grouped.map((group) => {
            const color = PLANO_COLORS[group.plano] || "#22d3ee";
            const icon = PLANO_ICONS[group.plano] || "📦";
            const title = PLANO_LABELS[group.plano] || group.plano;
            const isOpen = Boolean(openGroups[group.plano]);

            return (
              <div
                key={group.plano}
                style={{
                  background: "linear-gradient(180deg, rgba(13,21,38,1), rgba(10,16,29,1))",
                  border: "1px solid rgba(51,65,85,0.55)",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: isOpen ? `0 12px 30px ${color}22` : "0 6px 16px rgba(2,6,23,0.35)",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.plano)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderBottom: isOpen ? "1px solid #1e293b" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    background: `linear-gradient(135deg, ${color}1f, rgba(15,23,42,0.88))`,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ color, fontWeight: 800, letterSpacing: "0.01em", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#cbd5e1", fontSize: 12 }}>{isOpen ? "▼" : "▶"}</span>
                    <span>{icon}</span>
                    <span style={{ fontSize: 15 }}>{title}</span>
                  </div>
                  <Badge color={color}>{group.items.length} venda{group.items.length !== 1 ? "s" : ""}</Badge>
                </button>

                {isOpen && (
                  <>
                <div className="desktop-table" style={{ overflowX: "auto", padding: "4px 10px 10px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 920 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e293b", background: "rgba(15,23,42,0.7)" }}>
                        {["cliente", "descricao", "valor", "data", "vendedor", "status"].map((col) => (
                          <th
                            key={col}
                            onClick={() => onToggleSort(col)}
                            style={{
                              padding: "12px 12px",
                              textAlign: "left",
                              fontSize: 10,
                              fontWeight: 700,
                              color: sortBy === col ? "#22d3ee" : "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              cursor: "pointer",
                              userSelect: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {col === "cliente" ? "Cliente" : col === "descricao" ? "Descricao" : col === "valor" ? "Valor" : col === "data" ? "Data" : col === "vendedor" ? "Vendedor" : "Status"}
                            <SortArrow col={col} sortBy={sortBy} sortDir={sortDir} />
                          </th>
                        ))}
                        <th style={{ width: 220, background: "rgba(15,23,42,0.7)" }} />
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((venda, index) => (
                        <tr key={venda.id} style={{ borderBottom: "1px solid rgba(30,41,59,0.8)", background: index % 2 === 0 ? "rgba(15,23,42,0.16)" : "rgba(15,23,42,0.34)" }}>
                          <td style={{ padding: "11px 12px", fontWeight: 700, color: "#f8fafc" }}>{venda.cliente}</td>
                          <td style={{ padding: "11px 12px", color: "#94a3b8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{venda.descricao || "-"}</td>
                          <td style={{ padding: "11px 12px", fontWeight: 700, color: "#34d399", fontFamily: "'Crimson Pro',serif", fontSize: 16 }}>{fmtBRL(venda.valor)}</td>
                          <td style={{ padding: "11px 12px", color: "#94a3b8" }}>{fmtDate(venda.data)}</td>
                          <td style={{ padding: "11px 12px", color: "#cbd5e1" }}>{venda.vendedor || "-"}</td>
                          <td style={{ padding: "11px 12px" }}>
                            <Badge color={STATUS_COLORS[venda.status] || "#10b981"}>{venda.status}</Badge>
                          </td>
                          <td style={{ padding: "11px 12px" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button title="Ver detalhes" onClick={() => onView(venda)} className="action-pill action-pill-info">
                                👁 Ver
                              </button>
                              <button title="Editar" onClick={() => onEdit(venda)} className="action-pill action-pill-edit">
                                ✏ Editar
                              </button>
                              <button title="Excluir" onClick={() => onDelete(venda.id)} className="action-pill action-pill-delete">
                                🗑 Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-cards" style={{ display: "none", gap: 10, padding: 12 }}>
                  {group.items.map((venda) => (
                    <div key={venda.id} style={{ border: "1px solid rgba(51,65,85,0.7)", borderRadius: 14, padding: 14, background: "linear-gradient(180deg,#111b31,#0b1324)", boxShadow: "0 8px 20px rgba(2,6,23,0.35)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 15 }}>{venda.cliente}</div>
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
                          <span style={{ color: "#e2e8f0" }}>{venda.vendedor || "-"}</span>
                        </div>
                        {venda.descricao ? (
                          <div style={{ fontSize: 13 }}>
                            <div style={{ color: "#64748b", marginBottom: 4 }}>Descricao</div>
                            <div style={{ color: "#94a3b8", lineHeight: 1.5 }}>{venda.descricao}</div>
                          </div>
                        ) : null}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                        <button title="Ver detalhes" onClick={() => onView(venda)} className="action-pill action-pill-info">
                          Ver
                        </button>
                        <button title="Editar" onClick={() => onEdit(venda)} className="action-pill action-pill-edit">
                          Editar
                        </button>
                        <button title="Excluir" onClick={() => onDelete(venda.id)} className="action-pill action-pill-delete">
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
