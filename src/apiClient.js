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
  const normalizedRole = String(row.role || "").trim().toLowerCase();
  return {
    id: row.id,
    nome: row.nome,
    username: row.username,
    role: normalizedRole,
    createdAt: row.created_at || row.createdAt || nowIso(),
  };
}

function sortUsersByRole(users = []) {
  const roleWeight = {
    superadmin: 0,
    admin: 1,
    seller: 2,
  };

  return [...users].sort((a, b) => {
    const leftWeight = roleWeight[String(a?.role || "").trim().toLowerCase()] ?? 9;
    const rightWeight = roleWeight[String(b?.role || "").trim().toLowerCase()] ?? 9;
    if (leftWeight !== rightWeight) return leftWeight - rightWeight;
    return String(a?.nome || "").localeCompare(String(b?.nome || ""));
  });
}

function isMissingRpcFunction(error, functionName) {
  const message = String(error?.message || "");
  return (
    message.includes(`Could not find the function public.${functionName}`) ||
    message.includes(`function public.${functionName}`)
  );
}

function mapGoalsRows(rows) {
  const result = {};
  (rows || []).forEach((row) => {
    const userId = String(row?.user_id || "").trim();
    const month = String(row?.cycle_month || "").trim();
    const key = String(row?.goal_key || "").trim();
    if (!userId || !month || !key) return;

    if (!result[userId]) result[userId] = {};
    if (!result[userId][month]) result[userId][month] = {};

    const numericValue = Number(row?.goal_value);
    result[userId][month][key] = Number.isFinite(numericValue) ? numericValue : "";
  });
  return result;
}

async function rpcUserCreateWithFallback(client, functionName, nome, username, senha) {
  const attempts = [
    { p_nome: nome, p_senha: senha, p_username: username },
    { nome, senha, username },
  ];

  let lastError = null;
  for (const params of attempts) {
    const result = await client.rpc(functionName, params);
    if (!result.error) return result;
    lastError = result.error;

    if (!isMissingRpcFunction(result.error, functionName)) {
      return result;
    }
  }

  return { data: null, error: lastError };
}

async function rpcUserNameUpdateWithFallback(client, userId, nome) {
  const attempts = [
    { p_id: userId, p_nome: nome },
    { id: userId, nome },
  ];

  let lastError = null;
  for (const params of attempts) {
    const result = await client.rpc("app_update_user_nome", params);
    if (!result.error) return result;
    lastError = result.error;

    if (!isMissingRpcFunction(result.error, "app_update_user_nome")) {
      return result;
    }
  }

  return { data: null, error: lastError };
}

async function rpcGoalUpsertWithFallback(client, payload) {
  const attempts = [
    {
      p_user_id: payload.userId,
      p_cycle_month: payload.month,
      p_goal_key: payload.key,
      p_goal_value: payload.value,
    },
    {
      user_id: payload.userId,
      cycle_month: payload.month,
      goal_key: payload.key,
      goal_value: payload.value,
    },
  ];

  let lastError = null;
  for (const params of attempts) {
    const result = await client.rpc("app_upsert_goal", params);
    if (!result.error) return result;
    lastError = result.error;

    if (!isMissingRpcFunction(result.error, "app_upsert_goal")) {
      return result;
    }
  }

  return { data: null, error: lastError };
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
  if (!["admin", "superadmin"].includes(user.role)) {
    throw new Error("Acesso restrito ao administrador.");
  }
  return user;
}

