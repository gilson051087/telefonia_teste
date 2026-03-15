const TOKEN_KEY = "telefonia_api_token_v1";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(path, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Backend indisponivel. Execute `npm run backend` antes de entrar.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Erro na requisicao.");
  }

  return data;
}

export async function login(username, senha) {
  const data = await request("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, senha }),
  });
  setToken(data.token);
  return data.user;
}

export async function logout() {
  try {
    await request("/api/logout", { method: "POST" });
  } finally {
    setToken(null);
  }
}

export async function getSession() {
  const data = await request("/api/session");
  return data.user;
}

export async function listUsers() {
  const data = await request("/api/users");
  return data.users;
}

export async function createSeller(payload) {
  const data = await request("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function deleteSeller(id) {
  await request(`/api/users/${id}`, { method: "DELETE" });
}

export async function listVendas() {
  const data = await request("/api/vendas");
  return data.vendas;
}

export async function createVenda(payload) {
  const data = await request("/api/vendas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.venda;
}

export async function updateVenda(id, payload) {
  const data = await request(`/api/vendas/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.venda;
}

export async function deleteVenda(id) {
  await request(`/api/vendas/${id}`, { method: "DELETE" });
}

export async function migrateLegacyData(payload) {
  await request("/api/migrate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(currentSenha, newSenha) {
  await request("/api/change-password", {
    method: "POST",
    body: JSON.stringify({ currentSenha, newSenha }),
  });
}

export function hasApiToken() {
  return Boolean(getToken());
}

export function clearApiToken() {
  setToken(null);
}
