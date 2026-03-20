import { MONTH_NAMES, STORAGE_KEYS } from "../constants/sales";

export function fmtBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

export function fmtDate(s) {
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtMonth(s) {
  if (!s) return "Todos os meses";
  const [y, m] = s.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]}/${y}`;
}

export function slugify(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "")
    .toLowerCase();
}

export function normalizePlanoName(plano) {
  if (typeof plano !== "string") return plano;

  const value = plano.trim();

  if (value === "Acessórios") return "Acessorios";
  if (value === "Seguro Móvel Celular") return "Seguro Movel Celular";
  if (
    [
      "Plano de controle",
      "Plano controle",
      "plano controle",
      "Plano de carreira",
      "Plano de carreia",
      "plano de carreira",
      "plano de carreia",
    ].includes(value)
  ) {
    return "Plano Controle";
  }

  return value;
}

export function normalizeLegacyVenda(venda) {
  return { ...venda, plano: normalizePlanoName(venda.plano) };
}

export function loadVendas() {
  try {
    const current = localStorage.getItem(STORAGE_KEYS.vendas);
    if (current) return JSON.parse(current);
    const legacy = localStorage.getItem(STORAGE_KEYS.legacyVendas);
    return legacy ? JSON.parse(legacy).map(normalizeLegacyVenda) : [];
  } catch {
    return [];
  }
}

export function loadUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.users);
    if (saved) return JSON.parse(saved);
  } catch {}

  return [{ id: "admin-root", nome: "Administrador", username: "admin", senha: "123456", role: "admin" }];
}

export function maskCPF(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}

export function isValidCPF(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return true;
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  function calcCheckDigit(base, factor) {
    let total = 0;
    for (let i = 0; i < base.length; i += 1) {
      total += Number(base[i]) * (factor - i);
    }
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  }

  const first = calcCheckDigit(digits.slice(0, 9), 10);
  const second = calcCheckDigit(digits.slice(0, 10), 11);
  return first === Number(digits[9]) && second === Number(digits[10]);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildWorksheetRow(cells, options = {}) {
  const { header = false, title = false, currencyColumns = [] } = options;
  const styleId = title ? "Title" : header ? "Header" : "Cell";

  return `
    <Row>
      ${cells
        .map((cell, index) => {
          const isNumber = typeof cell === "number";
          const type = isNumber ? "Number" : "String";
          const value = isNumber ? cell : escapeXml(cell);
          const cellStyle = currencyColumns.includes(index) ? "Currency" : styleId;
          return `<Cell ss:StyleID="${cellStyle}"><Data ss:Type="${type}">${value}</Data></Cell>`;
        })
        .join("")}
    </Row>`;
}

export function exportExcelReport(filename, { sheetName, title, meta = [], headers, rows, totalLabel, totalValue, columnWidths = [] }) {
  const widths = columnWidths
    .map((width) => `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`)
    .join("");

  const metaRows = meta
    .map(([label, value]) => buildWorksheetRow([label, value], { header: true }))
    .join("");

  const dataRows = rows
    .map((row) =>
      buildWorksheetRow(
        row.map((cell) => (typeof cell === "number" ? Number(cell.toFixed(2)) : cell)),
        { currencyColumns: row.map((_, index) => index).filter((index) => headers[index]?.toLowerCase?.() === "valor") }
      )
    )
    .join("");

  const xml = `<?xml version="1.0"?>
  <?mso-application progid="Excel.Sheet"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:html="http://www.w3.org/TR/REC-html40">
    <Styles>
      <Style ss:ID="Default" ss:Name="Normal">
        <Alignment ss:Vertical="Center"/>
        <Borders/>
        <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#111827"/>
        <Interior/>
        <NumberFormat/>
        <Protection/>
      </Style>
      <Style ss:ID="Title">
        <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0F172A"/>
      </Style>
      <Style ss:ID="Header">
        <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
        <Interior ss:Color="#334155" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="Cell">
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        </Borders>
      </Style>
      <Style ss:ID="Currency">
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        </Borders>
        <NumberFormat ss:Format="&quot;R$&quot; #,##0.00"/>
      </Style>
      <Style ss:ID="TotalLabel">
        <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
        <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="TotalValue">
        <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
        <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
        <NumberFormat ss:Format="&quot;R$&quot; #,##0.00"/>
      </Style>
    </Styles>
    <Worksheet ss:Name="${escapeXml(sheetName)}">
      <Table>
        ${widths}
        ${buildWorksheetRow([title], { title: true })}
        <Row/>
        ${metaRows}
        <Row/>
        ${buildWorksheetRow(headers, { header: true })}
        ${dataRows}
        <Row/>
        <Row>
          <Cell ss:StyleID="TotalLabel"><Data ss:Type="String">${escapeXml(totalLabel)}</Data></Cell>
          <Cell/>
          <Cell/>
          <Cell/>
          <Cell ss:StyleID="TotalValue"><Data ss:Type="Number">${Number(totalValue.toFixed(2))}</Data></Cell>
        </Row>
      </Table>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
        <FreezePanes/>
        <FrozenNoSplit/>
        <SplitHorizontal>4</SplitHorizontal>
        <TopRowBottomPane>4</TopRowBottomPane>
        <ProtectObjects>False</ProtectObjects>
        <ProtectScenarios>False</ProtectScenarios>
      </WorksheetOptions>
    </Worksheet>
  </Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
