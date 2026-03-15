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
import { Badge, Modal, StatCard, btnDanger, btnPrimary, btnSecondary } from "./components/ui";
import { PLANO_COLORS, PLANO_EXTRAS, PLANO_ICONS, PLANO_LABELS, STATUS_COLORS, STATUS_OPTIONS, STORAGE_KEYS, MONTH_NAMES } from "./constants/sales";
import { fmtBRL, fmtDate, loadUsers, loadVendas, normalizeLegacyVenda } from "./utils/sales";
import "./App.css";

const APP_STYLES = `
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
`;

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
  const [fMes, setFMes] = useState("");
  const [fDia, setFDia] = useState("");
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

  const filtered = scopedVendas
    .filter((venda) => {
      const haystack = `${venda.cliente} ${venda.plano} ${venda.descricao || ""} ${venda.vendedor || ""}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (fPlano !== "Todos" && venda.plano !== fPlano) return false;
      if (fStatus !== "Todos" && venda.status !== fStatus) return false;
      if (fMes && venda.data?.slice(0, 7) !== fMes) return false;
      if (fDia && venda.data !== fDia) return false;
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
      const activeRevenue = sellerVendas.filter((venda) => venda.status === "Ativa").reduce((sum, venda) => sum + venda.valor, 0);

      return {
        ...seller,
        vendas: sellerVendas.length,
        ativas: sellerVendas.filter((venda) => venda.status === "Ativa").length,
        pendentes: sellerVendas.filter((venda) => venda.status === "Pendente").length,
        receita: activeRevenue,
      };
    })
    .sort((a, b) => b.vendas - a.vendas || a.nome.localeCompare(b.nome));

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

  function clearFilters() {
    setSearch("");
    setFPlano("Todos");
    setFStatus("Todos");
    setFVendedor("Todos");
    setFMes("");
    setFDia("");
    setPage(1);
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

        <div className="app-shell" style={{ padding: "28px 32px", maxWidth: 1320, margin: "0 auto" }}>
          <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
            <StatCard icon="💰" label="Receita Ativa" value={fmtBRL(totalVal)} sub={`${ativas.length} vendas ativas`} color="#6366f1" />
            <StatCard icon="🎯" label="Ticket Medio" value={fmtBRL(ticket)} color="#8b5cf6" />
            <StatCard icon="📦" label="Total Lancamentos" value={scopedVendas.length} sub={`${pendentes} pendentes`} color="#06b6d4" />
            <StatCard icon="📱" label="Planos Moveis" value={scopedVendas.filter((venda) => ["Plano Controle", "Plano Pós-Pago"].includes(venda.plano) && venda.status === "Ativa").length} color="#10b981" />
            <StatCard icon="🌐" label="Internet + TV" value={scopedVendas.filter((venda) => ["Internet Residencial", "TV"].includes(venda.plano) && venda.status === "Ativa").length} color="#f59e0b" />
          </div>

          {tab === "vendas" && (
            <VendasTab
              currentUser={currentUser}
              sellers={sellers}
              search={search}
              setSearch={setSearch}
              fPlano={fPlano}
              setFPlano={setFPlano}
              fStatus={fStatus}
              setFStatus={setFStatus}
              fVendedor={fVendedor}
              setFVendedor={setFVendedor}
              fMes={fMes}
              setFMes={setFMes}
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
            />
          )}

          {tab === "relatorios" && <ReportsTab currentUser={currentUser} scopedVendas={scopedVendas} monthData={monthData} planoData={planoData} byStatus={byStatus} />}

          {tab === "vendedores" && currentUser.role === "admin" && (
            <SellersTab sellerSummaries={sellerSummaries} onOpenSellerModal={() => setModal("seller")} onDeleteSeller={setSellerDeleteId} />
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
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>As vendas ja registradas serao mantidas no historico.</div>
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
                <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 20, color: "#f1f5f9", fontWeight: 700 }}>{PLANO_LABELS[viewItem.plano] || viewItem.plano}</div>
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
