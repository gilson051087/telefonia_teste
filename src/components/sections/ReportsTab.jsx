import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { PIE_COLORS, PLANO_COLORS, PLANO_ICONS, PLANO_LABELS, STATUS_COLORS } from "../../constants/sales";
import { fmtBRL, fmtDate, fmtMonth } from "../../utils/sales";
import { btnPrimary, inputStyle } from "../ui";

export default function ReportsTab({
  currentUser,
  sellers,
  scopedVendas,
  monthData,
  monthPlanSeries,
  planoData,
  byStatus,
  reportSeller,
  setReportSeller,
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

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {currentUser.role === "admin" && (
        <div
          className="panel-surface"
          style={{
            borderRadius: 14,
            padding: 18,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#f1f5f9", marginBottom: 4 }}>Filtro de Relatorio</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Escolha um vendedor para aplicar no relatorio diario, mensal e na exportacao.</div>
          </div>
          <select value={reportSeller} onChange={(event) => setReportSeller(event.target.value)} style={{ ...inputStyle, width: 220, appearance: "none" }}>
            <option value="Todos">Todos vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.nome}
              </option>
            ))}
          </select>
        </div>
      )}

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
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#f1f5f9", marginBottom: 4 }}>Relatorio Mensal</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Selecione um mes para ver o consolidado e exportar em Excel.</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input type="month" value={monthlyReportMonth} onChange={(event) => setMonthlyReportMonth(event.target.value)} style={{ ...inputStyle, width: 180 }} />
            <button onClick={onExportMonthlyReport} disabled={!monthlyReportMonth || monthlyReportVendas.length === 0} style={{ ...btnPrimary, opacity: !monthlyReportMonth || monthlyReportVendas.length === 0 ? 0.5 : 1 }}>
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Mes</div>
            <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>{monthlyReportMonth ? fmtMonth(monthlyReportMonth) : "Selecione"}</div>
          </div>
          <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Vendas do mes</div>
            <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>{monthlyReportVendas.length}</div>
          </div>
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total do mes</div>
            <div style={{ color: "#10b981", fontSize: 20, fontWeight: 700 }}>{fmtBRL(monthlyReportTotal)}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {showMonthlySales ? "Lista mensal expandida." : "Lista mensal recolhida para facilitar a visualizacao."}
          </div>
          <button
            type="button"
            onClick={() => setShowMonthlySales((value) => !value)}
            style={{ ...btnPrimary, padding: "8px 14px", opacity: monthlyReportVendas.length === 0 ? 0.5 : 1 }}
            disabled={monthlyReportVendas.length === 0}
          >
            {showMonthlySales ? "Recolher vendas" : "Mostrar vendas"}
          </button>
        </div>

        {showMonthlySales && (
          <div style={{ border: "1px solid rgba(71,85,105,0.55)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.4fr 1fr 1fr 1.2fr", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.02)", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Data</span>
              <span>Cliente</span>
              <span>Plano</span>
              <span>Status</span>
              <span>Valor</span>
              <span>Vendedor</span>
            </div>
            {monthlyReportVendas.length === 0 ? (
              <div style={{ padding: "18px 16px", color: "#64748b", fontSize: 13 }}>Nenhuma venda encontrada para o mes selecionado.</div>
            ) : (
              monthlyReportVendas.slice(0, 8).map((venda, index) => (
                <div
                  key={venda.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr 1.4fr 1fr 1fr 1.2fr",
                    gap: 12,
                    padding: "12px 16px",
                    borderTop: index === 0 ? "none" : "1px solid #1e293b",
                    color: "#e2e8f0",
                    fontSize: 13,
                  }}
                >
                  <span>{fmtDate(venda.data)}</span>
                  <span>{venda.cliente}</span>
                  <span>{PLANO_LABELS[venda.plano] || venda.plano}</span>
                  <span style={{ color: STATUS_COLORS[venda.status] || "#e2e8f0" }}>{venda.status}</span>
                  <span>{fmtBRL(venda.valor)}</span>
                  <span>{venda.vendedor || "—"}</span>
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
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#f1f5f9", marginBottom: 4 }}>Relatorio Diario</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Selecione um dia para ver as vendas e exportar em Excel.</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input type="date" value={dailyReportDate} onChange={(event) => setDailyReportDate(event.target.value)} style={{ ...inputStyle, width: 180 }} />
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

        <div style={{ border: "1px solid rgba(71,85,105,0.55)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 1.2fr", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.02)", color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span>Cliente</span>
            <span>Plano</span>
            <span>Status</span>
            <span>Valor</span>
            <span>Vendedor</span>
          </div>
          {dailyReportVendas.length === 0 ? (
            <div style={{ padding: "18px 16px", color: "#64748b", fontSize: 13 }}>Nenhuma venda encontrada para a data selecionada.</div>
          ) : (
            dailyReportVendas.slice(0, 8).map((venda, index) => (
              <div
                key={venda.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.4fr 1fr 1fr 1.2fr",
                  gap: 12,
                  padding: "12px 16px",
                  borderTop: index === 0 ? "none" : "1px solid #1e293b",
                  color: "#e2e8f0",
                  fontSize: 13,
                }}
              >
                <span>{venda.cliente}</span>
                <span>{PLANO_LABELS[venda.plano] || venda.plano}</span>
                <span style={{ color: STATUS_COLORS[venda.status] || "#e2e8f0" }}>{venda.status}</span>
                <span>{fmtBRL(venda.valor)}</span>
                <span>{venda.vendedor || "—"}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rel-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
        <div className="panel-surface" style={{ borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#f1f5f9", marginBottom: 2 }}>Receita por Mes</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 18 }}>Separada por tipo de venda (Controle, Pos-pago, Seguro etc.)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                formatter={(value, name) => [fmtBRL(value), PLANO_LABELS[name] || name]}
              />
              <Legend formatter={(value) => PLANO_LABELS[value] || value} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              {monthPlanSeries.map((plano, index) => (
                <Bar key={plano} dataKey={plano} stackId="receita" fill={PLANO_COLORS[plano] || PIE_COLORS[index % PIE_COLORS.length]} radius={[index === monthPlanSeries.length - 1 ? 6 : 0, index === monthPlanSeries.length - 1 ? 6 : 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-surface" style={{ borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#f1f5f9", marginBottom: 2 }}>Por Produto</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>Distribuicao de receita</div>
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

      <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="panel-surface" style={{ borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#f1f5f9", marginBottom: 2 }}>Status das Vendas</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 18 }}>Quantidade por status</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byStatus} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {byStatus.map((item, index) => (
                  <Cell key={index} fill={STATUS_COLORS[item.name] || "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-surface" style={{ borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#f1f5f9", marginBottom: 2 }}>
            {currentUser.role === "admin" ? "Ranking de Vendedores" : "Ranking de Produtos"}
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 18 }}>
            {currentUser.role === "admin" ? "Quantidade de vendas por vendedor" : "Quantidade de vendas por produto"}
          </div>
          {(() => {
            const counter = {};

            if (currentUser.role === "admin") {
              scopedVendas.forEach((venda) => {
                counter[venda.vendedor || "Sem vendedor"] = (counter[venda.vendedor || "Sem vendedor"] || 0) + 1;
              });
            } else {
              scopedVendas.forEach((venda) => {
                counter[venda.plano] = (counter[venda.plano] || 0) + 1;
              });
            }

            const sorted = Object.entries(counter).sort(([, a], [, b]) => b - a);
            const max = sorted[0]?.[1] || 1;

            return sorted.map(([name, count], index) => (
              <div key={name} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: "#94a3b8" }}>
                    {currentUser.role === "admin" ? "👤" : PLANO_ICONS[name]} {PLANO_LABELS[name] || name}
                  </span>
                  <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 3,
                      background: currentUser.role === "admin" ? PIE_COLORS[index % PIE_COLORS.length] : PLANO_COLORS[name] || PIE_COLORS[index % PIE_COLORS.length],
                      width: `${(count / max) * 100}%`,
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
