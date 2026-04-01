export const STORAGE_KEYS = {
  vendas: "telefonia_vendas_v2",
  users: "telefonia_users_v1",
  legacyVendas: "telefonia_vendas_v1",
  backendMigration: "telefonia_backend_migration_v1",
  currentCycleMonth: "telefonia_current_cycle_month_v1",
};

export const PLANOS = [
  "Plano Controle",
  "Plano Pós-Pago",
  "Internet Residencial",
  "Internet Movel Mais",
  "TV",
  "Aparelho Celular",
  "Acessorios",
  "Seguro Movel Celular",
];

export const PLANO_LABELS = {
  "Plano Controle": "Controle",
  "Plano Pós-Pago": "Pos-pago",
  "Internet Residencial": "Internet",
  "Internet Movel Mais": "Internet Movel Mais",
  TV: "TV",
  "Aparelho Celular": "Aparelho",
  Acessorios: "Acessorios",
  "Seguro Movel Celular": "Seguro",
};

export const PLANO_ICONS = {
  "Plano Controle": "📱",
  "Plano Pós-Pago": "📱",
  "Internet Residencial": "🌐",
  "Internet Movel Mais": "📶",
  TV: "📺",
  "Aparelho Celular": "📲",
  Acessorios: "🎧",
  "Seguro Movel Celular": "🛡️",
};

export const PLANO_COLORS = {
  "Plano Controle": "#6366f1",
  "Plano Pós-Pago": "#8b5cf6",
  "Internet Residencial": "#06b6d4",
  "Internet Movel Mais": "#0ea5e9",
  TV: "#f59e0b",
  "Aparelho Celular": "#10b981",
  Acessorios: "#ec4899",
  "Seguro Movel Celular": "#f97316",
};

export const REMUNERATION_OPTIONS_BY_PLANO = {
  "Plano Controle": [
    { label: "CLARO CONTROLE 2025 ON+ 15GB + 5GB", value: 54.9 },
    { label: "CLARO CONTROLE 2025 ON+ 20GB + 5GB", value: 59.9 },
    { label: "Claro Flex 8GB", value: 39.99 },
    { label: "Claro Flex 10GB", value: 49.99 },
    { label: "Claro Flex 30GB", value: 69.99 },
  ],
  "Plano Pós-Pago": [
    { label: "Dependente Banda Larga", value: 1.0 },
    { label: "Dependente Conta", value: 30.0 },
    { label: "Claro Pós ON 25GB - Combo", value: 49.9 },
    { label: "Claro Pós ON 25GB", value: 109.9 },
    { label: "Claro Pós ON 50GB Multi", value: 109.9 },
    { label: "Claro Pós ON 50GB", value: 159.9 },
    { label: "Claro Pós ON 100GB Multi", value: 159.9 },
    { label: "Claro Pós ON 75GB", value: 209.9 },
    { label: "Claro Pós ON 150GB Multi", value: 209.9 },
    { label: "Claro Pós ON 150GB", value: 309.9 },
    { label: "Claro Pós ON 300GB Combo", value: 309.9 },
  ],
  "Internet Residencial": [
    { label: "Ilimitado Brasil", value: 35.0 },
    { label: "VIRTUA 350 MB", value: 99.9 },
    { label: "VIRTUA 600 MB", value: 119.9 },
    { label: "VIRTUA 400 PME", value: 79.0 },
    { label: "VIRTUA 600 MB PME", value: 190.0 },
    { label: "VIRTUA 800 MB PME", value: 109.9 },
    { label: "VIRTUA 1 GB", value: 199.9 },
    { label: "VIRTUA 750 MB", value: 129.9 },
  ],
  "Internet Movel Mais": [
    { label: "Claro Internet Mais 20GB", value: 69.9 },
    { label: "Claro Internet Mais 20GB + Noites em Claro", value: 79.9 },
    { label: "Claro Internet Mais 40GB", value: 89.9 },
    { label: "Claro Internet Mais 40GB + Noites em Claro", value: 99.9 },
    { label: "Claro Internet Mais 120GB", value: 109.9 },
    { label: "Claro Internet Mais 120GB + Noites em Claro", value: 119.9 },
    { label: "Claro Internet Móvel 5G+ 200GB", value: 189.9 },
    { label: "Claro Internet Móvel 5G+ 400GB", value: 389.9 },
  ],
  TV: [
    { label: "Claro TV MAIS 4K", value: 126.0 },
    { label: "Claro TV MAIS BOX", value: 96.0 },
    { label: "Claro TV Mais SoundBox", value: 136.0 },
  ],
  "Seguro Movel Celular": [
    { label: "Seguro R$ 17,00", value: 6.8 },
    { label: "Seguro R$ 25,00", value: 10.0 },
    { label: "Seguro R$ 35,00", value: 14.0 },
    { label: "Seguro R$ 45,00", value: 18.0 },
    { label: "Seguro R$ 55,00", value: 22.0 },
    { label: "Seguro R$ 60,00", value: 24.0 },
  ],
};

export function getRemunerationValue(plano, tipoPlano) {
  const options = REMUNERATION_OPTIONS_BY_PLANO[plano] || [];
  const found = options.find((item) => item.label === tipoPlano);
  return found ? found.value : null;
}

export const INSTALLATION_STATUS_OPTIONS = ["Pendente", "Instalado", "Nao instalado"];

