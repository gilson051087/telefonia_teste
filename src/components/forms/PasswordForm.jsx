import { useState } from "react";
import { Field, btnPrimary, btnSecondary, inputStyle } from "../ui";

export default function PasswordForm({ onSave, onClose }) {
  const [form, setForm] = useState({ currentSenha: "", newSenha: "", confirmSenha: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!form.currentSenha || !form.newSenha || !form.confirmSenha) {
      setError("Preencha todos os campos.");
      return;
    }

    if (form.newSenha.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (form.newSenha !== form.confirmSenha) {
      setError("A confirmação não confere.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await onSave(form.currentSenha, form.newSenha);
    } catch (err) {
      setError(err.message || "Erro ao alterar senha.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Field label="Senha atual">
        <input
          type="password"
          value={form.currentSenha}
          onChange={(e) => setForm((current) => ({ ...current, currentSenha: e.target.value }))}
          style={inputStyle}
          placeholder="Digite a senha atual"
        />
      </Field>
      <Field label="Nova senha">
        <input
          type="password"
          value={form.newSenha}
          onChange={(e) => setForm((current) => ({ ...current, newSenha: e.target.value }))}
          style={inputStyle}
          placeholder="Mínimo de 6 caracteres"
        />
      </Field>
      <Field label="Confirmar nova senha">
        <input
          type="password"
          value={form.confirmSenha}
          onChange={(e) => setForm((current) => ({ ...current, confirmSenha: e.target.value }))}
          style={inputStyle}
          placeholder="Repita a nova senha"
        />
      </Field>
      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 14 }}>{error}</div>}
      <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Alterar senha"}
        </button>
      </div>
    </div>
  );
}
