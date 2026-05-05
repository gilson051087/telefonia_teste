import { useMemo, useState } from "react";
import { Field, btnPrimary, btnSecondary } from "../ui";

export default function SellerAdminsForm({ seller, users, onSave, onClose }) {
  const adminUsers = useMemo(
    () =>
      (users || [])
        .filter((item) => item.role === "admin")
        .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""))),
    [users]
  );

  const [selectedAdminIds, setSelectedAdminIds] = useState(() => (adminUsers[0]?.id ? [adminUsers[0].id] : []));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const normalized = Array.from(new Set(selectedAdminIds.filter(Boolean)));
    if (normalized.length === 0) {
      setError("Selecione ao menos um administrador.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await onSave(normalized);
    } catch (err) {
      setError(err.message || "Erro ao atualizar os administradores do vendedor.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div style={{ color: "#A1A1AA", fontSize: 12, marginBottom: 12 }}>
        Vendedor: <strong style={{ color: "#FFFFFF" }}>{String(seller?.nome || "").toUpperCase()}</strong>
      </div>

      <Field label="Empresa / administrador responsável">
        <select
          value={selectedAdminIds[0] || ""}
          onChange={(e) => setSelectedAdminIds(e.target.value ? [e.target.value] : [])}
          disabled={adminUsers.length === 0}
          style={{
            width: "100%",
            padding: "12px 14px",
            border: "1px solid #2A2A2E",
            borderRadius: 10,
            background: "#141416",
            color: "#FFFFFF",
            outline: "none",
            appearance: "none",
          }}
        >
          {adminUsers.map((adminUser) => (
            <option key={adminUser.id} value={adminUser.id}>
              {String(adminUser.nome || "").toUpperCase()}
            </option>
          ))}
        </select>
        {adminUsers.length === 0 && (
          <div style={{ color: "#A1A1AA", fontSize: 12, marginTop: 6 }}>
            Nenhum administrador disponível para vínculo.
          </div>
        )}
      </Field>

      {error && <div style={{ color: "#DA291C", fontSize: 13, marginBottom: 14, borderLeft: "3px solid #DA291C", paddingLeft: 10 }}>{error}</div>}

      <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving || adminUsers.length === 0}>
          {isSaving ? "Salvando..." : "Salvar vínculo"}
        </button>
      </div>
    </div>
  );
}
