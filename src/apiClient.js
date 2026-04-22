import { createSupabaseClient, isSupabaseConfigured, supabaseConfigError } from "./lib/supabase";
import { normalizeLegacyVenda } from "./utils/sales";

const SESSION_KEY = "telefonia_supabase_session_v2";

function ensureSupabase(includeSessionToken = true) {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError);
  }

  const session = includeSessionToken ? getStoredSession() : null;
  const client = createSupabaseClient(session?.token || null);
  if (!client) throw new Error(supabaseConfigError);
  return client;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function getStoredSession() {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!raw || typeof raw !== "object") return null;
    if (!raw.token || !raw.user?.id) return null;
    return raw;
  } catch {
    return null;
  }
}

function setStoredSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    username: row.username,
    role: row.role,
    createdAt: row.created_at || row.createdAt || nowIso(),
  };
}

async function requireCurrentUser() {
  const session = getStoredSession();
  if (!session?.token) {
    throw new Error("Sessao nao encontrada.");
  }

  const client = ensureSupabase(true);
  const { data, error } = await client.rpc("app_get_session");
  if (error || !data?.user) {
    setStoredSession(null);
    throw new Error(error?.message || "Usuario da sessao nao encontrado.");
  }

  const user = mapUser(data.user);
  setStoredSession({
    token: session.token,
    expiresAt: data.expiresAt || session.expiresAt || null,
    user,
  });
  return user;
}

async function ensureAdmin() {
  const user = await requireCurrentUser();
  if (user.role !== "admin") {
    throw new Error("Acesso restrito ao administrador.");
  }
  return user;
}

export async function login(username, senha) {
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const client = ensureSupabase(false);

  const { data, error } = await client.rpc("app_login", {
    p_username: normalizedUsername,
    p_senha: String(senha || ""),
  });

  if (error || !data?.token || !data?.user) {
    throw new Error(error?.message || "Usuario ou senha invalidos.");
  }

  const user = mapUser(data.user);
  setStoredSession({
    token: data.token,
    expiresAt: data.expiresAt || null,
    user,
  });
  return user;
}

export async function logout() {
  try {
    const session = getStoredSession();
    if (session?.token) {
      const client = ensureSupabase(true);
      await client.rpc("app_logout");
    }
  } catch {
    // noop
  } finally {
    setStoredSession(null);
  }
}

export async function getSession() {
  return requireCurrentUser();
}

export async function listUsers() {
  const client = ensureSupabase(true);
  const { data, error } = await client.rpc("app_list_users");
  if (error) throw new Error(error.message || "Erro ao carregar usuarios.");
  return (data || []).map(mapUser);
}

