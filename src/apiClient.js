import { supabase } from "./lib/supabase";
import { normalizeLegacyVenda } from "./utils/sales";

const SESSION_KEY = "telefonia_supabase_session_v1";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
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

async function hashPassword(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchUserByUsername(username) {
  const { data, error } = await supabase.from("users").select("*").eq("username", username.toLowerCase()).maybeSingle();
  if (error) throw new Error(error.message || "Erro ao buscar usuario.");
  return data;
}

async function requireCurrentUser() {
  const session = getStoredSession();
  if (!session?.user?.id) {
    throw new Error("Sessao nao encontrada.");
  }

  const { data, error } = await supabase.from("users").select("*").eq("id", session.user.id).maybeSingle();
  if (error) throw new Error(error.message || "Erro ao carregar sessao.");
  if (!data) {
    setStoredSession(null);
    throw new Error("Usuario da sessao nao encontrado.");
  }

  const user = mapUser(data);
  setStoredSession({ user });
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
  const user = await fetchUserByUsername(normalizedUsername);

  if (!user) {
    throw new Error("Usuario ou senha invalidos.");
  }

  const hashed = await hashPassword(String(senha || ""));
  if (hashed !== user.password_hash) {
    throw new Error("Usuario ou senha invalidos.");
  }

  const mapped = mapUser(user);
  setStoredSession({ user: mapped });
  return mapped;
}

export async function logout() {
  setStoredSession(null);
}

export async function getSession() {
  const session = getStoredSession();
  if (!session?.user) {
    throw new Error("Sessao nao encontrada.");
  }

  return requireCurrentUser();
}

export async function listUsers() {
  const user = await requireCurrentUser();
  if (user.role === "admin") {
    const { data, error } = await supabase.from("users").select("id, nome, username, role, created_at").order("role", { ascending: false }).order("nome", { ascending: true });
    if (error) throw new Error(error.message || "Erro ao carregar usuarios.");
    return (data || []).map(mapUser);
  }

  return [user];
}

export async function createSeller(payload) {
  await ensureAdmin();

  const nome = String(payload?.nome || "").trim();
  const username = String(payload?.username || "").trim().toLowerCase();
  const senha = String(payload?.senha || "");

  if (!nome || !username || !senha) {
    throw new Error("Preencha nome, usuario e senha.");
  }

  if (senha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const existing = await fetchUserByUsername(username);
  if (existing) {
    throw new Error("Ja existe um usuario com esse login.");
  }

  const record = {
    id: genId(),
    nome,
    username,
    password_hash: await hashPassword(senha),
    role: "seller",
    created_at: nowIso(),
  };

  const { data, error } = await supabase.from("users").insert(record).select("id, nome, username, role, created_at").single();
  if (error) throw new Error(error.message || "Erro ao cadastrar vendedor.");
  return mapUser(data);
}

export async function deleteSeller(id) {
  await ensureAdmin();

  const { data: user, error: fetchError } = await supabase.from("users").select("id, role").eq("id", id).maybeSingle();
  if (fetchError) throw new Error(fetchError.message || "Erro ao carregar vendedor.");
  if (!user) throw new Error("Vendedor nao encontrado.");
  if (user.role === "admin") throw new Error("Nao e permitido excluir o administrador.");

  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message || "Erro ao excluir vendedor.");
}

export async function listVendas() {
  const user = await requireCurrentUser();
  let query = supabase.from("vendas").select("payload, created_at").order("created_at", { ascending: false });

  if (user.role !== "admin") {
    query = query.or(`vendedor_id.eq.${user.id},vendedor.eq.${user.nome}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message || "Erro ao carregar vendas.");
  return (data || []).map((row) => normalizeLegacyVenda(row.payload));
}

export async function createVenda(payload) {
  const user = await requireCurrentUser();
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

  const { error } = await supabase.from("vendas").insert(record);
  if (error) throw new Error(error.message || "Erro ao salvar venda.");
  return venda;
}

export async function updateVenda(id, payload) {
  const user = await requireCurrentUser();
  const { data: currentRow, error: fetchError } = await supabase.from("vendas").select("payload").eq("id", id).maybeSingle();
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

  const { error } = await supabase
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
  const { data: currentRow, error: fetchError } = await supabase.from("vendas").select("payload").eq("id", id).maybeSingle();
  if (fetchError) throw new Error(fetchError.message || "Erro ao carregar venda.");
  if (!currentRow?.payload) throw new Error("Venda nao encontrada.");

  const current = normalizeLegacyVenda(currentRow.payload);
  if (user.role !== "admin" && current.vendedorId !== user.id) {
    throw new Error("Sem permissao para excluir esta venda.");
  }

  const { error } = await supabase.from("vendas").delete().eq("id", id);
  if (error) throw new Error(error.message || "Erro ao excluir venda.");
}

export async function migrateLegacyData(payload) {
  await ensureAdmin();

  const users = Array.isArray(payload?.users) ? payload.users : [];
  const vendas = Array.isArray(payload?.vendas) ? payload.vendas : [];

  if (users.length) {
    const { data: existingUsers, error: usersError } = await supabase.from("users").select("username");
    if (usersError) throw new Error(usersError.message || "Erro ao migrar usuarios.");
    const usernames = new Set((existingUsers || []).map((item) => item.username));

    const newUsers = [];
    for (const user of users) {
      const username = String(user.username || "").trim().toLowerCase();
      if (!username || usernames.has(username) || user.role !== "seller") continue;
      newUsers.push({
        id: user.id || genId(),
        nome: user.nome || username,
        username,
        password_hash: await hashPassword(String(user.senha || "123456")),
        role: "seller",
        created_at: user.createdAt || nowIso(),
      });
    }

    if (newUsers.length) {
      const { error } = await supabase.from("users").insert(newUsers);
      if (error) throw new Error(error.message || "Erro ao migrar usuarios.");
    }
  }

  if (vendas.length) {
    const { data: existingVendas, error: vendasError } = await supabase.from("vendas").select("id");
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
      const { error } = await supabase.from("vendas").insert(newVendas);
      if (error) throw new Error(error.message || "Erro ao migrar vendas.");
    }
  }
}

export async function changePassword(currentSenha, newSenha) {
  const user = await requireCurrentUser();
  const { data, error } = await supabase.from("users").select("password_hash").eq("id", user.id).maybeSingle();
  if (error) throw new Error(error.message || "Erro ao carregar usuario.");
  if (!data) throw new Error("Usuario nao encontrado.");

  const currentHash = await hashPassword(String(currentSenha || ""));
  if (currentHash !== data.password_hash) {
    throw new Error("Senha atual incorreta.");
  }

  if (!newSenha || newSenha.length < 6) {
    throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  }

  const { error: updateError } = await supabase.from("users").update({ password_hash: await hashPassword(newSenha) }).eq("id", user.id);
  if (updateError) throw new Error(updateError.message || "Erro ao alterar senha.");
}

export function hasApiToken() {
  return Boolean(getStoredSession()?.user);
}

export function clearApiToken() {
  setStoredSession(null);
}
