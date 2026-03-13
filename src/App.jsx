import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  login as apiLogin,
  logout as apiLogout,
  getSession,
  listUsers,
  listVendas,
  createSeller,
  deleteSeller,
  createVenda,
  updateVenda,
  deleteVenda,
  migrateLegacyData,
  changePassword as apiChangePassword,
  hasApiToken,
  clearApiToken,
} from "./api";
import "./App.css";

const STORAGE_KEYS = {
  vendas: "telefonia_vendas_v2",
  users: "telefonia_users_v1",
  legacyVendas: "telefonia_vendas_v1",
  backendMigration: "telefonia_backend_migration_v1",
};

const PLANOS = [
  "Plano Controle",
  "Plano Pós-Pago",
  "Internet Residencial",
  "TV",
  "Aparelho Celular",
  "Acessorios",
  "Seguro Movel Celular",
];

const PLANO_LABELS = {
  "Plano Controle": "Plano Controle",
  "Plano Pós-Pago": "Plano Pós-Pago",
  "Internet Residencial": "Internet Residencial",
  TV: "TV",
  "Aparelho Celular": "Aparelho Celular",
  Acessorios: "Acessorios",
  "Seguro Movel Celular": "Seguro Movel Celular",
};

const PLANO_ICONS = {
  "Plano Controle": "📱",
  "Plano Pós-Pago": "📱",
  "Internet Residencial": "🌐",
  TV: "📺",
  "Aparelho Celular": "📲",
  Acessorios: "🎧",
  "Seguro Movel Celular": "🛡️",
};

const PLANO_COLORS = {
  "Plano Controle": "#6366f1",
  "Plano Pós-Pago": "#8b5cf6",
  "Internet Residencial": "#06b6d4",
  TV: "#f59e0b",
  "Aparelho Celular": "#10b981",
  Acessorios: "#ec4899",
  "Seguro Movel Celular": "#f97316",
};

const PLANO_EXTRAS = {
  "Plano Controle": [
    { key: "franquia", label: "Franquia de Dados", type: "text", placeholder: "Ex: 15GB" },
    { key: "numero", label: "Numero do Chip", type: "text", placeholder: "Ex: (41) 99999-0000" },
  ],
  "Plano Pós-Pago": [
    { key: "franquia", label: "Franquia de Dados", type: "text", placeholder: "Ex: Ilimitado" },
    { key: "numero", label: "Numero do Chip", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "linhas", label: "Qtd. Linhas", type: "number", placeholder: "1" },
  ],
  "Internet Residencial": [
    { key: "velocidade", label: "Velocidade", type: "text", placeholder: "Ex: 300 Mbps" },
    { key: "endereco", label: "Endereco Inst.", type: "text", placeholder: "Rua, no, Bairro" },
  ],
  TV: [
    { key: "pacote", label: "Streaming", type: "text", placeholder: "Ex: Box 4K" },
    { key: "endereco", label: "Endereco Inst.", type: "text", placeholder: "Rua, no, Bairro" },
  ],
  "Aparelho Celular": [
    { key: "modelo", label: "Modelo", type: "text", placeholder: "Ex: iPhone 15" },
    { key: "imei", label: "IMEI", type: "text", placeholder: "15 digitos" },
    { key: "cor", label: "Cor", type: "text", placeholder: "Ex: Preto" },
    { key: "memoria", label: "Memoria", type: "text", placeholder: "Ex: 128GB" },
  ],
  Acessorios: [
    { key: "modelo", label: "Produto / Modelo", type: "text", placeholder: "Ex: Capinha, Fone..." },
    { key: "qty", label: "Quantidade", type: "number", placeholder: "1" },
  ],
  "Seguro Movel Celular": [
    { key: "modelo", label: "Aparelho Segurado", type: "text", placeholder: "Ex: Samsung S24" },
    { key: "cobertura", label: "Cobertura", type: "text", placeholder: "Ex: Roubo + Quebra" },
  ],
};

const STATUS_OPTIONS = ["Ativa", "Pendente", "Cancelada"];
const STATUS_COLORS = { Ativa: "#10b981", Pendente: "#f59e0b", Cancelada: "#ef4444" };
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#f97316"];

function fmtBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

function fmtDate(s) {
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function slugify(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "")
    .toLowerCase();
}

function normalizePlanoName(plano) {
  if (typeof plano !== "string") return plano;

  const value = plano.trim();

  if (value === "Acessórios") return "Acessorios";
  if (value === "Seguro Móvel Celular") return "Seguro Movel Celular";
  if (
    [
      "Plano de controle",
      "Plano controle",
      "plano controle",
      "Plano de carreira",
      "Plano de carreia",
      "plano de carreira",
      "plano de carreia",
    ].includes(value)
  ) {
    return "Plano Controle";
  }

  return value;
}

function normalizeLegacyVenda(venda) {
  return { ...venda, plano: normalizePlanoName(venda.plano) };
}

