export const STORAGE_KEYS = {
  vendas: "telefonia_vendas_v2",
  users: "telefonia_users_v1",
  legacyVendas: "telefonia_vendas_v1",
  backendMigration: "telefonia_backend_migration_v1",
  currentCycleMonth: "telefonia_current_cycle_month_v1",
  goalsByMonth: "telefonia_goals_by_month_v1",
  vendasSync: "telefonia_vendas_sync_v1",
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
  "Plano Pós-Pago": "Pós-pago",
  "Internet Residencial": "Internet",
  "Internet Movel Mais": "Internet Móvel Mais",
  TV: "TV",
  "Aparelho Celular": "Aparelho",
  Acessorios: "Acessórios",
  "Seguro Movel Celular": "Seguro",
};

export const PLANO_ICONS = {
  "Plano Controle": "phone",
  "Plano Pós-Pago": "phone",
  "Internet Residencial": "wifi",
  "Internet Movel Mais": "signal",
  TV: "tv",
  "Aparelho Celular": "device",
  Acessorios: "headset",
  "Seguro Movel Celular": "shield",
};

export const PLANO_COLORS = {
  "Plano Controle": "#DA291C",
  "Plano Pós-Pago": "#C6241A",
  "Internet Residencial": "#B71C1C",
  "Internet Movel Mais": "#E63A2B",
  TV: "#DA291C",
  "Aparelho Celular": "#B71C1C",
  Acessorios: "#DA291C",
  "Seguro Movel Celular": "#E63A2B",
};