export const COMANDA_COMMON_FIELDS = [
  { key: "ordemVenda", label: "Ordem de venda", type: "text", placeholder: "Ex: 129342591" },
  { key: "cep", label: "CEP", type: "text", placeholder: "Ex: 82130-110" },
  { key: "dataNascimento", label: "Data de nascimento", type: "date" },
];

export const PLANO_EXTRAS = {
  "Plano Controle": [
    {
      key: "tipoPlano",
      label: "Tipo de Plano",
      type: "select",
      placeholderSelect: "Selecione o tipo do plano",
      options: REMUNERATION_OPTIONS_BY_PLANO["Plano Controle"].map((item) => item.label),
    },
    { key: "numero", label: "Numero do Cliente", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "portabilidade", label: "Numero da Portabilidade", type: "text", placeholder: "Ex: (41) 98765-1234" },
    { key: "iccid", label: "ICCID", type: "text", placeholder: "Ex: 8955053165000***" },
  ],
  "Plano Pós-Pago": [
    {
      key: "tipoPlano",
      label: "Tipo de Plano",
      type: "select",
      placeholderSelect: "Selecione o tipo do plano",
      options: REMUNERATION_OPTIONS_BY_PLANO["Plano Pós-Pago"].map((item) => item.label),
    },
    { key: "numero", label: "Numero do Cliente", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "portabilidade", label: "Numero da Portabilidade", type: "text", placeholder: "Ex: (41) 98888-7777" },
    { key: "iccid", label: "ICCID", type: "text", placeholder: "Ex: 8955..." },
    { key: "linhas", label: "Qtd. Linhas", type: "number", placeholder: "1" },
  ],
  "Internet Residencial": [
    {
      key: "tipoPlano",
      label: "Tipo de Plano",
      type: "select",
      placeholderSelect: "Selecione o tipo do plano",
      options: REMUNERATION_OPTIONS_BY_PLANO["Internet Residencial"].map((item) => item.label),
    },
    { key: "dataInstalacao", label: "Data de Instalacao", type: "date" },
    { key: "statusInstalacao", label: "Status da Instalacao", type: "select", placeholderSelect: "Selecione o status", options: INSTALLATION_STATUS_OPTIONS },
    { key: "contrato", label: "Contrato", type: "text", placeholder: "Ex: 884/12345678-9", numericOnly: true },
  ],
  "Internet Movel Mais": [
    {
      key: "tipoPlano",
      label: "Tipo de Plano",
      type: "select",
      placeholderSelect: "Selecione o tipo do plano",
      options: REMUNERATION_OPTIONS_BY_PLANO["Internet Movel Mais"].map((item) => item.label),
    },
    { key: "numero", label: "Numero do Cliente", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "portabilidade", label: "Numero da Portabilidade", type: "text", placeholder: "Ex: (41) 98888-7777" },
    { key: "iccid", label: "ICCID", type: "text", placeholder: "Ex: 8955..." },
  ],
  TV: [
    {
      key: "tipoPlano",
      label: "Tipo de Plano",
      type: "select",
      placeholderSelect: "Selecione o tipo do plano",
      options: REMUNERATION_OPTIONS_BY_PLANO.TV.map((item) => item.label),
    },
    { key: "dataInstalacao", label: "Data de Instalacao", type: "date" },
    { key: "statusInstalacao", label: "Status da Instalacao", type: "select", placeholderSelect: "Selecione o status", options: INSTALLATION_STATUS_OPTIONS },
    { key: "pacote", label: "Streaming", type: "text", placeholder: "Ex: Box 4K" },
    { key: "contrato", label: "Contrato", type: "text", placeholder: "Ex: 884/12345678-9", numericOnly: true },
  ],
  "Aparelho Celular": [
    { key: "modelo", label: "Modelo", type: "text", placeholder: "Ex: iPhone 15" },
    { key: "imei", label: "IMEI", type: "text", placeholder: "15 digitos" },
    { key: "cor", label: "Cor", type: "text", placeholder: "Ex: Preto" },
    { key: "memoria", label: "Memoria", type: "text", placeholder: "Ex: 128GB" },
  ],
  Acessorios: [
    { key: "modelo", label: "Produto / Modelo", type: "text", placeholder: "Ex: Capinha, Fone..." },
    { key: "qty", label: "Quantidade", type: "number", placeholder: "1" },
  ],
  "Seguro Movel Celular": [
    {
      key: "tipoPlano",
      label: "Tipo de Plano",
      type: "select",
      placeholderSelect: "Selecione o tipo do plano",
      options: REMUNERATION_OPTIONS_BY_PLANO["Seguro Movel Celular"].map((item) => item.label),
    },
    { key: "numero", label: "Numero do Cliente", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "portabilidade", label: "Numero da Portabilidade", type: "text", placeholder: "Ex: (41) 98888-7777" },
    { key: "iccid", label: "ICCID", type: "text", placeholder: "Ex: 8955..." },
  ],
};

export const STATUS_OPTIONS = ["Ativa", "Pendente", "Cancelada"];
export const STATUS_COLORS = { Ativa: "#10b981", Pendente: "#f59e0b", Cancelada: "#ef4444" };
export const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const PIE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#f97316"];

const INSTALLATION_PLANOS = ["Internet Residencial", "TV"];

export function getVendaStatusLabel(status, plano) {
  if (!INSTALLATION_PLANOS.includes(plano)) return status;
  if (status === "Ativa") return "Instalado";
  if (status === "Pendente") return "Pendente de instalacao";
  return "Cancelada";
}
