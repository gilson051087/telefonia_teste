import { render, screen } from "@testing-library/react";
import App from './App';

test("renderiza tela de login quando não há sessão", () => {
  render(<App />);
  expect(screen.getByText(/Painel de Vendas/i)).toBeInTheDocument();
});
