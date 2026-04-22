import { useEffect, useMemo, useState } from "react";
import { fmtBRL } from "../../utils/sales";
import { Badge } from "../ui";

export default function GoalsTab({
  goalItems,
  onGoalTargetChange,
  projectedGoalProgress,
  elapsedDays = 1,
  ownerName = "",
  ownerOptions = [],
  selectedOwnerId = "",
  onOwnerChange,
  readOnly = false,
}) {
  const items = useMemo(() => (Array.isArray(goalItems) ? goalItems : []), [goalItems]);
  const projected = projectedGoalProgress || {};
  const [draftTargets, setDraftTargets] = useState({});
  const [editingKey, setEditingKey] = useState("");

  useEffect(() => {
    setDraftTargets((current) => {
      const next = { ...current };
      items.forEach((item) => {
        if (editingKey === item.key) return;
        next[item.key] = String(item.target ?? "");
      });
      return next;
    });
  }, [items, editingKey]);

  function renderGoalValue(item, value) {
    if (item.type === "currency") return fmtBRL(value);
    return String(value);
  }

  function getProgressPercent(item) {
    const target = Number(item?.target) || 0;
    const done = Number(item?.done) || 0;
    if (target <= 0) return done > 0 ? 100 : 0;
    return Math.max(0, Math.min(100, (done / target) * 100));
  }

  const reachedCount = items.filter((item) => Number(item.remaining) <= 0).length;
  const avgProgress = items.length
    ? items.reduce((sum, item) => sum + getProgressPercent(item), 0) / items.length
    : 0;
  const pendingItems = items.filter((item) => Number(item.remaining) > 0);
  const pendingCount = pendingItems.length;

  const accentByKey = {
    bandaLarga: "#DA291C",
    grossTotal: "#DA291C",
    posPagoTitular: "#DA291C",
    residencial: "#DA291C",
    receita: "#DA291C",
    tv: "#DA291C",
  };

  function sanitizeDraft(item, raw) {
    const value = String(raw ?? "");
    if (item.type === "currency") {
      const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
      const [head, ...tail] = normalized.split(".");
      const integer = (head || "").replace(/^0+(?=\d)/, "");
      if (tail.length === 0) return integer;
      return `${integer || "0"}.${tail.join("").slice(0, 2)}`;
    }
    const digits = value.replace(/\D/g, "");
    return digits.replace(/^0+(?=\d)/, "");
  }

  function renderGoalInput(item) {
    const inputValue = editingKey === item.key
      ? (draftTargets[item.key] ?? "")
      : String(item.target ?? "");
    return (
      <input
        type="text"
        inputMode={item.type === "currency" ? "decimal" : "numeric"}
        value={inputValue}
        onFocus={() => {
          setEditingKey(item.key);
          setDraftTargets((current) => ({ ...current, [item.key]: String(item.target ?? "") }));
        }}
        onChange={(event) => {
          if (readOnly) return;
          const sanitized = sanitizeDraft(item, event.target.value);
          setDraftTargets((current) => ({ ...current, [item.key]: sanitized }));
          onGoalTargetChange(item.key, sanitized);
        }}
        onBlur={() => {
          setEditingKey((current) => (current === item.key ? "" : current));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        disabled={readOnly}
        style={{
          width: 120,
          border: "1px solid #2A2A2E",
          borderRadius: 12,
          background: readOnly ? "#101012" : "#141416",
          color: readOnly ? "#A1A1AA" : "#FFFFFF",
          padding: "8px 12px",
          fontSize: 13,
          fontWeight: 600,
          minHeight: 38,
          cursor: readOnly ? "not-allowed" : "text",
        }}
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        className="panel-surface"
        style={{
          padding: "16px 18px",
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 24, color: "#FFFFFF" }}>Central de Metas</div>
            <div style={{ color: "#A1A1AA", fontSize: 12 }}>Acompanhe performance e ajuste objetivos do ciclo em tempo real.</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Badge color={readOnly ? "#A1A1AA" : "#EF4444"}>{readOnly ? "Somente leitura" : "Editável"}</Badge>
            <Badge color="#22C55E">{`Metas de: ${String(ownerName || "Usuário").toUpperCase()}`}</Badge>
          </div>
        </div>
        {Array.isArray(ownerOptions) && ownerOptions.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ color: "#A1A1AA", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Visualizar metas de
            </div>
            <select
              value={selectedOwnerId}
              onChange={(event) => onOwnerChange?.(event.target.value)}
              style={{
                minHeight: 40,
                border: "1px solid #2A2A2E",
                borderRadius: 10,
                background: "#141416",
                color: "#FFFFFF",
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 600,
                minWidth: 220,
              }}
            >
              {ownerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <div style={{ border: "1px solid #2A2A2E", borderRadius: 8, padding: "10px 12px", background: "#141416" }}>
            <div style={{ color: "#A1A1AA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Metas atingidas</div>
            <div style={{ color: "#FFFFFF", fontFamily: "'Crimson Pro',serif", fontSize: 28, lineHeight: 1 }}>{reachedCount}/{items.length || 0}</div>
          </div>
          <div style={{ border: "1px solid #2A2A2E", borderRadius: 8, padding: "10px 12px", background: "#141416" }}>
            <div style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Progresso médio</div>
            <div style={{ color: "#FFFFFF", fontFamily: "'Crimson Pro',serif", fontSize: 28, lineHeight: 1 }}>{Math.round(avgProgress)}%</div>
          </div>
          <div style={{ border: "1px solid #2A2A2E", borderRadius: 8, padding: "10px 12px", background: "#141416" }}>
            <div style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pendências</div>
            <div style={{ color: "#FFFFFF", fontFamily: "'Crimson Pro',serif", fontSize: 28, lineHeight: 1 }}>{pendingCount}</div>
            <div style={{ color: "#FACC15", fontSize: 11 }}>
              Metas ainda abaixo do alvo
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {items.map((item) => {
          const progress = getProgressPercent(item);
          const isMet = item.remaining <= 0;
          const accent = accentByKey[item.key] || "#EF4444";
          const projectedValue = Number(projected[item.key]) || 0;
          const dailyEfficiencyRaw = (Number(item.done) || 0) / Math.max(1, elapsedDays);
          const dailyEfficiency = item.type === "currency" ? dailyEfficiencyRaw : Math.round(dailyEfficiencyRaw);
          return (
            <div
              key={item.key}
              className="panel-surface"
              style={{
                border: "1px solid #2A2A2E",
                borderRadius: 8,
                padding: "12px 13px",
                background: "#141416",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 700 }}>
                  <span style={{ marginRight: 6 }}>{item.icon}</span>
                  {item.label}
                </div>
                <Badge color={isMet ? "#22C55E" : "#EF4444"}>
                  {Math.round(progress)}%
                </Badge>
              </div>

              <div
                style={{
                  height: 9,
                  borderRadius: 999,
                  background: "rgba(42,42,46,0.95)",
                  overflow: "hidden",
                  border: "1px solid #2A2A2E",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${accent}, ${isMet ? "#22C55E" : "#EF4444"})`,
                    transition: "width .25s ease",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "#A1A1AA", fontSize: 12, flexWrap: "wrap" }}>
                <span>
                  Realizado: <strong style={{ color: "#FFFFFF" }}>{renderGoalValue(item, item.done)}</strong>
                </span>
                <span>
                  {isMet ? "Meta batida" : "Falta"}:{" "}
                  <strong style={{ color: isMet ? "#22C55E" : "#FACC15" }}>{renderGoalValue(item, Math.abs(item.remaining))}</strong>
                </span>
              </div>

              <div style={{ display: "grid", gap: 4, color: "#A1A1AA", fontSize: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span>Eficiência diária: <strong style={{ color: "#FFFFFF" }}>{renderGoalValue(item, dailyEfficiency)}/dia</strong></span>
                  <span>
                    Ritmo atual
                  </span>
                </div>
                <div>
                  Projeção fechamento:{" "}
                  <strong style={{ color: "#FFFFFF" }}>{renderGoalValue(item, projectedValue)}</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ color: "#A1A1AA", fontSize: 11 }}>
                  Meta definida
                </div>
                {renderGoalInput(item)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