export const REMUNERATION_OPTIONS_BY_PLANO = {
  "Plano Controle": [
    { label: "Claro Controle 40GB GeForce (No Multi)", value: 99.9 },
    { label: "Claro Controle 40GB GeForce (Single)", value: 99.9 },
    { label: "Claro Controle 40GB (No Multi)", value: 69.9 },
    { label: "Claro Controle 40GB (Single)", value: 69.9 },
    { label: "Claro Controle 35GB (No Multi)", value: 49.9 },
    { label: "Claro Controle 35GB (Single)", value: 59.9 },
  ],
  "Plano Pós-Pago": [
    { label: "Dependente Conta", value: 55.0 },
    { label: "Dependente Banda Larga", value: 60.0 },
    { label: "Claro Pós 50GB (Single)", value: 124.9 },
    { label: "Claro Pós 50GB GeForce NOW (Single)", value: 164.9 },
    { label: "Claro Pós 100GB (Single)", value: 179.9 },
    { label: "Claro Pós 150GB (Single)", value: 239.9 },
    { label: "Claro Pós 200GB (Single)", value: 339.9 },
    { label: "Claro Pós 500GB (Single)", value: 849.9 },
    { label: "Claro Pós 50GB (Multi)", value: 80.0 },
    { label: "Claro Pós 50GB GeForce NOW (Multi)", value: 120.0 },
    { label: "Claro Pós 100GB (Multi)", value: 125.0 },
    { label: "Claro Pós 150GB (Multi)", value: 180.0 },
    { label: "Claro Pós 200GB (Multi)", value: 240.0 },
    { label: "Claro Pós 500GB (Multi)", value: 800.0 },
  ],
  "Internet Residencial": [
    { label: "Fibra 350 Mega (claro Multi) ", value: 79.9 },
    { label: "Fibra 350 Mega (claro Single) ", value: 99.9 },
    { label: "Fibra 500 Mega (Claro Multi)", value: 99.9 },
    { label: "Fibra 500 Mega (Single)", value: 119.9 },
    { label: "Fibra 600 Mega (Claro Multi)", value: 99.9 },
    { label: "Fibra 600 Mega (Claro Single)", value: 119.9 },
    { label: "Fibra 1 Giga (Claro Multi)", value: 149.9 },
    { label: "Fibra 1 Giga (Single)", value: 199.9 },
    { label: "Fibra 5 Giga (Claro Multi)", value: 449.9 },
    { label: "Fibra 5 Giga (Single)", value: 499.9 },
    { label: "Fibra 10 Giga (Claro Multi)", value: 1949.9 },
    { label: "Fibra 10 Giga (Single)", value: 1999.9 },
  ],
  "Internet Movel Mais": [
    { label: "Claro Internet Móvel 120GB", value: 199.9 },
    { label: "Claro Internet Móvel 5G 200GB", value: 199.9 },
    { label: "Claro Internet Móvel 5G 400GB", value: 399.9 },
  ],
  TV: [
    { label: "Claro TV + 6 Streams (Áreas Cabeadas)", value: 99.9 },
    { label: "Claro TV + 6 Streams (Áreas Não Cabeadas)", value: 109.9 },
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

export const INSTALLATION_STATUS_OPTIONS = ["Pendente", "Instalado", "Não instalado"];

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
    { key: "numero", label: "Número Provisório / Cliente", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "portabilidade", label: "Número da Portabilidade", type: "text", placeholder: "Ex: (41) 98765-1234" },
    { key: "iccid", label: "ICCID", type: "text", placeholder: "Ex: 8955053164000601" },
  ],
  "Plano Pós-Pago": [
    {
      key: "tipoPlano",
      label: "Tipo de Plano",
      type: "select",
      placeholderSelect: "Selecione o tipo do plano",
      options: REMUNERATION_OPTIONS_BY_PLANO["Plano Pós-Pago"].map((item) => item.label),
    },
    { key: "numero", label: "Número Provisório / Cliente", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "portabilidade", label: "Número da Portabilidade", type: "text", placeholder: "Ex: (41) 98888-7777" },
    { key: "iccid", label: "ICCID", type: "text", placeholder: "Ex: 8955053164000601" },
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
    { key: "dataInstalacao", label: "Data de Instalação", type: "date" },
    { key: "statusInstalacao", label: "Status da Instalação", type: "select", placeholderSelect: "Selecione o status", options: INSTALLATION_STATUS_OPTIONS },
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
    { key: "numero", label: "Número Provisório / Cliente", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "portabilidade", label: "Número da Portabilidade", type: "text", placeholder: "Ex: (41) 98888-7777" },
    { key: "iccid", label: "ICCID", type: "text", placeholder: "Ex: 8955053164000601" },
  ],
  TV: [
    {
      key: "tipoPlano",
      label: "Tipo de Plano",
      type: "select",
      placeholderSelect: "Selecione o tipo do plano",
      options: REMUNERATION_OPTIONS_BY_PLANO.TV.map((item) => item.label),
    },
    { key: "dataInstalacao", label: "Data de Instalação", type: "date" },
    { key: "statusInstalacao", label: "Status da Instalação", type: "select", placeholderSelect: "Selecione o status", options: INSTALLATION_STATUS_OPTIONS },
    { key: "pacote", label: "Streaming", type: "text", placeholder: "Ex: Box 4K" },
    { key: "contrato", label: "Contrato", type: "text", placeholder: "Ex: 884/12345678-9", numericOnly: true },
  ],
  "Aparelho Celular": [
    { key: "modelo", label: "Modelo", type: "text", placeholder: "Ex: iPhone 15" },
    { key: "imei", label: "IMEI", type: "text", placeholder: "15 digitos" },
    { key: "cor", label: "Cor", type: "text", placeholder: "Ex: Preto" },
    { key: "memoria", label: "Memória", type: "text", placeholder: "Ex: 128GB" },
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
    { key: "numero", label: "Número Provisório / Cliente", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "portabilidade", label: "Número da Portabilidade", type: "text", placeholder: "Ex: (41) 98888-7777" },
    { key: "iccid", label: "ICCID", type: "text", placeholder: "Ex: 88955053164000601" },
  ],
};

export const STATUS_OPTIONS = ["Ativa", "Pendente", "Cancelada"];
export const STATUS_COLORS = { Ativa: "#22C55E", Pendente: "#FACC15", Cancelada: "#EF4444" };
export const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const PIE_COLORS = ["#DA291C", "#C6241A", "#B71C1C", "#E63A2B", "#DA291C", "#B71C1C", "#E63A2B"];

const INSTALLATION_PLANOS = ["Internet Residencial", "TV"];

export function getVendaStatusLabel(status, plano) {
  if (!INSTALLATION_PLANOS.includes(plano)) return status;
  if (status === "Ativa") return "Instalado";
  if (status === "Pendente") return "Pendente de instalação";
  return "Cancelada";
}
