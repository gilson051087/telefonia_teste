import { useEffect, useState } from "react";
import { PLANOS, PLANO_COLORS, PLANO_ICONS, PLANO_LABELS } from "../../constants/sales";
import { fmtBRL, fmtDate } from "../../utils/sales";
import { AppIcon } from "../icons";
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
  animatedSaleIds = [],
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
  const animatedSaleIdSet = new Set(animatedSaleIds);

  const grouped = PLANOS.map((plano) => ({
    plano,
    items: filtered.filter((venda) => venda.plano === plano),
  })).filter((group) => group.items.length > 0);

  const extras = filtered.filter((venda) => !PLANOS.includes(venda.plano));
  if (extras.length > 0) {
    grouped.push({ plano: "Outros", items: extras });
  }

  const highlightedGroupKey = grouped.find((group) => group.items.some((venda) => animatedSaleIdSet.has(venda.id)))?.plano || "";

  useEffect(() => {
    if (!highlightedGroupKey) return;
    setOpenGroups((current) => (current[highlightedGroupKey] ? current : { [highlightedGroupKey]: true }));
  }, [highlightedGroupKey]);

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
          marginBottom: 18,
          flexWrap: "wrap",
          background: "#141416",
          border: "1px solid #2A2A2E",
          borderRadius: 12,
          padding: "18px 20px",
        }}
      >
        <div>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 28, color: "#FFFFFF", marginBottom: 4 }}>Lançamentos de vendas</div>
        </div>
        <button
          onClick={onOpenNew}
          className="touch-btn lift-hover"
          style={{
            ...btnPrimary,
            padding: "12px 22px",
            boxShadow: "0 10px 30px rgba(218,41,28,0.2)",
            fontSize: 15,
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>➕</span>
          <span>Nova venda rápida</span>
        </button>
      </div>

      {installationReminders.length > 0 && (
        <div
          style={{
            marginBottom: 18,
            border: "1px solid #2A2A2E",
            borderLeft: "3px solid #DA291C",
            borderRadius: 12,
            background: "#141416",
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 14 }}>Lembretes de instalação (Internet e TV)</div>
            <Badge color={pendingInstallationCount > 0 ? "#DA291C" : "#22C55E"}>
              {pendingInstallationCount > 0 ? `${pendingInstallationCount} pendente${pendingInstallationCount > 1 ? "s" : ""}` : "Tudo instalado"}
            </Badge>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {installationReminders.slice(0, 6).map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #2A2A2E",
                  borderRadius: 10,
                  padding: "11px 12px",
                  background: "rgba(20,20,22,0.75)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ color: "#FFFFFF", fontSize: 13 }}>
                  <strong style={{ color: "#FFFFFF" }}>{item.cliente}</strong> · {PLANO_LABELS[item.plano] || item.plano} · {item.tipoPlano}
                  <span style={{ color: "#A1A1AA" }}> · Inst.: {fmtDate(item.dataInstalacao)}</span>
                </div>
                <Badge color={item.statusInstalacao === "Instalado" ? "#22C55E" : (item.statusInstalacao === "Nao instalado" || item.statusInstalacao === "Não instalado") ? "#DA291C" : "#FACC15"}>
                  {item.statusInstalacao === "Nao instalado" ? "Não instalado" : item.statusInstalacao}
                </Badge>
              </div>
            ))}
          </div>
          {installationReminders.length > 6 && <div style={{ marginTop: 8, color: "#A1A1AA", fontSize: 12 }}>Mostrando 6 de {installationReminders.length} lembretes.</div>}
        </div>
      )}

      <div
        className="filters-bar"
        style={{
          background: "#141416",
          border: "1px solid #2A2A2E",
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 18,
        }}
      >
        <div className="filter-field filter-search-top" style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#FFFFFF",
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
              color: "#FFFFFF",
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
        {currentUser.role !== "seller" && (
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
          <button onClick={onClearFilters} className="touch-btn" style={{ ...btnSecondary, padding: "11px 14px", background: "transparent", border: "1px solid #2A2A2E" }}>
            Limpar filtros
          </button>
          <div className="filter-count">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#2A2A2E", flex: 1 }}>
          <div style={{ width: 58, height: 58, margin: "0 auto 12px", display: "grid", placeItems: "center", color: "#52525B" }}>
            <AppIcon name="signal" size={42} strokeWidth={1.5} />
          </div>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#A1A1AA", marginBottom: 6 }}>Nenhum lançamento encontrado</p>
          <button onClick={onOpenNew} className="touch-btn lift-hover" style={{ ...btnPrimary, marginTop: 12 }}>
            + Nova venda
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0, overflowY: "visible", paddingRight: 2, alignItems: "stretch", paddingBottom: 18 }}>
          {grouped.map((group) => {
            const color = PLANO_COLORS[group.plano] || "#DA291C";
            const icon = PLANO_ICONS[group.plano] || "package";
            const title = PLANO_LABELS[group.plano] || group.plano;
            const isOpen = Boolean(openGroups[group.plano]);
            const groupTotal = group.items.reduce((sum, venda) => sum + (Number(venda.valor) || 0), 0);
            const hasAnimatedSale = group.items.some((venda) => animatedSaleIdSet.has(venda.id));

            return (
              <div
                key={group.plano}
                className={`sales-group-card${hasAnimatedSale ? " sale-launch-group" : ""}`}
                style={{
                  width: "100%",
                  height: "auto",
                  background: "#141416",
                  border: "1px solid rgba(42,42,46,0.85)",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: isOpen ? "0 10px 20px rgba(0,0,0,0.3)" : "0 6px 14px rgba(0,0,0,0.28)",
                  transition: "all 0.2s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.plano)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    padding: "16px 18px",
                    borderBottom: isOpen ? "1px solid #2A2A2E" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                    background: "rgba(20,20,22,0.95)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ color, fontWeight: 800, letterSpacing: "0.01em", display: "grid", gap: 5, minWidth: 220, flex: "1 1 280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ color: "#FFFFFF", fontSize: 12 }}>{isOpen ? "▼" : "▶"}</span>
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
                        <AppIcon name={icon} size={16} />
                      </span>
                      <span style={{ fontSize: 18 }}>{title}</span>
                    </div>
                    <div style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
                      {group.items.length} venda{group.items.length !== 1 ? "s" : ""} | {fmtBRL(groupTotal)}
                    </div>
                  </div>
                  <Badge color="#DA291C">{group.items.length} venda{group.items.length !== 1 ? "s" : ""}</Badge>
                </button>

                {isOpen && (
                  <div>
                <div
                  className="desktop-table"
                  style={{
                    overflow: "auto",
                    maxHeight: "clamp(260px, 56vh, 560px)",
                    overscrollBehavior: "contain",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "thin",
                    padding: "8px 12px 12px",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 920 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #2A2A2E", background: "rgba(20,20,22,0.7)" }}>
                        {["cliente", "descricao", "valor", "data", "vendedor"].map((col) => (
                          <th
                            key={col}
                            onClick={() => onToggleSort(col)}
                            style={{
                              padding: "12px 12px",
                              textAlign: "left",
                              fontSize: 10,
                              fontWeight: 700,
                              color: sortBy === col ? "#DA291C" : "#A1A1AA",
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
                        <th style={{ width: 220, background: "rgba(20,20,22,0.7)" }} />
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((venda, index) => {
                        const isAnimatedSale = animatedSaleIdSet.has(venda.id);
                        return (
                        <tr key={venda.id} className={isAnimatedSale ? "sale-launch-row" : ""} style={{ borderBottom: "1px solid rgba(42,42,46,0.8)", background: index % 2 === 0 ? "rgba(20,20,22,0.16)" : "rgba(20,20,22,0.34)", transition: "all 0.2s ease" }}>
                          <td style={{ padding: "14px 12px", fontWeight: 700, color: "#FFFFFF" }}>{venda.cliente}</td>
                          <td style={{ padding: "14px 12px", color: "#A1A1AA", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{venda.descricao || "-"}</td>
                          <td style={{ padding: "14px 12px", fontWeight: 700, color: "#DA291C", fontFamily: "'Crimson Pro',serif", fontSize: 16 }}>{fmtBRL(venda.valor)}</td>
                          <td style={{ padding: "14px 12px", color: "#A1A1AA" }}>{fmtDate(venda.data)}</td>
                          <td style={{ padding: "14px 12px", color: "#FFFFFF" }}>{venda.vendedor ? String(venda.vendedor).toUpperCase() : "-"}</td>
                          <td style={{ padding: "14px 12px" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button title="Ver detalhes" onClick={() => onView(venda)} className="action-pill action-pill-info">
                                <AppIcon name="eye" size={14} />
                                Ver
                              </button>
                              <button title="Editar" onClick={() => onEdit(venda)} className="action-pill action-pill-edit">
                                <AppIcon name="edit" size={14} />
                                Editar
                              </button>
                              <button title="Excluir" onClick={() => onDelete(venda.id)} className="action-pill action-pill-delete">
                                <AppIcon name="trash" size={14} />
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-cards" style={{ display: "none", gap: 10, padding: 12 }}>
                  {group.items.map((venda) => {
                    const isAnimatedSale = animatedSaleIdSet.has(venda.id);
                    return (
                    <div key={venda.id} className={isAnimatedSale ? "sale-launch-card" : ""} style={{ border: "1px solid rgba(42,42,46,0.9)", borderRadius: 10, padding: 15, background: "#141416", boxShadow: "0 8px 16px rgba(0,0,0,0.3)", transition: "all 0.2s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                          <div style={{ fontWeight: 700, color: "#FFFFFF", fontSize: 15 }}>{venda.cliente}</div>
                        </div>

                      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                          <span style={{ color: "#A1A1AA" }}>Valor</span>
                          <span style={{ color: "#DA291C", fontWeight: 700 }}>{fmtBRL(venda.valor)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                          <span style={{ color: "#A1A1AA" }}>Data</span>
                          <span style={{ color: "#FFFFFF" }}>{fmtDate(venda.data)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                          <span style={{ color: "#A1A1AA" }}>Vendedor</span>
                          <span style={{ color: "#FFFFFF" }}>{venda.vendedor ? String(venda.vendedor).toUpperCase() : "-"}</span>
                        </div>
                        {venda.descricao ? (
                          <div style={{ fontSize: 13 }}>
                            <div style={{ color: "#A1A1AA", marginBottom: 4 }}>Descrição</div>
                            <div style={{ color: "#A1A1AA", lineHeight: 1.5 }}>{venda.descricao}</div>
                          </div>
                        ) : null}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                        <button title="Ver detalhes" onClick={() => onView(venda)} className="action-pill action-pill-info">
                          <AppIcon name="eye" size={14} />
                          Ver
                        </button>
                        <button title="Editar" onClick={() => onEdit(venda)} className="action-pill action-pill-edit">
                          <AppIcon name="edit" size={14} />
                          Editar
                        </button>
                        <button title="Excluir" onClick={() => onDelete(venda.id)} className="action-pill action-pill-delete">
                          <AppIcon name="trash" size={14} />
                          Excluir
                        </button>
                      </div>
                    </div>
                    );
                  })}
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
