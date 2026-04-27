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
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div key={item.id} style={{ border: "1px solid #2A2A2E", borderRadius: 12, padding: "12px 14px", background: "rgba(20,20,22,0.62)", display: "grid", gap: 10, transition: "all 0.2s ease" }}>
            <div style={{ color: "#FFFFFF", fontSize: 13 }}>
              <strong style={{ color: "#FFFFFF" }}>{item.cliente}</strong> · {PLANO_LABELS[item.plano] || item.plano} · {item.tipoPlano}
              <span style={{ color: "#A1A1AA" }}> · Inst.: {fmtDate(item.dataInstalacao)}</span>
            </div>
            <div style={{ color: "#A1A1AA", fontSize: 12 }}>
              CPF/CNPJ: {item.cpf || "—"} · Contrato: {item.contrato || "—"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => onMarkInstalled(item.id)} style={{ ...btnPrimary, minHeight: 34, padding: "7px 12px", fontSize: 12 }}>
                Marcar instalado
              </button>
              <button onClick={() => onMarkNotInstalled(item.id)} style={{ ...btnSecondary, minHeight: 34, padding: "7px 12px", fontSize: 12, borderColor: "#EF4444", color: "#FFFFFF" }}>
                Marcar não instalado
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="panel-surface" style={{ padding: 22, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 22, color: "#FFFFFF" }}>Pendências de Instalação</div>
          <Badge color={installationPending.length ? "#DA291C" : "#22C55E"}>
            {installationPending.length ? `${installationPending.length} pendente(s)` : "Sem pendências"}
          </Badge>
        </div>
        {installationPending.length === 0 ? (
          <div style={{ color: "#A1A1AA", fontSize: 13 }}>Nenhuma instalação pendente no momento.</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 13 }}>Instalações atrasadas</div>
                <Badge color={installationOverdue.length ? "#EF4444" : "#A1A1AA"}>{installationOverdue.length}</Badge>
              </div>
              {installationOverdue.length ? <>{renderList(installationOverdue)}</> : <div style={{ color: "#A1A1AA", fontSize: 12 }}>Nenhuma instalação atrasada.</div>}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 13 }}>Próximas instalações</div>
                <Badge color={installationUpcoming.length ? "#DA291C" : "#A1A1AA"}>{installationUpcoming.length}</Badge>
              </div>
              {installationUpcoming.length ? <>{renderList(installationUpcoming)}</> : <div style={{ color: "#A1A1AA", fontSize: 12 }}>Nenhuma instalação futura pendente.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
