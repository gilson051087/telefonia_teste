import { useState } from "react";
import { Field, btnPrimary, btnSecondary, inputStyle } from "../ui";

export default function UserNameForm({ user, onSave, onClose }) {
  const [nome, setNome] = useState(String(user?.nome || "").toUpperCase());
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const normalizedName = String(nome || "").trim().toUpperCase();
    if (!normalizedName) {
      setError("Informe um nome válido.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await onSave(normalizedName);
    } catch (err) {
      setError(err.message || "Erro ao atualizar nome do usuário.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Field label="Nome">
        <input
          value={nome}
          onChange={(event) => setNome(event.target.value.toUpperCase())}
          style={inputStyle}
          placeholder="Ex: MARIA SOUZA"
          autoFocus
        />
      </Field>
      <div style={{ color: "#A1A1AA", fontSize: 12, marginBottom: 12 }}>
        Login: <strong>{user?.username || "-"}</strong>
      </div>
      {error && <div style={{ color: "#DA291C", fontSize: 13, marginBottom: 14, borderLeft: "3px solid #DA291C", paddingLeft: 10 }}>{error}</div>}
      <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar nome"}
        </button>
      </div>
    </div>
  );
}
