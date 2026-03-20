const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "data");
const SQLITE_FILE = path.join(DATA_DIR, "db.sqlite");

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function nowIso() {
  return new Date().toISOString();
}

ensureDir();
const db = new DatabaseSync(SQLITE_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const existing = db.prepare("SELECT id FROM users WHERE lower(username) = lower(?)").get("admin");

if (existing) {
  db.prepare("UPDATE users SET nome = ?, password_hash = ?, role = ? WHERE id = ?").run(
    "Administrador",
    hashPassword("123456"),
    "admin",
    existing.id
  );
  console.log("Senha do admin redefinida para .");
} else {
  db.prepare(
    "INSERT INTO users (id, nome, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run("admin-root", "Administrador", "admin", hashPassword("123456"), "admin", nowIso());
  console.log("Usuario admin criado com senha 123456.");
}
