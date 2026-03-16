export const STORAGE_KEYS = {
  vendas: "telefonia_vendas_v2",
  users: "telefonia_users_v1",
  legacyVendas: "telefonia_vendas_v1",
  backendMigration: "telefonia_backend_migration_v1",
};

export const PLANOS = [
  "Plano Controle",
  "Plano Pós-Pago",
  "Internet Residencial",
  "TV",
  "Aparelho Celular",
  "Acessorios",
  "Seguro Movel Celular",
];

export const PLANO_LABELS = {
  "Plano Controle": "Controle",
  "Plano Pós-Pago": "Pos-pago",
  "Internet Residencial": "Internet",
  TV: "TV",
  "Aparelho Celular": "Aparelho",
  Acessorios: "Acessorios",
  "Seguro Movel Celular": "Seguro",
};

export const PLANO_ICONS = {
  "Plano Controle": "📱",
  "Plano Pós-Pago": "📱",
  "Internet Residencial": "🌐",
  TV: "📺",
  "Aparelho Celular": "📲",
  Acessorios: "🎧",
  "Seguro Movel Celular": "🛡️",
};

export const PLANO_COLORS = {
  "Plano Controle": "#6366f1",
  "Plano Pós-Pago": "#8b5cf6",
  "Internet Residencial": "#06b6d4",
  TV: "#f59e0b",
  "Aparelho Celular": "#10b981",
  Acessorios: "#ec4899",
  "Seguro Movel Celular": "#f97316",
};

export const PLANO_EXTRAS = {
  "Plano Controle": [
    { key: "franquia", label: "Franquia de Dados", type: "text", placeholder: "Ex: 15GB" },
    { key: "numero", label: "Numero do Chip", type: "text", placeholder: "Ex: (41) 99999-0000" },
  ],
  "Plano Pós-Pago": [
    { key: "franquia", label: "Franquia de Dados", type: "text", placeholder: "Ex: Ilimitado" },
    { key: "numero", label: "Numero do Chip", type: "text", placeholder: "Ex: (41) 99999-0000" },
    { key: "linhas", label: "Qtd. Linhas", type: "number", placeholder: "1" },
  ],
  "Internet Residencial": [
    { key: "velocidade", label: "Velocidade", type: "text", placeholder: "Ex: 300 Mbps" },
    { key: "contrato", label: "Contrato", type: "text", placeholder: "Ex: 884/12345678-9", numericOnly: true },
    { key: "endereco", label: "Endereco Inst.", type: "text", placeholder: "Rua, no, Bairro" },
  ],
  TV: [
    { key: "pacote", label: "Streaming", type: "text", placeholder: "Ex: Box 4K" },
    { key: "contrato", label: "Contrato", type: "text", placeholder: "Ex: 884/12345678-9", numericOnly: true },
    { key: "endereco", label: "Endereco Inst.", type: "text", placeholder: "Rua, no, Bairro" },
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
    { key: "modelo", label: "Aparelho Segurado", type: "text", placeholder: "Ex: Samsung S24" },
    { key: "cobertura", label: "Cobertura", type: "text", placeholder: "Ex: Roubo + Quebra" },
  ],
};

export const STATUS_OPTIONS = ["Ativa", "Pendente", "Cancelada"];
export const STATUS_COLORS = { Ativa: "#10b981", Pendente: "#f59e0b", Cancelada: "#ef4444" };
export const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const PIE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#f97316"];
