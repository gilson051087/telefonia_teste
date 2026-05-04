import { useMemo, useState } from "react";
import { inputStyle } from "../ui";

const imageContext = process.env.NODE_ENV === "test"
  ? null
  : require.context("../../assets/image", false, /\.(png|jpe?g|webp|gif)$/i);

function formatFileTitle(path = "") {
  const filename = path.replace("./", "").replace(/\.[^.]+$/, "");
  return filename
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

function getCategoryFromTitle(title = "") {
  const normalized = normalizeSearch(title);
  if (normalized.includes("tv") || normalized.includes("combo") || normalized.includes("multi")) return "Combo";
  if (normalized.includes("pos")) return "Pós-pago";
  if (normalized.includes("controle")) return "Controle";
  if (normalized.includes("internet")) return "Internet";
  return "Consulta";
}

const PLAN_IMAGES = imageContext
  ? imageContext
      .keys()
      .sort((a, b) => a.localeCompare(b))
      .map((path) => {
        const title = formatFileTitle(path);
        return {
          title,
          category: getCategoryFromTitle(title),
          src: imageContext(path),
          tags: [title],
        };
      })
  : [];

const CATEGORY_OPTIONS = ["Todos", ...Array.from(new Set(PLAN_IMAGES.map((item) => item.category)))];

function normalizeSearch(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function PlanosTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [selected, setSelected] = useState(PLAN_IMAGES[0]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const filteredImages = useMemo(() => {
    const term = normalizeSearch(search);
    return PLAN_IMAGES.filter((item) => {
      if (category !== "Todos" && item.category !== category) return false;
      if (!term) return true;
      const haystack = normalizeSearch(`${item.title} ${item.category} ${item.tags.join(" ")}`);
      return haystack.includes(term);
    });
  }, [search, category]);

  const activeImage = selected && filteredImages.some((item) => item.title === selected.title) ? selected : filteredImages[0] || null;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="panel-surface" style={{ borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Crimson Pro',serif", fontSize: 24, color: "#FFFFFF", marginBottom: 3 }}>Consulta de planos</div>
            <div style={{ fontSize: 13, color: "#A1A1AA" }}>{filteredImages.length} imagem{filteredImages.length !== 1 ? "s" : ""} disponível{filteredImages.length !== 1 ? "eis" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar plano" style={{ ...inputStyle, width: 220 }} />
            <select value={category} onChange={(event) => setCategory(event.target.value)} style={{ ...inputStyle, width: 180, appearance: "none" }}>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rel-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(230px, 320px) 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 10 }}>
            {filteredImages.map((item) => {
              const active = activeImage?.title === item.title;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setSelected(item)}
                  style={{
                    border: `1px solid ${active ? "#DA291C" : "#2A2A2E"}`,
                    background: active ? "rgba(218,41,28,0.13)" : "#141416",
                    color: "#FFFFFF",
                    borderRadius: 10,
                    padding: 10,
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "64px 1fr",
                    gap: 10,
                    alignItems: "center",
                    textAlign: "left",
                  }}
                >
                  <img src={item.src} alt="" style={{ width: 64, height: 46, objectFit: "cover", borderRadius: 6, border: "1px solid #2A2A2E" }} />
                  <span>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 13 }}>{item.title}</span>
                    <span style={{ display: "block", color: "#A1A1AA", fontSize: 12, marginTop: 2 }}>{item.category}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ border: "1px solid #2A2A2E", borderRadius: 12, overflow: "hidden", background: "#0B0B0C", minHeight: 420 }}>
            {activeImage ? (
              <>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #2A2A2E", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ color: "#FFFFFF", fontWeight: 800 }}>{activeImage.title}</div>
                    <div style={{ color: "#A1A1AA", fontSize: 12 }}>{activeImage.category}</div>
                  </div>
                </div>
                <div style={{ padding: 14 }}>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    style={{ border: "none", padding: 0, margin: 0, background: "transparent", width: "100%", cursor: "zoom-in" }}
                    aria-label={`Ampliar ${activeImage.title}`}
                  >
                    <img src={activeImage.src} alt={activeImage.title} style={{ width: "100%", maxHeight: "72vh", objectFit: "contain", display: "block", borderRadius: 8, background: "#FFFFFF" }} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: 18, color: "#A1A1AA" }}>Nenhuma imagem encontrada.</div>
            )}
          </div>
        </div>
      </div>

      {isPreviewOpen && activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.title}
          onClick={() => setIsPreviewOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.88)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsPreviewOpen(false);
            }}
            style={{
              position: "fixed",
              top: 18,
              right: 18,
              border: "1px solid #3F3F46",
              background: "#141416",
              color: "#FFFFFF",
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Fechar
          </button>
          <img
            src={activeImage.src}
            alt={activeImage.title}
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: "96vw",
              maxHeight: "92vh",
              objectFit: "contain",
              borderRadius: 10,
              background: "#FFFFFF",
              boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
            }}
          />
        </div>
      )}
    </div>
  );
}
