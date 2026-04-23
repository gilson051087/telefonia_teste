import { useEffect, useMemo, useState } from "react";
import { slugify } from "../../utils/sales";
import { Field, btnPrimary, btnSecondary, inputStyle } from "../ui";

export default function SellerForm({ users, onSave, onClose, canManageAdmins = false }) {
  const adminUsers = useMemo(
    () =>
      (users || [])
        .filter((item) => item.role === "admin")
        .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""))),
    [users]
  );
  const [form, setForm] = useState({ nome: "", username: "", senha: "", role: "seller", adminId: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!canManageAdmins || form.role !== "seller") return;
    const hasSelectedAdmin = adminUsers.some((item) => item.id === form.adminId);
    if (hasSelectedAdmin) return;
    setForm((current) => ({ ...current, adminId: adminUsers[0]?.id || "" }));
  }, [canManageAdmins, form.role, form.adminId, adminUsers]);

  async function handleSave() {
    const nome = form.nome.trim().toUpperCase();
    const username = form.username.trim().toLowerCase() || slugify(nome);

    if (!nome || !username || !form.senha.trim()) {
      setError("Preencha nome, usuário e senha.");
      return;
    }

    if (users.some((item) => item.username.toLowerCase() === username)) {
      setError("Já existe um usuário com esse login.");
      return;
    }

    if (canManageAdmins && form.role === "seller" && !form.adminId) {
      setError("Selecione o administrador responsável pelo vendedor.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await onSave({
        nome,
        username,
        senha: form.senha,
        role: canManageAdmins ? form.role : "seller",
        adminId: canManageAdmins && form.role === "seller" ? form.adminId : "",
      });
    } catch (err) {
      setError(err.message || "Erro ao cadastrar vendedor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Field label={canManageAdmins ? "Nome do usuário" : "Nome do vendedor"}>
        <input
          value={form.nome}
          onChange={(e) =>
            setForm((current) => ({
              ...current,
              nome: e.target.value.toUpperCase(),
              username: current.username ? current.username : slugify(e.target.value),
            }))
          }
          style={inputStyle}
          placeholder="Ex: Maria Souza"
        />
      </Field>
      <Field label="Usuário de acesso">
        <input
          value={form.username}
          onChange={(e) => setForm((current) => ({ ...current, username: slugify(e.target.value) }))}
          style={inputStyle}
          placeholder="Ex: maria.souza"
        />
      </Field>
      {canManageAdmins && (
        <Field label="Perfil de acesso">
          <select
            value={form.role}
            onChange={(e) =>
              setForm((current) => {
                const nextRole = e.target.value === "admin" ? "admin" : "seller";
                return {
                  ...current,
                  role: nextRole,
                  adminId: nextRole === "seller" ? current.adminId || adminUsers[0]?.id || "" : "",
                };
              })
            }
            style={{ ...inputStyle, appearance: "none" }}
          >
            <option value="seller">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>
        </Field>
      )}
      {canManageAdmins && form.role === "seller" && (
        <Field label="Administrador responsável">
          <select
            value={form.adminId}
            onChange={(e) => setForm((current) => ({ ...current, adminId: e.target.value }))}
            style={{ ...inputStyle, appearance: "none" }}
            disabled={adminUsers.length === 0}
          >
            <option value="">Selecione um administrador</option>
            {adminUsers.map((adminUser) => (
              <option key={adminUser.id} value={adminUser.id}>
                {String(adminUser.nome || "").toUpperCase()}
              </option>
            ))}
          </select>
          {adminUsers.length === 0 && (
            <div style={{ color: "#A1A1AA", fontSize: 12, marginTop: 6 }}>
              Cadastre pelo menos um administrador antes de criar vendedores.
            </div>
          )}
        </Field>
      )}
      <Field label="Senha">
        <input
          type="password"
          value={form.senha}
          onChange={(e) => setForm((current) => ({ ...current, senha: e.target.value }))}
          style={inputStyle}
          placeholder="Crie uma senha"
        />
      </Field>
      {error && <div style={{ color: "#DA291C", fontSize: 13, marginBottom: 14 }}>{error}</div>}
      <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : canManageAdmins ? "Cadastrar usuário" : "Cadastrar vendedor"}
        </button>
      </div>
    </div>
  );
}
