import { useState } from "react";
import { PLANOS, PLANO_COLORS, PLANO_ICONS, PLANO_LABELS } from "../../constants/sales";
import { fmtBRL, fmtDate } from "../../utils/sales";
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
  fVendedor,
  setFVendedor,
  fMes,
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
  installationReminders,
  pendingInstallationCount,
}) {
  const [openGroups, setOpenGroups] = useState({});

  const grouped = PLANOS.map((plano) => ({
    plano,
    items: filtered.filter((venda) => venda.plano === plano),
  })).filter((group) => group.items.length > 0);

  const extras = filtered.filter((venda) => !PLANOS.includes(venda.plano));
  if (extras.length > 0) {
    grouped.push({ plano: "Outros", items: extras });
  }

  function toggleGroup(groupKey) {
    setOpenGroups((current) => (current[groupKey] ? {} : { [groupKey]: true }));
  }

  return (
    <div className="vendas-screen">
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
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#f1f5f9", marginBottom: 4 }}>Lançamentos de vendas</div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Agora as vendas ficam separadas por categoria de plano.</div>
        </div>
        <button
          onClick={onOpenNew}
          className="touch-btn lift-hover"
          style={{
            ...btnPrimary,
            padding: "12px 22px",
            background: "linear-gradient(135deg,#22c55e,#0ea5e9 55%,#0284c7)",
            border: "1px solid rgba(125,211,252,0.55)",
            boxShadow: "0 14px 28px rgba(14,165,233,0.34)",
            fontSize: 15,
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>➕</span>
          <span>Nova venda rápida</span>
        </button>
      </div>

      <button
        onClick={onOpenNew}
        className="touch-btn lift-hover"
        aria-label="Nova venda rápida"
        title="Nova venda rápida"
        style={{
          ...btnPrimary,
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 85,
          borderRadius: 999,
          width: 62,
          height: 62,
          minHeight: 62,
          padding: 0,
          fontSize: 28,
          background: "linear-gradient(135deg,#0ea5e9,#22c55e)",
          border: "1px solid rgba(52,211,153,0.7)",
          boxShadow: "0 16px 34px rgba(14,165,233,0.42)",
        }}
      >
        ➕
      </button>

      {installationReminders.length > 0 && (
        <div
          style={{
            marginBottom: 14,
            border: "1px solid rgba(245,158,11,0.35)",
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(30,41,59,0.45))",
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ color: "#fef3c7", fontWeight: 700, fontSize: 14 }}>Lembretes de instalação (Internet e TV)</div>
            <Badge color={pendingInstallationCount > 0 ? "#f59e0b" : "#10b981"}>
              {pendingInstallationCount > 0 ? `${pendingInstallationCount} pendente${pendingInstallationCount > 1 ? "s" : ""}` : "Tudo instalado"}
            </Badge>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {installationReminders.slice(0, 6).map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid rgba(51,65,85,0.6)",
                  borderRadius: 10,
                  padding: "9px 10px",
                  background: "rgba(15,23,42,0.75)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ color: "#e2e8f0", fontSize: 13 }}>
                  <strong style={{ color: "#f8fafc" }}>{item.cliente}</strong> · {PLANO_LABELS[item.plano] || item.plano} · {item.tipoPlano}
                  <span style={{ color: "#94a3b8" }}> · Inst.: {fmtDate(item.dataInstalacao)}</span>
                </div>
                <Badge color={item.statusInstalacao === "Instalado" ? "#10b981" : (item.statusInstalacao === "Nao instalado" || item.statusInstalacao === "Não instalado") ? "#ef4444" : "#f59e0b"}>
                  {item.statusInstalacao === "Nao instalado" ? "Não instalado" : item.statusInstalacao}
                </Badge>
              </div>
            ))}
          </div>
          {installationReminders.length > 6 && <div style={{ marginTop: 8, color: "#94a3b8", fontSize: 12 }}>Mostrando 6 de {installationReminders.length} lembretes.</div>}
        </div>
      )}

      <div
        className="filters-bar"
        style={{
          background: "linear-gradient(180deg, rgba(13,21,38,0.98), rgba(11,18,32,0.98))",
          border: "1px solid rgba(51,65,85,0.7)",
          borderRadius: 16,
          padding: "14px 18px",
          marginBottom: 14,
        }}
      >
        <div className="filter-field filter-search-top" style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#67e8f9",
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            placeholder="Buscar cliente ou plano (ex.: maria internet)"
            aria-label="Buscar vendas por cliente, plano ou descrição"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            style={{ ...inputStyle, width: "100%", paddingLeft: 34 }}
          />
        </div>
        <div className="filter-field">
          <select
            aria-label="Filtrar por plano"
            value={fPlano}
            onChange={(event) => {
              setFPlano(event.target.value);
              setPage(1);
            }}
            style={{ ...inputStyle, appearance: "none" }}
          >
            <option>Todos</option>
            {PLANOS.map((plano) => (
              <option key={plano} value={plano}>
                {PLANO_LABELS[plano]}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <input
            type="month"
            aria-label="Mês do ciclo automático"
            value={fMes}
            onChange={() => {}}
            disabled
            title="Ciclo mensal automático"
            style={{ ...inputStyle, opacity: 0.75, cursor: "not-allowed" }}
          />
        </div>
        <div className="filter-field" style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#67e8f9",
              fontSize: 13,
              pointerEvents: "none",
            }}
          >
            📅
          </span>
          <input
            type="date"
            aria-label="Filtrar por dia"
            value={fDia}
            onChange={(event) => {
              setFDia(event.target.value);
              setPage(1);
            }}
            style={{ ...inputStyle, width: "100%", paddingLeft: 34 }}
          />
        </div>
        {currentUser.role === "admin" && (
          <div className="filter-field">
            <select
              aria-label="Filtrar por vendedor"
              value={fVendedor}
              onChange={(event) => {
                setFVendedor(event.target.value);
                setPage(1);
              }}
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="Todos">Todos vendedores</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {String(seller.nome || "").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="filters-actions">
          <button onClick={onClearFilters} className="touch-btn" style={{ ...btnSecondary, padding: "11px 14px", background: "#0f172a", borderColor: "#334155" }}>
            Limpar filtros
          </button>
          <div className="filter-count">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#475569", flex: 1, overflow: "auto" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📡</div>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#94a3b8", marginBottom: 6 }}>Nenhum lançamento encontrado</p>
          <button onClick={onOpenNew} className="touch-btn lift-hover" style={{ ...btnPrimary, marginTop: 12 }}>
            + Nova venda
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, overflowY: "auto", paddingRight: 2, alignItems: "stretch" }}>
          {grouped.map((group) => {
            const color = PLANO_COLORS[group.plano] || "#22d3ee";
            const icon = PLANO_ICONS[group.plano] || "📦";
            const title = PLANO_LABELS[group.plano] || group.plano;
            const isOpen = Boolean(openGroups[group.plano]);
            const groupTotal = group.items.reduce((sum, venda) => sum + (Number(venda.valor) || 0), 0);

            return (
              <div
                key={group.plano}
                className="sales-group-card"
                style={{
                  width: "100%",
                  height: "auto",
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
                    flexWrap: "wrap",
                    gap: 10,
                    background: `linear-gradient(135deg, ${color}1f, rgba(15,23,42,0.88))`,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ color, fontWeight: 800, letterSpacing: "0.01em", display: "grid", gap: 5, minWidth: 220, flex: "1 1 280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ color: "#cbd5e1", fontSize: 12 }}>{isOpen ? "▼" : "▶"}</span>
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 15,
                          background: `${color}2b`,
                          border: `1px solid ${color}66`,
                          boxShadow: `0 8px 14px ${color}22`,
                        }}
                      >
                        {icon}
                      </span>
                      <span style={{ fontSize: 18 }}>{title}</span>
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
                      {group.items.length} venda{group.items.length !== 1 ? "s" : ""} | {fmtBRL(groupTotal)}
                    </div>
                  </div>
                  <Badge color={color}>{group.items.length} venda{group.items.length !== 1 ? "s" : ""}</Badge>
                </button>

                {isOpen && (
                  <div>
                <div className="desktop-table" style={{ overflowX: "auto", padding: "4px 10px 10px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 920 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e293b", background: "rgba(15,23,42,0.7)" }}>
                        {["cliente", "descricao", "valor", "data", "vendedor"].map((col) => (
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
                            {col === "cliente" ? "Cliente" : col === "descricao" ? "Descrição" : col === "valor" ? "Valor" : col === "data" ? "Data" : "Vendedor"}
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
                          <td style={{ padding: "11px 12px", color: "#cbd5e1" }}>{venda.vendedor ? String(venda.vendedor).toUpperCase() : "-"}</td>
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
                          <span style={{ color: "#e2e8f0" }}>{venda.vendedor ? String(venda.vendedor).toUpperCase() : "-"}</span>
                        </div>
                        {venda.descricao ? (
                          <div style={{ fontSize: 13 }}>
                            <div style={{ color: "#64748b", marginBottom: 4 }}>Descrição</div>
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
