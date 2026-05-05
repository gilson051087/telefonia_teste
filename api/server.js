const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "telefonia-teste-dev-secret-change-me";
const TOKEN_TTL_SECONDS = 60 * 60 * 8;
const DATA_DIR = path.join(__dirname, "data");
const SQLITE_FILE = path.join(DATA_DIR, "db.sqlite");
const LEGACY_JSON_FILE = path.join(DATA_DIR, "db.json");

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function createJwt(payload, expiresInSeconds = TOKEN_TTL_SECONDS) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = { ...payload, exp };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return {
    token: `${encodedHeader}.${encodedBody}.${signature}`,
    exp,
  };
}

function verifyJwt(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedBody, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedBody));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, originalHash] = stored.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload muito grande."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON invalido."));
      }
    });
    req.on("error", reject);
  });
}

function getToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    username: user.username,
    role: user.role,
    storeId: user.store_id || null,
    createdAt: user.created_at,
  };
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
    ].includes(value)
  ) {
    return "Plano Controle";
  }
  return value;
}

function normalizeVenda(venda) {
  return {
    ...venda,
    plano: normalizePlanoName(venda.plano),
    valor: Number(venda.valor) || 0,
  };
}

ensureDir();
const db = new DatabaseSync(SQLITE_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    store_id TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS vendas (
    id TEXT PRIMARY KEY,
    vendedor_id TEXT,
    vendedor TEXT,
    store_id TEXT,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
  CREATE INDEX IF NOT EXISTS idx_vendas_vendedor_id ON vendas(vendedor_id);
  CREATE INDEX IF NOT EXISTS idx_vendas_store_id ON vendas(store_id);
`);

try {
  db.exec("ALTER TABLE users ADD COLUMN store_id TEXT;");
} catch {}

try {
  db.exec("ALTER TABLE vendas ADD COLUMN store_id TEXT;");
} catch {}

db.exec(`
  UPDATE users SET store_id = NULL WHERE role = 'superadmin';
  UPDATE users SET store_id = id WHERE role = 'admin' AND coalesce(store_id, '') = '';
  UPDATE users SET role = 'superadmin', store_id = NULL WHERE lower(username) = 'admin';
  UPDATE users
  SET store_id = (
    SELECT store_id
    FROM users admin_user
    WHERE admin_user.role = 'admin'
      AND coalesce(admin_user.store_id, '') <> ''
    ORDER BY admin_user.created_at ASC
    LIMIT 1
  )
  WHERE role = 'seller' AND coalesce(store_id, '') = '';
  UPDATE vendas
  SET store_id = (
    SELECT users.store_id
    FROM users
    WHERE users.id = vendas.vendedor_id
    LIMIT 1
  )
  WHERE coalesce(store_id, '') = '';
`);

function getUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE lower(username) = lower(?)").get(username) || null;
}

function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) || null;
}

function listAllUsers() {
  return db.prepare("SELECT * FROM users ORDER BY role DESC, nome ASC").all().map(sanitizeUser);
}

function listScopedUsers(user) {
  if (user.role === "superadmin") return listAllUsers();
  if (user.role === "admin") {
    return db
      .prepare("SELECT * FROM users WHERE role = 'seller' AND store_id = ? ORDER BY nome ASC")
      .all(user.store_id)
      .map(sanitizeUser);
  }
  return [sanitizeUser(user)];
}

function getAllVendas() {
  const rows = db.prepare("SELECT * FROM vendas ORDER BY created_at DESC").all();
  return rows.map((row) => normalizeVenda({ ...JSON.parse(row.payload), storeId: row.store_id || null }));
}

function getScopedVendas(user) {
  if (user.role === "superadmin") return getAllVendas();
  if (user.role === "admin") {
    const rows = db.prepare("SELECT * FROM vendas WHERE store_id = ? ORDER BY created_at DESC").all(user.store_id);
    return rows.map((row) => normalizeVenda({ ...JSON.parse(row.payload), storeId: row.store_id || null }));
  }
  const rows = db
    .prepare("SELECT * FROM vendas WHERE vendedor_id = ? OR vendedor = ? ORDER BY created_at DESC")
    .all(user.id, user.nome);
  return rows.map((row) => normalizeVenda({ ...JSON.parse(row.payload), storeId: row.store_id || null }));
}

function insertUser({ id, nome, username, senha, role, storeId }) {
  const createdAt = nowIso();
  const resolvedStoreId = role === "superadmin" ? null : role === "admin" ? id : storeId || null;
  db.prepare(
    "INSERT INTO users (id, nome, username, password_hash, role, store_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, nome, username, hashPassword(senha), role, resolvedStoreId, createdAt);
  return getUserById(id);
}

function insertVenda(venda) {
  const payload = normalizeVenda(venda);
  const seller = payload.vendedorId ? getUserById(payload.vendedorId) : null;
  const storeId = payload.storeId || seller?.store_id || null;
  payload.storeId = storeId;
  const now = nowIso();
  db.prepare(
    "INSERT INTO vendas (id, vendedor_id, vendedor, store_id, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(payload.id, payload.vendedorId || null, payload.vendedor || null, storeId, JSON.stringify(payload), now, now);
  return payload;
}

function updateVendaRecord(id, venda) {
  const payload = normalizeVenda(venda);
  const seller = payload.vendedorId ? getUserById(payload.vendedorId) : null;
  const storeId = payload.storeId || seller?.store_id || null;
  payload.storeId = storeId;
  const now = nowIso();
  db.prepare("UPDATE vendas SET vendedor_id = ?, vendedor = ?, store_id = ?, payload = ?, updated_at = ? WHERE id = ?").run(
    payload.vendedorId || null,
    payload.vendedor || null,
    storeId,
    JSON.stringify(payload),
    now,
    id
  );
  return payload;
}

function getVendaById(id) {
  const row = db.prepare("SELECT * FROM vendas WHERE id = ?").get(id);
  return row ? normalizeVenda({ ...JSON.parse(row.payload), storeId: row.store_id || null }) : null;
}

function bootstrapAdmin() {
  const exists = db.prepare("SELECT count(*) as count FROM users").get().count;
  if (exists > 0) return;
  insertUser({
    id: "admin-root",
    nome: "Administrador",
    username: "admin",
    senha: "123456",
    role: "superadmin",
  });
}

function migrateLegacyJsonIfNeeded() {
  const hasUsers = db.prepare("SELECT count(*) as count FROM users").get().count > 0;
  const hasVendas = db.prepare("SELECT count(*) as count FROM vendas").get().count > 0;
  if ((hasUsers || hasVendas) || !fs.existsSync(LEGACY_JSON_FILE)) return;

  try {
    const legacy = JSON.parse(fs.readFileSync(LEGACY_JSON_FILE, "utf8"));
    (legacy.users || []).forEach((user) => {
      if (getUserByUsername(user.username)) return;
      db.prepare(
        "INSERT INTO users (id, nome, username, password_hash, role, store_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(
        user.id || genId(),
        user.nome || user.username,
        String(user.username || "").toLowerCase(),
        user.passwordHash || hashPassword(user.senha || "123456"),
        user.role || "seller",
        user.storeId || user.store_id || null,
        user.createdAt || nowIso()
      );
    });
    (legacy.vendas || []).forEach((venda) => {
      if (!venda || !venda.id || getVendaById(venda.id)) return;
      insertVenda({ ...venda, id: venda.id });
    });
  } catch {}
}

bootstrapAdmin();
migrateLegacyJsonIfNeeded();

function requireAuth(req, res) {
  const token = getToken(req);
  const payload = verifyJwt(token);
  if (!payload?.sub) {
    sendJson(res, 401, { error: "Nao autenticado." });
    return null;
  }
  const user = getUserById(payload.sub);
  if (!user) {
    sendJson(res, 401, { error: "Usuario da sessao nao encontrado." });
    return null;
  }
  return user;
}

function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (!["admin", "superadmin"].includes(user.role)) {
    sendJson(res, 403, { error: "Acesso restrito ao administrador." });
    return null;
  }
  return user;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "POST" && url.pathname === "/api/login") {
      const body = await readBody(req);
      const username = String(body.username || "").trim().toLowerCase();
      const senha = String(body.senha || "");
      const user = getUserByUsername(username);

      if (!user || !verifyPassword(senha, user.password_hash)) {
        sendJson(res, 401, { error: "Usuario ou senha invalidos." });
        return;
      }

      const session = createJwt({ sub: user.id, role: user.role });
      sendJson(res, 200, {
        token: session.token,
        expiresAt: new Date(session.exp * 1000).toISOString(),
        user: sanitizeUser(user),
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/logout") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/session") {
      const user = requireAuth(req, res);
      if (!user) return;
      sendJson(res, 200, { user: sanitizeUser(user) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/change-password") {
      const user = requireAuth(req, res);
      if (!user) return;

      const body = await readBody(req);
      const currentSenha = String(body.currentSenha || "");
      const newSenha = String(body.newSenha || "");

      if (!currentSenha || !newSenha) {
        sendJson(res, 400, { error: "Informe a senha atual e a nova senha." });
        return;
      }

      if (newSenha.length < 6) {
        sendJson(res, 400, { error: "A nova senha deve ter pelo menos 6 caracteres." });
        return;
      }

      if (!verifyPassword(currentSenha, user.password_hash)) {
        sendJson(res, 401, { error: "Senha atual incorreta." });
        return;
      }

      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(newSenha), user.id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/users") {
      const user = requireAuth(req, res);
      if (!user) return;
      sendJson(res, 200, { users: listScopedUsers(user) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/users") {
      const admin = requireAdmin(req, res);
      if (!admin) return;

      const body = await readBody(req);
      const nome = String(body.nome || "").trim().toUpperCase();
      const username = String(body.username || "").trim().toLowerCase();
      const senha = String(body.senha || "");
      const role = admin.role === "superadmin" && body.role === "admin" ? "admin" : "seller";

      if (!nome || !username || !senha) {
        sendJson(res, 400, { error: "Preencha nome, usuario e senha." });
        return;
      }

      if (senha.length < 6) {
        sendJson(res, 400, { error: "A senha deve ter pelo menos 6 caracteres." });
        return;
      }

      if (getUserByUsername(username)) {
        sendJson(res, 409, { error: "Ja existe um usuario com esse login." });
        return;
      }

      if (role === "admin" && admin.role !== "superadmin") {
        sendJson(res, 403, { error: "Apenas superadmin pode criar administradores." });
        return;
      }

      const storeId = role === "seller" ? admin.store_id : null;

      const newUser = insertUser({
        id: genId(),
        nome,
        username,
        senha,
        role,
        storeId,
      });

      sendJson(res, 201, { user: sanitizeUser(newUser) });
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/users/")) {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const id = url.pathname.split("/").pop();
      const user = getUserById(id);

      if (!user) {
        sendJson(res, 404, { error: "Vendedor nao encontrado." });
        return;
      }

      if (user.role === "superadmin") {
        sendJson(res, 400, { error: "Nao e permitido excluir o superadmin." });
        return;
      }

      if (user.role === "admin" && admin.role !== "superadmin") {
        sendJson(res, 400, { error: "Nao e permitido excluir o administrador." });
        return;
      }

      if (admin.role === "admin" && user.store_id !== admin.store_id) {
        sendJson(res, 403, { error: "Sem permissao para excluir usuario de outra empresa." });
        return;
      }

      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/vendas") {
      const user = requireAuth(req, res);
      if (!user) return;
      sendJson(res, 200, { vendas: getScopedVendas(user) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/vendas") {
      const user = requireAuth(req, res);
      if (!user) return;
      const body = normalizeVenda(await readBody(req));

      const venda = {
        ...body,
        id: genId(),
        vendedorId: user.role === "seller" ? user.id : body.vendedorId,
        vendedor: user.role === "seller" ? user.nome : body.vendedor,
        storeId: user.role === "seller" ? user.store_id : body.storeId,
      };

      const seller = venda.vendedorId ? getUserById(venda.vendedorId) : null;
      if (user.role === "admin" && seller?.store_id !== user.store_id) {
        sendJson(res, 403, { error: "Sem permissao para lancar venda em outra empresa." });
        return;
      }

      insertVenda(venda);
      sendJson(res, 201, { venda });
      return;
    }

    if (req.method === "PUT" && url.pathname.startsWith("/api/vendas/")) {
      const user = requireAuth(req, res);
      if (!user) return;
      const id = url.pathname.split("/").pop();
      const current = getVendaById(id);

      if (!current) {
        sendJson(res, 404, { error: "Venda nao encontrada." });
        return;
      }

      if (user.role === "admin" && current.storeId !== user.store_id) {
        sendJson(res, 403, { error: "Sem permissao para editar venda de outra empresa." });
        return;
      }

      if (!["admin", "superadmin"].includes(user.role) && current.vendedorId !== user.id) {
        sendJson(res, 403, { error: "Sem permissao para editar esta venda." });
        return;
      }

      const body = normalizeVenda(await readBody(req));
      const updated = {
        ...current,
        ...body,
        id,
        vendedorId: user.role === "seller" ? user.id : body.vendedorId,
        vendedor: user.role === "seller" ? user.nome : body.vendedor,
        storeId: user.role === "seller" ? user.store_id : body.storeId || current.storeId,
      };

      const updatedSeller = updated.vendedorId ? getUserById(updated.vendedorId) : null;
      if (user.role === "admin" && updatedSeller?.store_id !== user.store_id) {
        sendJson(res, 403, { error: "Sem permissao para mover venda para outra empresa." });
        return;
      }

      updateVendaRecord(id, updated);
      sendJson(res, 200, { venda: updated });
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/vendas/")) {
      const user = requireAuth(req, res);
      if (!user) return;
      const id = url.pathname.split("/").pop();
      const venda = getVendaById(id);

      if (!venda) {
        sendJson(res, 404, { error: "Venda nao encontrada." });
        return;
      }

      if (user.role === "admin" && venda.storeId !== user.store_id) {
        sendJson(res, 403, { error: "Sem permissao para excluir venda de outra empresa." });
        return;
      }

      if (!["admin", "superadmin"].includes(user.role) && venda.vendedorId !== user.id) {
        sendJson(res, 403, { error: "Sem permissao para excluir esta venda." });
        return;
      }

      db.prepare("DELETE FROM vendas WHERE id = ?").run(id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/migrate") {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const body = await readBody(req);
      const legacyUsers = Array.isArray(body.users) ? body.users : [];
      const legacyVendas = Array.isArray(body.vendas) ? body.vendas : [];

      const insertLegacyUser = db.prepare(
        "INSERT INTO users (id, nome, username, password_hash, role, store_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );

      const insertLegacyVenda = db.prepare(
        "INSERT INTO vendas (id, vendedor_id, vendedor, store_id, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );

      legacyUsers.forEach((user) => {
        const username = String(user.username || "").trim().toLowerCase();
        if (!username || user.role !== "seller" || getUserByUsername(username)) return;
        insertLegacyUser.run(
          user.id || genId(),
          user.nome || username,
          username,
          hashPassword(String(user.senha || "123456")),
          "seller",
          admin.store_id || null,
          nowIso()
        );
      });

      legacyVendas.forEach((venda) => {
        const normalized = normalizeVenda(venda);
        if (!normalized.id || getVendaById(normalized.id)) return;
        const seller = normalized.vendedorId ? getUserById(normalized.vendedorId) : null;
        const storeId = normalized.storeId || seller?.store_id || admin.store_id || null;
        normalized.storeId = storeId;
        const now = nowIso();
        insertLegacyVenda.run(
          normalized.id,
          normalized.vendedorId || null,
          normalized.vendedor || null,
          storeId,
          JSON.stringify(normalized),
          now,
          now
        );
      });

      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { error: "Rota nao encontrada." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Erro interno." });
  }
});

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
