import { useCallback, useEffect, useState } from "react";
import {
  changePassword as apiChangePassword,
  clearApiToken,
  createSeller,
  createVenda,
  deleteSeller,
  deleteVenda,
  getSession,
  hasApiToken,
  listUsers,
  listVendas,
  login as apiLogin,
  logout as apiLogout,
  migrateLegacyData,
  updateVenda,
} from "./apiClient";
import AppHeader from "./components/AppHeader";
import AuthScreen from "./components/AuthScreen";
import PasswordForm from "./components/forms/PasswordForm";
import SellerForm from "./components/forms/SellerForm";
import VendaForm from "./components/forms/VendaForm";
import ReportsTab from "./components/sections/ReportsTab";
import SellersTab from "./components/sections/SellersTab";
import VendasTab from "./components/sections/VendasTab";
import PendenciasTab from "./components/sections/PendenciasTab";
import { Modal, Panel, StatCard, ToastStack, btnDanger, btnPrimary, btnSecondary } from "./components/ui";
import { COMANDA_COMMON_FIELDS, PLANOS, PLANO_COLORS, PLANO_EXTRAS, PLANO_ICONS, PLANO_LABELS, STORAGE_KEYS, MONTH_NAMES, getRemunerationValue } from "./constants/sales";
import { exportExcelReport, exportVendaComanda, fmtBRL, fmtDate, fmtMonth, loadUsers, loadVendas, normalizeLegacyVenda, slugify } from "./utils/sales";
import { appendHistory, buildPendingQueue, getInstallationStatus } from "./utils/workflow";
import "./App.css";

