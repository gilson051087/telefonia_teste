import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import "./App.css";


const STORAGE_KEY = "telefonia_vendas_v1";

const PLANOS = [
  "Plano Controle",
  "Plano Pós-Pago",
  "Internet Residencial",
  "TV",
  "Aparelho Celular",
  "Acessórios",
  "Seguro Móvel Celular",
];

const PLANO_ICONS = {
  "Plano Controle":        "📱",
  "Plano Pós-Pago":        "📱",
  "Internet Residencial":  "🌐",
  "TV":                    "📺",
  "Aparelho Celular":      "📲",
  "Acessórios":            "🎧",
  "Seguro Móvel Celular":  "🛡️",
};

const PLANO_COLORS = {
  "Plano Controle":        "#6366f1",
  "Plano Pós-Pago":        "#8b5cf6",
  "Internet Residencial":  "#06b6d4",
  "TV":                    "#f59e0b",
  "Aparelho Celular":      "#10b981",
  "Acessórios":            "#ec4899",
  "Seguro Móvel Celular":  "#f97316",
};

// Campos extras por plano
const PLANO_EXTRAS = {
  "Plano Controle": [
    { key: "franquia", label: "Franquia de Dados", type: "text", placeholder: "Ex: 15GB" },
    { key: "numero",   label: "Número do Chip",    type: "text", placeholder: "Ex: (41) 99999-0000" },
  ],
  "Plano Pós-Pago": [
    { key: "franquia", label: "Franquia de Dados", type: "text", placeholder: "Ex: Ilimitado" },
    { key: "numero",   label: "Número do Chip",    type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "linhas",   label: "Qtd. Linhas",       type: "number", placeholder: "1" },
  ],
  "Internet Residencial": [
    { key: "velocidade", label: "Velocidade",     type: "text", placeholder: "Ex: 300 Mbps" },
    { key: "endereco",   label: "Endereço Inst.", type: "text", placeholder: "Rua, nº, Bairro" },
  ],
  "TV": [
    { key: "pacote",   label: "Streaming", type: "text", placeholder: "Ex: Box 4K" },
    { key: "endereco", label: "Endereço Inst.",   type: "text", placeholder: "Rua, nº, Bairro" },
  ],
  "Aparelho Celular": [
    { key: "modelo",  label: "Modelo",     type: "text",   placeholder: "Ex: iPhone 15" },
    { key: "imei",    label: "IMEI",       type: "text",   placeholder: "15 dígitos" },
    { key: "cor",     label: "Cor",        type: "text",   placeholder: "Ex: Preto" },
    { key: "memoria", label: "Memória",    type: "text",   placeholder: "Ex: 128GB" },
  ],
  "Acessórios": [
    { key: "modelo", label: "Produto / Modelo", type: "text", placeholder: "Ex: Capinha, Fone..." },
    { key: "qty",    label: "Quantidade",        type: "number", placeholder: "1" },
  ],
  "Seguro Móvel Celular": [
    { key: "modelo",    label: "Aparelho Segurado", type: "text", placeholder: "Ex: Samsung S24" },
    { key: "cobertura", label: "Cobertura",          type: "text", placeholder: "Ex: Roubo + Quebra" },
  ],
};


const STATUS_OPTIONS   = ["Ativa", "Pendente", "Cancelada"];

const STATUS_COLORS = { "Ativa": "#10b981", "Pendente": "#f59e0b", "Cancelada": "#ef4444" };
const MONTH_NAMES   = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const PIE_COLORS    = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ec4899","#f97316"];

function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function fmtBRL(v) { return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0); }
function fmtDate(s) { if(!s) return "-"; const [y,m,d]=s.split("-"); return `${d}/${m}/${y}`; }