function loadVendas() {
  try {
    const current = localStorage.getItem(STORAGE_KEYS.vendas);
    if (current) return JSON.parse(current);
    const legacy = localStorage.getItem(STORAGE_KEYS.legacyVendas);
    return legacy ? JSON.parse(legacy).map(normalizeLegacyVenda) : [];
  } catch {
    return [];
  }
}

function loadUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.users);
    if (saved) return JSON.parse(saved);
  } catch {}

  return [
    { id: "admin-root", nome: "Administrador", username: "admin", senha: "123456", role: "admin" },
  ];
}

const btn = (extra = {}) => ({
  fontFamily: "'DM Sans',sans-serif",
  fontWeight: 600,
  fontSize: 13,
  borderRadius: 9,
  padding: "9px 18px",
  cursor: "pointer",
  border: "none",
  transition: "all 0.18s",
  ...extra,
});

const btnPrimary = btn({
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  color: "#fff",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
});

const btnSecondary = btn({
  background: "transparent",
  color: "#94a3b8",
  border: "1px solid #334155",
});

const btnDanger = btn({
  background: "linear-gradient(135deg,#ef4444,#dc2626)",
  color: "#fff",
});

const inputStyle = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#e2e8f0",
  padding: "10px 14px",
  fontFamily: "'DM Sans',sans-serif",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 5,
};

function Badge({ color, children }) {
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color = "#6366f1" }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg,#0f172a,#1a2744)",
        border: "1px solid #1e293b",
        borderRadius: 14,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -12,
          right: -12,
          width: 72,
          height: 72,
          background: color,
          borderRadius: "50%",
          opacity: 0.12,
        }}
      />
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontFamily: "'Crimson Pro',Georgia,serif", color: "#f1f5f9", fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="modal-shell"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        className="modal-panel"
        style={{
          background: "#0d1526",
          border: "1px solid #1e293b",
          borderRadius: 16,
          width: "100%",
          maxWidth: wide ? 680 : 560,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 30px 70px rgba(0,0,0,0.7)",
          animation: "fadeUp 0.2s ease",
        }}
      >
        <div className="modal-head" style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#f1f5f9", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div className="modal-body" style={{ padding: 28 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 3, display: "block" }}>{error}</span>}
    </div>
  );
}

function maskCPF(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}

