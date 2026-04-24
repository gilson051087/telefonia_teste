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
  const [form, setForm] = useState({ nome: "", username: "", senha: "", role: "seller", adminIds: [] });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!canManageAdmins || form.role !== "seller") return;
    const hasSelectedAdmin = (form.adminIds || []).some((adminId) => adminUsers.some((item) => item.id === adminId));
    if (hasSelectedAdmin) return;
    setForm((current) => ({ ...current, adminIds: adminUsers[0]?.id ? [adminUsers[0].id] : [] }));
  }, [canManageAdmins, form.role, form.adminIds, adminUsers]);

  function toggleAdminSelection(adminId) {
    setForm((current) => {
      const currentIds = Array.isArray(current.adminIds) ? current.adminIds : [];
      const hasAdmin = currentIds.includes(adminId);
      return {
        ...current,
        adminIds: hasAdmin ? currentIds.filter((id) => id !== adminId) : [...currentIds, adminId],
      };
    });
  }

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

    const selectedAdminIds = Array.from(new Set((form.adminIds || []).filter((adminId) => adminUsers.some((item) => item.id === adminId))));

    if (canManageAdmins && form.role === "seller" && selectedAdminIds.length === 0) {
      setError("Selecione pelo menos um administrador responsável pelo vendedor.");
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
        adminId: canManageAdmins && form.role === "seller" ? selectedAdminIds[0] || "" : "",
        adminIds: canManageAdmins && form.role === "seller" ? selectedAdminIds : [],
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
                const defaultAdminIds = current.adminIds?.length
                  ? current.adminIds
                  : (adminUsers[0]?.id ? [adminUsers[0].id] : []);
                return {
                  ...current,
                  role: nextRole,
                  adminIds: nextRole === "seller" ? defaultAdminIds : [],
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
        <Field label="Administradores responsáveis">
          <div
            style={{
              border: "1px solid #2A2A2E",
              borderRadius: 10,
              padding: 10,
              maxHeight: 190,
              overflowY: "auto",
              background: "#141416",
            }}
          >
            {adminUsers.map((adminUser) => {
              const checked = (form.adminIds || []).includes(adminUser.id);
              return (
                <label
                  key={adminUser.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 6px",
                    cursor: "pointer",
                    color: checked ? "#FFFFFF" : "#D4D4D8",
                    borderRadius: 8,
                    background: checked ? "rgba(218,41,28,0.12)" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAdminSelection(adminUser.id)}
                    disabled={adminUsers.length === 0}
                  />
                  <span>{String(adminUser.nome || "").toUpperCase()}</span>
                </label>
              );
            })}
          </div>
          <div style={{ color: "#A1A1AA", fontSize: 12, marginTop: 6 }}>
            Selecione um ou mais administradores para este vendedor.
          </div>
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
      {error && <div style={{ color: "#DA291C", fontSize: 13, marginBottom: 14, borderLeft: "3px solid #DA291C", paddingLeft: 10 }}>{error}</div>}
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
