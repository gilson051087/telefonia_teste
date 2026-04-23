import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Line } from "recharts";
import { PLANO_LABELS } from "../../constants/sales";
import { fmtBRL, fmtDate, fmtMonth } from "../../utils/sales";
import { btnPrimary, inputStyle } from "../ui";

const REPORT_PLANO_COLORS = {
  "Plano Controle": "#6366f1",
  "Plano Pós-Pago": "#8b5cf6",
  "Internet Residencial": "#06b6d4",
  "Internet Movel Mais": "#0ea5e9",
  TV: "#f59e0b",
  "Aparelho Celular": "#10b981",
  Acessorios: "#ec4899",
  "Seguro Movel Celular": "#f97316",
};

const REPORT_PIE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#f97316"];

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
    <div style={{ display: "grid", gap: 22 }}>
      <div
        className="panel-surface"
        style={{
          borderRadius: 12,
          padding: "14px 16px",
          borderColor: "#2A2A2E",
          borderLeft: "3px solid #DA291C",
          background: "#141416",
          color: "#FFFFFF",
          fontSize: 12,
        }}
      >
        <strong style={{ color: "#FFFFFF" }}>Competência dos relatórios:</strong> vendas de Internet e TV instaladas usam a data de finalização para apuração diária e mensal.
      </div>

      <div
        className="panel-surface"
        style={{
          borderRadius: 16,
          padding: 26,
          display: "grid",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#FFFFFF", marginBottom: 4 }}>Relatório mensal</div>
            <div style={{ fontSize: 13, color: "#A1A1AA" }}>Selecione um mês para ver o consolidado e exportar em Excel.</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input aria-label="Selecionar mês do relatório mensal" type="month" value={monthlyReportMonth} onChange={(event) => setMonthlyReportMonth(event.target.value)} style={{ ...inputStyle, width: 180 }} />
            <button onClick={onExportMonthlyReport} disabled={!monthlyReportMonth || monthlyReportVendas.length === 0} style={{ ...btnPrimary, opacity: !monthlyReportMonth || monthlyReportVendas.length === 0 ? 0.5 : 1 }}>
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Mês</div>
            <div style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{monthlyReportMonth ? fmtMonth(monthlyReportMonth) : "Selecione"}</div>
          </div>
          <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Vendas do mês</div>
            <div style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{monthlyReportVendas.length}</div>
          </div>
          <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total do mês</div>
            <div style={{ color: "#22C55E", fontSize: 20, fontWeight: 700 }}>{fmtBRL(monthlyReportTotal)}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "#A1A1AA" }}>
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
          <div style={{ border: "1px solid rgba(42,42,46,0.95)", borderRadius: 12, overflow: "hidden", maxHeight: 460, overflowY: "auto" }}>
            {groupedAllSalesEntries.length === 0 ? (
              <div style={{ padding: "18px 16px", color: "#A1A1AA", fontSize: 13 }}>Nenhuma venda encontrada.</div>
            ) : (
              groupedAllSalesEntries.map(([plano, vendas]) => (
                <div key={plano} style={{ borderTop: "1px solid #2A2A2E" }}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(plano)}
                    style={{
                      width: "100%",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.03)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.2s ease",
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
                            padding: "12px 16px",
                            borderTop: index === 0 ? "none" : "1px solid #2A2A2E",
                            color: "#FFFFFF",
                            fontSize: 13,
                            transition: "all 0.2s ease",
                          }}
                        >
                          <span>{fmtDate(venda.data)}</span>
                          <span>{venda.cliente}</span>
                          <span>{fmtBRL(venda.receita ?? venda.valor)}</span>
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
          borderRadius: 16,
          padding: 26,
          display: "grid",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#FFFFFF", marginBottom: 4 }}>Relatório diário</div>
            <div style={{ fontSize: 13, color: "#A1A1AA" }}>Selecione um dia para ver as vendas e exportar em Excel.</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input aria-label="Selecionar data do relatório diário" type="date" value={dailyReportDate} onChange={(event) => setDailyReportDate(event.target.value)} style={{ ...inputStyle, width: 180 }} />
            <button onClick={onExportDailyReport} disabled={!dailyReportDate || dailyReportVendas.length === 0} style={{ ...btnPrimary, opacity: !dailyReportDate || dailyReportVendas.length === 0 ? 0.5 : 1 }}>
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Data</div>
            <div style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{dailyReportDate ? fmtDate(dailyReportDate) : "Selecione"}</div>
          </div>
          <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Vendas do dia</div>
            <div style={{ color: "#FFFFFF", fontSize: 20, fontWeight: 700 }}>{dailyReportVendas.length}</div>
          </div>
          <div style={{ background: "#141416", border: "1px solid #2A2A2E", borderRadius: 12, padding: 16 }}>
            <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total do dia</div>
            <div style={{ color: "#22C55E", fontSize: 20, fontWeight: 700 }}>{fmtBRL(dailyReportTotal)}</div>
          </div>
        </div>

        <div style={{ border: "1px solid rgba(42,42,46,0.95)", borderRadius: 12, overflow: "hidden", maxHeight: 420, overflowY: "auto" }}>
          {groupedDailySalesEntries.length === 0 ? (
            <div style={{ padding: "18px 16px", color: "#A1A1AA", fontSize: 13 }}>Nenhuma venda encontrada para a data selecionada.</div>
          ) : (
            groupedDailySalesEntries.map(([plano, vendas]) => (
              <div key={plano} style={{ borderTop: "1px solid #2A2A2E" }}>
                <button
                  type="button"
                  onClick={() => toggleDailyCategory(plano)}
                  style={{
                    width: "100%",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.03)",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s ease",
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
                          padding: "12px 16px",
                          borderTop: index === 0 ? "none" : "1px solid #2A2A2E",
                          color: "#FFFFFF",
                          fontSize: 13,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span>{fmtDate(venda.dataCompetencia || venda.data)}</span>
                        <span>{venda.cliente}</span>
                        <span>{fmtBRL(venda.receita ?? venda.valor)}</span>
                        <span>{venda.vendedor ? String(venda.vendedor).toUpperCase() : "—"}</span>
                      </div>
                    ))}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rel-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div className="panel-surface" style={{ borderRadius: 16, padding: 26 }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#FFFFFF", marginBottom: 2 }}>Receita por mês</div>
          <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 18 }}>Colunas por serviço em cada mês + linha de total mensal.</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthDataWithTotal} barSize={36} barGap={1} barCategoryGap="2%" margin={{ top: 10, right: 6, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(42,42,46,0.95)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#A1A1AA", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: "rgba(34,211,238,0.08)", stroke: "rgba(34,211,238,0.35)", strokeWidth: 1 }} />
              <Legend formatter={(value) => PLANO_LABELS[value] || value} wrapperStyle={{ fontSize: 11, color: "#A1A1AA" }} />
              {monthPlanSeries.map((plano, index) => (
                <Bar
                  key={plano}
                  dataKey={plano}
                  fill={REPORT_PLANO_COLORS[plano] || REPORT_PIE_COLORS[index % REPORT_PIE_COLORS.length]}
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
              <Line type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2.2} dot={{ r: 2, strokeWidth: 1, fill: "#141416" }} activeDot={{ r: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-surface" style={{ borderRadius: 16, padding: 26 }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#FFFFFF", marginBottom: 2 }}>Por produto</div>
          <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 10 }}>Distribuição de receita</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={planoData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} dataKey="value" paddingAngle={3}>
                {planoData.map((_, index) => (
                  <Cell key={index} fill={REPORT_PIE_COLORS[index % REPORT_PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} formatter={(value) => [fmtBRL(value)]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
            {planoData.map((item, index) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, background: REPORT_PIE_COLORS[index % REPORT_PIE_COLORS.length], flexShrink: 0 }} />
                <span style={{ color: "#A1A1AA", flex: 1 }}>{PLANO_LABELS[item.name] || item.name}</span>
                <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{fmtBRL(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