function AuthScreen({ onLogin }) {
  const [loginForm, setLoginForm] = useState({ username: "", senha: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLogin();
    }
  }

  async function handleLogin() {
    try {
      setIsSubmitting(true);
      setError("");
      await onLogin(loginForm.username.trim(), loginForm.senha);
    } catch (err) {
      setError(err.message || "Usuario ou senha invalidos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const cardStyle = {
    background: "linear-gradient(180deg,rgba(15,23,42,0.95),rgba(12,18,32,0.98))",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 18px 56px rgba(0,0,0,0.32)",
    backdropFilter: "blur(14px)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top,#1e3a8a 0%,#0f172a 38%,#050816 100%)",
        color: "#e2e8f0",
        fontFamily: "'DM Sans',sans-serif",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
        .login-card{position:relative;overflow:hidden;}
        .login-card::before{
          content:"";
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at top right, rgba(96,165,250,0.16), transparent 28%),
            radial-gradient(circle at bottom left, rgba(129,140,248,0.12), transparent 30%);
          pointer-events:none;
        }
        .login-content{position:relative;z-index:1;}
        .login-label{
          font-family:'Manrope',sans-serif !important;
          font-size:11px !important;
          letter-spacing:0.12em !important;
          color:#7dd3fc !important;
        }
        .login-input{
          font-family:'Manrope',sans-serif !important;
          font-weight:500;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }
        @media (max-width: 768px){
          .auth-login-row{
            grid-template-columns:1fr !important;
          }
        }
      `}</style>
      <div className="login-card" style={{ ...cardStyle, width: "100%", maxWidth: 480 }}>
        <div className="login-content">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7dd3fc", marginBottom: 8 }}>
            Sistema Comercial
          </div>
          <h1 className="auth-hero-title" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, lineHeight: 1, marginBottom: 8, color: "#f8fafc", fontWeight: 600 }}>
          Painel de Vendas
          </h1>
          <div style={{ color: "#94a3b8", fontSize: 13, letterSpacing: "0.01em", fontFamily: "'Manrope',sans-serif" }}>
            Acesse com seu usuario e senha
          </div>
        </div>
        <div className="auth-login-row" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <Field label="Login">
            <input
              value={loginForm.username}
              onChange={(e) => setLoginForm((current) => ({ ...current, username: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="login-input"
              style={{ ...inputStyle, background: "rgba(15,23,42,0.75)", borderColor: "rgba(125,211,252,0.16)", borderRadius: 12, height: 44, fontSize: 13, padding: "10px 12px" }}
              placeholder="Digite seu login"
            />
          </Field>
          <Field label="Senha">
            <input
              type="password"
              value={loginForm.senha}
              onChange={(e) => setLoginForm((current) => ({ ...current, senha: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="login-input"
              style={{ ...inputStyle, background: "rgba(15,23,42,0.75)", borderColor: "rgba(125,211,252,0.16)", borderRadius: 12, height: 44, fontSize: 13, padding: "10px 12px" }}
              placeholder="Digite sua senha"
            />
          </Field>
        </div>
        {error && <div style={{ color: "#fca5a5", fontSize: 12, marginBottom: 12, textAlign: "center", fontFamily: "'Manrope',sans-serif" }}>{error}</div>}
        <button
          style={{ ...btnPrimary, width: "100%", borderRadius: 14, height: 46, fontSize: 13, fontFamily: "'Manrope',sans-serif", boxShadow: "0 8px 24px rgba(99,102,241,0.22)", opacity: isSubmitting ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Entrando..." : "Entrar no painel"}
        </button>
        </div>
      </div>
    </div>
  );
}

function SellerForm({ users, onSave, onClose }) {
  const [form, setForm] = useState({ nome: "", username: "", senha: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const nome = form.nome.trim();
    const username = form.username.trim().toLowerCase() || slugify(nome);

    if (!nome || !username || !form.senha.trim()) {
      setError("Preencha nome, usuario e senha.");
      return;
    }

    if (users.some((item) => item.username.toLowerCase() === username)) {
      setError("Ja existe um usuario com esse login.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await onSave({
        nome,
        username,
        senha: form.senha,
        role: "seller",
      });
    } catch (err) {
      setError(err.message || "Erro ao cadastrar vendedor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Field label="Nome do vendedor">
        <input
          value={form.nome}
          onChange={(e) =>
            setForm((current) => ({
              ...current,
              nome: e.target.value,
              username: current.username ? current.username : slugify(e.target.value),
            }))
          }
          style={inputStyle}
          placeholder="Ex: Maria Souza"
        />
      </Field>
      <Field label="Usuario de acesso">
        <input
          value={form.username}
          onChange={(e) => setForm((current) => ({ ...current, username: slugify(e.target.value) }))}
          style={inputStyle}
          placeholder="Ex: maria.souza"
        />
      </Field>
      <Field label="Senha">
        <input
          type="password"
          value={form.senha}
          onChange={(e) => setForm((current) => ({ ...current, senha: e.target.value }))}
          style={inputStyle}
          placeholder="Crie uma senha"
        />
      </Field>
      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 14 }}>{error}</div>}
      <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Cadastrar vendedor"}
        </button>
      </div>
    </div>
  );
}

function PasswordForm({ onSave, onClose }) {
  const [form, setForm] = useState({ currentSenha: "", newSenha: "", confirmSenha: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!form.currentSenha || !form.newSenha || !form.confirmSenha) {
      setError("Preencha todos os campos.");
      return;
    }

    if (form.newSenha.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (form.newSenha !== form.confirmSenha) {
      setError("A confirmacao nao confere.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await onSave(form.currentSenha, form.newSenha);
    } catch (err) {
      setError(err.message || "Erro ao alterar senha.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Field label="Senha atual">
        <input
          type="password"
          value={form.currentSenha}
          onChange={(e) => setForm((current) => ({ ...current, currentSenha: e.target.value }))}
          style={inputStyle}
          placeholder="Digite a senha atual"
        />
      </Field>
      <Field label="Nova senha">
        <input
          type="password"
          value={form.newSenha}
          onChange={(e) => setForm((current) => ({ ...current, newSenha: e.target.value }))}
          style={inputStyle}
          placeholder="Minimo de 6 caracteres"
        />
      </Field>
      <Field label="Confirmar nova senha">
        <input
          type="password"
          value={form.confirmSenha}
          onChange={(e) => setForm((current) => ({ ...current, confirmSenha: e.target.value }))}
          style={inputStyle}
          placeholder="Repita a nova senha"
        />
      </Field>
      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 14 }}>{error}</div>}
      <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Alterar senha"}
        </button>
      </div>
    </div>
  );
}

function VendaForm({ initial, onSave, onClose, currentUser, sellers }) {
  const defaultSellerId = currentUser.role === "seller" ? currentUser.id : sellers[0]?.id || "";
  const defaultSellerName = currentUser.role === "seller" ? currentUser.nome : sellers[0]?.nome || "";

  const defaultForm = {
    cliente: "",
    cpf: "",
    plano: "Plano Controle",
    descricao: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    pagamento: "Pix",
    status: "Ativa",
    vendedor: defaultSellerName,
    vendedorId: defaultSellerId,
  };

  const [form, setForm] = useState(initial ? { ...defaultForm, ...initial, plano: normalizePlanoName(initial.plano) } : defaultForm);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const currentPlano = normalizePlanoName(form.plano) || "Plano Controle";
  const extras = PLANO_EXTRAS[currentPlano] || [];

  useEffect(() => {
    if (currentUser.role === "seller") {
      setForm((current) => ({ ...current, vendedor: currentUser.nome, vendedorId: currentUser.id }));
      return;
    }

    if (!form.vendedorId && sellers[0]) {
      setForm((current) => ({ ...current, vendedorId: sellers[0].id, vendedor: sellers[0].nome }));
    }
  }, [currentUser, sellers, form.vendedorId]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: key === "plano" ? normalizePlanoName(value) : value }));
  }

  function handleSellerChange(value) {
    const selected = sellers.find((item) => item.id === value);
    setForm((current) => ({
      ...current,
      vendedorId: value,
      vendedor: selected?.nome || "",
    }));
  }

  function validate() {
    const next = {};
    if (!form.cliente.trim()) next.cliente = "Obrigatorio";
    if (!form.plano) next.plano = "Obrigatorio";
    if (!form.valor || Number.isNaN(+form.valor) || +form.valor <= 0) next.valor = "Valor invalido";
    if (!form.data) next.data = "Obrigatorio";
    if (!form.vendedorId && currentUser.role === "admin") next.vendedor = "Selecione um vendedor";
    return next;
  }

  async function handleSave() {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...form,
        valor: parseFloat(form.valor),
        vendedor: currentUser.role === "seller" ? currentUser.nome : form.vendedor,
        vendedorId: currentUser.role === "seller" ? currentUser.id : form.vendedorId,
      });
    } catch (err) {
      window.alert(err.message || "Erro ao salvar venda.");
    } finally {
      setIsSaving(false);
    }
  }

  const inp = (key, type = "text", placeholder = "") => (
    <input
      type={type}
      value={form[key] || ""}
      placeholder={placeholder}
      onChange={(e) => setField(key, e.target.value)}
      style={{ ...inputStyle, borderColor: errors[key] ? "#ef4444" : "#334155" }}
    />
  );

  const sel = (key, options) => (
    <select value={form[key] || ""} onChange={(e) => setField(key, e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Tipo de Plano / Produto</label>
        <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {PLANOS.map((plano) => (
            <button
              key={plano}
              onClick={() => setField("plano", plano)}
              style={{
                background: currentPlano === plano ? `${PLANO_COLORS[plano]}22` : "#1e293b",
                border: `1.5px solid ${currentPlano === plano ? PLANO_COLORS[plano] : "#334155"}`,
                borderRadius: 10,
                padding: "10px 6px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                transition: "all 0.18s",
              }}
            >
              <span style={{ fontSize: 20 }}>{PLANO_ICONS[plano]}</span>
              <span style={{ fontSize: 10, color: currentPlano === plano ? PLANO_COLORS[plano] : "#64748b", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                {PLANO_LABELS[plano]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Nome do Cliente" error={errors.cliente}>
            {inp("cliente", "text", "Nome completo")}
          </Field>
        </div>

        <Field label="CPF">
          <input
            type="text"
            value={form.cpf || ""}
            placeholder="000.000.000-00"
            onChange={(e) => setField("cpf", maskCPF(e.target.value))}
            style={inputStyle}
          />
        </Field>

        {currentUser.role === "admin" ? (
          <Field label="Vendedor" error={errors.vendedor}>
            <select value={form.vendedorId || ""} onChange={(e) => handleSellerChange(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
              <option value="">Selecione</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.nome}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Vendedor">
            <input value={currentUser.nome} disabled style={{ ...inputStyle, opacity: 0.8, cursor: "not-allowed" }} />
          </Field>
        )}

        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Descricao / Observacao">{inp("descricao", "text", "Detalhes da venda...")}</Field>
        </div>

        <Field label="Valor (R$)" error={errors.valor}>
          {inp("valor", "number", "0,00")}
        </Field>
        <Field label="Data da Venda" error={errors.data}>
          {inp("data", "date")}
        </Field>
        <Field label="Status">{sel("status", STATUS_OPTIONS)}</Field>
      </div>

      {extras.length > 0 && (
        <div style={{ borderTop: "1px solid #1e293b", margin: "6px 0 16px", paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: PLANO_COLORS[currentPlano], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            {PLANO_ICONS[currentPlano]} Dados do {PLANO_LABELS[currentPlano]}
          </div>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {extras.map((extra) => (
              <Field key={extra.key} label={extra.label}>
                <input
                  type={extra.type}
                  value={form[extra.key] || ""}
                  placeholder={extra.placeholder}
                  onChange={(e) => setField(extra.key, e.target.value)}
                  style={inputStyle}
                />
              </Field>
            ))}
          </div>
        </div>
      )}

      <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : initial ? "Salvar Alteracoes" : "Registrar Venda"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [vendas, setVendas] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [sellerDeleteId, setSellerDeleteId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [tab, setTab] = useState("vendas");
  const [search, setSearch] = useState("");
  const [fPlano, setFPlano] = useState("Todos");
  const [fStatus, setFStatus] = useState("Todos");
  const [fVendedor, setFVendedor] = useState("Todos");
  const [sortBy, setSortBy] = useState("data");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const sellers = users.filter((user) => user.role === "seller");

  useEffect(() => {
    async function bootstrap() {
      if (!hasApiToken()) {
        setIsBooting(false);
        return;
      }

      try {
        const user = await getSession();
        const [loadedUsers, loadedVendas] = await Promise.all([listUsers(), listVendas()]);
        setCurrentUser(user);
        setUsers(loadedUsers);
        setVendas(loadedVendas.map(normalizeLegacyVenda));
      } catch {
        clearApiToken();
      } finally {
        setIsBooting(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    async function migrateLegacy() {
      if (!currentUser || currentUser.role !== "admin") return;
      if (localStorage.getItem(STORAGE_KEYS.backendMigration) === "done") return;

      const legacyUsers = loadUsers().filter((user) => user.role === "seller");
      const legacyVendas = loadVendas().map(normalizeLegacyVenda);

      if (!legacyUsers.length && !legacyVendas.length) {
        localStorage.setItem(STORAGE_KEYS.backendMigration, "done");
        return;
      }

      try {
        await migrateLegacyData({ users: legacyUsers, vendas: legacyVendas });
        const [loadedUsers, loadedVendas] = await Promise.all([listUsers(), listVendas()]);
        setUsers(loadedUsers);
        setVendas(loadedVendas.map(normalizeLegacyVenda));
        localStorage.setItem(STORAGE_KEYS.backendMigration, "done");
      } catch {}
    }

    migrateLegacy();
  }, [currentUser]);

  const scopedVendas = vendas.filter((venda) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    return venda.vendedorId === currentUser.id || venda.vendedor === currentUser.nome;
  });

  const saveVenda = useCallback(
    async (data) => {
      if (modal?.edit) {
        const updated = await updateVenda(modal.edit.id, data);
        setVendas((current) => current.map((item) => (item.id === modal.edit.id ? normalizeLegacyVenda(updated) : item)));
      } else {
        const created = await createVenda(data);
        setVendas((current) => [normalizeLegacyVenda(created), ...current]);
      }
      setModal(null);
    },
    [modal]
  );

  const confirmDelete = useCallback(async () => {
    try {
      await deleteVenda(deleteId);
      setVendas((current) => current.filter((item) => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      window.alert(err.message || "Erro ao excluir venda.");
    }
  }, [deleteId]);

  const confirmSellerDelete = useCallback(async () => {
    try {
      await deleteSeller(sellerDeleteId);
      setUsers((current) => current.filter((item) => item.id !== sellerDeleteId));
      setSellerDeleteId(null);
    } catch (err) {
      window.alert(err.message || "Erro ao excluir vendedor.");
    }
  }, [sellerDeleteId]);

  const filtered = scopedVendas
    .filter((venda) => {
      const haystack = `${venda.cliente} ${venda.plano} ${venda.descricao || ""} ${venda.vendedor || ""}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (fPlano !== "Todos" && venda.plano !== fPlano) return false;
      if (fStatus !== "Todos" && venda.status !== fStatus) return false;
      if (currentUser?.role === "admin" && fVendedor !== "Todos" && venda.vendedorId !== fVendedor) return false;
      return true;
    })
    .sort((a, b) => {
      let va = a[sortBy];
      let vb = b[sortBy];
      if (sortBy === "valor") {
        va = +va;
        vb = +vb;
      }
      return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : va > vb ? -1 : va < vb ? 1 : 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const ativas = scopedVendas.filter((venda) => venda.status === "Ativa");
  const totalVal = ativas.reduce((sum, venda) => sum + venda.valor, 0);
  const ticket = ativas.length ? totalVal / ativas.length : 0;
  const pendentes = scopedVendas.filter((venda) => venda.status === "Pendente").length;

  const byMonth = {};
  scopedVendas.forEach((venda) => {
    if (venda.status === "Cancelada") return;
    const month = venda.data?.slice(0, 7);
    if (!month) return;
    byMonth[month] = (byMonth[month] || 0) + venda.valor;
  });

  const monthData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, value]) => ({ name: MONTH_NAMES[parseInt(key.split("-")[1], 10) - 1], valor: value }));

  const byPlano = {};
  scopedVendas.forEach((venda) => {
    if (venda.status !== "Cancelada") byPlano[venda.plano] = (byPlano[venda.plano] || 0) + venda.valor;
  });
  const planoData = Object.entries(byPlano).map(([name, value]) => ({ name, value }));

  const byStatus = STATUS_OPTIONS.map((status) => ({
    name: status,
    value: scopedVendas.filter((venda) => venda.status === status).length,
  }));

  const sellerSummaries = sellers
    .map((seller) => {
      const sellerVendas = vendas.filter((venda) => venda.vendedorId === seller.id || venda.vendedor === seller.nome);
      const activeRevenue = sellerVendas
        .filter((venda) => venda.status === "Ativa")
        .reduce((sum, venda) => sum + venda.valor, 0);

      return {
        ...seller,
        vendas: sellerVendas.length,
        ativas: sellerVendas.filter((venda) => venda.status === "Ativa").length,
        pendentes: sellerVendas.filter((venda) => venda.status === "Pendente").length,
        receita: activeRevenue,
      };
    })
    .sort((a, b) => b.vendas - a.vendas || a.nome.localeCompare(b.nome));

  function toggleSort(col) {
    if (sortBy === col) setSortDir((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
    setPage(1);
  }

  async function handleLogin(username, senha) {
    const user = await apiLogin(username, senha);
    const [loadedUsers, loadedVendas] = await Promise.all([listUsers(), listVendas()]);
    setCurrentUser(user);
    setUsers(loadedUsers);
    setVendas(loadedVendas.map(normalizeLegacyVenda));
  }

  async function handleRegister(user) {
    const created = await createSeller(user);
    setUsers((current) => [...current, created]);
    setModal(null);
  }

  async function handlePasswordChange(currentSenha, newSenha) {
    await apiChangePassword(currentSenha, newSenha);
    setModal(null);
    window.alert("Senha alterada com sucesso.");
  }

  async function handleLogout() {
    try {
      await apiLogout();
    } catch {}
    setCurrentUser(null);
    setUsers([]);
    setVendas([]);
    setModal(null);
    setViewItem(null);
    setDeleteId(null);
    setSellerDeleteId(null);
  }

  if (isBooting) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#070e1c", color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif" }}>
        Carregando...
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const sellerToDelete = sellers.find((seller) => seller.id === sellerDeleteId) || null;

  const SortArrow = ({ col }) => <span style={{ opacity: 0.5 }}>{sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}</span>;

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
        @media (max-width: 960px){
          .kpi-grid,
          .rel-grid,
          .rel-grid-2,
          .auth-grid{
            grid-template-columns:1fr !important;
          }
        }
        @media (max-width: 768px){
          .app-shell{
            padding:18px 14px !important;
          }
          .app-header{
            padding:14px !important;
            align-items:flex-start !important;
          }
          .app-brand{
            width:100%;
          }
          .app-nav,
          .app-user-actions{
            width:100%;
          }
          .app-nav{
            display:grid !important;
            grid-template-columns:1fr 1fr;
          }
          .app-nav button,
          .app-user-actions button{
            width:100%;
          }
          .app-user-actions{
            justify-content:stretch !important;
          }
          .app-user-meta{
            width:100%;
            text-align:left !important;
          }
          .kpi-grid{
            grid-template-columns:1fr 1fr !important;
          }
          .auth-grid,
          .auth-login-row,
          .form-grid,
          .rel-grid,
          .rel-grid-2{
            grid-template-columns:1fr !important;
          }
          .auth-tabs,
          .modal-actions{
            flex-direction:column;
          }
          .filters-bar > *{
            width:100% !important;
            margin-left:0 !important;
          }
          .plan-grid{
            grid-template-columns:repeat(2,1fr) !important;
          }
          .desktop-table{
            display:none;
          }
          .mobile-cards{
            display:grid !important;
          }
          .pagination{
            flex-wrap:wrap;
          }
          .modal-shell{
            padding:10px !important;
          }
          .modal-panel{
            max-height:96vh !important;
          }
          .modal-body,
          .modal-head{
            padding-left:16px !important;
            padding-right:16px !important;
          }
          .modal-head{
            padding-top:16px !important;
          }
        }
        @media (max-width: 480px){
          .kpi-grid{
            grid-template-columns:1fr !important;
          }
          .plan-grid{
            grid-template-columns:1fr !important;
          }
          .brand-title{
            font-size:18px !important;
          }
          .auth-hero-title{
            font-size:32px !important;
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#070e1c", fontFamily: "'DM Sans',sans-serif", color: "#e2e8f0" }}>
        <div
          className="app-header"
          style={{
            background: "linear-gradient(180deg,#0d1b2e,#070e1c)",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 32px",
            minHeight: 76,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div className="app-brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div className="brand-title" style={{ fontFamily: "'Crimson Pro',serif", fontSize: 21, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>PAINEL DE VENDAS</div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", fontWeight: 600 }}>
                {currentUser.role === "admin" ? "PAINEL GERAL DA EQUIPE" : "PAINEL INDIVIDUAL DO VENDEDOR"}
              </div>
            </div>
          </div>

          <div className="app-nav" style={{ display: "flex", gap: 4 }}>
            {[
              ["vendas", "📋 Vendas"],
              ["relatorios", "📊 Relatorios"],
              ...(currentUser.role === "admin" ? [["vendedores", "👥 Vendedores"]] : []),
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  background: tab === key ? "rgba(99,102,241,0.15)" : "transparent",
                  color: tab === key ? "#818cf8" : "#64748b",
                  border: tab === key ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                  borderRadius: 8,
                  padding: "7px 18px",
                  fontFamily: "'DM Sans',sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="app-user-actions" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div className="app-user-meta" style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{currentUser.nome}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{currentUser.role === "admin" ? "Administrador" : "Vendedor"}</div>
            </div>
            {currentUser.role === "admin" && (
              <button onClick={() => setModal("seller")} style={btnSecondary}>
                + Vendedor
              </button>
            )}
            <button onClick={() => setModal("password")} style={btnSecondary}>
              Senha
            </button>
            <button onClick={() => setModal("new")} style={{ ...btnPrimary, padding: "9px 20px" }}>
              + Nova Venda
            </button>
            <button onClick={handleLogout} style={btnSecondary}>
              Sair
            </button>
          </div>
        </div>

        <div className="app-shell" style={{ padding: "28px 32px", maxWidth: 1320, margin: "0 auto" }}>
          <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
            <StatCard icon="💰" label="Receita Ativa" value={fmtBRL(totalVal)} sub={`${ativas.length} vendas ativas`} color="#6366f1" />
            <StatCard icon="🎯" label="Ticket Medio" value={fmtBRL(ticket)} color="#8b5cf6" />
            <StatCard icon="📦" label="Total Lancamentos" value={scopedVendas.length} sub={`${pendentes} pendentes`} color="#06b6d4" />
            <StatCard icon="📱" label="Planos Moveis" value={scopedVendas.filter((v) => ["Plano Controle", "Plano Pós-Pago"].includes(v.plano) && v.status === "Ativa").length} color="#10b981" />
            <StatCard icon="🌐" label="Internet + TV" value={scopedVendas.filter((v) => ["Internet Residencial", "TV"].includes(v.plano) && v.status === "Ativa").length} color="#f59e0b" />
          </div>

          {tab === "vendas" && (
            <>
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
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  style={{ ...inputStyle, width: 280 }}
                />
                <select value={fPlano} onChange={(e) => { setFPlano(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 190, appearance: "none" }}>
                  <option>Todos</option>
                  {PLANOS.map((plano) => (
                    <option key={plano} value={plano}>
                      {PLANO_LABELS[plano]}
                    </option>
                  ))}
                </select>
                <select value={fStatus} onChange={(e) => { setFStatus(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 140, appearance: "none" }}>
                  <option>Todos</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                {currentUser.role === "admin" && (
                  <select value={fVendedor} onChange={(e) => { setFVendedor(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 200, appearance: "none" }}>
                    <option value="Todos">Todos vendedores</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.nome}
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ marginLeft: "auto", fontSize: 13, color: "#475569" }}>{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>📡</div>
                  <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#94a3b8", marginBottom: 6 }}>Nenhum lancamento encontrado</p>
                  <button onClick={() => setModal("new")} style={{ ...btnPrimary, marginTop: 12 }}>
                    + Nova Venda
                  </button>
                </div>
              ) : (
                <div style={{ background: "#0d1526", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden" }}>
                  <div className="desktop-table" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 980 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1e293b" }}>
                          {[["cliente", "Cliente"], ["plano", "Plano"], ["descricao", "Descricao"], ["valor", "Valor"], ["data", "Data"], ["pagamento", "Pagamento"], ["vendedor", "Vendedor"], ["status", "Status"]].map(([col, label]) => (
                            <th
                              key={col}
                              onClick={() => toggleSort(col)}
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
                              <SortArrow col={col} />
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
                            <td style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 12 }}>{venda.pagamento}</td>
                            <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{venda.vendedor || "—"}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <Badge color={STATUS_COLORS[venda.status] || "#10b981"}>{venda.status}</Badge>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button title="Ver detalhes" onClick={() => setViewItem(venda)} style={{ background: "rgba(6,182,212,0.1)", border: "none", color: "#06b6d4", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                                  👁️
                                </button>
                                <button title="Editar" onClick={() => setModal({ edit: venda })} style={{ background: "rgba(99,102,241,0.1)", border: "none", color: "#818cf8", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                                  ✏️
                                </button>
                                <button title="Excluir" onClick={() => setDeleteId(venda.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#f87171", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
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
                            <span style={{ color: "#64748b" }}>Pagamento</span>
                            <span style={{ color: "#e2e8f0" }}>{venda.pagamento}</span>
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
                          <button title="Ver detalhes" onClick={() => setViewItem(venda)} style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4", borderRadius: 10, padding: "10px 8px", cursor: "pointer" }}>
                            Ver
                          </button>
                          <button title="Editar" onClick={() => setModal({ edit: venda })} style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: 10, padding: "10px 8px", cursor: "pointer" }}>
                            Editar
                          </button>
                          <button title="Excluir" onClick={() => setDeleteId(venda.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 10, padding: "10px 8px", cursor: "pointer" }}>
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
          )}

          {tab === "relatorios" && (
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
          )}

          {tab === "vendedores" && currentUser.role === "admin" && (
            <div style={{ display: "grid", gap: 18 }}>
              <div
                style={{
                  background: "#0d1526",
                  border: "1px solid #1e293b",
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
                  <div style={{ color: "#94a3b8", fontSize: 14 }}>
                    Acompanhe os acessos da equipe e quantas vendas estao vinculadas a cada vendedor.
                  </div>
                </div>
                <button onClick={() => setModal("seller")} style={btnPrimary}>
                  + Novo vendedor
                </button>
              </div>

              <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                <StatCard icon="👥" label="Vendedores" value={sellerSummaries.length} color="#6366f1" />
                <StatCard
                  icon="📋"
                  label="Vendas da Equipe"
                  value={sellerSummaries.reduce((sum, seller) => sum + seller.vendas, 0)}
                  color="#06b6d4"
                />
                <StatCard
                  icon="✅"
                  label="Ativas"
                  value={sellerSummaries.reduce((sum, seller) => sum + seller.ativas, 0)}
                  color="#10b981"
                />
                <StatCard
                  icon="⏳"
                  label="Pendentes"
                  value={sellerSummaries.reduce((sum, seller) => sum + seller.pendentes, 0)}
                  color="#f59e0b"
                />
              </div>

              {sellerSummaries.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>👥</div>
                  <p style={{ fontFamily: "'Crimson Pro',serif", fontSize: 18, color: "#94a3b8", marginBottom: 6 }}>Nenhum vendedor cadastrado</p>
                  <button onClick={() => setModal("seller")} style={{ ...btnPrimary, marginTop: 12 }}>
                    + Cadastrar vendedor
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {sellerSummaries.map((seller) => (
                    <div
                      key={seller.id}
                      style={{
                        background: "linear-gradient(180deg,#111b31,#0d1526)",
                        border: "1px solid #1e293b",
                        borderRadius: 16,
                        padding: 18,
                        display: "grid",
                        gap: 14,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{seller.nome}</div>
                          <div style={{ color: "#94a3b8", fontSize: 13 }}>Login: {seller.username}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <Badge color="#6366f1">Vendedor</Badge>
                          <button
                            onClick={() => setSellerDeleteId(seller.id)}
                            style={{
                              ...btnDanger,
                              padding: "8px 14px",
                              fontSize: 12,
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>

                      <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
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
          )}
        </div>
      </div>

      {(modal === "new" || modal?.edit) && (
        <Modal title={modal?.edit ? "Editar Lancamento" : "Novo Lancamento"} onClose={() => setModal(null)} wide>
          <VendaForm initial={modal?.edit} onSave={saveVenda} onClose={() => setModal(null)} currentUser={currentUser} sellers={sellers} />
        </Modal>
      )}

      {modal === "seller" && currentUser.role === "admin" && (
        <Modal title="Cadastrar Vendedor" onClose={() => setModal(null)}>
          <SellerForm users={users} onSave={handleRegister} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal === "password" && (
        <Modal title="Alterar Senha" onClose={() => setModal(null)}>
          <PasswordForm onSave={handlePasswordChange} onClose={() => setModal(null)} />
        </Modal>
      )}

      {sellerDeleteId && currentUser.role === "admin" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0d1526", border: "1px solid #334155", borderRadius: 16, padding: 36, maxWidth: 420, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 42, marginBottom: 14 }}>👤</div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 8 }}>Excluir vendedor?</div>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 10 }}>
              {sellerToDelete?.nome ? `${sellerToDelete.nome} perdera o acesso ao sistema.` : "Este vendedor perdera o acesso ao sistema."}
            </div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
              As vendas ja registradas serao mantidas no historico.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button style={btnSecondary} onClick={() => setSellerDeleteId(null)}>
                Cancelar
              </button>
              <button style={btnDanger} onClick={confirmSellerDelete}>
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {viewItem && (
        <Modal title="Detalhes do Lancamento" onClose={() => setViewItem(null)}>
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                background: `${PLANO_COLORS[viewItem.plano] || "#6366f1"}15`,
                border: `1px solid ${PLANO_COLORS[viewItem.plano] || "#6366f1"}40`,
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 36 }}>{PLANO_ICONS[viewItem.plano]}</span>
              <div>
                <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#f1f5f9", fontWeight: 700 }}>
                  {PLANO_LABELS[viewItem.plano] || viewItem.plano}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>{viewItem.descricao || "Sem descricao"}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Badge color={STATUS_COLORS[viewItem.status]}>{viewItem.status}</Badge>
              </div>
            </div>

            {[
              ["Cliente", viewItem.cliente],
              ["CPF", viewItem.cpf || "—"],
              ["Vendedor", viewItem.vendedor || "—"],
              ["Valor", fmtBRL(viewItem.valor)],
              ["Data", fmtDate(viewItem.data)],
              ["Pagamento", viewItem.pagamento],
              ...(PLANO_EXTRAS[viewItem.plano] || []).map((extra) => [extra.label, viewItem[extra.key] || "—"]),
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e293b", fontSize: 14 }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>{label}</span>
                <span style={{ color: "#f1f5f9" }}>{value}</span>
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={btnSecondary} onClick={() => setViewItem(null)}>
                Fechar
              </button>
              <button style={btnPrimary} onClick={() => { setModal({ edit: viewItem }); setViewItem(null); }}>
                Editar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0d1526", border: "1px solid #334155", borderRadius: 16, padding: 36, maxWidth: 380, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 42, marginBottom: 14 }}>🗑️</div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 8 }}>Excluir lancamento?</div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Esta acao nao pode ser desfeita.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button style={btnSecondary} onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
              <button style={btnDanger} onClick={confirmDelete}>
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