export async function login(username, senha) {
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const client = ensureSupabase(false);

  const { data, error } = await client.rpc("app_login", {
    p_senha: String(senha || ""),
    p_username: normalizedUsername,
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
  await requireCurrentUser();
  const client = ensureSupabase(true);
  const { data, error } = await client.rpc("app_list_users");
  if (error && isMissingRpcFunction(error, "app_list_users")) {
    throw new Error(
      "A função RPC app_list_users não existe no projeto Supabase atual. Execute o SQL de schema (supabase/schema.sql) no mesmo projeto apontado por REACT_APP_SUPABASE_URL e recarregue o cache do PostgREST."
    );
  }

  if (error) throw new Error(error.message || "Erro ao carregar usuarios.");
  return sortUsersByRole((data || []).map(mapUser).filter(Boolean));
}

export async function listGoals() {
  await requireCurrentUser();
  const client = ensureSupabase(true);
  const { data, error } = await client.rpc("app_list_goals");

  if (error && isMissingRpcFunction(error, "app_list_goals")) {
    throw new Error(
      "A função RPC app_list_goals não existe no projeto Supabase atual. Execute o SQL de schema (supabase/schema.sql) no mesmo projeto apontado por REACT_APP_SUPABASE_URL e recarregue o cache do PostgREST."
    );
  }

  if (error) throw new Error(error.message || "Erro ao carregar metas.");
  return mapGoalsRows(data);
}

export async function createSeller(payload) {
  const user = await ensureAdmin();
  const client = ensureSupabase(true);

  const nome = String(payload?.nome || "").trim().toUpperCase();
  const username = String(payload?.username || "").trim().toLowerCase();
  const senha = String(payload?.senha || "");
  const role = payload?.role === "admin" ? "admin" : "seller";
  const adminIds = Array.from(
    new Set(
      (Array.isArray(payload?.adminIds) ? payload.adminIds : [payload?.adminId])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
  const primaryAdminId = adminIds[0] || "";

  if (!nome || !username || !senha) {
    throw new Error("Preencha nome, usuario e senha.");
  }

  if (senha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const isCreatingAdmin = role === "admin";
  if (isCreatingAdmin && user.role !== "superadmin") {
    throw new Error("Apenas superadmin pode criar administradores.");
  }

  if (isCreatingAdmin) {
    const { data, error } = await rpcUserCreateWithFallback(client, "app_create_admin", nome, username, senha);

    if (error && isMissingRpcFunction(error, "app_create_admin")) {
      throw new Error(
        "A função RPC app_create_admin não existe no projeto Supabase atual. Execute o SQL de schema (supabase/schema.sql) no mesmo projeto apontado por REACT_APP_SUPABASE_URL e recarregue o cache do PostgREST."
      );
    }

    if (error) throw new Error(error.message || "Erro ao cadastrar usuário.");
    return mapUser(data);
  }

  const creatingSellerAsSuperadmin = user.role === "superadmin";
  if (creatingSellerAsSuperadmin && !primaryAdminId) {
    throw new Error("Selecione pelo menos um administrador responsável pelo vendedor.");
  }

  const sellerAttempts = creatingSellerAsSuperadmin
    ? [
        { p_nome: nome, p_username: username, p_senha: senha, p_admin_ids: adminIds },
        { nome, username, senha, admin_ids: adminIds },
        { p_nome: nome, p_username: username, p_senha: senha, p_admin_id: primaryAdminId },
        { nome, username, senha, admin_id: primaryAdminId },
      ]
    : [
        { p_nome: nome, p_username: username, p_senha: senha },
        { nome, username, senha },
      ];

  let data = null;
  let error = null;
  let usedLegacyAdminParam = false;
  for (const params of sellerAttempts) {
    const result = await client.rpc("app_create_seller", params);
    if (!result.error) {
      data = result.data;
      error = null;
      usedLegacyAdminParam = Object.prototype.hasOwnProperty.call(params, "p_admin_id") || Object.prototype.hasOwnProperty.call(params, "admin_id");
      break;
    }

    error = result.error;
    if (!isMissingRpcFunction(result.error, "app_create_seller")) {
      break;
    }
  }

  if (error && isMissingRpcFunction(error, "app_create_seller")) {
    if (creatingSellerAsSuperadmin) {
      throw new Error(
        "A função RPC app_create_seller do projeto Supabase atual ainda não suporta vínculo de vendedor com administrador. Execute o SQL de schema (supabase/schema.sql), recarregue o cache do PostgREST e tente novamente."
      );
    }
    throw new Error(
      "A função RPC app_create_seller não existe no projeto Supabase atual. Execute o SQL de schema (supabase/schema.sql) no mesmo projeto apontado por REACT_APP_SUPABASE_URL e recarregue o cache do PostgREST."
    );
  }

  if (error) throw new Error(error.message || "Erro ao cadastrar usuário.");

  if (creatingSellerAsSuperadmin && adminIds.length > 1 && usedLegacyAdminParam && data?.id) {
    const linkAttempts = [
      { p_seller_id: data.id, p_admin_ids: adminIds },
      { seller_id: data.id, admin_ids: adminIds },
    ];

    let linkError = null;
    for (const params of linkAttempts) {
      const result = await client.rpc("app_set_seller_admins", params);
      if (!result.error) {
        linkError = null;
        break;
      }
      linkError = result.error;
      if (!isMissingRpcFunction(result.error, "app_set_seller_admins")) break;
    }

    if (linkError && isMissingRpcFunction(linkError, "app_set_seller_admins")) {
      throw new Error(
        "O projeto Supabase atual ainda não suporta múltiplos administradores por vendedor. Execute o schema atualizado (supabase/schema.sql), recarregue o cache do PostgREST e tente novamente."
      );
    }

    if (linkError) throw new Error(linkError.message || "Erro ao vincular vendedor aos administradores selecionados.");
  }

  return mapUser(data);
}

export async function updateUserName(id, nome) {
  const requester = await ensureAdmin();
  const client = ensureSupabase(true);
  const normalizedName = String(nome || "").trim().toUpperCase();

  if (!id || !normalizedName) {
    throw new Error("Informe um nome válido.");
  }

  const { data, error } = await rpcUserNameUpdateWithFallback(client, id, normalizedName);

  if (error && isMissingRpcFunction(error, "app_update_user_nome")) {
    throw new Error(
      "A função RPC app_update_user_nome não existe no projeto Supabase atual. Execute o SQL de schema (supabase/schema.sql) no mesmo projeto apontado por REACT_APP_SUPABASE_URL e recarregue o cache do PostgREST."
    );
  }

  if (error) throw new Error(error.message || "Erro ao atualizar nome do usuário.");

  const updatedUser = mapUser(data);
  if (requester.id === updatedUser?.id) {
    const session = getStoredSession();
    if (session?.token) {
      setStoredSession({
        token: session.token,
        expiresAt: session.expiresAt || null,
        user: updatedUser,
      });
    }
  }

  return updatedUser;
}

export async function deleteSeller(id) {
  await ensureAdmin();
  const client = ensureSupabase(true);
  const primary = await client.rpc("app_delete_seller", { p_id: id });
  if (!primary.error) return;

  const notFoundByParamName =
    String(primary.error?.message || "").includes("public.app_delete_seller(p_id)") ||
    String(primary.error?.message || "").includes("function public.app_delete_seller(p_id)");

  if (!notFoundByParamName) {
    throw new Error(primary.error.message || "Erro ao excluir usuário.");
  }

  // Backward compatibility for databases where the RPC argument is still named `id`.
  const legacy = await client.rpc("app_delete_seller", { id });
  if (!legacy.error) return;

  const missingFunction =
    String(legacy.error?.message || "").includes("Could not find the function public.app_delete_seller") ||
    String(legacy.error?.message || "").includes("function public.app_delete_seller");

  if (missingFunction) {
    throw new Error(
      "A função RPC app_delete_seller não existe no projeto Supabase atual. Execute o SQL de schema (supabase/schema.sql) no mesmo projeto apontado por REACT_APP_SUPABASE_URL e recarregue o cache do PostgREST."
    );
  }

  throw new Error(legacy.error.message || "Erro ao excluir usuário.");
}

export async function setSellerAdmins(sellerId, adminIds) {
  const requester = await ensureAdmin();
  if (requester.role !== "superadmin") {
    throw new Error("Apenas superadmin pode mover vendedor entre administradores.");
  }

  const client = ensureSupabase(true);
  const normalizedSellerId = String(sellerId || "").trim();
  const normalizedAdminIds = Array.from(new Set((Array.isArray(adminIds) ? adminIds : []).map((id) => String(id || "").trim()).filter(Boolean)));

  if (!normalizedSellerId) {
    throw new Error("Vendedor inválido.");
  }

  if (normalizedAdminIds.length === 0) {
    throw new Error("Selecione ao menos um administrador.");
  }

  const attempts = [
    { p_seller_id: normalizedSellerId, p_admin_ids: normalizedAdminIds },
    { seller_id: normalizedSellerId, admin_ids: normalizedAdminIds },
  ];

  let lastError = null;
  for (const params of attempts) {
    const result = await client.rpc("app_set_seller_admins", params);
    if (!result.error) return result.data || null;
    lastError = result.error;
    if (!isMissingRpcFunction(result.error, "app_set_seller_admins")) break;
  }

  if (lastError && isMissingRpcFunction(lastError, "app_set_seller_admins")) {
    throw new Error(
      "A função RPC app_set_seller_admins não existe no projeto Supabase atual. Execute o SQL de schema (supabase/schema.sql) no mesmo projeto apontado por REACT_APP_SUPABASE_URL e recarregue o cache do PostgREST."
    );
  }

  throw new Error(lastError?.message || "Erro ao mover vendedor para administradores.");
}

export async function upsertGoalTarget(payload) {
  await requireCurrentUser();
  const client = ensureSupabase(true);
  const userId = String(payload?.userId || "").trim();
  const month = String(payload?.month || "").trim();
  const key = String(payload?.key || "").trim();
  const value = payload?.value === "" || payload?.value == null ? null : Number(payload.value);

  if (!userId || !month || !key) {
    throw new Error("Parâmetros de meta inválidos.");
  }

  if (value != null && !Number.isFinite(value)) {
    throw new Error("Valor de meta inválido.");
  }

  const { error } = await rpcGoalUpsertWithFallback(client, {
    userId,
    month,
    key,
    value,
  });

  if (error && isMissingRpcFunction(error, "app_upsert_goal")) {
    throw new Error(
      "A função RPC app_upsert_goal não existe no projeto Supabase atual. Execute o SQL de schema (supabase/schema.sql) no mesmo projeto apontado por REACT_APP_SUPABASE_URL e recarregue o cache do PostgREST."
    );
  }

  if (error) throw new Error(error.message || "Erro ao salvar meta.");
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
  if (!["admin", "superadmin"].includes(user.role) && current.vendedorId !== user.id) {
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
  if (!["admin", "superadmin"].includes(user.role) && current.vendedorId !== user.id) {
    throw new Error("Sem permissao para excluir esta venda.");
  }

  const { error } = await client.from("vendas").delete().eq("id", id);
  if (error) throw new Error(error.message || "Erro ao excluir venda.");
}

export async function migrateLegacyData(payload) {
  const requester = await ensureAdmin();
  const client = ensureSupabase(true);

  const users = Array.isArray(payload?.users) ? payload.users : [];
  const vendas = Array.isArray(payload?.vendas) ? payload.vendas : [];

  if (users.length) {
    const { data: existingUsers, error: usersError } = await client.rpc("app_list_users");
    if (usersError) throw new Error(usersError.message || "Erro ao migrar usuarios.");
    const usernames = new Set((existingUsers || []).map((item) => String(item.username || "").toLowerCase()));
    const fallbackAdminId = requester.role === "superadmin"
      ? String((existingUsers || []).find((item) => item.role === "admin")?.id || "").trim()
      : "";

    if (requester.role === "superadmin" && !fallbackAdminId) {
      throw new Error("Crie ao menos um administrador antes de migrar vendedores legados.");
    }

    for (const user of users) {
      const username = String(user.username || "").trim().toLowerCase();
      if (!username || usernames.has(username) || user.role !== "seller") continue;
      const nome = String(user.nome || username).toUpperCase();
      const senha = String(user.senha || "123456");

      if (requester.role === "superadmin") {
        const attempts = [
          { p_nome: nome, p_username: username, p_senha: senha, p_admin_id: fallbackAdminId },
          { nome, username, senha, admin_id: fallbackAdminId },
        ];

        let creationError = null;
        let created = false;
        for (const params of attempts) {
          const result = await client.rpc("app_create_seller", params);
          if (!result.error) {
            created = true;
            creationError = null;
            break;
          }

          creationError = result.error;
          if (!isMissingRpcFunction(result.error, "app_create_seller")) {
            break;
          }
        }

        if (created) {
          usernames.add(username);
          continue;
        }

        if (creationError && isMissingRpcFunction(creationError, "app_create_seller")) {
          throw new Error(
            "A função RPC app_create_seller do projeto Supabase atual ainda não suporta vínculo de vendedor com administrador. Execute o SQL de schema (supabase/schema.sql), recarregue o cache do PostgREST e tente novamente."
          );
        }

        if (creationError) {
          throw new Error(creationError.message || "Erro ao migrar usuarios.");
        }

        continue;
      }

      const { error } = await rpcUserCreateWithFallback(client, "app_create_seller", nome, username, senha);
      if (!error) {
        usernames.add(username);
      } else if (!isMissingRpcFunction(error, "app_create_seller")) {
        throw new Error(error.message || "Erro ao migrar usuarios.");
      }
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