const DEMO = [
  { id:genId()
    
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const btn = (extra={}) => ({
  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13,
  borderRadius:9, padding:"9px 18px", cursor:"pointer", border:"none",
  transition:"all 0.18s", ...extra,
});
const btnPrimary   = btn({ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", boxShadow:"0 4px 14px rgba(99,102,241,0.35)" });
const btnSecondary = btn({ background:"transparent", color:"#94a3b8", border:"1px solid #334155" });
const btnDanger    = btn({ background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff" });

const inputStyle = {
  background:"#1e293b", border:"1px solid #334155", borderRadius:8,
  color:"#e2e8f0", padding:"10px 14px",
  fontFamily:"'DM Sans',sans-serif", fontSize:14,
  width:"100%", boxSizing:"border-box", outline:"none",
};
const labelStyle = {
  display:"block", fontSize:11, fontWeight:700, color:"#64748b",
  textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function Badge({ color, children }) {
  return (
    <span style={{
      background:`${color}22`, color, borderRadius:6,
      padding:"3px 10px", fontSize:12, fontWeight:700, whiteSpace:"nowrap",
    }}>{children}</span>
  );
}

function StatCard({ icon, label, value, sub, color="#6366f1" }) {
  return (
    <div style={{
      background:"linear-gradient(135deg,#0f172a,#1a2744)",
      border:"1px solid #1e293b", borderRadius:14, padding:"20px 22px",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", top:-12, right:-12, width:72, height:72,
        background:color, borderRadius:"50%", opacity:0.12,
      }}/>
      <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:11, color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontFamily:"'Crimson Pro',Georgia,serif", color:"#f1f5f9", fontWeight:700 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
      backdropFilter:"blur(5px)", display:"flex", alignItems:"center",
      justifyContent:"center", zIndex:1000, padding:20,
    }}>
      <div style={{
        background:"#0d1526", border:"1px solid #1e293b", borderRadius:16,
        width:"100%", maxWidth: wide ? 680 : 560, maxHeight:"92vh", overflowY:"auto",
        boxShadow:"0 30px 70px rgba(0,0,0,0.7)",
        animation:"fadeUp 0.2s ease",
      }}>
        <div style={{ padding:"24px 28px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h2 style={{ fontFamily:"'Crimson Pro',serif", fontSize:22, color:"#f1f5f9", margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:24, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:28 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <span style={{ color:"#ef4444", fontSize:11, marginTop:3, display:"block" }}>{error}</span>}
    </div>
  );
}

// Função criada para pontuaçao do CPF

function maskCPF(value) {
  return value
  .replace(/\D/g, "")
  .replace(/(\d{3})(\d)/, "$1.$2")
  .replace(/(\d{3})(\d)/, "$1.$2")
  .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  .slice(0, 14);
}

function VendaForm({ initial, onSave, onClose }) {
  const defaultForm = {
    cliente:"", cpf:"", plano:"Plano Controle", descricao:"",
    valor:"", data: new Date().toISOString().split("T")[0],
    pagamento:"Pix", status:"Ativa", vendedor:"",
  };
  const [form, setForm]   = useState(initial ? { ...defaultForm, ...initial } : defaultForm);
  const [errors, setErrors] = useState({});

  const extras = PLANO_EXTRAS[form.plano] || [];

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function validate() {
    const e = {};
    if (!form.cliente.trim()) e.cliente = "Obrigatório";
    if (!form.plano)          e.plano   = "Obrigatório";
    if (!form.valor || isNaN(+form.valor) || +form.valor <= 0) e.valor = "Valor inválido";
    if (!form.data)           e.data    = "Obrigatório";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, valor: parseFloat(form.valor) });
  }

  const inp = (key, type="text", placeholder="") => (
    <input type={type} value={form[key]||""} placeholder={placeholder}
      onChange={e => set(key, e.target.value)}
      style={{ ...inputStyle, borderColor: errors[key] ? "#ef4444" : "#334155" }}
    />
  );

  const sel = (key, options) => (
    <select value={form[key]||""} onChange={e => set(key, e.target.value)}
      style={{ ...inputStyle, appearance:"none" }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <div>
      {/* Seleção de Plano — visual */}
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Tipo de Plano / Produto</label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {PLANOS.map(p => (
            <button key={p} onClick={() => set("plano", p)} style={{
              background: form.plano===p ? `${PLANO_COLORS[p]}22` : "#1e293b",
              border: `1.5px solid ${form.plano===p ? PLANO_COLORS[p] : "#334155"}`,
              borderRadius:10, padding:"10px 6px", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              transition:"all 0.18s",
            }}>
              <span style={{ fontSize:20 }}>{PLANO_ICONS[p]}</span>
              <span style={{ fontSize:10, color: form.plano===p ? PLANO_COLORS[p] : "#64748b", fontWeight:700, textAlign:"center", lineHeight:1.2 }}>{p}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
        <div style={{ gridColumn:"1/-1" }}>
          <Field label="Nome do Cliente" error={errors.cliente}>{inp("cliente","text","Nome completo")}</Field>
        </div>
        {/* <Field label="CPF">{inp("cpf","text","000.000.000-00")}</Field> */}

        <Field label="CPF">
          <input
              type="text" value={form.cpf || ""} placeholder="000.000.000-00" onChange={(e) => set("cpf", maskCPF(e.target.value))} style={inputStyle} /></Field>

              
        <Field label="Vendedor">{inp("vendedor","text","Nome do vendedor")}</Field>
        <div style={{ gridColumn:"1/-1" }}>
          <Field label="Descrição / Observação">{inp("descricao","text","Detalhes da venda...")}</Field>
        </div>
        <Field label="Valor (R$)" error={errors.valor}>{inp("valor","number","0,00")}</Field>
        <Field label="Data da Venda" error={errors.data}>{inp("data","date")}</Field>
        
        <Field label="Status">{sel("status", STATUS_OPTIONS)}</Field>
      </div>

      {/* Campos extras do plano */}
      {extras.length > 0 && (
        <>
          <div style={{
            borderTop:"1px solid #1e293b", margin:"6px 0 16px",
            paddingTop:16,
          }}>
            <div style={{ fontSize:11, color: PLANO_COLORS[form.plano], fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>
              {PLANO_ICONS[form.plano]} Dados do {form.plano}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
              {extras.map(ex => (
                <Field key={ex.key} label={ex.label}>
                  <input type={ex.type} value={form[ex.key]||""} placeholder={ex.placeholder}
                    onChange={e => set(ex.key, e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:8 }}>
        <button style={btnSecondary} onClick={onClose}>Cancelar</button>
        <button style={btnPrimary} onClick={handleSave}>
          {initial ? "Salvar Alterações" : "Registrar Venda"}
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [vendas, setVendas] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEMO; }
    catch { return DEMO; }
  });
  const [modal,      setModal]      = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);
  const [viewItem,   setViewItem]   = useState(null);
  const [tab,        setTab]        = useState("vendas");
  const [search,     setSearch]     = useState("");
  const [fPlano,     setFPlano]     = useState("Todos");
  const [fStatus,    setFStatus]    = useState("Todos");
  const [sortBy,     setSortBy]     = useState("data");
  const [sortDir,    setSortDir]    = useState("desc");
  const [page,       setPage]       = useState(1);
  const PER_PAGE = 8;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas)); } catch {}
  }, [vendas]);

  const saveVenda = useCallback((data) => {
    if (modal?.edit) setVendas(v => v.map(x => x.id===modal.edit.id ? { ...x, ...data } : x));
    else             setVendas(v => [{ id:genId(), ...data }, ...v]);
    setModal(null);
  }, [modal]);

  const confirmDelete = useCallback(() => {
    setVendas(v => v.filter(x => x.id!==deleteId));
    setDeleteId(null);
  }, [deleteId]);

  // Filter + sort
  const filtered = vendas
    .filter(v => {
      if (search && !`${v.cliente} ${v.plano} ${v.descricao} ${v.vendedor||""}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (fPlano  !== "Todos"  && v.plano  !== fPlano)  return false;
      if (fStatus !== "Todos"  && v.status !== fStatus) return false;
      return true;
    })
    .sort((a, b) => {
      let va=a[sortBy], vb=b[sortBy];
      if (sortBy==="valor") { va=+va; vb=+vb; }
      return sortDir==="asc" ? (va<vb?-1:va>vb?1:0) : (va>vb?-1:va<vb?1:0);
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length/PER_PAGE));
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  // KPIs
  const ativas    = vendas.filter(v => v.status==="Ativa");
  const totalVal  = ativas.reduce((s,v) => s+v.valor, 0);
  const ticket    = ativas.length ? totalVal/ativas.length : 0;
  const pendentes = vendas.filter(v => v.status==="Pendente").length;

  // Charts
  const byMonth = {};
  vendas.forEach(v => {
    if (v.status==="Cancelada") return;
    const m = v.data?.slice(0,7); if(!m) return;
    byMonth[m] = (byMonth[m]||0) + v.valor;
  });
  const monthData = Object.entries(byMonth).sort(([a],[b])=>a.localeCompare(b)).slice(-6)
    .map(([k,v]) => ({ name: MONTH_NAMES[parseInt(k.split("-")[1])-1], valor:v }));

  const byPlano = {};
  vendas.forEach(v => { if(v.status!=="Cancelada") byPlano[v.plano]=(byPlano[v.plano]||0)+v.valor; });
  const planoData = Object.entries(byPlano).map(([name,value]) => ({ name,value }));

  const byStatus = STATUS_OPTIONS.map(s => ({ name:s, value: vendas.filter(v=>v.status===s).length }));

  function toggleSort(col) {
    if(sortBy===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortBy(col); setSortDir("asc"); }
    setPage(1);
  }
  const SortArrow = ({col}) => <span style={{ opacity:0.5 }}>{sortBy===col ? (sortDir==="asc"?" ↑":" ↓") : " ↕"}</span>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#070e1c;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#0d1526;}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px;}
        select option{background:#1e293b;}
        input[type=number]::-webkit-inner-spin-button{opacity:0;}
        tr:hover td{background:rgba(99,102,241,0.05)!important;}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#070e1c", fontFamily:"'DM Sans',sans-serif", color:"#e2e8f0" }}>

        {/* ── Header ── */}
        <div style={{
          background:"linear-gradient(180deg,#0d1b2e,#070e1c)",
          borderBottom:"1px solid #1e293b",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 32px", height:64,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:40, height:40, borderRadius:12,
              background:"linear-gradient(135deg,#6366f1,#06b6d4)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
            }}>📡</div>
            <div>
              <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:21, fontWeight:700, color:"#f1f5f9", lineHeight:1 }}>Vendas Claro Teste</div>
              <div style={{ fontSize:10, color:"#475569", letterSpacing:"0.08em", fontWeight:600 }}>SISTEMA DE PLANOS & SERVIÇOS</div>
            </div>
          </div>

          <div style={{ display:"flex", gap:4 }}>
            {[["vendas","📋 Vendas"],["relatorios","📊 Relatórios"]].map(([k,lbl]) => (
              <button key={k} onClick={()=>setTab(k)} style={{
                background: tab===k ? "rgba(99,102,241,0.15)" : "transparent",
                color:      tab===k ? "#818cf8"              : "#64748b",
                border:     tab===k ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                borderRadius:8, padding:"7px 18px",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, cursor:"pointer",
              }}>{lbl}</button>
            ))}
          </div>

          <button onClick={()=>setModal("new")} style={{ ...btnPrimary, padding:"9px 20px" }}>
            + Nova Venda
          </button>
        </div>

        <div style={{ padding:"28px 32px", maxWidth:1320, margin:"0 auto" }}>

          {/* ── KPIs ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:24 }}>
            <StatCard icon="💰" label="Receita Ativa"    value={fmtBRL(totalVal)} sub={`${ativas.length} vendas ativas`} color="#6366f1"/>
            <StatCard icon="🎯" label="Ticket Médio"     value={fmtBRL(ticket)}   color="#8b5cf6"/>
            <StatCard icon="📦" label="Total Lançamentos" value={vendas.length}   sub={`${pendentes} pendentes`}         color="#06b6d4"/>
            <StatCard icon="📱" label="Planos Móveis"    value={vendas.filter(v=>["Plano Controle","Plano Pós-Pago"].includes(v.plano)&&v.status==="Ativa").length} color="#10b981"/>
            <StatCard icon="🌐" label="Internet + TV"    value={vendas.filter(v=>["Internet Residencial","TV"].includes(v.plano)&&v.status==="Ativa").length} color="#f59e0b"/>
          </div>

          {/* ── VENDAS TAB ── */}
          {tab==="vendas" && (
            <>
              {/* Filtros */}
              <div style={{
                background:"#0d1526", border:"1px solid #1e293b", borderRadius:14,
                padding:"14px 18px", marginBottom:14,
                display:"flex", gap:10, alignItems:"center", flexWrap:"wrap",
              }}>
                <input placeholder="🔍  Buscar cliente, plano, vendedor..."
                  value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                  style={{ ...inputStyle, width:280 }}
                />
                <select value={fPlano} onChange={e=>{setFPlano(e.target.value);setPage(1);}}
                  style={{ ...inputStyle, width:190, appearance:"none" }}>
                  <option>Todos</option>
                  {PLANOS.map(p=><option key={p}>{p}</option>)}
                </select>
                <select value={fStatus} onChange={e=>{setFStatus(e.target.value);setPage(1);}}
                  style={{ ...inputStyle, width:140, appearance:"none" }}>
                  <option>Todos</option>
                  {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                </select>
                <div style={{ marginLeft:"auto", fontSize:13, color:"#475569" }}>
                  {filtered.length} registro{filtered.length!==1?"s":""}
                </div>
              </div>

              {/* Tabela */}
              {filtered.length===0 ? (
                <div style={{ textAlign:"center", padding:"80px 0", color:"#475569" }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>📡</div>
                  <p style={{ fontFamily:"'Crimson Pro',serif", fontSize:18, color:"#94a3b8", marginBottom:6 }}>Nenhum lançamento encontrado</p>
                  <button onClick={()=>setModal("new")} style={{ ...btnPrimary, marginTop:12 }}>+ Nova Venda</button>
                </div>
              ) : (
                <div style={{ background:"#0d1526", border:"1px solid #1e293b", borderRadius:14, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #1e293b" }}>
                        {[["cliente","Cliente"],["plano","Plano"],["descricao","Descrição"],["valor","Valor"],["data","Data"],["pagamento","Pagamento"],["vendedor","Vendedor"],["status","Status"]].map(([col,lbl])=>(
                          <th key={col} onClick={()=>toggleSort(col)} style={{
                            padding:"13px 14px", textAlign:"left", fontSize:10, fontWeight:700,
                            color: sortBy===col ? "#818cf8" : "#64748b",
                            textTransform:"uppercase", letterSpacing:"0.07em", cursor:"pointer", userSelect:"none", whiteSpace:"nowrap",
                          }}>{lbl}<SortArrow col={col}/></th>
                        ))}
                        <th style={{ width:100 }}/>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((v,i) => (
                        <tr key={v.id} style={{ borderBottom:"1px solid #1e293b", background: i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                          <td style={{ padding:"12px 14px", fontWeight:600, color:"#f1f5f9" }}>{v.cliente}</td>
                          <td style={{ padding:"12px 14px" }}>
                            <Badge color={PLANO_COLORS[v.plano]||"#6366f1"}>
                              {PLANO_ICONS[v.plano]} {v.plano}
                            </Badge>
                          </td>
                          <td style={{ padding:"12px 14px", color:"#94a3b8", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.descricao||"—"}</td>
                          <td style={{ padding:"12px 14px", fontWeight:700, color:"#10b981", fontFamily:"'Crimson Pro',serif", fontSize:15 }}>{fmtBRL(v.valor)}</td>
                          <td style={{ padding:"12px 14px", color:"#64748b" }}>{fmtDate(v.data)}</td>
                          <td style={{ padding:"12px 14px", color:"#94a3b8", fontSize:12 }}>{v.pagamento}</td>
                          <td style={{ padding:"12px 14px", color:"#94a3b8" }}>{v.vendedor||"—"}</td>
                          <td style={{ padding:"12px 14px" }}>
                            <Badge color={STATUS_COLORS[v.status]||"#10b981"}>{v.status}</Badge>
                          </td>
                          <td style={{ padding:"12px 14px" }}>
                            <div style={{ display:"flex", gap:6 }}>
                              <button title="Ver detalhes" onClick={()=>setViewItem(v)} style={{ background:"rgba(6,182,212,0.1)", border:"none", color:"#06b6d4", borderRadius:6, padding:"5px 8px", cursor:"pointer" }}>👁️</button>
                              <button title="Editar" onClick={()=>setModal({edit:v})} style={{ background:"rgba(99,102,241,0.1)", border:"none", color:"#818cf8", borderRadius:6, padding:"5px 8px", cursor:"pointer" }}>✏️</button>
                              <button title="Excluir" onClick={()=>setDeleteId(v.id)} style={{ background:"rgba(239,68,68,0.1)", border:"none", color:"#f87171", borderRadius:6, padding:"5px 8px", cursor:"pointer" }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {totalPages>1 && (
                    <div style={{ padding:"12px 20px", display:"flex", justifyContent:"center", gap:6, borderTop:"1px solid #1e293b" }}>
                      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ ...btnSecondary, padding:"6px 14px", opacity:page===1?0.4:1 }}>‹</button>
                      {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                        <button key={p} onClick={()=>setPage(p)} style={{ ...(p===page?btnPrimary:btnSecondary), padding:"6px 14px" }}>{p}</button>
                      ))}
                      <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ ...btnSecondary, padding:"6px 14px", opacity:page===totalPages?0.4:1 }}>›</button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── RELATÓRIOS TAB ── */}
          {tab==="relatorios" && (
            <div style={{ display:"grid", gap:18 }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18 }}>
                {/* Receita por mês */}
                <div style={{ background:"#0d1526", border:"1px solid #1e293b", borderRadius:14, padding:24 }}>
                  <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:18, color:"#f1f5f9", marginBottom:2 }}>Receita por Mês</div>
                  <div style={{ fontSize:12, color:"#475569", marginBottom:18 }}>Vendas ativas e pendentes</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthData} barSize={30}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                      <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:12}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                      <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#e2e8f0"}} formatter={v=>[fmtBRL(v),"Receita"]}/>
                      <defs>
                        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1"/>
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <Bar dataKey="valor" fill="url(#bg)" radius={[6,6,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pizza por plano */}
                <div style={{ background:"#0d1526", border:"1px solid #1e293b", borderRadius:14, padding:24 }}>
                  <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:18, color:"#f1f5f9", marginBottom:2 }}>Por Produto</div>
                  <div style={{ fontSize:12, color:"#475569", marginBottom:10 }}>Distribuição de receita</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={planoData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} dataKey="value" paddingAngle={3}>
                        {planoData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#e2e8f0"}} formatter={v=>[fmtBRL(v)]}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:8 }}>
                    {planoData.map((c,i)=>(
                      <div key={c.name} style={{ display:"flex", alignItems:"center", gap:7, fontSize:11 }}>
                        <div style={{ width:9, height:9, borderRadius:2, background:PIE_COLORS[i%PIE_COLORS.length], flexShrink:0 }}/>
                        <span style={{ color:"#94a3b8", flex:1 }}>{c.name}</span>
                        <span style={{ color:"#f1f5f9", fontWeight:700 }}>{fmtBRL(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                {/* Status */}
                <div style={{ background:"#0d1526", border:"1px solid #1e293b", borderRadius:14, padding:24 }}>
                  <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:18, color:"#f1f5f9", marginBottom:2 }}>Status das Vendas</div>
                  <div style={{ fontSize:12, color:"#475569", marginBottom:18 }}>Quantidade por status</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={byStatus} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false}/>
                      <XAxis type="number" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis dataKey="name" type="category" tick={{fill:"#94a3b8",fontSize:12}} axisLine={false} tickLine={false} width={80}/>
                      <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#e2e8f0"}}/>
                      <Bar dataKey="value" radius={[0,6,6,0]}>
                        {byStatus.map((s,i)=><Cell key={i} fill={STATUS_COLORS[s.name]||"#6366f1"}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Ranking planos */}
                <div style={{ background:"#0d1526", border:"1px solid #1e293b", borderRadius:14, padding:24 }}>
                  <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:18, color:"#f1f5f9", marginBottom:2 }}>Ranking de Produtos</div>
                  <div style={{ fontSize:12, color:"#475569", marginBottom:18 }}>Quantidade de vendas por produto</div>
                  {(() => {
                    const cnt = {};
                    vendas.forEach(v => { cnt[v.plano] = (cnt[v.plano]||0)+1; });
                    const sorted = Object.entries(cnt).sort(([,a],[,b])=>b-a);
                    const max = sorted[0]?.[1]||1;
                    return sorted.map(([name,count],i) => (
                      <div key={name} style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
                          <span style={{ color:"#94a3b8" }}>{PLANO_ICONS[name]} {name}</span>
                          <span style={{ color:"#f1f5f9", fontWeight:700 }}>{count}</span>
                        </div>
                        <div style={{ height:6, background:"#1e293b", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:3, background: PLANO_COLORS[name]||PIE_COLORS[i%PIE_COLORS.length], width:`${count/max*100}%`, transition:"width 0.8s ease" }}/>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modais Form ── */}
      {(modal==="new" || modal?.edit) && (
        <Modal title={modal?.edit ? "Editar Lançamento" : "Novo Lançamento"} onClose={()=>setModal(null)} wide>
          <VendaForm initial={modal?.edit} onSave={saveVenda} onClose={()=>setModal(null)}/>
        </Modal>
      )}

      {/* ── Modal Detalhes ── */}
      {viewItem && (
        <Modal title="Detalhes do Lançamento" onClose={()=>setViewItem(null)}>
          <div style={{ display:"grid", gap:12 }}>
            <div style={{
              background:`${PLANO_COLORS[viewItem.plano]||"#6366f1"}15`,
              border:`1px solid ${PLANO_COLORS[viewItem.plano]||"#6366f1"}40`,
              borderRadius:12, padding:"16px 20px",
              display:"flex", alignItems:"center", gap:14,
            }}>
              <span style={{ fontSize:36 }}>{PLANO_ICONS[viewItem.plano]}</span>
              <div>
                <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#f1f5f9", fontWeight:700 }}>{viewItem.plano}</div>
                <div style={{ color:"#94a3b8", fontSize:13 }}>{viewItem.descricao||"Sem descrição"}</div>
              </div>
              <div style={{ marginLeft:"auto" }}>
                <Badge color={STATUS_COLORS[viewItem.status]}>{viewItem.status}</Badge>
              </div>
            </div>

            {[
              ["Cliente",          viewItem.cliente],
              ["CPF",              viewItem.cpf||"—"],
              ["Vendedor",         viewItem.vendedor||"—"],
              ["Valor",            fmtBRL(viewItem.valor)],
              ["Data",             fmtDate(viewItem.data)],
              ["Pagamento",        viewItem.pagamento],
              ...(PLANO_EXTRAS[viewItem.plano]||[]).map(ex=>[ex.label, viewItem[ex.key]||"—"]),
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1e293b", fontSize:14 }}>
                <span style={{ color:"#64748b", fontWeight:600 }}>{k}</span>
                <span style={{ color:"#f1f5f9" }}>{v}</span>
              </div>
            ))}

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
              <button style={btnSecondary} onClick={()=>setViewItem(null)}>Fechar</button>
              <button style={btnPrimary} onClick={()=>{ setModal({edit:viewItem}); setViewItem(null); }}>Editar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirmar Exclusão ── */}
      {deleteId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(5px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"#0d1526", border:"1px solid #334155", borderRadius:16, padding:36, maxWidth:380, width:"90%", textAlign:"center" }}>
            <div style={{ fontSize:42, marginBottom:14 }}>🗑️</div>
            <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:20, color:"#f1f5f9", marginBottom:8 }}>Excluir lançamento?</div>
            <div style={{ color:"#64748b", fontSize:14, marginBottom:24 }}>Esta ação não pode ser desfeita.</div>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button style={btnSecondary} onClick={()=>setDeleteId(null)}>Cancelar</button>
              <button style={btnDanger} onClick={confirmDelete}>Sim, excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
