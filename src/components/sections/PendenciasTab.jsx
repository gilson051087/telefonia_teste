import { PLANO_LABELS } from "../../constants/sales";
import { fmtDate } from "../../utils/sales";
import { Badge, btnPrimary, btnSecondary } from "../ui";

export default function PendenciasTab({
  installationPending,
  installationOverdue,
  installationUpcoming,
  onMarkInstalled,
  onMarkNotInstalled,
}) {
  function renderList(items) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item) => (
          <div key={item.id} style={{ border: "1px solid #334155", borderRadius: 12, padding: "10px 12px", background: "rgba(15,23,42,0.62)", display: "grid", gap: 8 }}>
            <div style={{ color: "#e2e8f0", fontSize: 13 }}>
              <strong style={{ color: "#f8fafc" }}>{item.cliente}</strong> · {PLANO_LABELS[item.plano] || item.plano} · {item.tipoPlano}
              <span style={{ color: "#94a3b8" }}> · Inst.: {fmtDate(item.dataInstalacao)}</span>
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>
              CPF: {item.cpf || "—"} · Contrato: {item.contrato || "—"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => onMarkInstalled(item.id)} style={{ ...btnPrimary, minHeight: 34, padding: "7px 12px", fontSize: 12 }}>
                Marcar instalado
              </button>
              <button onClick={() => onMarkNotInstalled(item.id)} style={{ ...btnSecondary, minHeight: 34, padding: "7px 12px", fontSize: 12, borderColor: "#ef4444", color: "#fecaca" }}>
                Marcar não instalado
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="panel-surface" style={{ padding: 18, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#f1f5f9" }}>Pendências de Instalação</div>
          <Badge color={installationPending.length ? "#f59e0b" : "#10b981"}>
            {installationPending.length ? `${installationPending.length} pendente(s)` : "Sem pendências"}
          </Badge>
        </div>
        {installationPending.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Nenhuma instalação pendente no momento.</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ color: "#fca5a5", fontWeight: 700, fontSize: 13 }}>Instalações atrasadas</div>
                <Badge color={installationOverdue.length ? "#ef4444" : "#64748b"}>{installationOverdue.length}</Badge>
              </div>
              {installationOverdue.length ? <>{renderList(installationOverdue)}</> : <div style={{ color: "#94a3b8", fontSize: 12 }}>Nenhuma instalação atrasada.</div>}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ color: "#93c5fd", fontWeight: 700, fontSize: 13 }}>Próximas instalações</div>
                <Badge color={installationUpcoming.length ? "#0ea5e9" : "#64748b"}>{installationUpcoming.length}</Badge>
              </div>
              {installationUpcoming.length ? <>{renderList(installationUpcoming)}</> : <div style={{ color: "#94a3b8", fontSize: 12 }}>Nenhuma instalação futura pendente.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
