import { useState } from "react";
import { btnPrimary, inputStyle } from "./ui";
import Logo from "./Logo";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 12c2.67 0 4.8-2.2 4.8-4.9S14.67 2.2 12 2.2 7.2 4.4 7.2 7.1 9.33 12 12 12zm0 2.2c-4.03 0-7.8 2.05-7.8 4.9V22h15.6v-2.9c0-2.85-3.77-4.9-7.8-4.9z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-6 7.73V18a1 1 0 1 0 2 0v-1.27a2 2 0 1 0-2 0zM10 9V7a2 2 0 1 1 4 0v2h-4z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 5c-5.2 0-9.27 3.45-10.8 7 1.53 3.55 5.6 7 10.8 7s9.27-3.45 10.8-7C21.27 8.45 17.2 5 12 5zm0 11.2A4.2 4.2 0 1 1 12 7.8a4.2 4.2 0 0 1 0 8.4zm0-6.7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="m12 2 7 3v6c0 5.05-3.07 9.78-7 11-3.93-1.22-7-5.95-7-11V5l7-3zm0 2.15L7 6.3v4.7c0 4.04 2.33 7.86 5 8.93 2.67-1.07 5-4.89 5-8.93V6.3l-5-2.15z"
      />
    </svg>
  );
}

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
      setError(err.message || "Usuario ou senha invalidos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-shell" style={{ color: "#FFFFFF", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        .login-shell{
          min-height:100vh;
          position:relative;
          overflow:hidden;
          background:
            radial-gradient(circle at top right, rgba(218,41,28,0.08), transparent 50%),
            #0B0B0C;
          display:grid;
          place-items:center;
          padding:28px 16px 20px;
        }
        .login-shell::before{
          content:"";
          position:absolute;
          inset:0;
          background:linear-gradient(180deg, rgba(11,11,12,0.25), rgba(11,11,12,0.5));
          pointer-events:none;
        }
        .login-shell::after{
          content:"";
          position:absolute;
          right:-280px;
          top:140px;
          width:620px;
          height:620px;
          border-radius:999px;
          border:1px solid rgba(218,41,28,0.07);
          box-shadow:
            0 0 0 34px rgba(218,41,28,0.04),
            0 0 0 68px rgba(218,41,28,0.02);
          pointer-events:none;
          opacity:0.35;
        }
        .login-dot-grid{
          display:none;
        }
        .login-dot-grid.left{left:74px; top:42%; transform:translateY(-50%);}
        .login-dot-grid.right{right:74px; bottom:176px;}

        .login-content-wrap{
          position:relative;
          z-index:1;
          width:100%;
          display:grid;
          justify-items:center;
          gap:22px;
        }
        .login-card{
          width:min(100%, 720px);
          border-radius:18px;
          border:1px solid #2A2A2E;
          background:#141416;
          box-shadow:0 10px 40px rgba(0,0,0,0.6);
          position:relative;
          overflow:hidden;
        }
        .login-card::before{
          content:"";
          position:absolute;
          inset:0;
          background:linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0));
          pointer-events:none;
        }
        .login-card-body{
          position:relative;
          z-index:1;
          padding:58px 78px 40px;
          display:grid;
          gap:0;
        }
        .login-logo{margin-bottom:22px;}
        .login-chip{
          display:inline-flex;
          align-items:center;
          width:max-content;
          border:1px solid rgba(218,41,28,0.5);
          border-radius:999px;
          padding:9px 20px;
          background:rgba(218,41,28,0.12);
          font-size:13px;
          font-weight:800;
          letter-spacing:0.04em;
          text-transform:uppercase;
          color:#FFFFFF;
          margin-bottom:22px;
        }
        .login-title{
          margin:0;
          font-family:'Crimson Pro',serif;
          font-size:58px;
          line-height:1;
          color:#FFFFFF;
          font-weight:800;
          margin-bottom:14px;
        }
        .login-subtitle{
          margin:0;
          color:#A1A1AA;
          font-size:19px;
          line-height:1.42;
          margin-bottom:42px;
        }
        .login-field{
          display:grid;
          gap:9px;
          margin-bottom:22px;
        }
        .login-label{
          font-size:17px;
          text-transform:uppercase;
          letter-spacing:0.08em;
          font-weight:800;
          color:#FFFFFF;
        }
        .login-input-wrap{
          height:66px;
          position:relative;
          border-radius:14px;
          border:1px solid #2A2A2E;
          background:#0B0B0C;
          transition:border-color .2s ease, box-shadow .2s ease;
        }
        .login-input-wrap:focus-within{
          border-color:#DA291C;
          box-shadow:0 0 0 2px rgba(218,41,28,0.1);
        }
        .login-input-icon,
        .login-pass-toggle{
          position:absolute;
          top:50%;
          transform:translateY(-50%);
          color:#DA291C;
          width:23px;
          height:23px;
          display:grid;
          place-items:center;
        }
        .login-input-icon{left:18px;}
        .login-pass-toggle{
          right:18px;
          color:#8b8b95;
          background:transparent;
          border:0;
          padding:0;
          cursor:default;
        }
        .login-input{
          height:100%;
          border:0 !important;
          background:transparent !important;
          color:#FFFFFF !important;
          font-size:18px !important;
          padding:0 56px !important;
        }
        .login-input::placeholder{color:#8B8B95;}

        .login-error{
          border:1px solid rgba(239,68,68,0.6);
          background:rgba(127,29,29,0.3);
          color:#FFFFFF;
          border-radius:12px;
          padding:11px 12px;
          text-align:center;
          font-size:13px;
          margin-bottom:14px;
        }
        .login-submit{
          width:100%;
          min-height:72px;
          border-radius:16px !important;
          border:1px solid #DA291C !important;
          background:linear-gradient(135deg, #DA291C, #B71C1C) !important;
          font-size:22px;
          font-weight:800 !important;
          box-shadow:0 4px 20px rgba(218,41,28,0.3) !important;
          display:flex !important;
          align-items:center !important;
          justify-content:center !important;
          gap:14px;
          margin-top:8px;
          transition:filter .2s ease, box-shadow .2s ease;
        }
        .login-submit:hover:not(:disabled){
          filter:brightness(1.05);
          box-shadow:0 8px 24px rgba(218,41,28,0.34) !important;
        }
        .login-submit-arrow{
          font-size:32px;
          font-weight:400;
          line-height:1;
        }

        .login-restricted{
          margin-top:28px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:11px;
          color:#A1A1AA;
          font-size:18px;
        }
        .login-restricted-icon{
          width:26px;
          height:26px;
          color:#DA291C;
          display:grid;
          place-items:center;
        }

        .login-footer{
          display:flex;
          align-items:center;
          justify-content:center;
          gap:18px;
          width:min(100%, 980px);
        }
        .login-footer-line{
          height:1px;
          flex:1;
          max-width:320px;
          background:linear-gradient(90deg, transparent, #DA291C, transparent);
          opacity:0.85;
        }
        .login-footer-copy{
          color:#9a9aa3;
          font-size:17px;
          text-align:center;
        }

        @media (max-width: 860px){
          .login-shell{padding:18px 12px 16px;}
          .login-dot-grid{display:none;}
          .login-shell::after{
            right:-360px;
            top:160px;
            opacity:0.22;
          }
          .login-card-body{padding:32px 24px 24px;}
          .login-logo{margin-bottom:16px;}
          .login-title{font-size:44px; margin-bottom:10px;}
          .login-subtitle{font-size:17px; margin-bottom:26px;}
          .login-label{font-size:14px;}
          .login-input-wrap{height:58px;}
          .login-input{font-size:17px !important;}
          .login-submit{min-height:60px; font-size:20px;}
          .login-submit-arrow{font-size:28px;}
          .login-restricted{margin-top:18px; font-size:15px;}
          .login-footer{gap:12px;}
          .login-footer-copy{font-size:13px;}
        }
      `}</style>

      <div className="login-dot-grid left" aria-hidden />
      <div className="login-dot-grid right" aria-hidden />

      <div className="login-content-wrap">
        <section className="login-card">
          <div className="login-card-body">
            <Logo size={74} className="login-logo" alt="Claro Painel de Vendas" />

            <span className="login-chip">Sistema de vendas</span>
            <h2 className="login-title">Bem-vindo!</h2>
            <p className="login-subtitle">Use seu login para acessar o painel de vendas.</p>

            <div className="login-field">
              <label htmlFor="login-username" className="login-label">Login</label>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden>
                  <UserIcon />
                </span>
                <input
                  id="login-username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((current) => ({ ...current, username: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="login-input"
                  style={{
                    ...inputStyle,
                  }}
                  placeholder="Digite seu login"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="login-label">Senha</label>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden>
                  <LockIcon />
                </span>
                <input
                  id="login-password"
                  type="password"
                  value={loginForm.senha}
                  onChange={(e) => setLoginForm((current) => ({ ...current, senha: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="login-input"
                  style={{
                    ...inputStyle,
                  }}
                  placeholder="Digite sua senha"
                />
                <button type="button" className="login-pass-toggle" aria-label="Exibir senha">
                  <EyeIcon />
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              style={{
                ...btnPrimary,
                opacity: isSubmitting ? 0.7 : 1,
              }}
              className="login-submit"
              onClick={handleLogin}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? "Entrando..." : "Entrar no painel"}</span>
              <span className="login-submit-arrow" aria-hidden>→</span>
            </button>

            <div className="login-restricted">
              <span className="login-restricted-icon" aria-hidden>
                <ShieldIcon />
              </span>
              <span>Sistema interno - uso restrito</span>
            </div>
          </div>
        </section>

        <div className="login-footer">
          <span className="login-footer-line" aria-hidden />
          <Logo size={54} alt="Claro" />
          <span className="login-footer-line" aria-hidden />
        </div>

        <div className="login-footer-copy">© 2026 Desenvolvido por GILSON ELIAS e CAIO CARDOSO.</div>
      </div>
    </div>
  );
}
