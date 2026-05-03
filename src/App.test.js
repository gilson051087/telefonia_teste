import { render, screen } from "@testing-library/react";
import App, { resolveInitialCycleMonth } from "./App";

test("renderiza tela de login quando não há sessão", () => {
  render(<App />);
  expect(screen.getByText(/Painel de Vendas/i)).toBeInTheDocument();
});

describe("ciclo mensal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 2, 10, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("ignora mês salvo antigo ao iniciar um novo mês", () => {
    expect(resolveInitialCycleMonth("2026-04")).toBe("2026-05");
  });

  test("mantém o mês salvo quando ele já é o mês atual", () => {
    expect(resolveInitialCycleMonth("2026-05")).toBe("2026-05");
  });
});
