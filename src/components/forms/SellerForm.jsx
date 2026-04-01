import { useState } from "react";
import { slugify } from "../../utils/sales";
import { Field, btnPrimary, btnSecondary, inputStyle } from "../ui";

export default function SellerForm({ users, onSave, onClose }) {
  const [form, setForm] = useState({ nome: "", username: "", senha: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

    try {
      setIsSaving(true);
      setError("");
      await onSave({
        nome,
        username,
        senha: form.senha,
        role: "seller",
      });
    } catch (err) {
      setError(err.message || "Erro ao cadastrar vendedor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Field label="Nome do vendedor">
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
      <Field label="Senha">
        <input
          type="password"
          value={form.senha}
          onChange={(e) => setForm((current) => ({ ...current, senha: e.target.value }))}
          style={inputStyle}
          placeholder="Crie uma senha"
        />
      </Field>
      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 14 }}>{error}</div>}
      <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Cadastrar vendedor"}
        </button>
      </div>
    </div>
  );
}
