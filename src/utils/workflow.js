export function getInstallationStatus(venda = {}) {
  if (!["Internet Residencial", "TV"].includes(venda.plano)) return null;
  if (venda.statusInstalacao) return venda.statusInstalacao;
  if (venda.dataInstalacao) return "Pendente";
  if (venda.status === "Ativa") return "Instalado";
  if (venda.status === "Cancelada") return "Nao instalado";
  return "Pendente";
}

export function appendHistory(venda = {}, entry = {}) {
  const previous = Array.isArray(venda.historico) ? venda.historico : [];
  return [...previous, { at: new Date().toISOString(), ...entry }];
}

export function buildPendingQueue(vendas = [], cycleDate = "") {
  const installationPending = (vendas || [])
    .filter(
      (venda) =>
        ["Internet Residencial", "TV"].includes(venda.plano) &&
        venda.dataInstalacao
    )
    .filter((venda) => getInstallationStatus(venda) !== "Instalado")
    .sort((a, b) => a.dataInstalacao.localeCompare(b.dataInstalacao))
    .map((venda) => ({
      id: venda.id,
      cliente: venda.cliente,
      cpf: venda.cpf || "",
      plano: venda.plano,
      tipoPlano: venda.tipoPlano || "—",
      dataInstalacao: venda.dataInstalacao,
      contrato: venda.contrato || "",
    }));

  const installationOverdue = installationPending.filter((item) => item.dataInstalacao < cycleDate);
  const installationUpcoming = installationPending.filter((item) => item.dataInstalacao >= cycleDate);

  return {
    installationPending,
    installationOverdue,
    installationUpcoming,
  };
}
