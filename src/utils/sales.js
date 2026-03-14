import { MONTH_NAMES, STORAGE_KEYS } from "../constants/sales";

export function fmtBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

export function fmtDate(s) {
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtMonth(s) {
  if (!s) return "Todos os meses";
  const [y, m] = s.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]}/${y}`;
}

export function slugify(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "")
    .toLowerCase();
}

export function normalizePlanoName(plano) {
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

export function normalizeLegacyVenda(venda) {
  return { ...venda, plano: normalizePlanoName(venda.plano) };
}

export function loadVendas() {
  try {
    const current = localStorage.getItem(STORAGE_KEYS.vendas);
    if (current) return JSON.parse(current);
    const legacy = localStorage.getItem(STORAGE_KEYS.legacyVendas);
    return legacy ? JSON.parse(legacy).map(normalizeLegacyVenda) : [];
  } catch {
    return [];
  }
}

export function loadUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.users);
    if (saved) return JSON.parse(saved);
  } catch {}

  return [{ id: "admin-root", nome: "Administrador", username: "admin", senha: "123456", role: "admin" }];
}

export function maskCPF(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}
