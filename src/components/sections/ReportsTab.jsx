import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Line } from "recharts";
import { PIE_COLORS, PLANO_COLORS, PLANO_LABELS } from "../../constants/sales";
import { fmtBRL, fmtDate, fmtMonth } from "../../utils/sales";
import { btnPrimary, inputStyle } from "../ui";

export default function ReportsTab({
  reportScopedVendas,
  monthData,
  monthPlanSeries,
  planoData,
  dailyReportDate,
  setDailyReportDate,
  dailyReportVendas,
  dailyReportTotal,
  onExportDailyReport,
  monthlyReportMonth,
  setMonthlyReportMonth,
  monthlyReportVendas,
  monthlyReportTotal,
  onExportMonthlyReport,
}) {
  const [showMonthlySales, setShowMonthlySales] = useState(false);
  const [openCategories, setOpenCategories] = useState({});
  const [openDailyCategories, setOpenDailyCategories] = useState({});
  const groupedAllSales = (reportScopedVendas || []).reduce((acc, venda) => {
    const key = venda.plano || "Outros";
    if (!acc[key]) acc[key] = [];
    acc[key].push(venda);
    return acc;
  }, {});
  const groupedAllSalesEntries = Object.entries(groupedAllSales).sort((a, b) => (PLANO_LABELS[a[0]] || a[0]).localeCompare(PLANO_LABELS[b[0]] || b[0]));
  const groupedDailySales = (dailyReportVendas || []).reduce((acc, venda) => {
    const key = venda.plano || "Outros";
    if (!acc[key]) acc[key] = [];
    acc[key].push(venda);
    return acc;
  }, {});
  const groupedDailySalesEntries = Object.entries(groupedDailySales).sort((a, b) => (PLANO_LABELS[a[0]] || a[0]).localeCompare(PLANO_LABELS[b[0]] || b[0]));
  const monthDataWithTotal = monthData.map((entry) => ({
    ...entry,
    total: monthPlanSeries.reduce((sum, plano) => sum + (Number(entry[plano]) || 0), 0),
  }));

  function RevenueTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const orderedPayload = payload
      .filter((item) => item.dataKey !== "total" && Number(item.value) > 0)
      .sort((a, b) => Number(b.value) - Number(a.value));
    const total = payload.find((item) => item.dataKey === "total")?.value || 0;

    return (
      <div style={{ background: "linear-gradient(180deg,#0f172a,#111827)", border: "1px solid rgba(51,65,85,0.9)", borderRadius: 10, color: "#e2e8f0", padding: "10px 12px", minWidth: 180 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#22d3ee", marginBottom: 8 }}>Total: {fmtBRL(total)}</div>
        <div style={{ display: "grid", gap: 4 }}>
          {orderedPayload.map((item) => (
            <div key={item.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12 }}>
              <span style={{ color: "#cbd5e1" }}>{PLANO_LABELS[item.dataKey] || item.dataKey}</span>
              <span style={{ color: "#f8fafc", fontWeight: 700 }}>{fmtBRL(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function toggleCategory(category) {
    setOpenCategories((current) => ({ ...current, [category]: !current[category] }));
  }
  function toggleDailyCategory(category) {
    setOpenDailyCategories((current) => ({ ...current, [category]: !current[category] }));
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        className="panel-surface"
        style={{
          borderRadius: 14,
          padding: "12px 14px",
          borderColor: "rgba(14,165,233,0.4)",
          background: "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(15,23,42,0.9))",
          color: "#cbd5e1",
          fontSize: 12,
        }}
      >
        <strong style={{ color: "#67e8f9" }}>Competência dos relatórios:</strong> vendas de Internet e TV instaladas usam a data de finalização para apuração diária e mensal.
      </div>

      <div
        className="panel-surface"
        style={{
          borderRadius: 14,
          padding: 24,
          display: "grid",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#f1f5f9", marginBottom: 4 }}>Relatório mensal</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Selecione um mês para ver o consolidado e exportar em Excel.</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input aria-label="Selecionar mês do relatório mensal" type="month" value={monthlyReportMonth} onChange={(event) => setMonthlyReportMonth(event.target.value)} style={{ ...inputStyle, width: 180 }} />
            <button onClick={onExportMonthlyReport} disabled={!monthlyReportMonth || monthlyReportVendas.length === 0} style={{ ...btnPrimary, opacity: !monthlyReportMonth || monthlyReportVendas.length === 0 ? 0.5 : 1 }}>
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Mês</div>
            <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>{monthlyReportMonth ? fmtMonth(monthlyReportMonth) : "Selecione"}</div>
          </div>
          <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Vendas do mês</div>
            <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>{monthlyReportVendas.length}</div>
          </div>
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total do mês</div>
            <div style={{ color: "#10b981", fontSize: 20, fontWeight: 700 }}>{fmtBRL(monthlyReportTotal)}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {showMonthlySales ? "Lista completa de vendas expandida por categoria." : "Lista completa de vendas recolhida."}
          </div>
          <button
            type="button"
            onClick={() => setShowMonthlySales((value) => !value)}
            style={{ ...btnPrimary, padding: "8px 14px", opacity: reportScopedVendas.length === 0 ? 0.5 : 1 }}
            disabled={reportScopedVendas.length === 0}
          >
            {showMonthlySales ? "Recolher vendas" : "Mostrar vendas"}
          </button>
        </div>

        {showMonthlySales && (
          <div style={{ border: "1px solid rgba(71,85,105,0.55)", borderRadius: 12, overflow: "hidden", maxHeight: 460, overflowY: "auto" }}>
            {groupedAllSalesEntries.length === 0 ? (
              <div style={{ padding: "18px 16px", color: "#64748b", fontSize: 13 }}>Nenhuma venda encontrada.</div>
            ) : (
              groupedAllSalesEntries.map(([plano, vendas]) => (
                <div key={plano} style={{ borderTop: "1px solid #1e293b" }}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(plano)}
                    style={{
                      width: "100%",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: "10px 16px",
                      background: "rgba(255,255,255,0.03)",
                      color: "#cbd5e1",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{PLANO_LABELS[plano] || plano} • {vendas.length} venda{vendas.length !== 1 ? "s" : ""}</span>
                    <span>{openCategories[plano] ? "▼" : "▶"}</span>
                  </button>
                  {openCategories[plano] &&
                    vendas
                      .slice()
                      .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
                      .map((venda, index) => (
                        <div
                          key={venda.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 2fr 1fr 1.2fr",
                            gap: 12,
                            padding: "10px 16px",
                            borderTop: index === 0 ? "none" : "1px solid #1e293b",
                            color: "#e2e8f0",
                            fontSize: 13,
                          }}
                        >
                          <span>{fmtDate(venda.data)}</span>
                          <span>{venda.cliente}</span>
                          <span>{fmtBRL(venda.valor)}</span>
                          <span>{venda.vendedor ? String(venda.vendedor).toUpperCase() : "—"}</span>
                        </div>
                      ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div
        className="panel-surface"
        style={{
          borderRadius: 14,
          padding: 24,
          display: "grid",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#f1f5f9", marginBottom: 4 }}>Relatório diário</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Selecione um dia para ver as vendas e exportar em Excel.</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input aria-label="Selecionar data do relatório diário" type="date" value={dailyReportDate} onChange={(event) => setDailyReportDate(event.target.value)} style={{ ...inputStyle, width: 180 }} />
            <button onClick={onExportDailyReport} disabled={!dailyReportDate || dailyReportVendas.length === 0} style={{ ...btnPrimary, opacity: !dailyReportDate || dailyReportVendas.length === 0 ? 0.5 : 1 }}>
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Data</div>
            <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>{dailyReportDate ? fmtDate(dailyReportDate) : "Selecione"}</div>
          </div>
          <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Vendas do dia</div>
            <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>{dailyReportVendas.length}</div>
          </div>
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total do dia</div>
            <div style={{ color: "#10b981", fontSize: 20, fontWeight: 700 }}>{fmtBRL(dailyReportTotal)}</div>
          </div>
        </div>

        <div style={{ border: "1px solid rgba(71,85,105,0.55)", borderRadius: 12, overflow: "hidden", maxHeight: 420, overflowY: "auto" }}>
          {groupedDailySalesEntries.length === 0 ? (
            <div style={{ padding: "18px 16px", color: "#64748b", fontSize: 13 }}>Nenhuma venda encontrada para a data selecionada.</div>
          ) : (
            groupedDailySalesEntries.map(([plano, vendas]) => (
              <div key={plano} style={{ borderTop: "1px solid #1e293b" }}>
                <button
                  type="button"
                  onClick={() => toggleDailyCategory(plano)}
                  style={{
                    width: "100%",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "10px 16px",
                    background: "rgba(255,255,255,0.03)",
                    color: "#cbd5e1",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{PLANO_LABELS[plano] || plano} • {vendas.length} venda{vendas.length !== 1 ? "s" : ""}</span>
                  <span>{openDailyCategories[plano] ? "▼" : "▶"}</span>
                </button>
                {openDailyCategories[plano] &&
                  vendas
                    .slice()
                    .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
                    .map((venda, index) => (
                      <div
                        key={venda.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 2fr 1fr 1.2fr",
                          gap: 12,
                          padding: "10px 16px",
                          borderTop: index === 0 ? "none" : "1px solid #1e293b",
                          color: "#e2e8f0",
                          fontSize: 13,
                        }}
                      >
                        <span>{fmtDate(venda.dataCompetencia || venda.data)}</span>
                        <span>{venda.cliente}</span>
                        <span>{fmtBRL(venda.valor)}</span>
                        <span>{venda.vendedor ? String(venda.vendedor).toUpperCase() : "—"}</span>
                      </div>
                    ))}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rel-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
        <div className="panel-surface" style={{ borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#f1f5f9", marginBottom: 2 }}>Receita por mês</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 18 }}>Colunas por serviço em cada mês + linha de total mensal.</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthDataWithTotal} barSize={36} barGap={1} barCategoryGap="2%" margin={{ top: 10, right: 6, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(51,65,85,0.65)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: "rgba(34,211,238,0.08)", stroke: "rgba(34,211,238,0.35)", strokeWidth: 1 }} />
              <Legend formatter={(value) => PLANO_LABELS[value] || value} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              {monthPlanSeries.map((plano, index) => (
                <Bar
                  key={plano}
                  dataKey={plano}
                  fill={PLANO_COLORS[plano] || PIE_COLORS[index % PIE_COLORS.length]}
                  fillOpacity={0.88}
                  radius={[4, 4, 0, 0]}
                  animationDuration={700}
                  activeBar={{
                    fillOpacity: 1,
                    stroke: "rgba(226,232,240,0.65)",
                    strokeWidth: 1,
                    radius: [6, 6, 0, 0],
                  }}
                />
              ))}
              <Line type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2.2} dot={{ r: 2, strokeWidth: 1, fill: "#0f172a" }} activeDot={{ r: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-surface" style={{ borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#f1f5f9", marginBottom: 2 }}>Por produto</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>Distribuição de receita</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={planoData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} dataKey="value" paddingAngle={3}>
                {planoData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} formatter={(value) => [fmtBRL(value)]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
            {planoData.map((item, index) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, background: PIE_COLORS[index % PIE_COLORS.length], flexShrink: 0 }} />
                <span style={{ color: "#94a3b8", flex: 1 }}>{PLANO_LABELS[item.name] || item.name}</span>
                <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{fmtBRL(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