export async function createSeller(payload) {
  await ensureAdmin();
  const client = ensureSupabase(true);

  const nome = String(payload?.nome || "").trim().toUpperCase();
  const username = String(payload?.username || "").trim().toLowerCase();
  const senha = String(payload?.senha || "");

  if (!nome || !username || !senha) {
    throw new Error("Preencha nome, usuario e senha.");
  }

  if (senha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const { data, error } = await client.rpc("app_create_seller", {
    p_nome: nome,
    p_username: username,
    p_senha: senha,
  });

  if (error) throw new Error(error.message || "Erro ao cadastrar vendedor.");
  return mapUser(data);
}

export async function deleteSeller(id) {
  await ensureAdmin();
  const client = ensureSupabase(true);
  const { error } = await client.rpc("app_delete_seller", { p_id: id });
  if (error) throw new Error(error.message || "Erro ao excluir vendedor.");
}

export async function listVendas() {
  await requireCurrentUser();
  const client = ensureSupabase(true);
  const { data, error } = await client.from("vendas").select("payload, created_at").order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Erro ao carregar vendas.");
  return (data || []).map((row) => normalizeLegacyVenda(row.payload));
}

export async function createVenda(payload) {
  const user = await requireCurrentUser();
  const client = ensureSupabase(true);
  const venda = normalizeLegacyVenda({
    ...payload,
    id: genId(),
    vendedorId: user.role === "seller" ? user.id : payload.vendedorId,
    vendedor: user.role === "seller" ? user.nome : payload.vendedor,
  });

  const record = {
    id: venda.id,
    vendedor_id: venda.vendedorId || null,
    vendedor: venda.vendedor || null,
    payload: venda,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  const { error } = await client.from("vendas").insert(record);
  if (error) throw new Error(error.message || "Erro ao salvar venda.");
  return venda;
}

export async function updateVenda(id, payload) {
  const user = await requireCurrentUser();
  const client = ensureSupabase(true);
  const { data: currentRow, error: fetchError } = await client.from("vendas").select("payload").eq("id", id).maybeSingle();
  if (fetchError) throw new Error(fetchError.message || "Erro ao carregar venda.");
  if (!currentRow?.payload) throw new Error("Venda nao encontrada.");

  const current = normalizeLegacyVenda(currentRow.payload);
  if (user.role !== "admin" && current.vendedorId !== user.id) {
    throw new Error("Sem permissao para editar esta venda.");
  }

  const updated = normalizeLegacyVenda({
    ...current,
    ...payload,
    id,
    vendedorId: user.role === "seller" ? user.id : payload.vendedorId,
    vendedor: user.role === "seller" ? user.nome : payload.vendedor,
  });

  const { error } = await client
    .from("vendas")
    .update({
      vendedor_id: updated.vendedorId || null,
      vendedor: updated.vendedor || null,
      payload: updated,
      updated_at: nowIso(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message || "Erro ao atualizar venda.");
  return updated;
}

export async function deleteVenda(id) {
  const user = await requireCurrentUser();
  const client = ensureSupabase(true);
  const { data: currentRow, error: fetchError } = await client.from("vendas").select("payload").eq("id", id).maybeSingle();
  if (fetchError) throw new Error(fetchError.message || "Erro ao carregar venda.");
  if (!currentRow?.payload) throw new Error("Venda nao encontrada.");

  const current = normalizeLegacyVenda(currentRow.payload);
  if (user.role !== "admin" && current.vendedorId !== user.id) {
    throw new Error("Sem permissao para excluir esta venda.");
  }

  const { error } = await client.from("vendas").delete().eq("id", id);
  if (error) throw new Error(error.message || "Erro ao excluir venda.");
}

export async function migrateLegacyData(payload) {
  await ensureAdmin();
  const client = ensureSupabase(true);

  const users = Array.isArray(payload?.users) ? payload.users : [];
  const vendas = Array.isArray(payload?.vendas) ? payload.vendas : [];

  if (users.length) {
    const { data: existingUsers, error: usersError } = await client.rpc("app_list_users");
    if (usersError) throw new Error(usersError.message || "Erro ao migrar usuarios.");
    const usernames = new Set((existingUsers || []).map((item) => String(item.username || "").toLowerCase()));

    for (const user of users) {
      const username = String(user.username || "").trim().toLowerCase();
      if (!username || usernames.has(username) || user.role !== "seller") continue;

      const { error } = await client.rpc("app_create_seller", {
        p_nome: String(user.nome || username).toUpperCase(),
        p_username: username,
        p_senha: String(user.senha || "123456"),
      });

      if (!error) usernames.add(username);
    }
  }

  if (vendas.length) {
    const { data: existingVendas, error: vendasError } = await client.from("vendas").select("id");
    if (vendasError) throw new Error(vendasError.message || "Erro ao migrar vendas.");
    const ids = new Set((existingVendas || []).map((item) => item.id));

    const newVendas = vendas
      .map(normalizeLegacyVenda)
      .filter((venda) => venda?.id && !ids.has(venda.id))
      .map((venda) => ({
        id: venda.id,
        vendedor_id: venda.vendedorId || null,
        vendedor: venda.vendedor || null,
        payload: venda,
        created_at: nowIso(),
        updated_at: nowIso(),
      }));

    if (newVendas.length) {
      const { error } = await client.from("vendas").insert(newVendas);
      if (error) throw new Error(error.message || "Erro ao migrar vendas.");
    }
  }
}

export async function changePassword(currentSenha, newSenha) {
  const client = ensureSupabase(true);
  const { error } = await client.rpc("app_change_password", {
    p_current_senha: String(currentSenha || ""),
    p_new_senha: String(newSenha || ""),
  });

  if (error) throw new Error(error.message || "Erro ao alterar senha.");
}

export function hasApiToken() {
  return Boolean(getStoredSession()?.token);
}

export function clearApiToken() {
  setStoredSession(null);
}
