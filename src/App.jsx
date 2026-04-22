import { useCallback, useEffect, useRef, useState } from "react";
import {
  changePassword as apiChangePassword,
  clearApiToken,
  createSeller,
  createVenda,
  deleteSeller,
  deleteVenda,
  getSession,
  hasApiToken,
  listGoals,
  listUsers,
  listVendas,
  login as apiLogin,
  logout as apiLogout,
  migrateLegacyData,
  upsertGoalTarget,
  updateUserName as apiUpdateUserName,
  updateVenda,
} from "./apiClient";
import AppHeader from "./components/AppHeader";
import AuthScreen from "./components/AuthScreen";
import Logo from "./components/Logo";
import PasswordForm from "./components/forms/PasswordForm";
import SellerForm from "./components/forms/SellerForm";
import UserNameForm from "./components/forms/UserNameForm";
import VendaForm from "./components/forms/VendaForm";
import ReportsTab from "./components/sections/ReportsTab";
import SellersTab from "./components/sections/SellersTab";
import VendasTab from "./components/sections/VendasTab";
import PendenciasTab from "./components/sections/PendenciasTab";
import GoalsTab from "./components/sections/GoalsTab";
import { Modal, Panel, StatCard, ToastStack, btnDanger, btnPrimary, btnSecondary } from "./components/ui";
import { COMANDA_COMMON_FIELDS, PLANOS, PLANO_COLORS, PLANO_EXTRAS, PLANO_ICONS, PLANO_LABELS, STORAGE_KEYS, MONTH_NAMES, getRemunerationValue } from "./constants/sales";
import { exportExcelReport, exportVendaComanda, fmtBRL, fmtDate, fmtMonth, loadUsers, loadVendas, normalizeLegacyVenda, slugify } from "./utils/sales";
import { appendHistory, buildPendingQueue, getInstallationStatus } from "./utils/workflow";
import "./App.css";

const getTodayDate = () => new Date().toISOString().split("T")[0];
const getTodayMonth = () => new Date().toISOString().slice(0, 7);
const INSTALLATION_COMPETENCE_PLANOS = new Set(["Internet Residencial", "TV"]);
const GOAL_FIELDS = [
  { key: "bandaLarga", label: "Banda Larga", type: "count", icon: "📶" },
  { key: "grossTotal", label: "Gross Total", type: "count", icon: "📦" },
  { key: "posPagoTitular", label: "Pos pago titular", type: "count", icon: "📱" },
  { key: "residencial", label: "Residencial", type: "count", icon: "🏠" },
  { key: "receita", label: "Receita", type: "currency", icon: "💰" },
  { key: "tv", label: "Tv", type: "count", icon: "📺" },
];
const DEFAULT_GOAL_VALUES = GOAL_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: 0 }), {});
const GOAL_OWNER_ALL_ADMINS = "__all_admins__";

