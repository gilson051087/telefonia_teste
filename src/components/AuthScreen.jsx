import { useState } from "react";
import { Field, btnPrimary, inputStyle } from "./ui";

export default function AuthScreen({ onLogin }) {
  const [loginForm, setLoginForm] = useState({ username: "", senha: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLogin();
    }
  }

  async function handleLogin() {
    try {
      setIsSubmitting(true);
      setError("");
      await onLogin(loginForm.username.trim(), loginForm.senha);
    } catch (err) {
      setError(err.message || "Usuário ou senha inválidos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const cardStyle = {
    background: "linear-gradient(180deg,rgba(15,23,42,0.95),rgba(12,18,32,0.98))",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 18px 56px rgba(0,0,0,0.32)",
    backdropFilter: "blur(14px)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top,#1e3a8a 0%,#0f172a 38%,#050816 100%)",
        color: "#e2e8f0",
        fontFamily: "'DM Sans',sans-serif",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <style>{`
        .login-card{position:relative;overflow:hidden;}
        .login-card::before{
          content:"";
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at top right, rgba(96,165,250,0.16), transparent 28%),
            radial-gradient(circle at bottom left, rgba(129,140,248,0.12), transparent 30%);
          pointer-events:none;
        }
        .login-content{position:relative;z-index:1;}
      `}</style>
      <div className="login-card" style={{ ...cardStyle, width: "100%", maxWidth: 480 }}>
        <div className="login-content">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#7dd3fc",
                marginBottom: 8,
              }}
            >
              Sistema Comercial
            </div>
            <h1
              className="auth-hero-title"
              style={{
                fontFamily: "'Crimson Pro',serif",
                fontSize: 38,
                lineHeight: 1,
                marginBottom: 8,
                color: "#f8fafc",
                fontWeight: 600,
              }}
            >
              Painel de Vendas
            </h1>
            <div
              style={{
                color: "#94a3b8",
                fontSize: 13,
                letterSpacing: "0.01em",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Acesse com seu usuário e senha.
            </div>
          </div>
          <div className="auth-login-row" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <Field label="Login">
              <input
                value={loginForm.username}
                onChange={(e) => setLoginForm((current) => ({ ...current, username: e.target.value }))}
                onKeyDown={handleKeyDown}
                style={{
                  ...inputStyle,
                  background: "rgba(15,23,42,0.75)",
                  borderColor: "rgba(125,211,252,0.16)",
                  borderRadius: 12,
                  height: 44,
                  fontSize: 13,
                  padding: "10px 12px",
                  fontFamily: "'DM Sans',sans-serif",
                  fontWeight: 500,
                }}
                placeholder="Digite seu login"
              />
            </Field>
            <Field label="Senha">
              <input
                type="password"
                value={loginForm.senha}
                onChange={(e) => setLoginForm((current) => ({ ...current, senha: e.target.value }))}
                onKeyDown={handleKeyDown}
                style={{
                  ...inputStyle,
                  background: "rgba(15,23,42,0.75)",
                  borderColor: "rgba(125,211,252,0.16)",
                  borderRadius: 12,
                  height: 44,
                  fontSize: 13,
                  padding: "10px 12px",
                  fontFamily: "'DM Sans',sans-serif",
                  fontWeight: 500,
                }}
                placeholder="Digite sua senha"
              />
            </Field>
          </div>
          {error && (
            <div
              style={{
                color: "#fca5a5",
                fontSize: 12,
                marginBottom: 12,
                textAlign: "center",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {error}
            </div>
          )}
          <button
            style={{
              ...btnPrimary,
              width: "100%",
              borderRadius: 14,
              height: 46,
              fontSize: 13,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: "0 8px 24px rgba(99,102,241,0.22)",
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onClick={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Entrando..." : "Entrar no painel"}
          </button>
        </div>
      </div>
    </div>
  );
}
