import { useEffect, useMemo, useState } from "react";
import { PLANOS, PLANO_COLORS, PLANO_EXTRAS, PLANO_ICONS, PLANO_LABELS, REMUNERATION_OPTIONS_BY_PLANO, getRemunerationValue } from "../../constants/sales";
import { isValidCPF, maskCPF, normalizePlanoName } from "../../utils/sales";
import { Field, btnPrimary, btnSecondary, inputStyle, labelStyle } from "../ui";

export default function VendaForm({ initial, onSave, onClose, currentUser, sellers }) {
  const installationPlanos = ["Internet Residencial", "TV"];
  const seguroOptions = REMUNERATION_OPTIONS_BY_PLANO["Seguro Movel Celular"] || [];
  const defaultSellerId = currentUser.role === "seller" ? currentUser.id : sellers[0]?.id || "";
  const defaultSellerName = currentUser.role === "seller" ? currentUser.nome : sellers[0]?.nome || "";

  const defaultForm = {
    cliente: "",
    cpf: "",
    plano: "Plano Controle",
    tipoPlano: "",
    descricao: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    vendedor: defaultSellerName,
    vendedorId: defaultSellerId,
    adicionarSeguro: false,
    tipoSeguro: "",
  };

  const [form, setForm] = useState(initial ? { ...defaultForm, ...initial, plano: normalizePlanoName(initial.plano) } : defaultForm);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const currentPlano = normalizePlanoName(form.plano) || "Plano Controle";
  const extras = PLANO_EXTRAS[currentPlano] || [];
  const remunerationOptions = useMemo(() => REMUNERATION_OPTIONS_BY_PLANO[currentPlano] || [], [currentPlano]);
  const isRemunerationLocked = remunerationOptions.length > 0;
  const usesInstallationStatus = installationPlanos.includes(currentPlano);

  useEffect(() => {
    if (currentUser.role === "seller") {
      setForm((current) => ({ ...current, vendedor: currentUser.nome, vendedorId: currentUser.id }));
      return;
    }

    if (!form.vendedorId && sellers[0]) {
      setForm((current) => ({ ...current, vendedorId: sellers[0].id, vendedor: sellers[0].nome }));
    }
  }, [currentUser, sellers, form.vendedorId]);

  useEffect(() => {
    if (!remunerationOptions.length) return;

    setForm((current) => {
      const selectedOption = remunerationOptions.find((item) => item.label === current.tipoPlano);
      if (selectedOption) {
        const nextValor = selectedOption.value.toFixed(2);
        if (String(current.valor || "") === nextValor) return current;
        return { ...current, valor: nextValor };
      }
      if (!current.tipoPlano && !current.valor) return current;
      return { ...current, tipoPlano: "", valor: "" };
    });
  }, [currentPlano, remunerationOptions]);

  function setField(key, value) {
    if (key === "plano") {
      const normalizedPlano = normalizePlanoName(value);
      const hasRemunerationOptions = (REMUNERATION_OPTIONS_BY_PLANO[normalizedPlano] || []).length > 0;
      setForm((current) => ({
        ...current,
        plano: normalizedPlano,
        tipoPlano: "",
        valor: hasRemunerationOptions ? "" : current.valor,
        statusInstalacao: installationPlanos.includes(normalizedPlano) ? current.statusInstalacao || "Pendente" : current.statusInstalacao,
        adicionarSeguro: normalizedPlano === "Aparelho Celular" ? current.adicionarSeguro : false,
        tipoSeguro: normalizedPlano === "Aparelho Celular" ? current.tipoSeguro : "",
      }));
      return;
    }

    if (key === "dataInstalacao") {
      setForm((current) => ({
        ...current,
        dataInstalacao: value,
        statusInstalacao: value ? current.statusInstalacao || "Pendente" : current.statusInstalacao,
      }));
      return;
    }

    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSellerChange(value) {
    const selected = sellers.find((item) => item.id === value);
    setForm((current) => ({
      ...current,
      vendedorId: value,
      vendedor: selected?.nome || "",
    }));
  }

  function validate() {
    const next = {};
    if (!form.cliente.trim()) next.cliente = "Obrigatorio";
    if (form.cpf && !isValidCPF(form.cpf)) next.cpf = "CPF invalido";
    if (!form.plano) next.plano = "Obrigatorio";
    if (remunerationOptions.length > 0 && !form.tipoPlano) next.tipoPlano = "Obrigatorio";
    if (usesInstallationStatus && !form.statusInstalacao) next.statusInstalacao = "Obrigatorio";
    if (!usesInstallationStatus && form.dataInstalacao && !form.statusInstalacao) next.statusInstalacao = "Obrigatorio";
    if (!initial && currentPlano === "Aparelho Celular" && form.adicionarSeguro && !form.tipoSeguro) next.tipoSeguro = "Selecione o seguro";
    if (!form.valor || Number.isNaN(+form.valor) || +form.valor <= 0) next.valor = "Valor invalido";
    if (!form.data) next.data = "Obrigatorio";
    if (!form.vendedorId && currentUser.role === "admin") next.vendedor = "Selecione um vendedor";
    return next;
  }

  async function handleSave() {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...form,
        autoSeguro: !initial && currentPlano === "Aparelho Celular" && form.adicionarSeguro ? { tipoPlano: form.tipoSeguro } : null,
        status:
          usesInstallationStatus
            ? form.statusInstalacao === "Instalado"
              ? "Ativa"
              : form.statusInstalacao === "Nao instalado"
                ? "Cancelada"
                : "Pendente"
            : "Ativa",
        valor: parseFloat(form.valor),
        vendedor: currentUser.role === "seller" ? currentUser.nome : form.vendedor,
        vendedorId: currentUser.role === "seller" ? currentUser.id : form.vendedorId,
      });
    } catch (err) {
      window.alert(err.message || "Erro ao salvar venda.");
    } finally {
      setIsSaving(false);
    }
  }

  const inp = (key, type = "text", placeholder = "") => (
    <input
      type={type}
      value={form[key] || ""}
      placeholder={placeholder}
      onChange={(e) => setField(key, e.target.value)}
      style={{ ...inputStyle, borderColor: errors[key] ? "#ef4444" : "#334155" }}
    />
  );

  return (
    <div>
      <div
        style={{
          border: "1px solid #164e63",
          background: "linear-gradient(135deg, rgba(8,145,178,0.2), rgba(22,78,99,0.2))",
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 16,
          color: "#a5f3fc",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        Preenchimento guiado: escolha o plano, complete os dados e toque em <strong style={{ color: "#ecfeff" }}>Registrar venda</strong>.
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Passo 1: Escolha o plano</label>
        <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {PLANOS.map((plano) => (
            <button
              key={plano}
              onClick={() => setField("plano", plano)}
              className="plan-choice"
              style={{
                background: currentPlano === plano ? `${PLANO_COLORS[plano]}22` : "#1e293b",
                border: `1.5px solid ${currentPlano === plano ? PLANO_COLORS[plano] : "#334155"}`,
                borderRadius: 12,
                padding: "12px 8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                transition: "all 0.18s",
              }}
            >
              <span style={{ fontSize: 22 }}>{PLANO_ICONS[plano]}</span>
              <span style={{ fontSize: 12, color: currentPlano === plano ? PLANO_COLORS[plano] : "#94a3b8", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                {PLANO_LABELS[plano]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="form-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Passo 2: Nome do cliente" error={errors.cliente}>
            {inp("cliente", "text", "Nome completo")}
          </Field>
        </div>

        <Field label="CPF" error={errors.cpf}>
          <input
            type="text"
            value={form.cpf || ""}
            placeholder="000.000.000-00"
            onChange={(e) => setField("cpf", maskCPF(e.target.value))}
            style={{ ...inputStyle, borderColor: errors.cpf ? "#ef4444" : undefined }}
          />
        </Field>

        {currentUser.role === "admin" ? (
          <Field label="Vendedor" error={errors.vendedor}>
            <select value={form.vendedorId || ""} onChange={(e) => handleSellerChange(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
              <option value="">Selecione</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.nome}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Vendedor">
            <input value={currentUser.nome} disabled style={{ ...inputStyle, opacity: 0.8, cursor: "not-allowed" }} />
          </Field>
        )}

        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Descricao / observacao">{inp("descricao", "text", "Detalhes da venda...")}</Field>
        </div>

        <Field label="Valor (R$)" error={errors.valor}>
          <div>
            <input
              type="number"
              value={form.valor || ""}
              placeholder="0,00"
              onChange={(e) => setField("valor", e.target.value)}
              style={{ ...inputStyle, borderColor: errors.valor ? "#ef4444" : "#334155", opacity: isRemunerationLocked ? 0.8 : 1 }}
              step="0.01"
              readOnly={isRemunerationLocked}
            />
            {isRemunerationLocked && <div style={{ marginTop: 6, fontSize: 11, color: "#67e8f9" }}>Valor preenchido automaticamente para remuneracao.</div>}
          </div>
        </Field>
        <Field label="Data da venda" error={errors.data}>
          {inp("data", "date")}
        </Field>
      </div>

      {!initial && currentPlano === "Aparelho Celular" && (
        <div style={{ borderTop: "1px solid #1e293b", margin: "6px 0 16px", paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            🛡️ Seguro automatico
          </div>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Incluir seguro junto com o celular">
              <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, color: "#cbd5e1", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={Boolean(form.adicionarSeguro)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      adicionarSeguro: e.target.checked,
                      tipoSeguro: e.target.checked ? current.tipoSeguro : "",
                    }))
                  }
                />
                Adicionar venda de seguro automaticamente
              </label>
            </Field>
            <Field label="Tipo de seguro" error={errors.tipoSeguro}>
              <select
                value={form.tipoSeguro || ""}
                disabled={!form.adicionarSeguro}
                onChange={(e) => setField("tipoSeguro", e.target.value)}
                style={{ ...inputStyle, appearance: "none", borderColor: errors.tipoSeguro ? "#ef4444" : "#334155", opacity: form.adicionarSeguro ? 1 : 0.6 }}
              >
                <option value="">Selecione o seguro</option>
                {seguroOptions.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      )}

      {extras.length > 0 && (
        <div style={{ borderTop: "1px solid #1e293b", margin: "6px 0 16px", paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: PLANO_COLORS[currentPlano], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            {PLANO_ICONS[currentPlano]} Dados do {PLANO_LABELS[currentPlano]}
          </div>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {extras.map((extra) => (
              <Field key={extra.key} label={extra.label} error={errors[extra.key]}>
                {extra.type === "select" ? (
                  <select
                    value={form[extra.key] || ""}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      if (extra.key === "tipoPlano") {
                        const remunerationValue = getRemunerationValue(currentPlano, nextValue);
                        setForm((current) => ({
                          ...current,
                          tipoPlano: nextValue,
                          valor: remunerationValue !== null ? remunerationValue.toFixed(2) : current.valor,
                        }));
                        return;
                      }
                      setField(extra.key, nextValue);
                    }}
                    style={{ ...inputStyle, appearance: "none", borderColor: errors[extra.key] ? "#ef4444" : "#334155" }}
                  >
                    <option value="">{extra.placeholderSelect || "Selecione"}</option>
                    {(extra.options || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={extra.type}
                    value={form[extra.key] || ""}
                    placeholder={extra.placeholder}
                    onChange={(e) => setField(extra.key, extra.numericOnly ? e.target.value.replace(/\D/g, "") : e.target.value)}
                    style={inputStyle}
                  />
                )}
              </Field>
            ))}
          </div>
        </div>
      )}

      <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button className="touch-btn" style={btnSecondary} onClick={onClose}>
          Cancelar
        </button>
        <button className="touch-btn lift-hover" style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : initial ? "Salvar alteracoes" : "Registrar venda"}
        </button>
      </div>
    </div>
  );
}
