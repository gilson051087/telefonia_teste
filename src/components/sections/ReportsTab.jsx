import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PIE_COLORS, PLANO_COLORS, PLANO_ICONS, PLANO_LABELS, STATUS_COLORS } from "../../constants/sales";
import { fmtBRL } from "../../utils/sales";

export default function ReportsTab({ currentUser, scopedVendas, monthData, planoData, byStatus }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="rel-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
        <div style={{ background: "#0d1526", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#f1f5f9", marginBottom: 2 }}>Receita por Mes</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 18 }}>Vendas ativas e pendentes</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthData} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} formatter={(value) => [fmtBRL(value), "Receita"]} />
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <Bar dataKey="valor" fill="url(#bg)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#0d1526", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
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
        <div style={{ background: "#0d1526", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
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

        <div style={{ background: "#0d1526", border: "1px solid #1e293b", borderRadius: 14, padding: 24 }}>
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
