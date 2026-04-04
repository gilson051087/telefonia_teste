import { useState } from "react";
import { btnPrimary, inputStyle } from "./ui";

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

  return (
    <div className="login-shell" style={{ color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        .login-shell{
          min-height:100vh;
          position:relative;
          overflow:hidden;
          background:
            radial-gradient(circle at 18% 20%, rgba(14,165,233,0.22), transparent 34%),
            radial-gradient(circle at 80% 16%, rgba(16,185,129,0.2), transparent 30%),
            radial-gradient(circle at 50% 120%, rgba(56,189,248,0.14), transparent 40%),
            linear-gradient(140deg,#020617 0%, #081226 46%, #091a2f 100%);
          display:grid;
          place-items:center;
          padding:24px;
        }
        .login-shell::before{
          content:"";
          position:absolute;
          inset:-35% -15%;
          background:
            conic-gradient(from 70deg at 35% 35%, rgba(34,211,238,0.16), transparent 22%),
            conic-gradient(from 220deg at 65% 40%, rgba(34,197,94,0.14), transparent 24%),
            conic-gradient(from 150deg at 40% 70%, rgba(14,165,233,0.12), transparent 26%);
          animation:auroraShift 20s linear infinite;
          filter:blur(12px);
          pointer-events:none;
        }
        .login-shell::after{
          content:"";
          position:absolute;
          inset:0;
          background:
            linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px);
          background-size:48px 48px;
          mask-image:radial-gradient(circle at center, black 16%, transparent 78%);
          opacity:0.3;
          animation:gridDrift 22s linear infinite;
          pointer-events:none;
        }
        .login-bg-orb{
          position:absolute;
          border-radius:999px;
          filter:blur(2px);
          pointer-events:none;
        }
        .login-bg-orb-a{
          width:320px;
          height:320px;
          left:-110px;
          top:8%;
          background:radial-gradient(circle, rgba(56,189,248,0.42), rgba(56,189,248,0.02) 72%);
          animation:orbFloat 8s ease-in-out infinite;
        }
        .login-bg-orb-b{
          width:360px;
          height:360px;
          right:-130px;
          bottom:2%;
          background:radial-gradient(circle, rgba(16,185,129,0.34), rgba(16,185,129,0.02) 72%);
          animation:orbFloat 11s ease-in-out infinite reverse;
        }
        .login-dots{
          position:absolute;
          inset:0;
          pointer-events:none;
        }
        .login-dot{
          position:absolute;
          border-radius:999px;
          background:rgba(186,230,253,0.8);
          box-shadow:0 0 14px rgba(125,211,252,0.5);
          animation:dotPulse 4.4s ease-in-out infinite;
          opacity:0.45;
        }
        .login-stage{
          position:relative;
          z-index:1;
          width:min(430px, 100%);
          display:grid;
          grid-template-columns:minmax(320px, 430px);
          justify-content:center;
          gap:0;
          align-items:stretch;
        }
        .login-showcase{
          border:1px solid rgba(103,232,249,0.18);
          background:linear-gradient(160deg, rgba(12,21,40,0.86), rgba(11,18,32,0.9));
          border-radius:26px;
          padding:30px;
          box-shadow:0 24px 54px rgba(2,6,23,0.45);
          backdrop-filter:blur(10px);
          display:grid;
          gap:20px;
          align-content:space-between;
          position:relative;
          overflow:hidden;
        }
        .login-showcase::before{
          content:"";
          position:absolute;
          inset:-25% -30%;
          background:radial-gradient(circle at center, rgba(125,211,252,0.2), transparent 44%);
          transform:rotate(-7deg);
          pointer-events:none;
        }
        .login-tag{
          display:inline-flex;
          align-items:center;
          gap:8px;
          font-size:11px;
          letter-spacing:0.14em;
          text-transform:uppercase;
          color:#67e8f9;
          font-weight:700;
        }
        .login-title{
          margin:0;
          font-family:'Crimson Pro',serif;
          font-size:clamp(36px,4.2vw,58px);
          line-height:0.95;
          color:#f8fafc;
          text-wrap:balance;
        }
        .login-subtitle{
          color:#94a3b8;
          font-size:15px;
          line-height:1.55;
          max-width:56ch;
        }
        .login-chips{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }
        .login-chip{
          border:1px solid rgba(125,211,252,0.28);
          background:rgba(12,20,36,0.78);
          color:#bae6fd;
          border-radius:999px;
          font-size:12px;
          font-weight:700;
          letter-spacing:0.02em;
          padding:7px 12px;
        }
        .login-stats{
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:10px;
        }
        .login-stat{
          border:1px solid rgba(71,85,105,0.55);
          background:linear-gradient(180deg, rgba(15,23,42,0.78), rgba(15,23,42,0.45));
          border-radius:14px;
          padding:12px;
        }
        .login-stat-label{
          color:#64748b;
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:0.08em;
          font-weight:700;
          margin-bottom:6px;
        }
        .login-stat-value{
          color:#e2e8f0;
          font-size:18px;
          font-weight:700;
          font-family:'Crimson Pro',serif;
        }
        .login-card{
          position:relative;
          border-radius:26px;
          overflow:hidden;
          background:linear-gradient(180deg, rgba(7,14,27,0.9), rgba(7,14,27,0.95));
          border:1px solid rgba(125,211,252,0.26);
          box-shadow:0 28px 62px rgba(2,6,23,0.56);
          backdrop-filter:blur(12px);
          transform:translateZ(0);
          transition:transform .24s ease, box-shadow .24s ease;
        }
        .login-card:hover{
          transform:translateY(-3px);
          box-shadow:0 34px 72px rgba(2,6,23,0.62);
        }
        .login-card::before{
          content:"";
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at 12% 15%, rgba(34,211,238,0.22), transparent 34%),
            radial-gradient(circle at 84% 6%, rgba(16,185,129,0.2), transparent 28%);
          pointer-events:none;
        }
        .login-card::after{
          content:"";
          position:absolute;
          inset:-35% -140%;
          background:linear-gradient(110deg, rgba(255,255,255,0), rgba(186,230,253,0.16) 50%, rgba(255,255,255,0));
          transform:translateX(-34%);
          animation:cardSweep 9s ease-in-out infinite;
          pointer-events:none;
        }
        .login-content{
          position:relative;
          z-index:1;
          padding:28px 26px;
        }
        .login-eyebrow{
          display:inline-flex;
          align-items:center;
          gap:8px;
          border:1px solid rgba(103,232,249,0.32);
          color:#67e8f9;
          border-radius:999px;
          background:rgba(8,47,73,0.5);
          padding:6px 10px;
          font-size:11px;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:0.08em;
          margin-bottom:12px;
        }
        .login-form-title{
          margin:0 0 8px;
          font-family:'Crimson Pro',serif;
          color:#f8fafc;
          font-size:36px;
          line-height:1;
          font-weight:600;
        }
        .login-form-copy{
          margin:0 0 18px;
          color:#94a3b8;
          font-size:13px;
          line-height:1.45;
        }
        .login-fields{
          display:grid;
          gap:11px;
          margin-bottom:14px;
        }
        .login-field{
          display:grid;
          gap:6px;
        }
        .login-label{
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:0.08em;
          color:#67e8f9;
          font-weight:700;
        }
        .login-input-wrap{
          position:relative;
          border-radius:13px;
          transition:box-shadow .2s ease, border-color .2s ease, transform .2s ease;
        }
        .login-input-wrap:focus-within{
          transform:translateY(-1px);
          box-shadow:0 0 0 3px rgba(34,211,238,0.18), 0 12px 20px rgba(2,6,23,0.38);
        }
        .login-input-icon{
          position:absolute;
          left:11px;
          top:50%;
          transform:translateY(-50%);
          color:#7dd3fc;
          font-size:14px;
          pointer-events:none;
        }
        .login-input{
          transition:border-color .2s ease, background .2s ease;
        }
        .login-input:focus{
          border-color:rgba(34,211,238,0.5) !important;
          background:rgba(15,23,42,0.94) !important;
        }
        .login-error{
          border:1px solid rgba(248,113,113,0.35);
          background:rgba(127,29,29,0.26);
          border-radius:12px;
          color:#fecaca;
          font-size:12px;
          text-align:center;
          line-height:1.4;
          padding:10px 12px;
          margin-bottom:12px;
        }
        .login-submit{
          position:relative;
          overflow:hidden;
          border-radius:14px !important;
          height:47px;
          width:100%;
          font-size:14px;
          box-shadow:0 14px 30px rgba(14,165,233,0.28) !important;
          transition:transform .2s ease, box-shadow .2s ease, opacity .2s ease;
        }
        .login-submit:hover:not(:disabled){
          transform:translateY(-1px);
          box-shadow:0 18px 36px rgba(14,165,233,0.36) !important;
        }
        .login-submit::after{
          content:"";
          position:absolute;
          inset:-40% -140%;
          background:linear-gradient(110deg, rgba(255,255,255,0), rgba(255,255,255,0.34), rgba(255,255,255,0));
          transform:translateX(-36%);
          animation:buttonSweep 4.2s ease-in-out infinite;
        }
        @keyframes auroraShift{
          0%{transform:translate3d(-2%,0,0) rotate(0deg);}
          50%{transform:translate3d(2%,1%,0) rotate(8deg);}
          100%{transform:translate3d(-2%,0,0) rotate(0deg);}
        }
        @keyframes orbFloat{
          0%,100%{transform:translateY(0) scale(1);}
          50%{transform:translateY(-14px) scale(1.04);}
        }
        @keyframes dotPulse{
          0%,100%{opacity:.2;transform:scale(.85);}
          50%{opacity:.9;transform:scale(1.12);}
        }
        @keyframes gridDrift{
          0%{transform:translate3d(0,0,0);}
          100%{transform:translate3d(24px,24px,0);}
        }
        @keyframes cardSweep{
          0%,100%{transform:translateX(-36%);}
          45%,55%{transform:translateX(34%);}
        }
        @keyframes buttonSweep{
          0%,100%{transform:translateX(-38%);}
          45%,55%{transform:translateX(34%);}
        }
        @media (max-width: 980px){
          .login-stage{
            grid-template-columns:1fr;
            max-width:560px;
          }
          .login-showcase{
            padding:22px;
          }
          .login-title{
            font-size:40px;
          }
          .login-stats{
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
        }
        @media (max-width: 560px){
          .login-shell{
            padding:14px;
          }
          .login-showcase{
            padding:18px;
            border-radius:18px;
          }
          .login-content{
            padding:20px 18px;
          }
          .login-form-title{
            font-size:30px;
          }
          .login-title{
            font-size:34px;
          }
          .login-stats{
            grid-template-columns:1fr;
          }
        }
        @media (prefers-reduced-motion: reduce){
          .login-shell::before,
          .login-shell::after,
          .login-bg-orb,
          .login-dot,
          .login-card::after,
          .login-submit::after{
            animation:none !important;
          }
          .login-card,
          .login-submit,
          .login-input-wrap{
            transition:none !important;
          }
        }
      `}</style>
      <div className="login-bg-orb login-bg-orb-a" />
      <div className="login-bg-orb login-bg-orb-b" />
      <div className="login-dots" aria-hidden>
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="login-dot"
            style={{
              left: `${(index * 17) % 100}%`,
              top: `${(index * 29) % 100}%`,
              width: index % 3 === 0 ? 4 : 2,
              height: index % 3 === 0 ? 4 : 2,
              animationDelay: `${(index % 7) * 0.55}s`,
              animationDuration: `${3.4 + (index % 5) * 0.7}s`,
            }}
          />
        ))}
      </div>

      <div className="login-stage">
        <section className="login-card">
          <div className="login-content">
            <div className="login-eyebrow">Sistema de Vendas</div>
            <h2 className="login-form-title">Bem-vindo</h2>
            <p className="login-form-copy">Use seu login para acessar o painel de vendas.</p>

            <div className="login-fields">
              <div className="login-field">
                <label htmlFor="login-username" className="login-label">Login</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">👤</span>
                  <input
                    id="login-username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm((current) => ({ ...current, username: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    className="login-input"
                    style={{
                      ...inputStyle,
                      background: "rgba(15,23,42,0.8)",
                      borderColor: "rgba(125,211,252,0.2)",
                      borderRadius: 13,
                      height: 45,
                      fontSize: 13,
                      padding: "10px 12px 10px 34px",
                      fontFamily: "'DM Sans',sans-serif",
                      fontWeight: 500,
                    }}
                    placeholder="Digite seu login"
                  />
                </div>
              </div>
              <div className="login-field">
                <label htmlFor="login-password" className="login-label">Senha</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">🔒</span>
                  <input
                    id="login-password"
                    type="password"
                    value={loginForm.senha}
                    onChange={(e) => setLoginForm((current) => ({ ...current, senha: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    className="login-input"
                    style={{
                      ...inputStyle,
                      background: "rgba(15,23,42,0.8)",
                      borderColor: "rgba(125,211,252,0.2)",
                      borderRadius: 13,
                      height: 45,
                      fontSize: 13,
                      padding: "10px 12px 10px 34px",
                      fontFamily: "'DM Sans',sans-serif",
                      fontWeight: 500,
                    }}
                    placeholder="Digite sua senha"
                  />
                </div>
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
              {isSubmitting ? "Entrando..." : "Entrar no painel"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
