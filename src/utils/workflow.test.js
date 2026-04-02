import { appendHistory, buildPendingQueue, getInstallationStatus } from "./workflow";

describe("workflow utils", () => {
  test("getInstallationStatus normaliza status para internet/tv", () => {
    expect(getInstallationStatus({ plano: "Internet Residencial", status: "Ativa" })).toBe("Instalado");
    expect(getInstallationStatus({ plano: "TV", status: "Cancelada" })).toBe("Não instalado");
    expect(getInstallationStatus({ plano: "TV", status: "Pendente" })).toBe("Pendente");
    expect(getInstallationStatus({ plano: "Internet Residencial", status: "Ativa", dataInstalacao: "2026-03-25" })).toBe("Pendente");
    expect(getInstallationStatus({ plano: "Plano Controle", status: "Ativa" })).toBeNull();
  });

  test("buildPendingQueue retorna pendencias de instalação", () => {
    const vendas = [
      { id: "1", plano: "TV", cliente: "Ana", tipoPlano: "Plano A", dataInstalacao: "2026-03-20", status: "Pendente" },
      { id: "2", plano: "Internet Residencial", cliente: "Bruno", tipoPlano: "500MB", dataInstalacao: "2026-03-24", statusInstalacao: "Nao instalado" },
      { id: "3", plano: "TV", cliente: "Carla", tipoPlano: "Plano B", dataInstalacao: "2026-03-29", status: "Pendente" },
      { id: "4", plano: "TV", cliente: "Davi", tipoPlano: "Plano C", dataInstalacao: "2026-03-18", statusInstalacao: "Instalado" },
      { id: "5", plano: "Plano Controle", cliente: "Eva", data: "2026-03-21" },
    ];
    const queue = buildPendingQueue(vendas, "2026-03-27");
    expect(queue.installationPending).toHaveLength(3);
    expect(queue.installationPending.map((item) => item.id)).toEqual(["1", "2", "3"]);
    expect(queue.installationOverdue.map((item) => item.id)).toEqual(["1", "2"]);
    expect(queue.installationUpcoming.map((item) => item.id)).toEqual(["3"]);
  });

  test("buildPendingQueue pode filtrar por mês de instalação", () => {
    const vendas = [
      { id: "1", plano: "TV", cliente: "Ana", dataInstalacao: "2026-03-31", status: "Pendente" },
      { id: "2", plano: "TV", cliente: "Bruno", dataInstalacao: "2026-04-02", status: "Pendente" },
      { id: "3", plano: "Internet Residencial", cliente: "Carla", dataInstalacao: "2026-04-15", statusInstalacao: "Pendente" },
    ];

    const queue = buildPendingQueue(vendas, "2026-04-10", "2026-04");
    expect(queue.installationPending.map((item) => item.id)).toEqual(["2", "3"]);
    expect(queue.installationOverdue.map((item) => item.id)).toEqual(["2"]);
    expect(queue.installationUpcoming.map((item) => item.id)).toEqual(["3"]);
  });

  test("appendHistory anexa evento com timestamp", () => {
    const next = appendHistory({ historico: [{ action: "criacao", at: "2026-03-26T10:00:00.000Z" }] }, { action: "edicao", userName: "Tester" });
    expect(next).toHaveLength(2);
    expect(next[1].action).toBe("edicao");
    expect(next[1].userName).toBe("Tester");
    expect(next[1].at).toBeTruthy();
  });

});
