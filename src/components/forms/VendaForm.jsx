import { useEffect, useMemo, useState } from "react";
import { COMANDA_COMMON_FIELDS, PLANOS, PLANO_COLORS, PLANO_EXTRAS, PLANO_ICONS, PLANO_LABELS, REMUNERATION_OPTIONS_BY_PLANO, getRemunerationValue } from "../../constants/sales";
import { isValidCPF, maskCEP, maskCPF, maskICCID, maskPhone, normalizePlanoName } from "../../utils/sales";
import { Field, btnPrimary, btnSecondary, inputStyle, labelStyle } from "../ui";

export default function VendaForm({ initial, onSave, onClose, currentUser, sellers, onFeedback }) {
  const installationPlanos = ["Internet Residencial", "TV"];
  const mobilePlanos = ["Plano Controle", "Plano Pós-Pago", "Internet Movel Mais", "Seguro Movel Celular"];
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
    comandaSeguroTipo: "",
    ordemVenda: "",
    cep: "",
    dataNascimento: "",
    tipoNumeroPortado: "numero-cliente",
    comandaMovelAtiva: false,
    comandaInternetAtiva: false,
    comandaTvAtiva: false,
    comandaAparelhoAtiva: false,
    comandaAcessoriosAtiva: false,
    comandaMovelPlano: "Plano Controle",
    comandaMovelServico: "",
    comandaMovelNumero: "",
    comandaMovelPortabilidade: "",
    comandaMovelIccid: "",
    comandaInternetPlano: "",
    comandaInternetDataInstalacao: "",
    comandaInternetContrato: "",
    comandaInternetPeriodo: "",
    comandaInternetHfcGpon: "",
    comandaTvPlano: "",
    comandaTvDataInstalacao: "",
    comandaTvContrato: "",
    comandaTvBoxImediata: "",
    comandaAparelhoModelo: "",
    comandaAparelhoImei: "",
    comandaAparelhoValor: "",
    comandaAcessoriosDescricao: "",
    comandaAcessoriosQuantidade: "",
    comandaAcessoriosValor: "",
    posPagoDependentes: [],
    controleAdicionais: [],
  };

  const maskBirthDate = (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const formatBirthDateForInput = (value = "") => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      const [year, month, day] = String(value).split("-");
      return `${day}/${month}/${year}`;
    }
    return maskBirthDate(value);
  };

  const maskDateBR = (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const isoToBR = (value = "") => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      const [year, month, day] = String(value).split("-");
      return `${day}/${month}/${year}`;
    }
    return maskDateBR(value);
  };

  const brToIso = (value = "") => {
    const cleaned = maskDateBR(value);
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) return null;
    const [dd, mm, yyyy] = cleaned.split("/").map(Number);
    const date = new Date(yyyy, mm - 1, dd);
    if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return null;
    return `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  };

  const [form, setForm] = useState(() => {
    if (!initial) return defaultForm;
    const normalizedPlano = normalizePlanoName(initial.plano);
    const normalizedInitial = { ...defaultForm, ...initial, plano: normalizedPlano };
    const isMobile = mobilePlanos.includes(normalizedPlano);
    if (!isMobile) return normalizedInitial;
    const hasDifferentPortedNumber =
      String(normalizedInitial.portabilidade || "").trim() &&
      String(normalizedInitial.portabilidade || "").trim() !== String(normalizedInitial.numero || "").trim();
    return {
      ...normalizedInitial,
      tipoNumeroPortado: hasDifferentPortedNumber ? "portabilidade" : normalizedInitial.tipoNumeroPortado || "numero-cliente",
    };
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [dateDrafts, setDateDrafts] = useState({});
  const [wizardPage, setWizardPage] = useState(initial ? 3 : 1);
  const currentPlano = normalizePlanoName(form.plano) || "Plano Controle";
  const extras = PLANO_EXTRAS[currentPlano] || [];
  const remunerationOptions = useMemo(() => REMUNERATION_OPTIONS_BY_PLANO[currentPlano] || [], [currentPlano]);
  const internetPlanOptions = useMemo(
    () => (REMUNERATION_OPTIONS_BY_PLANO["Internet Residencial"] || []).map((item) => item.label),
    []
  );
  const tvPlanOptions = useMemo(
    () => (REMUNERATION_OPTIONS_BY_PLANO.TV || []).map((item) => item.label),
    []
  );
  const comandaMovelPlanoOptions = useMemo(
    () => ["Plano Controle", "Plano Pós-Pago", "Internet Movel Mais", "Seguro Movel Celular"],
    []
  );
  const comandaMovelServicoOptions = useMemo(
    () => (REMUNERATION_OPTIONS_BY_PLANO[form.comandaMovelPlano] || []).map((item) => item.label),
    [form.comandaMovelPlano]
  );
  const isRemunerationLocked = remunerationOptions.length > 0;
  const usesInstallationStatus = installationPlanos.includes(currentPlano);
  const usesPortabilitySelector = mobilePlanos.includes(currentPlano);
  const isCurrentMovel = mobilePlanos.includes(currentPlano);
  const isCurrentInternet = currentPlano === "Internet Residencial";
  const isCurrentTv = currentPlano === "TV";
  const isCurrentAparelho = currentPlano === "Aparelho Celular";
  const isCurrentAcessorios = currentPlano === "Acessorios";
  const isCurrentPosPago = currentPlano === "Plano Pós-Pago";
  const isCurrentControle = currentPlano === "Plano Controle";
  const highlightedFieldKeys = ["tipoPlano", "numero", "portabilidade", "iccid", "linhas"];
  const shouldShowPortabilidadeField = !usesPortabilitySelector || form.tipoNumeroPortado === "portabilidade";
  const highlightedExtraFields = extras.filter(
    (fieldConfig) => highlightedFieldKeys.includes(fieldConfig.key) && (fieldConfig.key !== "portabilidade" || shouldShowPortabilidadeField)
  );
  const remainingExtraFields = extras.filter(
    (fieldConfig) => !highlightedFieldKeys.includes(fieldConfig.key) && (fieldConfig.key !== "portabilidade" || shouldShowPortabilidadeField)
  );
  const dependenteContaValue = getRemunerationValue("Plano Pós-Pago", "Dependente Conta") || 0;
  const dependenteBandaLargaValue = getRemunerationValue("Plano Pós-Pago", "Dependente Banda Larga") || 0;
  const dependentesList = Array.isArray(form.posPagoDependentes) ? form.posPagoDependentes : [];
  const dependentesContaQtd = dependentesList.filter((item) => item?.tipo === "Dependente Conta").length;
  const dependentesBandaLargaQtd = dependentesList.filter((item) => item?.tipo === "Dependente Banda Larga").length;
  const dependentesGratisQtd = dependentesList.filter((item) => item?.tipo === "Dependente Gratis").length;
  const dependentesAdicionaisTotal = dependentesContaQtd * dependenteContaValue + dependentesBandaLargaQtd * dependenteBandaLargaValue;
  const canAddPosPagoDependentes = isCurrentPosPago && !!form.tipoPlano && !String(form.tipoPlano).startsWith("Dependente");
  const controleAdicionaisList = Array.isArray(form.controleAdicionais) ? form.controleAdicionais : [];
  const comandaServiceToggles = [
    { key: "comandaMovelAtiva", label: "Móvel" },
    { key: "comandaInternetAtiva", label: "Internet" },
    { key: "comandaTvAtiva", label: "TV" },
    { key: "comandaAparelhoAtiva", label: "Aparelho" },
    { key: "comandaAcessoriosAtiva", label: "Acessórios" },
  ];
  const availableComandaServiceToggles = comandaServiceToggles.filter((toggle) => {
    if (toggle.key === "comandaMovelAtiva") return !isCurrentMovel;
    if (toggle.key === "comandaInternetAtiva") return !isCurrentInternet;
    if (toggle.key === "comandaTvAtiva") return !isCurrentTv;
    if (toggle.key === "comandaAparelhoAtiva") return !isCurrentAparelho;
    if (toggle.key === "comandaAcessoriosAtiva") return !isCurrentAcessorios;
    return true;
  });

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

  useEffect(() => {
    if (!form.comandaMovelAtiva) return;
    if (form.comandaMovelServico) return;
    if (!comandaMovelServicoOptions.length) return;
    setForm((current) => ({ ...current, comandaMovelServico: comandaMovelServicoOptions[0] }));
  }, [form.comandaMovelAtiva, form.comandaMovelServico, comandaMovelServicoOptions]);

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
        tipoNumeroPortado: mobilePlanos.includes(normalizedPlano) ? current.tipoNumeroPortado || "numero-cliente" : current.tipoNumeroPortado,
        posPagoDependentes: normalizedPlano === "Plano Pós-Pago" ? current.posPagoDependentes || [] : [],
        controleAdicionais: normalizedPlano === "Plano Controle" ? current.controleAdicionais || [] : [],
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

  function addDependente(tipo) {
    setForm((current) => {
      const currentList = Array.isArray(current.posPagoDependentes) ? current.posPagoDependentes : [];
      return {
        ...current,
        posPagoDependentes: [...currentList, { tipo, numero: "", portabilidade: "", iccid: "" }],
      };
    });
  }

  function removeDependente(index) {
    setForm((current) => {
      const currentList = Array.isArray(current.posPagoDependentes) ? current.posPagoDependentes : [];
      return {
        ...current,
        posPagoDependentes: currentList.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  function handleDependenteFieldChange(index, field, value) {
    setForm((current) => {
      const currentList = Array.isArray(current.posPagoDependentes) ? current.posPagoDependentes : [];
      const nextList = [...currentList];
      const currentItem = nextList[index] || { tipo: "Dependente Conta", numero: "", portabilidade: "", iccid: "" };
      const nextValue =
        field === "numero" || field === "portabilidade" ? maskPhone(value) : field === "iccid" ? maskICCID(value) : value;
      nextList[index] = { ...currentItem, [field]: nextValue };
      return { ...current, posPagoDependentes: nextList };
    });
  }

  function addControleAdicional() {
    const firstControleOption = (REMUNERATION_OPTIONS_BY_PLANO["Plano Controle"] || [])[0]?.label || "";
    setForm((current) => {
      const currentList = Array.isArray(current.controleAdicionais) ? current.controleAdicionais : [];
      return {
        ...current,
        controleAdicionais: [...currentList, { tipoPlano: firstControleOption, numero: "", tipoNumeroPortado: "numero-cliente", portabilidade: "", iccid: "" }],
      };
    });
  }

  function removeControleAdicional(index) {
    setForm((current) => {
      const currentList = Array.isArray(current.controleAdicionais) ? current.controleAdicionais : [];
      return {
        ...current,
        controleAdicionais: currentList.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  function handleControleAdicionalFieldChange(index, field, value) {
    setForm((current) => {
      const currentList = Array.isArray(current.controleAdicionais) ? current.controleAdicionais : [];
      const nextList = [...currentList];
      const currentItem = nextList[index] || { tipoPlano: "", numero: "", tipoNumeroPortado: "numero-cliente", portabilidade: "", iccid: "" };
      let nextValue = value;
      if (field === "numero" || field === "portabilidade") nextValue = maskPhone(value);
      if (field === "iccid") nextValue = maskICCID(value);
      const nextItem = { ...currentItem, [field]: nextValue };
      if (field === "tipoNumeroPortado" && nextValue !== "portabilidade") {
        nextItem.portabilidade = nextItem.numero || "";
      }
      nextList[index] = nextItem;
      return { ...current, controleAdicionais: nextList };
    });
  }

  function parseNumericInput(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    const compact = raw.replace(/\s/g, "");
    const hasComma = compact.includes(",");
    const hasDot = compact.includes(".");
    let normalized = compact;

    if (hasComma && hasDot) {
      normalized =
        compact.lastIndexOf(",") > compact.lastIndexOf(".")
          ? compact.replace(/\./g, "").replace(",", ".")
          : compact.replace(/,/g, "");
    } else if (hasComma) {
      normalized = compact.replace(",", ".");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function validate() {
    const next = {};
    if (!form.cliente.trim()) next.cliente = "Obrigatório";
    if (form.cpf && !isValidCPF(form.cpf)) next.cpf = "CPF inválido";
    if (!form.plano) next.plano = "Obrigatório";
    if (remunerationOptions.length > 0 && !form.tipoPlano) next.tipoPlano = "Obrigatório";
    if (usesInstallationStatus && !form.statusInstalacao) next.statusInstalacao = "Obrigatório";
    if (!usesInstallationStatus && form.dataInstalacao && !form.statusInstalacao) next.statusInstalacao = "Obrigatório";
    if (!initial && currentPlano === "Aparelho Celular" && form.adicionarSeguro && !form.tipoSeguro) next.tipoSeguro = "Selecione o seguro";
    if (!form.valor || parseNumericInput(form.valor) <= 0) next.valor = "Valor inválido";
    if (!form.data) next.data = "Obrigatório";
    if (!form.vendedorId && currentUser.role === "admin") next.vendedor = "Selecione um vendedor";
    if (!initial && isCurrentControle) {
      const hasInvalidControleAdicional = controleAdicionaisList.some((item) => !item?.tipoPlano);
      if (hasInvalidControleAdicional) next.controleAdicionais = "Preencha o tipo de plano em todas as linhas adicionais";
    }
    return next;
  }

  function validateStep(step) {
    const next = {};

    if (step === 1) {
      if (!form.plano) next.plano = "Obrigatório";
      if (remunerationOptions.length > 0 && !form.tipoPlano) next.tipoPlano = "Obrigatório";
      if (usesInstallationStatus && !form.statusInstalacao) next.statusInstalacao = "Obrigatório";
      if (!usesInstallationStatus && form.dataInstalacao && !form.statusInstalacao) next.statusInstalacao = "Obrigatório";
      return next;
    }

    if (step === 2) {
      if (!form.cliente.trim()) next.cliente = "Obrigatório";
      if (form.cpf && !isValidCPF(form.cpf)) next.cpf = "CPF inválido";
      if (!form.vendedorId && currentUser.role === "admin") next.vendedor = "Selecione um vendedor";
      return next;
    }

    return validate();
  }

  function goNextStep() {
    const nextErrors = validateStep(wizardPage);
    if (Object.keys(nextErrors).length) {
      setErrors((current) => ({ ...current, ...nextErrors }));
      return;
    }
    setErrors({});
    setWizardPage((current) => Math.min(3, current + 1));
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
        comandaSeguroTipo:
          currentPlano === "Aparelho Celular" && form.adicionarSeguro && form.tipoSeguro
            ? form.tipoSeguro
            : form.comandaSeguroTipo || "",
        comandaMovelAtiva: isCurrentMovel ? false : form.comandaMovelAtiva,
        comandaInternetAtiva: isCurrentInternet ? false : form.comandaInternetAtiva,
        comandaTvAtiva: isCurrentTv ? false : form.comandaTvAtiva,
        comandaAparelhoAtiva: isCurrentAparelho ? false : form.comandaAparelhoAtiva,
        comandaAcessoriosAtiva: isCurrentAcessorios ? false : form.comandaAcessoriosAtiva,
        portabilidade:
          usesPortabilitySelector && form.tipoNumeroPortado !== "portabilidade"
            ? form.numero || ""
            : form.portabilidade || "",
        autoSeguro: !initial && currentPlano === "Aparelho Celular" && form.adicionarSeguro ? { tipoPlano: form.tipoSeguro } : null,
        posPagoDependentes: !initial && isCurrentPosPago ? dependentesList : [],
        controleAdicionais: !initial && isCurrentControle ? controleAdicionaisList : [],
        status:
          usesInstallationStatus
            ? form.statusInstalacao === "Instalado"
              ? "Ativa"
              : (form.statusInstalacao === "Nao instalado" || form.statusInstalacao === "Não instalado")
                ? "Cancelada"
                : "Pendente"
            : "Ativa",
        valor: parseNumericInput(form.valor),
        vendedor: currentUser.role === "seller" ? currentUser.nome : form.vendedor,
        vendedorId: currentUser.role === "seller" ? currentUser.id : form.vendedorId,
      });
    } catch (err) {
      if (onFeedback) onFeedback(err.message || "Erro ao salvar venda.", "error");
      else window.alert(err.message || "Erro ao salvar venda.");
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

  const renderMaskedIsoDateInput = (key, error, placeholder = "DD/MM/AAAA") => {
    const draft = dateDrafts[key];
    const displayValue = draft !== undefined ? draft : isoToBR(form[key] || "");

    return (
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        value={displayValue}
        placeholder={placeholder}
        onChange={(e) => {
          const masked = maskDateBR(e.target.value);
          setDateDrafts((current) => ({ ...current, [key]: masked }));
          if (!masked) {
            setField(key, "");
            return;
          }
          const iso = brToIso(masked);
          if (iso) setField(key, iso);
        }}
        onBlur={() => {
          setDateDrafts((current) => {
            const next = { ...current };
            delete next[key];
            return next;
          });
        }}
        style={{ ...inputStyle, borderColor: error ? "#ef4444" : "#334155" }}
      />
    );
  };

  function renderConfiguredField(config) {
    const valueMaskByField = {
      cep: maskCEP,
      numero: maskPhone,
      portabilidade: maskPhone,
      fixo: maskPhone,
      internetFixo: maskPhone,
      iccid: maskICCID,
    };
    const applyMask = valueMaskByField[config.key];

    return (
      <Field key={config.key} label={config.label} error={errors[config.key]}>
        {config.type === "select" ? (
          <select
            value={form[config.key] || ""}
            onChange={(e) => {
              const nextValue = e.target.value;
              if (config.key === "tipoPlano") {
                const remunerationValue = getRemunerationValue(currentPlano, nextValue);
                setForm((current) => ({
                  ...current,
                  tipoPlano: nextValue,
                  valor: remunerationValue !== null ? remunerationValue.toFixed(2) : current.valor,
                  posPagoDependentes:
                    currentPlano === "Plano Pós-Pago" && String(nextValue).startsWith("Dependente") ? [] : current.posPagoDependentes,
                }));
                return;
              }
              setField(config.key, nextValue);
            }}
            style={{ ...inputStyle, appearance: "none", borderColor: errors[config.key] ? "#ef4444" : "#334155" }}
          >
            <option value="">{config.placeholderSelect || "Selecione"}</option>
            {(config.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : config.key === "dataNascimento" ? (
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={formatBirthDateForInput(form[config.key] || "")}
            placeholder="DD/MM/AAAA"
            onChange={(e) => setField(config.key, maskBirthDate(e.target.value))}
            style={{ ...inputStyle, borderColor: errors[config.key] ? "#ef4444" : "#334155" }}
          />
        ) : config.type === "date" ? (
          renderMaskedIsoDateInput(config.key, errors[config.key])
        ) : (
          <input
            type={config.type}
            value={form[config.key] || ""}
            placeholder={config.placeholder}
            onChange={(e) => {
              const rawValue = config.numericOnly ? e.target.value.replace(/\D/g, "") : e.target.value;
              setField(config.key, applyMask ? applyMask(rawValue) : rawValue);
            }}
            style={{ ...inputStyle, borderColor: errors[config.key] ? "#ef4444" : "#334155" }}
          />
        )}
      </Field>
    );
  }

  function renderComandaInput(key, label, type = "text", placeholder = "", options = null) {
    const valueMaskByField = {
      comandaMovelNumero: maskPhone,
      comandaMovelPortabilidade: maskPhone,
      comandaMovelIccid: maskICCID,
    };
    const applyMask = valueMaskByField[key];

    return (
      <Field key={key} label={label}>
        {Array.isArray(options) ? (
          <select
            value={form[key] || ""}
            onChange={(e) => setField(key, e.target.value)}
            style={{ ...inputStyle, appearance: "none", borderColor: "#334155" }}
          >
            <option value="">{placeholder || "Selecione"}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : type === "date" ? (
          renderMaskedIsoDateInput(key, false)
        ) : (
          <input
            type={type}
            value={form[key] || ""}
            placeholder={placeholder}
            onChange={(e) => setField(key, applyMask ? applyMask(e.target.value) : e.target.value)}
            style={{ ...inputStyle, borderColor: "#334155" }}
          />
        )}
      </Field>
    );
  }

  return (
    <div>
      <div
        style={{
          border: "1px solid #164e63",
          background: "linear-gradient(135deg, rgba(8,145,178,0.2), rgba(22,78,99,0.2))",
          borderRadius: 14,
          padding: "9px 12px",
          marginBottom: 12,
          color: "#a5f3fc",
          fontSize: 12,
          lineHeight: 1.35,
        }}
      >
        Escolha plano e cliente para continuar.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          ["1", "Escolha do Plano"],
          ["2", "Dados do cliente"],
          ["3", "Dados da venda"],
        ].map(([idx, label]) => {
          const step = Number(idx);
          const isActive = wizardPage === step;
          const isDone = wizardPage > step;
          return (
          <div key={idx} style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: isActive || isDone ? "#1e3a8a" : "rgba(30,41,59,0.8)",
                  border: isActive || isDone ? "1px solid #3b82f6" : "1px solid #334155",
                  color: isActive || isDone ? "#dbeafe" : "#94a3b8",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {idx}
              </span>
              <div style={{ height: 2, flex: 1, background: isDone ? "rgba(59,130,246,0.55)" : "rgba(59,130,246,0.2)", borderRadius: 999 }} />
            </div>
            <div style={{ color: isActive || isDone ? "#cbd5e1" : "#64748b", fontSize: 12, fontWeight: 700 }}>{label}</div>
          </div>
        )})}
      </div>

      {wizardPage === 1 && (
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Escolha do plano</label>
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
                padding: "10px 8px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                transition: "all 0.18s",
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 15,
                  background: `radial-gradient(circle at 30% 30%, ${PLANO_COLORS[plano]}66, ${PLANO_COLORS[plano]}22)`,
                  border: `1px solid ${PLANO_COLORS[plano]}66`,
                  boxShadow: `0 8px 14px ${PLANO_COLORS[plano]}33`,
                }}
              >
                {PLANO_ICONS[plano]}
              </span>
              <span style={{ fontSize: 11, color: currentPlano === plano ? PLANO_COLORS[plano] : "#94a3b8", fontWeight: 700, textAlign: "center", lineHeight: 1.15 }}>
                {PLANO_LABELS[plano]}
              </span>
            </button>
          ))}
        </div>
        {(usesPortabilitySelector || highlightedExtraFields.length > 0) && (
          <div style={{ marginTop: 12, border: "1px solid #1e293b", borderRadius: 12, padding: 12, background: "rgba(15,23,42,0.35)" }}>
            <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Campos principais do plano</div>
            {usesPortabilitySelector && (
              <div style={{ marginBottom: 12 }}>
                <Field label="Numero portado">
                  <select
                    value={form.tipoNumeroPortado || "numero-cliente"}
                    onChange={(e) => setField("tipoNumeroPortado", e.target.value)}
                    style={{ ...inputStyle, appearance: "none", borderColor: "#334155", maxWidth: 320 }}
                  >
                    <option value="numero-cliente">Habilitação Nova</option>
                    <option value="portabilidade">Portabilidade</option>
                  </select>
                </Field>
              </div>
            )}
            {highlightedExtraFields.length > 0 && (
              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                {highlightedExtraFields.map((fieldConfig) => renderConfiguredField(fieldConfig))}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {wizardPage === 2 && (
      <div
        className="form-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Dados do cliente" error={errors.cliente}>
            {inp("cliente", "text", "Digite o nome do cliente")}
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
                  {String(seller.nome || "").toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Vendedor">
            <input value={String(currentUser.nome || "").toUpperCase()} disabled style={{ ...inputStyle, opacity: 0.8, cursor: "not-allowed" }} />
          </Field>
        )}
      </div>
      )}

      {wizardPage === 3 && (
      <div
        className="form-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        <div style={{ gridColumn: "1/-1" }}>
          <Field label="Descrição / observação">{inp("descricao", "text", "Detalhes da venda...")}</Field>
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
            {isRemunerationLocked && <div style={{ marginTop: 6, fontSize: 11, color: "#67e8f9" }}>Valor preenchido automaticamente para remuneração.</div>}
          </div>
        </Field>
        <Field label="Data da venda" error={errors.data}>
          {renderMaskedIsoDateInput("data", errors.data)}
        </Field>
      </div>
      )}

      {wizardPage === 3 && extras.length > 0 && (
        <div style={{ borderTop: "1px solid #1e293b", margin: "6px 0 16px", paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: PLANO_COLORS[currentPlano], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                background: `${PLANO_COLORS[currentPlano]}22`,
                border: `1px solid ${PLANO_COLORS[currentPlano]}66`,
              }}
            >
              {PLANO_ICONS[currentPlano]}
            </span>
            Dados do {PLANO_LABELS[currentPlano]}
          </div>
          {remainingExtraFields.length > 0 && (
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {remainingExtraFields.map((fieldConfig) => renderConfiguredField(fieldConfig))}
            </div>
          )}
          {!initial && canAddPosPagoDependentes && (
            <div style={{ marginTop: 12, borderTop: "1px dashed #334155", paddingTop: 12 }}>
              <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Dependentes do pós-pago</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => addDependente("Dependente Conta")}
                  style={{ ...btnSecondary, padding: "8px 12px", fontSize: 12 }}
                >
                  + Dependente Conta
                </button>
                <button
                  type="button"
                  onClick={() => addDependente("Dependente Banda Larga")}
                  style={{ ...btnSecondary, padding: "8px 12px", fontSize: 12 }}
                >
                  + Dependente Banda Larga
                </button>
                <button
                  type="button"
                  onClick={() => addDependente("Dependente Gratis")}
                  style={{ ...btnSecondary, padding: "8px 12px", fontSize: 12 }}
                >
                  + Dependente Gratis
                </button>
              </div>
              {dependentesList.length > 0 && (
                <div style={{ display: "grid", gap: 10 }}>
                  {dependentesList.map((dependente, index) => (
                    <div key={`dep-${index}`} style={{ border: "1px solid #334155", borderRadius: 10, padding: 10, background: "rgba(15,23,42,0.5)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8, alignItems: "center" }}>
                        <div style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 700 }}>Dependente {index + 1}</div>
                        <button
                          type="button"
                          onClick={() => removeDependente(index)}
                          style={{ ...btnSecondary, padding: "6px 10px", fontSize: 11 }}
                        >
                          Remover
                        </button>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span
                          style={{
                            display: "inline-block",
                            border: "1px solid #334155",
                            borderRadius: 999,
                            padding: "4px 10px",
                            fontSize: 12,
                            color: "#cbd5e1",
                            background: "rgba(15,23,42,0.7)",
                          }}
                        >
                          {dependente?.tipo || "Dependente Conta"}
                        </span>
                      </div>
                      <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                        <Field label="Telefone">
                          <input
                            type="text"
                            value={dependente?.numero || ""}
                            placeholder="Ex: (41) 99999-0000"
                            onChange={(e) => handleDependenteFieldChange(index, "numero", e.target.value)}
                            style={{ ...inputStyle, borderColor: "#334155" }}
                          />
                        </Field>
                        <Field label="Portabilidade">
                          <input
                            type="text"
                            value={dependente?.portabilidade || ""}
                            placeholder="Ex: (41) 98888-7777"
                            onChange={(e) => handleDependenteFieldChange(index, "portabilidade", e.target.value)}
                            style={{ ...inputStyle, borderColor: "#334155" }}
                          />
                        </Field>
                        <Field label="ICCID">
                          <input
                            type="text"
                            value={dependente?.iccid || ""}
                            placeholder="Ex: 8955..."
                            onChange={(e) => handleDependenteFieldChange(index, "iccid", e.target.value)}
                            style={{ ...inputStyle, borderColor: "#334155" }}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 6, fontSize: 12, color: "#93c5fd" }}>
                Dependentes adicionais: {dependentesList.length} | Conta: {dependentesContaQtd} | Banda Larga: {dependentesBandaLargaQtd} | Gratis: {dependentesGratisQtd} | Valor adicional: R$ {dependentesAdicionaisTotal.toFixed(2)}
              </div>
            </div>
          )}
          {!initial && isCurrentControle && (
            <div style={{ marginTop: 12, borderTop: "1px dashed #334155", paddingTop: 12 }}>
              <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Linhas extras de Controle no mesmo lançamento</div>
              <button
                type="button"
                onClick={addControleAdicional}
                style={{ ...btnSecondary, padding: "8px 12px", fontSize: 12, marginBottom: 10 }}
              >
                + Adicionar linha de Controle
              </button>
              {errors.controleAdicionais && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{errors.controleAdicionais}</div>}
              {controleAdicionaisList.length > 0 && (
                <div style={{ display: "grid", gap: 10 }}>
                  {controleAdicionaisList.map((item, index) => (
                    <div key={`controle-extra-${index}`} style={{ border: "1px solid #334155", borderRadius: 10, padding: 10, background: "rgba(15,23,42,0.5)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8, alignItems: "center" }}>
                        <div style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 700 }}>Linha extra {index + 1}</div>
                        <button type="button" onClick={() => removeControleAdicional(index)} style={{ ...btnSecondary, padding: "6px 10px", fontSize: 11 }}>
                          Remover
                        </button>
                      </div>
                      <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                        <Field label="Tipo de Plano">
                          <select
                            value={item?.tipoPlano || ""}
                            onChange={(e) => handleControleAdicionalFieldChange(index, "tipoPlano", e.target.value)}
                            style={{ ...inputStyle, appearance: "none", borderColor: "#334155" }}
                          >
                            <option value="">Selecione</option>
                            {(REMUNERATION_OPTIONS_BY_PLANO["Plano Controle"] || []).map((option) => (
                              <option key={option.label} value={option.label}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Numero do cliente">
                          <input
                            type="text"
                            value={item?.numero || ""}
                            placeholder="Ex: (41) 99999-0000"
                            onChange={(e) => handleControleAdicionalFieldChange(index, "numero", e.target.value)}
                            style={{ ...inputStyle, borderColor: "#334155" }}
                          />
                        </Field>
                        <Field label="Numero portado">
                          <select
                            value={item?.tipoNumeroPortado || "numero-cliente"}
                            onChange={(e) => handleControleAdicionalFieldChange(index, "tipoNumeroPortado", e.target.value)}
                            style={{ ...inputStyle, appearance: "none", borderColor: "#334155" }}
                          >
                            <option value="numero-cliente">Habilitação Nova</option>
                            <option value="portabilidade">Portabilidade</option>
                          </select>
                        </Field>
                        <Field label="Numero da portabilidade">
                          <input
                            type="text"
                            value={item?.portabilidade || ""}
                            placeholder="Ex: (41) 98888-7777"
                            onChange={(e) => handleControleAdicionalFieldChange(index, "portabilidade", e.target.value)}
                            style={{ ...inputStyle, borderColor: "#334155", opacity: item?.tipoNumeroPortado === "portabilidade" ? 1 : 0.7 }}
                            disabled={item?.tipoNumeroPortado !== "portabilidade"}
                          />
                        </Field>
                        <Field label="ICCID">
                          <input
                            type="text"
                            value={item?.iccid || ""}
                            placeholder="Ex: 8955..."
                            onChange={(e) => handleControleAdicionalFieldChange(index, "iccid", e.target.value)}
                            style={{ ...inputStyle, borderColor: "#334155" }}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 6, fontSize: 12, color: "#93c5fd" }}>Linhas adicionais de Controle: {controleAdicionaisList.length}</div>
            </div>
          )}
        </div>
      )}

      {wizardPage === 3 && (
      <>
      <div style={{ borderTop: "1px solid #1e293b", margin: "10px 0 16px", paddingTop: 16 }}>
        <div style={{ fontSize: 11, color: "#67e8f9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
          Dados da comanda
        </div>
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          {COMANDA_COMMON_FIELDS.map((fieldConfig) => renderConfiguredField(fieldConfig))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #1e293b", margin: "10px 0 16px", paddingTop: 16 }}>
        <div style={{ fontSize: 11, color: "#22d3ee", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          Comanda unificada (opcional)
        </div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>Ative apenas os serviços extras que quer incluir na mesma comanda.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {availableComandaServiceToggles.map((toggle) => {
            const active = Boolean(form[toggle.key]);
            return (
              <button
                key={toggle.key}
                type="button"
                onClick={() =>
                  setForm((current) => {
                    const nextActive = !active;
                    const next = { ...current, [toggle.key]: nextActive };
                    if (toggle.key === "comandaInternetAtiva" && nextActive && !next.comandaInternetPlano) {
                      next.comandaInternetPlano = internetPlanOptions[0] || "";
                    }
                    if (toggle.key === "comandaTvAtiva" && nextActive && !next.comandaTvPlano) {
                      next.comandaTvPlano = tvPlanOptions[0] || "";
                    }
                    if (toggle.key === "comandaMovelAtiva" && nextActive && !next.comandaMovelServico) {
                      const options = REMUNERATION_OPTIONS_BY_PLANO[next.comandaMovelPlano] || [];
                      next.comandaMovelServico = options[0]?.label || "";
                    }
                    return next;
                  })
                }
                style={{
                  border: `1px solid ${active ? "#22d3ee" : "#334155"}`,
                  background: active ? "rgba(34,211,238,0.15)" : "rgba(15,23,42,0.7)",
                  color: active ? "#67e8f9" : "#94a3b8",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {toggle.label}
              </button>
            );
          })}
        </div>

        {!isCurrentMovel && form.comandaMovelAtiva && (
          <div style={{ marginBottom: 12, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Móvel</div>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Field label="Plano móvel">
                <select
                  value={form.comandaMovelPlano || "Plano Controle"}
                  onChange={(e) => {
                    const nextPlano = e.target.value;
                    const options = REMUNERATION_OPTIONS_BY_PLANO[nextPlano] || [];
                    setForm((current) => ({
                      ...current,
                      comandaMovelPlano: nextPlano,
                      comandaMovelServico: options[0]?.label || "",
                    }));
                  }}
                  style={{ ...inputStyle, appearance: "none", borderColor: "#334155" }}
                >
                  {comandaMovelPlanoOptions.map((option) => (
                    <option key={option} value={option}>
                      {PLANO_LABELS[option] || option}
                    </option>
                  ))}
                </select>
              </Field>
              {renderComandaInput("comandaMovelServico", "Serviço móvel", "text", "Selecione", comandaMovelServicoOptions)}
              {renderComandaInput("comandaMovelNumero", "Número do cliente", "text", "Ex: (41) 99999-0000")}
              {renderComandaInput("comandaMovelPortabilidade", "Número portado (se houver)", "text", "Ex: (41) 98888-7777")}
              {renderComandaInput("comandaMovelIccid", "ICCID", "text", "Ex: 8955...")}
            </div>
          </div>
        )}

        {!isCurrentInternet && form.comandaInternetAtiva && (
          <div style={{ marginBottom: 12, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Internet</div>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {renderComandaInput("comandaInternetPlano", "Plano de internet", "text", "Selecione", internetPlanOptions)}
              {renderComandaInput("comandaInternetDataInstalacao", "Data da instalação", "date")}
              {renderComandaInput("comandaInternetContrato", "Contrato", "text", "Ex: 884/7876765")}
              {renderComandaInput("comandaInternetPeriodo", "Período", "text", "Ex: 8:00 as 12:00")}
              {renderComandaInput("comandaInternetHfcGpon", "HFC / Gpon", "text", "Ex: GPON")}
            </div>
          </div>
        )}

        {!isCurrentTv && form.comandaTvAtiva && (
          <div style={{ marginBottom: 12, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>TV</div>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {renderComandaInput("comandaTvPlano", "Plano de TV", "text", "Selecione", tvPlanOptions)}
              {renderComandaInput("comandaTvDataInstalacao", "Data da instalação", "date")}
              {renderComandaInput("comandaTvContrato", "Contrato", "text", "Ex: 884/7876765")}
              {renderComandaInput("comandaTvBoxImediata", "BOX imediata", "text", "Ex: 2461356789")}
            </div>
          </div>
        )}

        {!isCurrentAparelho && form.comandaAparelhoAtiva && (
          <div style={{ marginBottom: 12, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Aparelho</div>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {renderComandaInput("comandaAparelhoModelo", "Modelo", "text", "Ex: MOTOROLA G35")}
              {renderComandaInput("comandaAparelhoImei", "IMEI", "text", "Ex: 353044842...")}
              {renderComandaInput("comandaAparelhoValor", "Valor no pré", "number", "0,00")}
            </div>
          </div>
        )}

        {!isCurrentAcessorios && form.comandaAcessoriosAtiva && (
          <div style={{ marginBottom: 4, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Acessórios</div>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {renderComandaInput("comandaAcessoriosDescricao", "Descrição", "text", "Ex: Fone + capa")}
              {renderComandaInput("comandaAcessoriosQuantidade", "Quantidade", "number", "1")}
              {renderComandaInput("comandaAcessoriosValor", "Valor de receita", "number", "0,00")}
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {wizardPage === 3 && !initial && currentPlano === "Aparelho Celular" && (
        <div style={{ borderTop: "1px solid #1e293b", margin: "6px 0 16px", paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            🛡️ Seguro automático
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

      {wizardPage < 3 ? (
        <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "space-between", marginTop: 10 }}>
          <div style={{ display: "flex", gap: 12 }}>
            {wizardPage > 1 && (
              <button className="touch-btn" style={btnSecondary} onClick={() => setWizardPage((current) => Math.max(1, current - 1))}>
                Voltar
              </button>
            )}
            <button className="touch-btn" style={btnSecondary} onClick={onClose}>
              Cancelar
            </button>
          </div>
          <button className="touch-btn lift-hover" style={{ ...btnPrimary, minWidth: 180 }} onClick={goNextStep}>
            Continuar
          </button>
        </div>
      ) : (
        <div className="modal-actions" style={{ display: "flex", gap: 12, justifyContent: "space-between", marginTop: 8 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="touch-btn" style={btnSecondary} onClick={() => setWizardPage(2)}>
              Voltar
            </button>
            <button className="touch-btn" style={btnSecondary} onClick={onClose}>
              Cancelar
            </button>
          </div>
          <button className="touch-btn lift-hover" style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }} onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : initial ? "Salvar alterações" : "Registrar venda"}
          </button>
        </div>
      )}
    </div>
  );
}