const getTodayDate = () => new Date().toISOString().split("T")[0];
const getTodayMonth = () => new Date().toISOString().slice(0, 7);
const INSTALLATION_COMPETENCE_PLANOS = new Set(["Internet Residencial", "TV"]);
const normalizeSearchText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const APP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
  :root{
    --bg:#060b18;
    --bg-soft:#0b1427;
    --panel:#0f1a2f;
    --panel-strong:#0d172b;
    --line:rgba(71,85,105,0.55);
    --text:#e2e8f0;
    --muted:#94a3b8;
    --brand:#22d3ee;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    background:
      radial-gradient(circle at 15% 10%, rgba(14,165,233,0.12), transparent 30%),
      radial-gradient(circle at 88% 14%, rgba(34,211,238,0.08), transparent 28%),
      linear-gradient(180deg, var(--bg-soft), var(--bg));
    color:var(--text);
  }
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  button:focus-visible,
  input:focus-visible,
  select:focus-visible{
    outline:2px solid #22d3ee;
    outline-offset:2px;
  }
  .touch-btn:hover{transform:translateY(-1px);}
  .touch-btn:active{transform:translateY(0);}
  .lift-hover:hover{transform:translateY(-2px) scale(1.01);}
  .panel-surface{
    background:linear-gradient(180deg,var(--panel),var(--panel-strong));
    border:1px solid var(--line);
    border-radius:16px;
    box-shadow:0 12px 26px rgba(2,6,23,0.32);
  }
  .stat-card{
    transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    animation:fadeUp .34s ease both;
  }
  .kpi-grid .stat-card:nth-child(1){animation-delay:.02s;}
  .kpi-grid .stat-card:nth-child(2){animation-delay:.05s;}
  .kpi-grid .stat-card:nth-child(3){animation-delay:.08s;}
  .kpi-grid .stat-card:nth-child(4){animation-delay:.11s;}
  .kpi-grid .stat-card:nth-child(5){animation-delay:.14s;}
  .kpi-grid .stat-card:nth-child(6){animation-delay:.17s;}
  .kpi-grid .stat-card:nth-child(7){animation-delay:.2s;}
  .sales-group-card{
    transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease;
    animation:fadeUp .3s ease both;
  }
  .sales-group-card:hover{
    transform:translateY(-2px);
    border-color:rgba(56,189,248,0.5) !important;
    box-shadow:0 14px 28px rgba(14,165,233,0.18) !important;
  }
  .skeleton{
    background:linear-gradient(90deg, rgba(51,65,85,0.3) 25%, rgba(100,116,139,0.45) 50%, rgba(51,65,85,0.3) 75%);
    background-size:200% 100%;
    animation:shimmer 1.2s linear infinite;
    border-radius:12px;
  }
  .skeleton-card{
    padding:14px;
    border:1px solid rgba(71,85,105,0.45);
    border-radius:16px;
    background:linear-gradient(180deg, rgba(15,23,42,0.8), rgba(15,23,42,0.92));
  }
  .action-pill{
    border:none;
    border-radius:11px;
    padding:7px 10px;
    cursor:pointer;
    font-size:12px;
    font-weight:700;
    min-height:36px;
    transition:all .15s ease;
  }
  .action-pill:hover{filter:brightness(1.08);}
  .action-pill-info{background:rgba(6,182,212,0.16);color:#67e8f9;border:1px solid rgba(6,182,212,0.25);}
  .action-pill-edit{background:rgba(14,165,233,0.16);color:#bae6fd;border:1px solid rgba(14,165,233,0.26);}
  .action-pill-delete{background:rgba(239,68,68,0.16);color:#fca5a5;border:1px solid rgba(239,68,68,0.26);}
  .quick-filter-btn:hover{border-color:#22d3ee!important;color:#67e8f9!important;}
  input[type="date"],
  input[type="month"]{
    color-scheme:dark;
    background:
      linear-gradient(180deg, rgba(30,41,59,0.95), rgba(22,30,45,0.95)),
      radial-gradient(circle at 92% 50%, rgba(34,211,238,0.2), transparent 30%);
    border:1px solid rgba(71,85,105,0.9);
    border-radius:12px;
    color:#f1f5f9;
    min-height:44px;
    padding-right:42px;
    box-shadow:inset 0 1px 0 rgba(148,163,184,0.08);
    transition:all .2s ease;
  }
  input[type="date"]:hover,
  input[type="month"]:hover{
    border-color:rgba(34,211,238,0.45);
    box-shadow:0 0 0 2px rgba(34,211,238,0.08);
  }
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="month"]::-webkit-calendar-picker-indicator{
    cursor:pointer;
    opacity:.95;
    border-radius:8px;
    padding:4px;
    background:
      radial-gradient(circle at center, rgba(34,211,238,0.2), rgba(15,23,42,0.05));
    filter:brightness(1.2) contrast(1.1);
  }
  input[type="date"]::-webkit-datetime-edit,
  input[type="month"]::-webkit-datetime-edit{
    color:#e2e8f0;
  }
  .app-nav button:hover{
    transform:translateY(-1px);
    border-color:rgba(34,211,238,0.28)!important;
    color:#e0f2fe!important;
    background:rgba(30,41,59,0.68)!important;
  }
  .app-nav button:focus-visible{
    outline:2px solid #22d3ee;
    outline-offset:1px;
  }
  .plan-choice:hover,
  .status-choice:hover{
    transform:translateY(-1px);
    filter:brightness(1.05);
  }
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:#0d1526;}
  ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px;}
  select option{background:#1e293b;}
  input[type=number]::-webkit-inner-spin-button{opacity:0;}
  tr:hover td{background:rgba(99,102,241,0.05)!important;}
  .app-shell{
    padding:28px 24px;
    width:100%;
  }
  .app-content{
    max-width:1240px;
    margin:0 auto;
    display:grid;
    gap:20px;
  }
  .kpi-grid{
    display:grid;
    grid-template-columns:repeat(auto-fit, minmax(190px, 220px));
    justify-content:center;
    gap:12px;
    align-items:stretch;
  }
  @media (max-width: 900px){
    .kpi-grid{
      grid-template-columns:repeat(2, minmax(0, 1fr));
      justify-content:stretch;
    }
  }
  @media (max-width: 768px){
    .app-shell{
      padding:18px 14px !important;
    }
    .app-content{
      gap:16px;
    }
    .kpi-grid{
      grid-template-columns:1fr !important;
      justify-content:stretch;
    }
    .action-pill{
      min-height:40px;
      font-size:12px;
      padding:8px 10px;
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
  @media (max-width: 560px){
    .kpi-grid{
      grid-template-columns:1fr;
    }
  }
    @media (max-width: 480px){
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
`;

export default function App() {
  const storedCycleMonth = (() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.currentCycleMonth) || getTodayMonth();
    } catch {
      return getTodayMonth();
    }
  })();
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
  const [fVendedor, setFVendedor] = useState("Todos");
  const [fMes, setFMes] = useState(storedCycleMonth);
  const [fDia, setFDia] = useState("");
  const [monthlyReportMonth, setMonthlyReportMonth] = useState(storedCycleMonth);
  const [dailyReportDate, setDailyReportDate] = useState(getTodayDate);
  const [cycleDate, setCycleDate] = useState(getTodayDate);
  const [currentCycleMonth, setCurrentCycleMonth] = useState(storedCycleMonth);
  const [sortBy, setSortBy] = useState("data");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const PER_PAGE = 8;

  const pushToast = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

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

  useEffect(() => {
    const timer = setInterval(() => {
      const nowDate = getTodayDate();
      if (nowDate === cycleDate) return;

      setCycleDate(nowDate);
      setFDia("");
      setDailyReportDate(nowDate);
      setPage(1);
    }, 60000);

    return () => clearInterval(timer);
  }, [cycleDate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.currentCycleMonth, currentCycleMonth);
    } catch {}
    setFMes(currentCycleMonth);
    setMonthlyReportMonth(currentCycleMonth);
    setFDia("");
    setPage(1);
  }, [currentCycleMonth]);

  const scopedVendas = vendas.filter((venda) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    return venda.vendedorId === currentUser.id || venda.vendedor === currentUser.nome;
  });

  const getVendaCompetenceMonth = (venda) => {
    if (!venda?.data) return "";
    if (!INSTALLATION_COMPETENCE_PLANOS.has(venda.plano)) return venda.data.slice(0, 7);

    const statusInstalacao = getInstallationStatus(venda);
    const finalizacao = venda.dataFinalizacao || "";
    if (statusInstalacao === "Instalado" && finalizacao) return finalizacao.slice(0, 7);

    return venda.data.slice(0, 7);
  };
  const getVendaCompetenceDate = (venda) => {
    if (!venda?.data) return "";
    if (!INSTALLATION_COMPETENCE_PLANOS.has(venda.plano)) return venda.data;

    const statusInstalacao = getInstallationStatus(venda);
    if (statusInstalacao === "Instalado" && venda.dataFinalizacao) return venda.dataFinalizacao;

    return venda.data;
  };
  const cycleScopedVendas = scopedVendas.filter((venda) => getVendaCompetenceMonth(venda) === currentCycleMonth);
  const searchTerms = normalizeSearchText(search).split(/\s+/).filter(Boolean);

  const filtered = scopedVendas
    .filter((venda) => {
      const vendaCompetenceDate = getVendaCompetenceDate(venda);
      if (searchTerms.length > 0) {
        const haystack = normalizeSearchText(`${venda.cliente} ${PLANO_LABELS[venda.plano] || venda.plano} ${venda.tipoPlano || ""}`);
        if (!searchTerms.every((term) => haystack.includes(term))) return false;
      }
      if (fPlano !== "Todos" && venda.plano !== fPlano) return false;
      if (fDia) {
        if (vendaCompetenceDate !== fDia) return false;
      } else if (getVendaCompetenceMonth(venda) !== currentCycleMonth) {
        return false;
      }
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

  const vendasComValor = cycleScopedVendas.filter((venda) => venda.status === "Ativa");
  const ativas = vendasComValor;
  const totalVal = vendasComValor.reduce((sum, venda) => {
    if (["Plano Controle", "Plano Pós-Pago", "TV", "Internet Residencial", "Internet Movel Mais", "Seguro Movel Celular"].includes(venda.plano)) {
      const remuneracaoTabela = getRemunerationValue(venda.plano, venda.tipoPlano);
      return sum + (remuneracaoTabela ?? venda.valor);
    }
    if (venda.plano === "Aparelho Celular") return sum + venda.valor * 0.05;
    if (venda.plano === "Acessorios") return sum + venda.valor * 0.15;
    return sum;
  }, 0);
  const ticketCelularVendas = vendasComValor.filter((venda) => venda.plano === "Aparelho Celular");
  const ticketCelularTotal = ticketCelularVendas.reduce((sum, venda) => sum + venda.valor * 0.05, 0);
  const ticketCelular = ticketCelularTotal;
  const ticketAcessoriosVendas = vendasComValor.filter((venda) => venda.plano === "Acessorios");
  const ticketAcessoriosTotal = ticketAcessoriosVendas.reduce((sum, venda) => sum + venda.valor * 0.15, 0);
  const ticketAcessorios = ticketAcessoriosVendas.length ? ticketAcessoriosTotal / ticketAcessoriosVendas.length : 0;
  const ticketPlanosPrincipaisVendas = vendasComValor.filter((venda) => ["Plano Controle", "Plano Pós-Pago", "TV", "Internet Residencial", "Internet Movel Mais"].includes(venda.plano));
  const ticketPlanosPrincipaisTotal = ticketPlanosPrincipaisVendas.reduce((sum, venda) => {
    const remuneracaoTabela = getRemunerationValue(venda.plano, venda.tipoPlano);
    return sum + (remuneracaoTabela ?? venda.valor);
  }, 0);
  const installationReminders = cycleScopedVendas
    .filter((venda) => ["Internet Residencial", "TV"].includes(venda.plano) && venda.status !== "Cancelada" && venda.dataInstalacao)
    .filter((venda) => venda.dataInstalacao <= cycleDate)
    .map((venda) => {
      const statusInstalacao = getInstallationStatus(venda);
      return {
        id: venda.id,
        cliente: venda.cliente,
        plano: venda.plano,
        tipoPlano: venda.tipoPlano || "—",
        dataInstalacao: venda.dataInstalacao,
        statusInstalacao,
        isInstalled: statusInstalacao === "Instalado",
      };
    })
    .filter((item) => item.statusInstalacao === "Pendente")
    .sort((a, b) => a.dataInstalacao.localeCompare(b.dataInstalacao));
  const pendingInstallationCount = installationReminders.length;
  const pendingQueue = buildPendingQueue(cycleScopedVendas, cycleDate);

  const byMonth = {};
  const ensureMonthBucket = (month) => {
    if (!month) return;
    if (byMonth[month]) return;
    byMonth[month] = { total: 0 };
    PLANOS.forEach((plano) => {
      byMonth[month][plano] = 0;
    });
  };
  let hasOtherPlanoInMonth = false;
  ensureMonthBucket(currentCycleMonth);
  scopedVendas.forEach((venda) => {
    if (venda.status !== "Ativa") return;
    const month = getVendaCompetenceMonth(venda);
    if (!month) return;
    ensureMonthBucket(month);

    if (PLANOS.includes(venda.plano)) {
      byMonth[month][venda.plano] += venda.valor;
    } else {
      byMonth[month].Outros = (byMonth[month].Outros || 0) + venda.valor;
      hasOtherPlanoInMonth = true;
    }
    byMonth[month].total += venda.valor;
  });

  const monthPlanSeries = hasOtherPlanoInMonth ? [...PLANOS, "Outros"] : PLANOS;
  const monthData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, value]) => ({
      name: MONTH_NAMES[parseInt(key.split("-")[1], 10) - 1],
      ...value,
    }));

  const byPlano = {};
  cycleScopedVendas.forEach((venda) => {
    if (venda.status === "Ativa") byPlano[venda.plano] = (byPlano[venda.plano] || 0) + venda.valor;
  });
  const planoData = Object.entries(byPlano).map(([name, value]) => ({ name, value }));

  const reportScopedVendas = scopedVendas;

  const dailyReportVendas = reportScopedVendas
    .map((venda) => ({ ...venda, dataCompetencia: getVendaCompetenceDate(venda) }))
    .filter((venda) => !dailyReportDate || venda.dataCompetencia === dailyReportDate)
    .sort((a, b) => a.dataCompetencia.localeCompare(b.dataCompetencia) || a.cliente.localeCompare(b.cliente));
  const dailyReportTotal = dailyReportVendas.filter((venda) => venda.status === "Ativa").reduce((sum, venda) => sum + venda.valor, 0);
  const monthlyReportVendas = reportScopedVendas
    .filter((venda) => !monthlyReportMonth || getVendaCompetenceMonth(venda) === monthlyReportMonth)
    .sort((a, b) => a.data.localeCompare(b.data) || a.cliente.localeCompare(b.cliente));
  const monthlyReportTotal = monthlyReportVendas.filter((venda) => venda.status === "Ativa").reduce((sum, venda) => sum + venda.valor, 0);

  const reportSellerName = currentUser?.role === "seller" ? String(currentUser.nome || "").toUpperCase() : "Todos vendedores";

  const sellerSummaries = sellers
    .map((seller) => {
      const sellerVendas = cycleScopedVendas.filter((venda) => venda.vendedorId === seller.id || venda.vendedor === seller.nome);
      const activeRevenue = sellerVendas.filter((venda) => venda.status === "Ativa").reduce((sum, venda) => sum + venda.valor, 0);

      return {
        ...seller,
        vendas: sellerVendas.length,
        ativas: sellerVendas.filter((venda) => venda.status === "Ativa").length,
        pendentes: sellerVendas.filter((venda) => venda.status === "Pendente").length,
        receita: activeRevenue,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const handleDownloadComanda = useCallback((venda) => {
    if (!venda) return;
    const baseDate = venda.data || new Date().toISOString().split("T")[0];
    const safeClient = slugify(venda.cliente || "cliente").slice(0, 50) || "cliente";
    exportVendaComanda(`comanda-venda-${baseDate}-${safeClient}.xls`, venda);
  }, []);

  const handleInstallationStatusUpdate = useCallback(
    async (vendaId, nextStatusInstalacao) => {
      const current = vendas.find((item) => item.id === vendaId);
      if (!current) return;
      const nextStatus =
        nextStatusInstalacao === "Instalado"
          ? "Ativa"
          : (nextStatusInstalacao === "Nao instalado" || nextStatusInstalacao === "Não instalado")
            ? "Cancelada"
            : "Pendente";
      const withHistory = {
        ...current,
        statusInstalacao: nextStatusInstalacao,
        status: nextStatus,
        dataFinalizacao: nextStatusInstalacao === "Instalado" ? getTodayDate() : current.dataFinalizacao || "",
        historico: appendHistory(current, {
          action: "status-instalacao",
          from: getInstallationStatus(current),
          to: nextStatusInstalacao,
          userId: currentUser?.id || "",
          userName: currentUser?.nome || "",
        }),
      };
      const updated = await updateVenda(vendaId, withHistory);
      setVendas((currentList) => currentList.map((item) => (item.id === vendaId ? normalizeLegacyVenda(updated) : item)));
      if (nextStatusInstalacao === "Instalado") {
        pushToast("Instalação concluída e venda atualizada para o mês vigente.", "success");
      } else {
      pushToast("Status da instalação atualizado.", "success");
      }
    },
    [vendas, currentUser, pushToast]
  );

  const handleNotInstalledDelete = useCallback(async (vendaId) => {
    const confirmed = window.confirm("Essa venda será excluída. Deseja continuar?");
    if (!confirmed) return;

    try {
      await deleteVenda(vendaId);
      setVendas((currentList) => currentList.filter((item) => item.id !== vendaId));
      pushToast("Venda excluída com sucesso.", "success");
    } catch (err) {
      pushToast(err.message || "Erro ao excluir venda.", "error");
    }
  }, [pushToast]);

  const saveVenda = useCallback(
    async (data) => {
      const { autoSeguro, adicionarSeguro, tipoSeguro, controleAdicionais, ...baseData } = data || {};
      if (modal?.edit) {
        const current = vendas.find((item) => item.id === modal.edit.id) || {};
        const updatedPayload = {
          ...baseData,
          historico: appendHistory(current, {
            action: "edicao",
            userId: currentUser?.id || "",
            userName: currentUser?.nome || "",
          }),
        };
        const updated = await updateVenda(modal.edit.id, updatedPayload);
        setVendas((current) => current.map((item) => (item.id === modal.edit.id ? normalizeLegacyVenda(updated) : item)));
      } else {
        const created = await createVenda({
          ...baseData,
          historico: appendHistory({}, {
            action: "criacao",
            userId: currentUser?.id || "",
            userName: currentUser?.nome || "",
          }),
        });
        const createdVenda = normalizeLegacyVenda(created);
        const createdItems = [createdVenda];

        const additionalSales = [];
        const addAdditional = (payload) => {
          if (!payload?.plano || !payload?.tipoPlano || !payload?.valor || payload.valor <= 0) return;
          additionalSales.push(payload);
        };
        const num = (value) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : 0;
        };

        const additionalBase = {
          cliente: baseData.cliente,
          cpf: baseData.cpf,
          data: baseData.data,
          vendedor: baseData.vendedor,
          vendedorId: baseData.vendedorId,
          ordemVenda: baseData.ordemVenda,
          cep: baseData.cep,
          dataNascimento: baseData.dataNascimento,
          descricao: baseData.descricao ? `${baseData.descricao} | Lançamento conjunto` : "Lançamento conjunto",
          status: "Ativa",
        };

        const hasMovelExtra = Boolean(baseData.comandaMovelAtiva || baseData.comandaMovelServico);
        const hasInternetExtra = Boolean(baseData.comandaInternetAtiva || baseData.comandaInternetPlano);
        const hasTvExtra = Boolean(baseData.comandaTvAtiva || baseData.comandaTvPlano);
        const hasAparelhoExtra = Boolean(baseData.comandaAparelhoAtiva || baseData.comandaAparelhoValor);
        const hasAcessoriosExtra = Boolean(baseData.comandaAcessoriosAtiva || baseData.comandaAcessoriosValor);
        const controleExtrasList = Array.isArray(controleAdicionais) ? controleAdicionais : [];

        const movelPlano = baseData.comandaMovelPlano || "Plano Controle";
        if (hasMovelExtra && baseData.plano !== movelPlano && baseData.comandaMovelServico) {
          addAdditional({
            ...additionalBase,
            plano: movelPlano,
            tipoPlano: baseData.comandaMovelServico,
            valor: getRemunerationValue(movelPlano, baseData.comandaMovelServico) || 0,
            numero: baseData.comandaMovelNumero || "",
            portabilidade: baseData.comandaMovelPortabilidade || baseData.comandaMovelNumero || "",
            iccid: baseData.comandaMovelIccid || "",
          });
        }

        if (hasInternetExtra && baseData.plano !== "Internet Residencial" && baseData.comandaInternetPlano) {
          addAdditional({
            ...additionalBase,
            plano: "Internet Residencial",
            tipoPlano: baseData.comandaInternetPlano,
            valor: getRemunerationValue("Internet Residencial", baseData.comandaInternetPlano) || 0,
            dataInstalacao: baseData.comandaInternetDataInstalacao || "",
            statusInstalacao: baseData.comandaInternetDataInstalacao ? "Pendente" : "",
            status: baseData.comandaInternetDataInstalacao ? "Pendente" : "Ativa",
            contrato: baseData.comandaInternetContrato || "",
            periodo: baseData.comandaInternetPeriodo || "",
            hfcGpon: baseData.comandaInternetHfcGpon || "",
          });
        }

        if (hasTvExtra && baseData.plano !== "TV" && baseData.comandaTvPlano) {
          addAdditional({
            ...additionalBase,
            plano: "TV",
            tipoPlano: baseData.comandaTvPlano,
            valor: getRemunerationValue("TV", baseData.comandaTvPlano) || 0,
            dataInstalacao: baseData.comandaTvDataInstalacao || "",
            statusInstalacao: baseData.comandaTvDataInstalacao ? "Pendente" : "",
            status: baseData.comandaTvDataInstalacao ? "Pendente" : "Ativa",
            contrato: baseData.comandaTvContrato || "",
            boxImediata: baseData.comandaTvBoxImediata || "",
          });
        }

        if (hasAparelhoExtra && baseData.plano !== "Aparelho Celular") {
          const aparelhoValor = num(baseData.comandaAparelhoValor);
          if (aparelhoValor > 0) {
            addAdditional({
              ...additionalBase,
              plano: "Aparelho Celular",
              tipoPlano: baseData.comandaAparelhoModelo || "Aparelho adicional",
              valor: aparelhoValor,
              modelo: baseData.comandaAparelhoModelo || "",
              imei: baseData.comandaAparelhoImei || "",
            });
          }
        }

        if (hasAcessoriosExtra && baseData.plano !== "Acessorios") {
          const acessoriosValor = num(baseData.comandaAcessoriosValor);
          if (acessoriosValor > 0) {
            addAdditional({
              ...additionalBase,
              plano: "Acessorios",
              tipoPlano: baseData.comandaAcessoriosDescricao || "Acessório adicional",
              valor: acessoriosValor,
              modelo: baseData.comandaAcessoriosDescricao || "",
              qty: baseData.comandaAcessoriosQuantidade || "",
            });
          }
        }

        if (baseData.plano === "Plano Controle" && controleExtrasList.length > 0) {
          controleExtrasList.forEach((item, index) => {
            if (!item?.tipoPlano) return;
            const valorControleExtra = getRemunerationValue("Plano Controle", item.tipoPlano) || 0;
            if (valorControleExtra <= 0) return;
            addAdditional({
              ...additionalBase,
              plano: "Plano Controle",
              tipoPlano: item.tipoPlano,
              valor: valorControleExtra,
              numero: item.numero || "",
              portabilidade: item.tipoNumeroPortado === "portabilidade" ? item.portabilidade || "" : item.numero || "",
              iccid: item.iccid || "",
              descricao: additionalBase.descricao
                ? `${additionalBase.descricao} | Linha Controle adicional ${index + 1}`
                : `Linha Controle adicional ${index + 1}`,
            });
          });
        }

        if (additionalSales.length > 0) {
          const createdAdditional = await Promise.all(additionalSales.map((payload) => createVenda(payload)));
          createdItems.unshift(...createdAdditional.map((item) => normalizeLegacyVenda(item)));
        }

        if (baseData.plano === "Aparelho Celular" && autoSeguro?.tipoPlano) {
          const valorSeguro = getRemunerationValue("Seguro Movel Celular", autoSeguro.tipoPlano);
          if (valorSeguro && valorSeguro > 0) {
            const createdSeguro = await createVenda({
              ...baseData,
              plano: "Seguro Movel Celular",
              tipoPlano: autoSeguro.tipoPlano,
              valor: valorSeguro,
              status: "Ativa",
              descricao: baseData.descricao ? `${baseData.descricao} | Seguro incluso` : "Seguro incluso no lançamento de aparelho",
            });
            createdItems.unshift(normalizeLegacyVenda(createdSeguro));
          }
        }

        setVendas((current) => [...createdItems, ...current]);

        pushToast("Venda registrada com sucesso.", "success");
        const shouldExportComanda = window.confirm("Venda registrada com sucesso. Deseja gerar a planilha de comanda desta venda?");
        if (shouldExportComanda) {
          handleDownloadComanda(createdVenda);
          pushToast("Comanda gerada para download.", "success");
        }
      }
      setModal(null);
    },
    [handleDownloadComanda, modal, vendas, currentUser, pushToast]
  );

  const confirmDelete = useCallback(async () => {
    try {
      await deleteVenda(deleteId);
      setVendas((current) => current.filter((item) => item.id !== deleteId));
      setDeleteId(null);
      pushToast("Venda excluída com sucesso.", "success");
    } catch (err) {
      pushToast(err.message || "Erro ao excluir venda.", "error");
    }
  }, [deleteId, pushToast]);

  const confirmSellerDelete = useCallback(async () => {
    try {
      await deleteSeller(sellerDeleteId);
      setUsers((current) => current.filter((item) => item.id !== sellerDeleteId));
      setSellerDeleteId(null);
      pushToast("Vendedor excluído com sucesso.", "success");
    } catch (err) {
      pushToast(err.message || "Erro ao excluir vendedor.", "error");
    }
  }, [sellerDeleteId, pushToast]);

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
    pushToast("Senha alterada com sucesso.", "success");
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

  function handleExportDailyReport() {
    if (!dailyReportDate || dailyReportVendas.length === 0) {
      pushToast("Selecione um dia com vendas para exportar.", "info");
      return;
    }

    const rows = dailyReportVendas.map((venda) => [
        fmtDate(venda.dataCompetencia || venda.data),
        venda.cliente,
        venda.cpf || "",
        PLANO_LABELS[venda.plano] || venda.plano,
        venda.tipoPlano || "",
        venda.valor,
        venda.vendedor ? String(venda.vendedor).toUpperCase() : "",
        venda.descricao || "",
      ]);

    exportExcelReport(`relatorio-vendas-${dailyReportDate}.xls`, {
      sheetName: "Relatório Diário",
      title: "Relatório Diário de Vendas",
      meta: [
        ["Data", fmtDate(dailyReportDate)],
        ["Vendedor", reportSellerName],
        ["Quantidade de vendas", dailyReportVendas.length],
      ],
      headers: ["Data", "Cliente", "CPF", "Plano", "Tipo de Plano", "Valor", "Vendedor", "Descrição"],
      rows,
      totalLabel: "Total do dia",
      totalValue: dailyReportTotal,
      columnWidths: [80, 180, 100, 140, 210, 90, 120, 220],
    });
  }

  function handleExportMonthlyReport() {
    if (!monthlyReportMonth || monthlyReportVendas.length === 0) {
      pushToast("Selecione um mês com vendas para exportar.", "info");
      return;
    }

    const rows = monthlyReportVendas.map((venda) => [
        fmtDate(venda.data),
        venda.cliente,
        venda.cpf || "",
        PLANO_LABELS[venda.plano] || venda.plano,
        venda.tipoPlano || "",
        venda.valor,
        venda.vendedor ? String(venda.vendedor).toUpperCase() : "",
        venda.descricao || "",
      ]);

    exportExcelReport(`relatorio-mensal-${monthlyReportMonth}.xls`, {
      sheetName: "Relatório Mensal",
      title: "Relatório Mensal de Vendas",
      meta: [
        ["Mês", fmtMonth(monthlyReportMonth)],
        ["Vendedor", reportSellerName],
        ["Quantidade de vendas", monthlyReportVendas.length],
      ],
      headers: ["Data", "Cliente", "CPF", "Plano", "Tipo de Plano", "Valor", "Vendedor", "Descrição"],
      rows,
      totalLabel: "Total do mês",
      totalValue: monthlyReportTotal,
      columnWidths: [80, 180, 100, 140, 210, 90, 120, 220],
    });
  }

  function clearFilters() {
    setSearch("");
    setFPlano("Todos");
    setFVendedor("Todos");
    setFMes(currentCycleMonth);
    setFDia("");
    setPage(1);
  }

  if (isBooting) {
    return (
      <div style={{ minHeight: "100vh", background: "#070e1c", color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif" }}>
        <style>{APP_STYLES}</style>
        <div className="app-shell">
          <div className="app-content">
            <div className="panel-surface" style={{ padding: 18, display: "grid", gap: 12 }}>
              <div className="skeleton" style={{ height: 24, width: 260 }} />
              <div className="skeleton" style={{ height: 14, width: 180 }} />
            </div>
            <div className="kpi-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton-card">
                  <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 30, width: "70%", marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 12, width: "55%" }} />
                </div>
              ))}
            </div>
            <div className="panel-surface" style={{ padding: 18, display: "grid", gap: 10 }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="skeleton" style={{ height: 44, width: "100%" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const sellerToDelete = sellers.find((seller) => seller.id === sellerDeleteId) || null;

  return (
    <>
      <style>{APP_STYLES}</style>

      <div style={{ minHeight: "100vh", background: "#070e1c", fontFamily: "'DM Sans',sans-serif", color: "#e2e8f0" }}>
        <AppHeader
          currentUser={currentUser}
          tab={tab}
          onTabChange={setTab}
          onOpenSellerModal={() => setModal("seller")}
          onOpenPasswordModal={() => setModal("password")}
          onLogout={handleLogout}
        />

        <div className="app-shell">
          <div className="app-content">
          <div className="kpi-grid">
            <StatCard icon="💰" label="Receita Total" value={fmtBRL(totalVal)} sub={`${ativas.length} vendas ativas`} color="#22c55e" featured />
            <StatCard icon="📲" label="Ticket Celular (5%)" value={fmtBRL(ticketCelular)} sub={`${ticketCelularVendas.length} vendas`} color="#10b981" />
            <StatCard icon="🎧" label="Ticket Acessórios (15%)" value={fmtBRL(ticketAcessorios)} sub={`${ticketAcessoriosVendas.length} vendas`} color="#ec4899" />
            <StatCard icon="📊" label="Controle + Pós + TV + Internet" value={fmtBRL(ticketPlanosPrincipaisTotal)} sub={`${ticketPlanosPrincipaisVendas.length} vendas`} color="#0ea5e9" />
            <StatCard icon="📱" label="Planos Móveis" value={cycleScopedVendas.filter((venda) => ["Plano Controle", "Plano Pós-Pago"].includes(venda.plano)).length} color="#10b981" />
            <StatCard icon="🌐" label="Internet + TV" value={cycleScopedVendas.filter((venda) => ["Internet Residencial", "Internet Movel Mais", "TV"].includes(venda.plano) && venda.status === "Ativa").length} color="#f59e0b" />
          </div>

          {tab === "vendas" && (
            <VendasTab
              currentUser={currentUser}
              sellers={sellers}
              search={search}
              setSearch={setSearch}
              fPlano={fPlano}
              setFPlano={setFPlano}
              fVendedor={fVendedor}
              setFVendedor={setFVendedor}
              fMes={fMes}
              fDia={fDia}
              setFDia={setFDia}
              filtered={filtered}
              paginated={paginated}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              sortBy={sortBy}
              sortDir={sortDir}
              onToggleSort={toggleSort}
              onOpenNew={() => setModal("new")}
              onView={setViewItem}
              onEdit={(venda) => setModal({ edit: venda })}
              onDelete={setDeleteId}
              onClearFilters={clearFilters}
              installationReminders={installationReminders}
              pendingInstallationCount={pendingInstallationCount}
            />
          )}

          {tab === "pendencias" && (
            <PendenciasTab
              installationPending={pendingQueue.installationPending}
              installationOverdue={pendingQueue.installationOverdue}
              installationUpcoming={pendingQueue.installationUpcoming}
              onMarkInstalled={(vendaId) => handleInstallationStatusUpdate(vendaId, "Instalado")}
              onMarkNotInstalled={handleNotInstalledDelete}
            />
          )}

          {tab === "relatorios" && (
            <ReportsTab
              reportScopedVendas={reportScopedVendas}
              monthData={monthData}
              monthPlanSeries={monthPlanSeries}
              planoData={planoData}
              dailyReportDate={dailyReportDate}
              setDailyReportDate={setDailyReportDate}
              dailyReportVendas={dailyReportVendas}
              dailyReportTotal={dailyReportTotal}
              onExportDailyReport={handleExportDailyReport}
              monthlyReportMonth={monthlyReportMonth}
              setMonthlyReportMonth={setMonthlyReportMonth}
              monthlyReportVendas={monthlyReportVendas}
              monthlyReportTotal={monthlyReportTotal}
              onExportMonthlyReport={handleExportMonthlyReport}
            />
          )}

          {tab === "vendedores" && currentUser.role === "admin" && (
            <SellersTab sellerSummaries={sellerSummaries} currentCycleMonth={currentCycleMonth} onOpenSellerModal={() => setModal("seller")} onDeleteSeller={setSellerDeleteId} />
          )}
          </div>
          <footer
            style={{
              marginTop: 20,
              textAlign: "center",
              color: "#64748b",
              fontSize: 12,
              padding: "10px 6px 6px",
            }}
          >
            © 2026 Painel de Vendas • Desenvolvido por GILSON ELIAS • Produto idealizado por CAIO CARDOSO
          </footer>
        </div>
      </div>

      <ToastStack items={toasts} onDismiss={dismissToast} />

      {(modal === "new" || modal?.edit) && (
        <Modal title={modal?.edit ? "Editar Lançamento" : "Novo Lançamento"} onClose={() => setModal(null)} wide>
          <VendaForm initial={modal?.edit} onSave={saveVenda} onClose={() => setModal(null)} currentUser={currentUser} sellers={sellers} onFeedback={pushToast} />
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
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <Panel style={{ maxWidth: 420, width: "90%", textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 42, marginBottom: 14 }}>👤</div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 8 }}>Excluir vendedor?</div>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 10 }}>
              {sellerToDelete?.nome ? `${sellerToDelete.nome} perderá o acesso ao sistema.` : "Este vendedor perderá o acesso ao sistema."}
            </div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>As vendas já registradas serão mantidas no histórico.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button style={btnSecondary} onClick={() => setSellerDeleteId(null)}>
                Cancelar
              </button>
              <button style={btnDanger} onClick={confirmSellerDelete}>
                Sim, excluir
              </button>
            </div>
          </Panel>
        </div>
      )}

      {viewItem && (
        <Modal title="Detalhes do Lançamento" onClose={() => setViewItem(null)}>
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
              <span
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  background: `${PLANO_COLORS[viewItem.plano] || "#6366f1"}25`,
                  border: `1px solid ${PLANO_COLORS[viewItem.plano] || "#6366f1"}66`,
                  boxShadow: `0 10px 18px ${(PLANO_COLORS[viewItem.plano] || "#6366f1")}33`,
                }}
              >
                {PLANO_ICONS[viewItem.plano]}
              </span>
              <div>
                <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#f1f5f9", fontWeight: 700 }}>{PLANO_LABELS[viewItem.plano] || viewItem.plano}</div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>{viewItem.descricao || "Sem descrição"}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
              </div>
            </div>

            {[
              ["Cliente", viewItem.cliente],
              ["CPF", viewItem.cpf || "—"],
              ["Vendedor", viewItem.vendedor ? String(viewItem.vendedor).toUpperCase() : "—"],
              ["Valor", fmtBRL(viewItem.valor)],
              ["Data", fmtDate(viewItem.data)],
              ["Status", viewItem.status || "—"],
              ["Status da instalação", getInstallationStatus(viewItem) || "—"],
              ...COMANDA_COMMON_FIELDS.map((field) => [field.label, viewItem[field.key] || "—"]),
              ...(PLANO_EXTRAS[viewItem.plano] || []).map((extra) => [extra.label, viewItem[extra.key] || "—"]),
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e293b", fontSize: 14 }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>{label}</span>
                <span style={{ color: "#f1f5f9" }}>{value}</span>
              </div>
            ))}

            {Array.isArray(viewItem.historico) && viewItem.historico.length > 0 && (
              <div style={{ marginTop: 8, borderTop: "1px solid #1e293b", paddingTop: 10 }}>
                <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Histórico</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {viewItem.historico.slice().reverse().slice(0, 8).map((event, index) => (
                    <div key={`${event.at || "evt"}-${index}`} style={{ fontSize: 12, color: "#cbd5e1" }}>
                      {fmtDate(event.at || "")} · {event.action || "alteração"} · {event.userName || "sistema"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                style={{ ...btnSecondary, borderColor: "#22d3ee", color: "#67e8f9" }}
                onClick={() => handleDownloadComanda(viewItem)}
              >
                Baixar comanda
              </button>
              <button style={btnSecondary} onClick={() => setViewItem(null)}>
                Fechar
              </button>
              <button
                style={btnPrimary}
                onClick={() => {
                  setModal({ edit: viewItem });
                  setViewItem(null);
                }}
              >
                Editar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <Panel style={{ maxWidth: 380, width: "90%", textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 42, marginBottom: 14 }}>🗑️</div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 8 }}>Excluir lançamento?</div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Esta ação não pode ser desfeita.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button style={btnSecondary} onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
              <button style={btnDanger} onClick={confirmDelete}>
                Sim, excluir
              </button>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