const normalizeSearchText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const APP_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
  :root{
    --bg:#0B0B0C;
    --bg-soft:#101012;
    --panel:#141416;
    --panel-strong:#141416;
    --line:#2A2A2E;
    --line-strong:#DA291C;
    --text:#FFFFFF;
    --text-strong:#FFFFFF;
    --muted:#A1A1AA;
    --brand:#DA291C;
    --brand-dark:#B71C1C;
    --accent-info:#DA291C;
    --accent-success:#22C55E;
    --accent-warning:#FACC15;
    --accent-danger:#EF4444;
    --accent-info-soft:rgba(218,41,28,0.22);
    --accent-success-soft:rgba(34,197,94,0.16);
    --accent-warning-soft:rgba(250,204,21,0.2);
    --accent-danger-soft:rgba(239,68,68,0.16);
    --radius-md:10px;
    --radius-lg:12px;
    --shadow-soft:0 12px 24px rgba(0,0,0,0.28);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    background:var(--bg);
    color:var(--text);
  }
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes auroraDrift{0%{transform:translate3d(-2%,0,0)}50%{transform:translate3d(2%,1%,0)}100%{transform:translate3d(-2%,0,0)}}
  .app-atmosphere{
    position:relative;
    isolation:isolate;
    background:var(--bg);
    overflow:hidden;
  }
  .app-atmosphere::before{
    content:none;
    position:absolute;
    inset:-22% -18%;
    background:none;
    filter:none;
    animation:none;
    pointer-events:none;
    z-index:0;
  }
  .app-atmosphere::after{
    content:none;
    position:absolute;
    inset:0;
    background:none;
    opacity:0;
    pointer-events:none;
    z-index:0;
  }
  .app-atmosphere > *{
    position:relative;
    z-index:1;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible{
    outline:2px solid var(--accent-info);
    outline-offset:2px;
  }
  .touch-btn:hover{transform:translateY(-1px);}
  .touch-btn:active{transform:translateY(0);}
  .lift-hover:hover{transform:translateY(-1px);}
  input::placeholder,
  textarea::placeholder{
    color:var(--muted);
    opacity:1;
  }
  .panel-surface{
    background:#141416;
    border:1px solid var(--line);
    border-radius:8px;
    box-shadow:0 8px 16px rgba(0,0,0,0.26);
    transition:all .2s ease;
  }
  @media (hover:hover){
    .panel-surface:hover{
      border-color:rgba(218,41,28,0.45);
      box-shadow:0 10px 18px rgba(0,0,0,0.3);
    }
  }
  .stat-card{
    transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    animation:fadeUp .34s ease both;
  }
  @media (hover:hover){
    .stat-card{
      will-change:transform, box-shadow;
    }
    .stat-card::after{
      content:"";
      position:absolute;
      inset:-35% -120%;
      background:linear-gradient(100deg, rgba(255,255,255,0) 24%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 76%);
      transform:translateX(-28%);
      opacity:0;
      transition:transform .45s ease, opacity .45s ease;
      pointer-events:none;
    }
    .stat-card:hover{
      transform:translateY(-3px);
      border-color:rgba(218,41,28,0.5) !important;
      box-shadow:0 12px 24px rgba(0,0,0,0.34) !important;
    }
    .stat-card:hover::after{
      transform:translateX(32%);
      opacity:1;
    }
    .seller-summary-card{
      transition:transform .22s ease, border-color .22s ease, box-shadow .22s ease;
      will-change:transform, box-shadow;
    }
    .seller-summary-card:hover{
      transform:translateY(-3px);
      border-color:rgba(218,41,28,0.45) !important;
      box-shadow:0 12px 24px rgba(0,0,0,0.3) !important;
    }
  }
  @media (prefers-reduced-motion: reduce){
    .stat-card,
    .seller-summary-card{
      transition:none !important;
      animation:none !important;
    }
    .app-atmosphere::before{
      animation:none !important;
    }
    .stat-card::after{
      display:none;
    }
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
    transform:translateY(-1px);
    border-color:rgba(218,41,28,0.4) !important;
    box-shadow:0 10px 18px rgba(0,0,0,0.3) !important;
  }
  .skeleton{
    background:linear-gradient(90deg, rgba(42,42,46,0.45) 25%, rgba(62,62,68,0.55) 50%, rgba(42,42,46,0.45) 75%);
    background-size:200% 100%;
    animation:shimmer 1.2s linear infinite;
    border-radius:12px;
  }
  .skeleton-card{
    padding:14px;
    border:1px solid var(--line);
    border-radius:16px;
    background:linear-gradient(180deg, rgba(20,20,22,0.96), rgba(16,16,18,0.96));
  }
  .action-pill{
    border:none;
    border-radius:10px;
    padding:7px 10px;
    cursor:pointer;
    font-size:12px;
    font-weight:700;
    min-height:36px;
    transition:all .15s ease;
  }
  .action-pill:hover{filter:brightness(1.04);}
  .action-pill-info{background:rgba(218,41,28,0.16);color:#fff;border:1px solid rgba(218,41,28,0.6);}
  .action-pill-edit{background:rgba(20,20,22,0.96);color:#fff;border:1px solid rgba(42,42,46,1);}
  .action-pill-delete{background:rgba(20,20,22,0.96);color:#fff;border:1px solid rgba(239,68,68,0.65);}
  .filters-bar{
    display:flex;
    flex-wrap:nowrap;
    overflow-x:auto;
    gap:10px;
    align-items:flex-end;
  }
  .filter-field{
    min-width:0;
    flex:1 1 170px;
  }
  .filter-search-top{
    flex:1.8 1 320px;
    min-width:280px;
  }
  .filters-actions{
    display:flex;
    gap:8px;
    justify-content:flex-end;
    align-items:center;
    flex:0 0 auto;
  }
  .filter-count{
    color:var(--muted);
    font-size:13px;
    font-weight:600;
  }
  .quick-filter-btn:hover{border-color:var(--accent-info)!important;color:#fff!important;}
  input[type="date"],
  input[type="month"]{
    color-scheme:dark;
    background:#141416;
    border:1px solid var(--line);
    border-radius:12px;
    color:var(--text);
    min-height:44px;
    padding-right:42px;
    box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);
    transition:all .2s ease;
  }
  input[type="date"]:hover,
  input[type="month"]:hover{
    border-color:rgba(218,41,28,0.75);
    box-shadow:0 0 0 2px var(--accent-info-soft);
  }
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="month"]::-webkit-calendar-picker-indicator{
    cursor:pointer;
    opacity:.95;
    border-radius:8px;
    padding:4px;
    background:rgba(218,41,28,0.1);
    filter:brightness(1.2) contrast(1.1);
  }
  input[type="date"]::-webkit-datetime-edit,
  input[type="month"]::-webkit-datetime-edit{
    color:var(--text);
  }
  .app-nav button:hover{
    transform:translateY(-1px);
    border-color:rgba(218,41,28,0.75)!important;
    color:#fff!important;
    background:rgba(183,28,28,0.36)!important;
  }
  .app-nav button:focus-visible{
    outline:2px solid var(--accent-info);
    outline-offset:1px;
  }
  .plan-choice:hover,
  .status-choice:hover{
    transform:translateY(-1px);
    filter:brightness(1.05);
  }
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:#111113;}
  ::-webkit-scrollbar-thumb{background:#B71C1C;border-radius:3px;}
  select option{background:#141416;}
  input[type=number]::-webkit-inner-spin-button{opacity:0;}
  tr:hover td{background:rgba(225,6,19,0.08)!important;}
  .app-shell{
    padding:24px 20px;
    width:100%;
  }
  .app-content{
    max-width:1280px;
    margin:0 auto;
    display:grid;
    gap:16px;
  }
  .vendas-screen{
    height:auto;
    min-height:0;
    display:flex;
    flex-direction:column;
    gap:12px;
    overflow:visible;
  }
  .kpi-grid{
    display:grid;
    grid-template-columns: minmax(280px, 1.05fr) minmax(0, 1.95fr);
    gap:14px;
    width:100%;
    align-items:stretch;
  }
  .kpi-featured{
    width:100%;
    min-width:0;
    display:flex;
  }
  .kpi-featured .stat-card{
    flex:1;
    min-height:100%;
  }
  .kpi-row{
    display:grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap:12px;
    width:100%;
    align-items:stretch;
  }
  .kpi-row > *{
    grid-column:span 2;
    min-width:0;
  }
  .kpi-row .stat-card{
    width:100%;
    max-width:188px;
    min-height:96px;
    justify-self:center;
  }
  @media (max-width: 1200px){
    .kpi-row{
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
    .kpi-row .stat-card{
      max-width:178px;
      justify-self:center;
    }
  }
  @media (max-width: 900px){
    .kpi-grid{
      grid-template-columns:1fr;
    }
    .kpi-row{
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .kpi-row > *{
      grid-column:auto;
    }
    .kpi-row .stat-card{
      max-width:100%;
      min-height:96px;
    }
  }
  @media (max-width: 1024px){
    .desktop-table{
      display:none;
    }
    .mobile-cards{
      display:grid !important;
    }
  }
  @media (max-width: 768px){
    .app-shell{
      padding:18px 14px !important;
    }
    .app-content{
      gap:16px;
    }
    .vendas-screen{
      height:auto;
    }
    .filters-bar{
      display:grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      overflow:visible;
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
    .brand-logo-img{
      width:240px !important;
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
    .kpi-row{
      grid-template-columns:1fr;
    }
  }
  @media (max-width: 480px){
    .plan-grid{
      grid-template-columns:1fr !important;
    }
    .brand-logo-img{
      width:200px !important;
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
  const storedGoalsByMonth = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.goalsByMonth);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();
  const [vendas, setVendas] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [sellerDeleteId, setSellerDeleteId] = useState(null);
  const [userEditId, setUserEditId] = useState(null);
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
  const [currentCycleMonth] = useState(storedCycleMonth);
  const [sortBy, setSortBy] = useState("data");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [goalsByMonth, setGoalsByMonth] = useState(storedGoalsByMonth);
  const [goalOwnerId, setGoalOwnerId] = useState("");
  const goalSaveTimersRef = useRef({});
  const goalSyncWarningShownRef = useRef(false);
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

  const readLocalGoalsCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.goalsByMonth);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const loadGoalsWithFallback = useCallback(async () => {
    try {
      const remoteGoals = await listGoals();
      goalSyncWarningShownRef.current = false;
      return remoteGoals || {};
    } catch {
      if (!goalSyncWarningShownRef.current) {
        pushToast("Não foi possível carregar metas do Supabase. Usando cache local.", "warning");
        goalSyncWarningShownRef.current = true;
      }
      return readLocalGoalsCache();
    }
  }, [pushToast, readLocalGoalsCache]);

  useEffect(() => {
    return () => {
      Object.values(goalSaveTimersRef.current).forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  const sellers = users.filter((user) => user.role === "seller");
  const canManageUsers = currentUser ? currentUser.role !== "seller" : false;
  const canManageAdmins = currentUser?.role === "superadmin";


  const fetchLatestVendas = useCallback(async () => {
    const loaded = await listVendas();
    setVendas(loaded.map(normalizeLegacyVenda));
  }, []);

  const broadcastVendaSync = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.vendasSync, String(Date.now()));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event) => {
      if (event.key !== STORAGE_KEYS.vendasSync) return;
      if (currentUser?.role === "seller") return;
      if (!event.newValue) return;
      fetchLatestVendas().catch(() => {});
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [currentUser?.role, fetchLatestVendas]);

  useEffect(() => {
    async function bootstrap() {
      if (!hasApiToken()) {
        setIsBooting(false);
        return;
      }

      try {
        const user = await getSession();
        const [loadedUsers, loadedVendas, loadedGoals] = await Promise.all([listUsers(), listVendas(), loadGoalsWithFallback()]);
        setCurrentUser(user);
        setUsers(loadedUsers);
        setVendas(loadedVendas.map(normalizeLegacyVenda));
        setGoalsByMonth(loadedGoals || {});
      } catch {
        clearApiToken();
      } finally {
        setIsBooting(false);
      }
    }

    bootstrap();
  }, [loadGoalsWithFallback]);

  useEffect(() => {
    async function migrateLegacy() {
      if (!currentUser || currentUser.role === "seller") return;
      if (localStorage.getItem(STORAGE_KEYS.backendMigration) === "done") return;

      const legacyUsers = loadUsers().filter((user) => user.role === "seller");
      const legacyVendas = loadVendas().map(normalizeLegacyVenda);

      if (!legacyUsers.length && !legacyVendas.length) {
        localStorage.setItem(STORAGE_KEYS.backendMigration, "done");
        return;
      }

      try {
        await migrateLegacyData({ users: legacyUsers, vendas: legacyVendas });
        const [loadedUsers, loadedVendas, loadedGoals] = await Promise.all([listUsers(), listVendas(), loadGoalsWithFallback()]);
        setUsers(loadedUsers);
        setVendas(loadedVendas.map(normalizeLegacyVenda));
        setGoalsByMonth(loadedGoals || {});
        localStorage.setItem(STORAGE_KEYS.backendMigration, "done");
      } catch {}
    }

    migrateLegacy();
  }, [currentUser, loadGoalsWithFallback]);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.goalsByMonth, JSON.stringify(goalsByMonth));
    } catch {}
  }, [goalsByMonth]);

  useEffect(() => {
    if (!currentUser?.id) {
      setGoalOwnerId("");
      return;
    }

    if (currentUser.role !== "superadmin") {
      setGoalOwnerId(currentUser.id);
      return;
    }

    const adminIds = users.filter((user) => user.role === "admin").map((user) => user.id);
    setGoalOwnerId((current) => {
      if (current === GOAL_OWNER_ALL_ADMINS) return current;
      if (adminIds.includes(current)) return current;
      return GOAL_OWNER_ALL_ADMINS;
    });
  }, [currentUser?.id, currentUser?.role, users]);

  const scopedVendas = vendas.filter((venda) => {
    if (!currentUser) return false;
    if (currentUser.role !== "seller") return true;
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
  const parseNumericValue = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    const compact = raw.replace(/\s/g, "");
    const hasComma = compact.includes(",");
    const hasDot = compact.includes(".");
    let normalized = compact;

    if (hasComma && hasDot) {
      normalized =
        compact.lastIndexOf(",") > compact.lastIndexOf(".")
          ? compact.replace(/\./g, "").replace(",", ".")
          : compact.replace(/,/g, "");
    } else if (hasComma) {
      normalized = compact.replace(",", ".");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const TICKET_PERCENTAGE_BY_PLANO = {
    "Aparelho Celular": 0.05,
    Acessorios: 0.15,
  };
  const getVendaRevenue = (venda = {}) => {
    const valorBase = parseNumericValue(venda.valor);
    if (["Plano Controle", "Plano Pós-Pago", "TV", "Internet Residencial", "Internet Movel Mais", "Seguro Movel Celular"].includes(venda.plano)) {
      const remuneracaoTabela = getRemunerationValue(venda.plano, venda.tipoPlano);
      return remuneracaoTabela ?? valorBase;
    }
    const ticketPercentage = TICKET_PERCENTAGE_BY_PLANO[venda.plano];
    if (ticketPercentage) return valorBase * ticketPercentage;
    return valorBase;
  };
  const cycleScopedVendas = scopedVendas.filter((venda) => getVendaCompetenceMonth(venda) === currentCycleMonth);
  const installationCycleScopedVendas = scopedVendas.filter(
    (venda) =>
      ["Internet Residencial", "TV"].includes(venda.plano) &&
      venda.status !== "Cancelada" &&
      venda.dataInstalacao &&
      venda.dataInstalacao.slice(0, 7) === currentCycleMonth
  );
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
      if (currentUser?.role !== "seller" && fVendedor !== "Todos" && venda.vendedorId !== fVendedor) return false;
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
  const totalVal = vendasComValor.reduce((sum, venda) => sum + getVendaRevenue(venda), 0);
  const ticketCelularVendas = vendasComValor.filter((venda) => venda.plano === "Aparelho Celular");
  const ticketCelularTotal = ticketCelularVendas.reduce((sum, venda) => sum + getVendaRevenue(venda), 0);
  const ticketCelular = ticketCelularTotal;
  const ticketAcessoriosVendas = vendasComValor.filter((venda) => venda.plano === "Acessorios");
  const ticketAcessoriosTotal = ticketAcessoriosVendas.reduce((sum, venda) => sum + getVendaRevenue(venda), 0);
  const ticketAcessorios = ticketAcessoriosTotal;
  const ticketPlanosPrincipaisVendas = vendasComValor.filter((venda) => ["Plano Controle", "Plano Pós-Pago", "TV", "Internet Residencial", "Internet Movel Mais"].includes(venda.plano));
  const ticketPlanosPrincipaisTotal = ticketPlanosPrincipaisVendas.reduce((sum, venda) => sum + getVendaRevenue(venda), 0);
  const computeGoalProgress = (vendasList = [], receitaTotal = 0) => {
    const activeVendas = (vendasList || []).filter((venda) => venda.status !== "Cancelada");
    const bandaLarga = activeVendas.reduce((sum, venda) => {
      const isDependenteVenda =
        venda.plano === "Plano Pós-Pago" &&
        String(venda.tipoPlano || "")
          .toLowerCase()
          .includes("dependente banda larga");
      const dependentes = Array.isArray(venda.posPagoDependentes) ? venda.posPagoDependentes : [];
      const dependentesBandaLarga = dependentes.filter((item) => String(item?.tipo || "").toLowerCase().includes("dependente banda larga")).length;
      const internetResidencial = venda.plano === "Internet Residencial" ? 1 : 0;
      return sum + (isDependenteVenda ? 1 : 0) + dependentesBandaLarga + internetResidencial;
    }, 0);

    return {
      bandaLarga,
      grossTotal: activeVendas.filter((venda) => ["Plano Controle", "Plano Pós-Pago"].includes(venda.plano)).length,
      posPagoTitular: activeVendas.filter(
        (venda) =>
          venda.plano === "Plano Pós-Pago" &&
          !String(venda.tipoPlano || "")
            .toLowerCase()
            .startsWith("dependente")
      ).length,
      residencial: activeVendas.filter((venda) => ["Internet Residencial", "TV"].includes(venda.plano)).length,
      receita: receitaTotal,
      tv: activeVendas.filter((venda) => venda.plano === "TV").length,
    };
  };
  const installationReminders = installationCycleScopedVendas
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
  const pendingQueue = buildPendingQueue(scopedVendas, cycleDate, currentCycleMonth);
  const adminGoalUsers = users
    .filter((user) => user.role === "admin")
    .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));
  const canReviewAdminGoals = currentUser?.role === "superadmin";
  const isAllAdminsGoalView = canReviewAdminGoals && goalOwnerId === GOAL_OWNER_ALL_ADMINS;
  const selectedGoalOwner = isAllAdminsGoalView ? null : (users.find((user) => user.id === goalOwnerId) || currentUser);
  const selectedGoalOwnerId = isAllAdminsGoalView ? null : (selectedGoalOwner?.id || currentUser?.id || null);
  const goalScopeUsers = isAllAdminsGoalView
    ? adminGoalUsers
    : selectedGoalOwner
      ? [selectedGoalOwner]
      : [];
  const goalScopeUserIds = new Set(goalScopeUsers.map((user) => user.id));
  const goalScopeUserNames = new Set(goalScopeUsers.map((user) => String(user.nome || "").toUpperCase()));
  const goalScopedVendas = cycleScopedVendas.filter((venda) => {
    const sellerName = String(venda.vendedor || "").toUpperCase();
    return goalScopeUserIds.has(venda.vendedorId) || goalScopeUserNames.has(sellerName);
  });
  const goalScopedTotal = goalScopedVendas
    .filter((venda) => venda.status === "Ativa")
    .reduce((sum, venda) => sum + getVendaRevenue(venda), 0);
  const selectedGoalOwnerByMonth = selectedGoalOwnerId ? (goalsByMonth[selectedGoalOwnerId] || {}) : {};
  const allAdminsGoalTargets = adminGoalUsers.reduce((acc, adminUser) => {
    const monthGoals = goalsByMonth[adminUser.id]?.[currentCycleMonth] || {};
    GOAL_FIELDS.forEach((field) => {
      acc[field.key] = Number(acc[field.key] || 0) + (Number(monthGoals[field.key]) || 0);
    });
    return acc;
  }, { ...DEFAULT_GOAL_VALUES });
  const currentGoalTargets = isAllAdminsGoalView
    ? allAdminsGoalTargets
    : { ...DEFAULT_GOAL_VALUES, ...(selectedGoalOwnerByMonth[currentCycleMonth] || {}) };
  const goalProgress = computeGoalProgress(goalScopedVendas, goalScopedTotal);
  const goalOwnerDisplayName = isAllAdminsGoalView
    ? "Todos administradores"
    : (selectedGoalOwner?.nome || currentUser?.nome || "");
  const goalTargetsReadOnly = isAllAdminsGoalView;
  const goalOwnerOptions = canReviewAdminGoals
    ? [
        { id: GOAL_OWNER_ALL_ADMINS, label: "Todos administradores (consolidado)" },
        ...adminGoalUsers.map((user) => ({
          id: user.id,
          label: String(user.nome || user.username || "Administrador").toUpperCase(),
        })),
      ]
    : [];
  const [goalYear, goalMonth] = currentCycleMonth.split("-").map(Number);
  const daysInGoalMonth = Number.isFinite(goalYear) && Number.isFinite(goalMonth)
    ? new Date(goalYear, goalMonth, 0).getDate()
    : 30;
  const isCurrentMonthCycle = currentCycleMonth === getTodayMonth();
  const elapsedDays = isCurrentMonthCycle ? Math.max(1, Math.min(daysInGoalMonth, Number(cycleDate.slice(8, 10)) || 1)) : daysInGoalMonth;
  const projectedGoalProgress = GOAL_FIELDS.reduce((acc, field) => {
    const done = Number(goalProgress[field.key]) || 0;
    const projected = elapsedDays > 0 ? (done / elapsedDays) * daysInGoalMonth : done;
    acc[field.key] = field.type === "currency" ? projected : Math.round(projected);
    return acc;
  }, {});
  const goalItems = GOAL_FIELDS.map((field) => {
    const target = Number(currentGoalTargets[field.key]) || 0;
    const done = Number(goalProgress[field.key]) || 0;
    return {
      ...field,
      target,
      done,
      remaining: target - done,
    };
  });

  const queueGoalTargetSync = useCallback((payload) => {
    const timerKey = `${payload.userId}|${payload.month}|${payload.key}`;
    const existingTimer = goalSaveTimersRef.current[timerKey];
    if (existingTimer) clearTimeout(existingTimer);

    goalSaveTimersRef.current[timerKey] = setTimeout(async () => {
      try {
        await upsertGoalTarget(payload);
        goalSyncWarningShownRef.current = false;
      } catch {
        if (!goalSyncWarningShownRef.current) {
          pushToast("Não foi possível sincronizar metas com o Supabase. As alterações seguem salvas localmente.", "warning");
          goalSyncWarningShownRef.current = true;
        }
      } finally {
        delete goalSaveTimersRef.current[timerKey];
      }
    }, 450);
  }, [pushToast]);

  const handleGoalTargetChange = useCallback((goalKey, nextValue) => {
    if (!selectedGoalOwnerId) return;
    const goalType = GOAL_FIELDS.find((field) => field.key === goalKey)?.type || "count";
    const rawValue = String(nextValue ?? "").trim();
    if (rawValue === "") {
      setGoalsByMonth((current) => {
        const currentUserMonthMap = current[selectedGoalOwnerId] || {};
        const monthGoals = { ...DEFAULT_GOAL_VALUES, ...(currentUserMonthMap[currentCycleMonth] || {}) };
        return {
          ...current,
          [selectedGoalOwnerId]: {
            ...currentUserMonthMap,
            [currentCycleMonth]: {
              ...monthGoals,
              [goalKey]: "",
            },
          },
        };
      });
      queueGoalTargetSync({
        userId: selectedGoalOwnerId,
        month: currentCycleMonth,
        key: goalKey,
        value: null,
      });
      return;
    }
    const normalized = Number(String(nextValue || "").replace(",", "."));
    const numericValue = Number.isFinite(normalized) ? Math.max(0, normalized) : 0;
    const safeValue = goalType === "currency" ? numericValue : Math.round(numericValue);
    setGoalsByMonth((current) => {
      const currentUserMonthMap = current[selectedGoalOwnerId] || {};
      const monthGoals = { ...DEFAULT_GOAL_VALUES, ...(currentUserMonthMap[currentCycleMonth] || {}) };
      return {
        ...current,
        [selectedGoalOwnerId]: {
          ...currentUserMonthMap,
          [currentCycleMonth]: {
            ...monthGoals,
            [goalKey]: safeValue,
          },
            },
        };
      });
    queueGoalTargetSync({
      userId: selectedGoalOwnerId,
      month: currentCycleMonth,
      key: goalKey,
      value: safeValue,
    });
  }, [currentCycleMonth, queueGoalTargetSync, selectedGoalOwnerId]);

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
    const vendaRevenue = getVendaRevenue(venda);

    if (PLANOS.includes(venda.plano)) {
      byMonth[month][venda.plano] += vendaRevenue;
    } else {
      byMonth[month].Outros = (byMonth[month].Outros || 0) + vendaRevenue;
      hasOtherPlanoInMonth = true;
    }
    byMonth[month].total += vendaRevenue;
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
    if (venda.status === "Ativa") byPlano[venda.plano] = (byPlano[venda.plano] || 0) + getVendaRevenue(venda);
  });
  const planoData = Object.entries(byPlano).map(([name, value]) => ({ name, value }));

  const reportScopedVendas = scopedVendas;

  const dailyReportVendas = reportScopedVendas
    .map((venda) => ({ ...venda, dataCompetencia: getVendaCompetenceDate(venda), receita: getVendaRevenue(venda) }))
    .filter((venda) => !dailyReportDate || venda.dataCompetencia === dailyReportDate)
    .sort((a, b) => a.dataCompetencia.localeCompare(b.dataCompetencia) || a.cliente.localeCompare(b.cliente));
  const dailyReportTotal = dailyReportVendas.filter((venda) => venda.status === "Ativa").reduce((sum, venda) => sum + venda.receita, 0);
  const monthlyReportVendas = reportScopedVendas
    .filter((venda) => !monthlyReportMonth || getVendaCompetenceMonth(venda) === monthlyReportMonth)
    .map((venda) => ({ ...venda, receita: getVendaRevenue(venda) }))
    .sort((a, b) => a.data.localeCompare(b.data) || a.cliente.localeCompare(b.cliente));
  const monthlyReportTotal = monthlyReportVendas.filter((venda) => venda.status === "Ativa").reduce((sum, venda) => sum + venda.receita, 0);

  const reportSellerName = currentUser?.role === "seller" ? String(currentUser.nome || "").toUpperCase() : "Todos vendedores";

  const managedUsers = users.filter((user) => {
    if (canManageAdmins) return true;
    return user.role === "seller";
  });

  const sellerSummaries = managedUsers
    .map((managedUser) => {
      const sellerVendas = cycleScopedVendas.filter((venda) => venda.vendedorId === managedUser.id || venda.vendedor === managedUser.nome);
      const activeRevenue = sellerVendas.filter((venda) => venda.status === "Ativa").reduce((sum, venda) => sum + getVendaRevenue(venda), 0);

      return {
        ...managedUser,
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
        broadcastVendaSync();
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
          const valorNumerico = parseNumericValue(payload?.valor);
          if (!payload?.plano || !payload?.tipoPlano || valorNumerico <= 0) return;
          additionalSales.push({
            ...payload,
            valor: valorNumerico,
          });
        };
        const num = parseNumericValue;

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
        broadcastVendaSync();

        pushToast("Venda registrada com sucesso.", "success");
        const shouldExportComanda = window.confirm("Venda registrada com sucesso. Deseja gerar a planilha de comanda desta venda?");
        if (shouldExportComanda) {
          handleDownloadComanda(createdVenda);
          pushToast("Comanda gerada para download.", "success");
        }
      }
      setModal(null);
    },
    [handleDownloadComanda, modal, vendas, currentUser, pushToast, broadcastVendaSync]
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
      const removedUser = users.find((item) => item.id === sellerDeleteId);
      await deleteSeller(sellerDeleteId);
      setUsers((current) => current.filter((item) => item.id !== sellerDeleteId));
      setSellerDeleteId(null);
      pushToast(removedUser?.role === "admin" ? "Administrador excluído com sucesso." : "Vendedor excluído com sucesso.", "success");
    } catch (err) {
      pushToast(err.message || "Erro ao excluir usuário.", "error");
    }
  }, [sellerDeleteId, pushToast, users]);

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
    const [loadedUsers, loadedVendas, loadedGoals] = await Promise.all([listUsers(), listVendas(), loadGoalsWithFallback()]);
    setCurrentUser(user);
    setUsers(loadedUsers);
    setVendas(loadedVendas.map(normalizeLegacyVenda));
    setGoalsByMonth(loadedGoals || {});
  }

  async function handleRegister(user) {
    const created = await createSeller(user);
    setUsers((current) => [...current, created]);
    setModal(null);
  }

  async function handleUserNameUpdate(nextName) {
    if (!userEditId) return;
    const updatedUser = await apiUpdateUserName(userEditId, nextName);
    setUsers((current) => current.map((item) => (item.id === updatedUser.id ? { ...item, ...updatedUser } : item)));
    setCurrentUser((current) => (current?.id === updatedUser.id ? { ...current, ...updatedUser } : current));
    setVendas((current) =>
      current.map((item) => {
        if (item.vendedorId !== updatedUser.id) return item;
        return {
          ...item,
          vendedor: updatedUser.nome,
        };
      })
    );
    setUserEditId(null);
    pushToast("Nome atualizado com sucesso.", "success");
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
    Object.values(goalSaveTimersRef.current).forEach((timerId) => clearTimeout(timerId));
    goalSaveTimersRef.current = {};
    goalSyncWarningShownRef.current = false;
    setCurrentUser(null);
    setUsers([]);
    setVendas([]);
    setGoalsByMonth({});
    setModal(null);
    setViewItem(null);
    setDeleteId(null);
    setSellerDeleteId(null);
    setUserEditId(null);
    setGoalOwnerId("");
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
        venda.receita,
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
        venda.receita,
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
      <div className="app-atmosphere" style={{ minHeight: "100vh", background: "#0B0B0C", color: "#FFFFFF", fontFamily: "'DM Sans',sans-serif" }}>
        <style>{APP_STYLES}</style>
        <div className="app-shell" style={{ paddingBottom: 46 }}>
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

  const sellerToDelete = users.find((seller) => seller.id === sellerDeleteId) || null;
  const userToEdit = users.find((item) => item.id === userEditId) || null;

  return (
    <>
      <style>{APP_STYLES}</style>

      <div className="app-atmosphere" style={{ minHeight: "100vh", background: "#0B0B0C", fontFamily: "'DM Sans',sans-serif", color: "#FFFFFF" }}>
        <AppHeader
          currentUser={currentUser}
          tab={tab}
          onTabChange={setTab}
          onOpenSellerModal={() => setModal("seller")}
          onOpenPasswordModal={() => setModal("password")}
          onLogout={handleLogout}
          canManageUsers={canManageUsers}
          manageButtonLabel={canManageAdmins ? "+ Usuário" : "+ Vendedor"}
        />

        <div className="app-shell">
          <div className="app-content">
          {tab === "vendas" && (
            <div className="kpi-grid">
              <div className="kpi-featured">
                <StatCard label="Receita Total" value={fmtBRL(totalVal)} color="#DA291C" featured />
              </div>
              <div className="kpi-row">
                <StatCard icon="📲" label="Ticket Celular (5%)" value={fmtBRL(ticketCelular)} sub={`${ticketCelularVendas.length} vendas`} color="#DA291C" />
                <StatCard icon="🎧" label="Ticket Acessórios (15%)" value={fmtBRL(ticketAcessorios)} sub={`${ticketAcessoriosVendas.length} vendas`} color="#DA291C" />
                <StatCard icon="📊" label="Controle + Pós + TV + Internet" value={fmtBRL(ticketPlanosPrincipaisTotal)} sub={`${ticketPlanosPrincipaisVendas.length} vendas`} color="#DA291C" />
                <StatCard icon="📱" label="Planos Móveis" value={cycleScopedVendas.filter((venda) => ["Plano Controle", "Plano Pós-Pago"].includes(venda.plano)).length} color="#DA291C" />
                <StatCard icon="🌐" label="Internet + TV" value={cycleScopedVendas.filter((venda) => ["Internet Residencial", "Internet Movel Mais", "TV"].includes(venda.plano) && venda.status === "Ativa").length} color="#DA291C" />
              </div>
            </div>
          )}

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

          {tab === "metas" && (
            <GoalsTab
              goalItems={goalItems}
              onGoalTargetChange={handleGoalTargetChange}
              projectedGoalProgress={projectedGoalProgress}
              elapsedDays={elapsedDays}
              ownerName={goalOwnerDisplayName}
              ownerOptions={goalOwnerOptions}
              selectedOwnerId={goalOwnerId}
              onOwnerChange={setGoalOwnerId}
              readOnly={goalTargetsReadOnly}
            />
          )}

          {tab === "vendedores" && currentUser.role !== "seller" && (
            <SellersTab
              userSummaries={sellerSummaries}
              currentCycleMonth={currentCycleMonth}
              onOpenSellerModal={() => setModal("seller")}
              onDeleteSeller={setSellerDeleteId}
              onEditUser={setUserEditId}
              canManageAdmins={canManageAdmins}
            />
          )}
          </div>
          <footer
            style={{
              textAlign: "center",
              color: "#A1A1AA",
              fontSize: 12,
              padding: "12px 8px 10px",
              background: "#0B0B0C",
              borderTop: "1px solid #2A2A2E",
            }}
          >
            <div style={{ display: "grid", gap: 4, justifyItems: "center" }}>
              <Logo size={24} opacity={0.7} className="h-6 opacity-70 mx-auto" alt="Claro" />
              <div>© 2026 Painel de Vendas • Desenvolvido por GILSON ELIAS • Produto idealizado por CAIO CARDOSO</div>
            </div>
          </footer>
        </div>
      </div>

      <ToastStack items={toasts} onDismiss={dismissToast} />

      {(modal === "new" || modal?.edit) && (
        <Modal title={modal?.edit ? "Editar Lançamento" : "Novo Lançamento"} onClose={() => setModal(null)} wide>
          <VendaForm initial={modal?.edit} onSave={saveVenda} onClose={() => setModal(null)} currentUser={currentUser} sellers={sellers} onFeedback={pushToast} />
        </Modal>
      )}

      {modal === "seller" && currentUser.role !== "seller" && (
        <Modal title={canManageAdmins ? "Cadastrar Usuário" : "Cadastrar Vendedor"} onClose={() => setModal(null)}>
          <SellerForm users={users} onSave={handleRegister} onClose={() => setModal(null)} canManageAdmins={canManageAdmins} />
        </Modal>
      )}

      {modal === "password" && (
        <Modal title="Alterar Senha" onClose={() => setModal(null)}>
          <PasswordForm onSave={handlePasswordChange} onClose={() => setModal(null)} />
        </Modal>
      )}

      {userEditId && currentUser.role !== "seller" && userToEdit && (
        <Modal title="Editar Nome do Usuário" onClose={() => setUserEditId(null)}>
          <UserNameForm user={userToEdit} onSave={handleUserNameUpdate} onClose={() => setUserEditId(null)} />
        </Modal>
      )}

      {sellerDeleteId && currentUser.role !== "seller" && (
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
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#FFFFFF", marginBottom: 8 }}>Excluir usuário?</div>
            <div style={{ color: "#A1A1AA", fontSize: 14, marginBottom: 10 }}>
              {sellerToDelete?.nome ? `${sellerToDelete.nome} perderá o acesso ao sistema.` : "Este usuário perderá o acesso ao sistema."}
            </div>
            <div style={{ color: "#A1A1AA", fontSize: 13, marginBottom: 24 }}>As vendas já registradas serão mantidas no histórico.</div>
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
                background: `${PLANO_COLORS[viewItem.plano] || "#DA291C"}15`,
                border: `1px solid ${PLANO_COLORS[viewItem.plano] || "#DA291C"}40`,
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
                  background: `${PLANO_COLORS[viewItem.plano] || "#DA291C"}25`,
                  border: `1px solid ${PLANO_COLORS[viewItem.plano] || "#DA291C"}66`,
                  boxShadow: `0 10px 18px ${(PLANO_COLORS[viewItem.plano] || "#DA291C")}33`,
                }}
              >
                {PLANO_ICONS[viewItem.plano]}
              </span>
              <div>
                <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#FFFFFF", fontWeight: 700 }}>{PLANO_LABELS[viewItem.plano] || viewItem.plano}</div>
                <div style={{ color: "#A1A1AA", fontSize: 13 }}>{viewItem.descricao || "Sem descrição"}</div>
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
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2A2A2E", fontSize: 14 }}>
                <span style={{ color: "#A1A1AA", fontWeight: 600 }}>{label}</span>
                <span style={{ color: "#FFFFFF" }}>{value}</span>
              </div>
            ))}

            {Array.isArray(viewItem.historico) && viewItem.historico.length > 0 && (
              <div style={{ marginTop: 8, borderTop: "1px solid #2A2A2E", paddingTop: 10 }}>
                <div style={{ color: "#A1A1AA", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Histórico</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {viewItem.historico.slice().reverse().slice(0, 8).map((event, index) => (
                    <div key={`${event.at || "evt"}-${index}`} style={{ fontSize: 12, color: "#FFFFFF" }}>
                      {fmtDate(event.at || "")} · {event.action || "alteração"} · {event.userName || "sistema"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                style={{ ...btnSecondary, borderColor: "#EF4444", color: "#FFFFFF" }}
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
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#FFFFFF", marginBottom: 8 }}>Excluir lançamento?</div>
            <div style={{ color: "#A1A1AA", fontSize: 14, marginBottom: 24 }}>Esta ação não pode ser desfeita.</div>
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
