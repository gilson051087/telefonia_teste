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
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}

export function maskCNPJ(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    .slice(0, 18);
}

export function maskCpfCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length > 11 ? maskCNPJ(digits) : maskCPF(digits);
}

export function maskCEP(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 9);
}

export function maskPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskICCID(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 22);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
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

export function isValidCNPJ(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return true;
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  function calcCheckDigit(base, weights) {
    const total = base.split("").reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  const first = calcCheckDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calcCheckDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(digits[12]) && second === Number(digits[13]);
}

export function isValidCpfCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return true;
  if (digits.length <= 11) return isValidCPF(digits);
  return isValidCNPJ(digits);
}

function parseNumericValue(value, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const compact = raw.replace(/\s/g, "");
  const hasComma = compact.includes(",");
  const hasDot = compact.includes(".");
  let normalized = compact;

  if (hasComma && hasDot) {
    normalized =
      compact.lastIndexOf(",") > compact.lastIndexOf(".")
        ? compact.replace(/\./g, "").replace(",", ".")
        : compact.replace(/,/g, "");
  } else if (hasComma) {
    normalized = compact.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function buildComandaCell(value, { style = "ComandaValue", mergeAcross = 0, type = null } = {}) {
  const resolvedType = type || (typeof value === "number" ? "Number" : "String");
  const attrs = [`ss:StyleID="${style}"`];
  if (mergeAcross > 0) attrs.push(`ss:MergeAcross="${mergeAcross}"`);
  const data = resolvedType === "Number" ? value : escapeXml(value ?? "");
  return `<Cell ${attrs.join(" ")}><Data ss:Type="${resolvedType}">${data}</Data></Cell>`;
}

function buildComandaRow(cells = []) {
  return `<Row>${cells.join("")}</Row>`;
}

function formatDateBr(value) {
  if (!value || typeof value !== "string") return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function normalizeForMatch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isMobilePlano(plano) {
  const planoLower = normalizeForMatch(plano);
  return (
    planoLower === "plano controle" ||
    planoLower === "plano pos-pago" ||
    planoLower === "internet movel mais" ||
    planoLower === "seguro movel celular"
  );
}

function sameVenda(left = {}, right = {}) {
  if (!left || !right) return false;
  if (left.id && right.id) return left.id === right.id;
  return left === right;
}

function uniqueVendas(vendas = []) {
  const seenIds = new Set();
  const unique = [];

  vendas.forEach((item) => {
    if (!item) return;
    const key = item.id || `${item.plano || ""}|${item.tipoPlano || ""}|${item.numero || ""}|${item.iccid || ""}`;
    if (seenIds.has(key)) return;
    seenIds.add(key);
    unique.push(item);
  });

  return unique;
}

function uniqueComandaDependentes(dependentes = []) {
  const seen = new Set();
  const unique = [];

  dependentes.forEach((item) => {
    if (!item || !(item.tipo || item.numero || item.portabilidade || item.iccid)) return;
    const key = `${item.tipo || ""}|${item.numero || ""}|${item.portabilidade || ""}|${item.iccid || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });

  return unique;
}

export function exportVendaComanda(filename, venda = {}, relatedVendas = []) {
  const vendasComanda = uniqueVendas([venda, ...(Array.isArray(relatedVendas) ? relatedVendas : [])]);
  const findVendaByPlano = (matcher) => vendasComanda.find((item) => matcher(normalizeForMatch(item?.plano), item));
  const plano = venda.plano || "";
  const planoLower = normalizeForMatch(plano);

  const isPlanoMovel = isMobilePlano(plano);
  const isPlanoInternet = planoLower === "internet residencial";
  const isPlanoTv = planoLower === "tv";
  const isPlanoAparelho = planoLower === "aparelho celular";
  const isPlanoAcessorio = planoLower === "acessorios";
  const isPlanoSeguro = planoLower === "seguro movel celular";
  const vendaMovel = isPlanoMovel
    ? venda
    : findVendaByPlano((itemPlano) =>
        ["plano controle", "plano pos-pago", "internet movel mais", "seguro movel celular"].includes(itemPlano)
      );
  const vendaInternet = isPlanoInternet ? venda : findVendaByPlano((itemPlano) => itemPlano === "internet residencial");
  const vendaTv = isPlanoTv ? venda : findVendaByPlano((itemPlano) => itemPlano === "tv");
  const vendaAparelho = isPlanoAparelho ? venda : findVendaByPlano((itemPlano) => itemPlano === "aparelho celular");
  const vendaAcessorio = isPlanoAcessorio ? venda : findVendaByPlano((itemPlano) => itemPlano === "acessorios");
  const vendaSeguro = isPlanoSeguro ? venda : findVendaByPlano((itemPlano) => itemPlano === "seguro movel celular");
  const hasComandaMovelExtra = Boolean(
    venda.comandaMovelAtiva ||
    venda.comandaMovelServico ||
    venda.comandaMovelNumero ||
    venda.comandaMovelPortabilidade ||
    venda.comandaMovelIccid
  );
  const hasComandaInternetExtra = Boolean(
    venda.comandaInternetAtiva ||
    venda.comandaInternetPlano ||
    venda.comandaInternetDataInstalacao ||
    venda.comandaInternetContrato ||
    venda.comandaInternetPeriodo ||
    venda.comandaInternetHfcGpon
  );
  const hasComandaTvExtra = Boolean(
    venda.comandaTvAtiva ||
    venda.comandaTvPlano ||
    venda.comandaTvDataInstalacao ||
    venda.comandaTvContrato ||
    venda.comandaTvBoxImediata
  );
  const hasComandaAparelhoExtra = Boolean(
    venda.comandaAparelhoAtiva ||
    venda.comandaAparelhoModelo ||
    venda.comandaAparelhoImei ||
    venda.comandaAparelhoValor
  );
  const hasComandaAcessoriosExtra = Boolean(
    venda.comandaAcessoriosAtiva ||
    venda.comandaAcessoriosDescricao ||
    venda.comandaAcessoriosQuantidade ||
    venda.comandaAcessoriosValor
  );

  const dataVenda = formatDateBr(venda.data);
  const cliente = (venda.cliente || "").toUpperCase();
  const cpf = venda.cpf || "";
  const observacao = venda.descricao || "";
  const vendedor = venda.vendedor || "";
  const ordemVenda = venda.ordemVenda || venda.ordem || "";
  const cep = venda.cep || "";
  const dataNascimento = formatDateBr(venda.dataNascimento || "");

  const titularServico = vendaMovel ? vendaMovel.tipoPlano || vendaMovel.plano || "" : hasComandaMovelExtra ? venda.comandaMovelServico || "" : "";
  const numeroProvisorio = vendaMovel ? vendaMovel.numero || "" : hasComandaMovelExtra ? venda.comandaMovelNumero || "" : "";
  const numeroPortado =
    vendaMovel
      ? vendaMovel.portabilidade || vendaMovel.numero || ""
      : hasComandaMovelExtra
        ? venda.comandaMovelPortabilidade || venda.comandaMovelNumero || ""
        : "";
  const titularIccid = vendaMovel ? vendaMovel.iccid || "" : hasComandaMovelExtra ? venda.comandaMovelIccid || "" : "";
  const mobileVendasExtras = vendasComanda
    .filter((item) => item && isMobilePlano(item.plano) && !sameVenda(item, vendaMovel))
    .map((item) => ({
      tipo: item.tipoPlano || item.plano || "",
      numero: item.numero || "",
      portabilidade: item.portabilidade || item.numero || "",
      iccid: item.iccid || "",
    }));
  const controleDependentes = Array.isArray(venda.controleAdicionais)
    ? venda.controleAdicionais.map((item) => ({
        tipo: item?.tipoPlano || "",
        numero: item?.numero || "",
        portabilidade: item?.tipoNumeroPortado === "portabilidade" ? item?.portabilidade || "" : item?.numero || "",
        iccid: item?.iccid || "",
      }))
    : [];
  const posPagoDependentes = Array.isArray(venda.posPagoDependentes)
    ? venda.posPagoDependentes.map((item) => ({
        tipo: item?.tipo || "",
        numero: item?.numero || "",
        portabilidade: item?.portabilidade || item?.numero || "",
        iccid: item?.iccid || "",
      }))
    : [];
  const storedComandaDependentes = Array.isArray(venda.comandaDependentes) ? venda.comandaDependentes : [];
  const comandaDependentes = uniqueComandaDependentes([
    ...mobileVendasExtras,
    ...storedComandaDependentes,
    ...controleDependentes,
    ...posPagoDependentes,
  ]).slice(0, 5);
  const dependentesRowsXml = Array.from({ length: 5 }, (_, index) => {
    const dependente = comandaDependentes[index] || {};
    return buildComandaRow([
      buildComandaCell(`Dependente ${index + 1}`, { style: "ComandaLabel" }),
      buildComandaCell(dependente.tipo || ""),
      buildComandaCell(dependente.portabilidade || dependente.numero || "", { style: "ComandaValueCenter" }),
      buildComandaCell("", { style: "ComandaValueCenter" }),
      buildComandaCell("", { style: "ComandaValueCenter" }),
      buildComandaCell(dependente.iccid || "", { style: "ComandaValueCenter" }),
    ]);
  }).join("");
  const modelo = vendaAparelho ? vendaAparelho.modelo || vendaAparelho.tipoPlano || "" : hasComandaAparelhoExtra ? venda.comandaAparelhoModelo || "" : "";
  const imei = vendaAparelho ? vendaAparelho.imei || "" : hasComandaAparelhoExtra ? venda.comandaAparelhoImei || "" : "";
  const valorPre = vendaAparelho ? parseNumericValue(vendaAparelho.valor) : hasComandaAparelhoExtra ? parseNumericValue(venda.comandaAparelhoValor) : 0;

  const seguroTipoSelecionado = venda.comandaSeguroTipo || (vendaSeguro ? vendaSeguro.tipoPlano || vendaSeguro.plano || "" : "");
  const seguroTexto = seguroTipoSelecionado ? `SIM - ${seguroTipoSelecionado}` : "";

  const internetPlano = vendaInternet ? vendaInternet.tipoPlano || "" : hasComandaInternetExtra ? venda.comandaInternetPlano || "" : "";
  const internetDataInstalacao = vendaInternet ? formatDateBr(vendaInternet.dataInstalacao || "") : formatDateBr(venda.comandaInternetDataInstalacao || "");
  const internetContrato = vendaInternet ? vendaInternet.contrato || "" : hasComandaInternetExtra ? venda.comandaInternetContrato || "" : "";
  const internetBox = "";
  const internetPeriodo = vendaInternet ? vendaInternet.periodo || "" : hasComandaInternetExtra ? venda.comandaInternetPeriodo || "" : "";
  const internetHfcGpon = vendaInternet ? vendaInternet.hfcGpon || vendaInternet.tecnologia || "" : hasComandaInternetExtra ? venda.comandaInternetHfcGpon || "" : "";
  const tvPlano = vendaTv ? vendaTv.tipoPlano || "" : hasComandaTvExtra ? venda.comandaTvPlano || "" : "";
  const tvDataInstalacao = vendaTv ? formatDateBr(vendaTv.dataInstalacao || "") : formatDateBr(venda.comandaTvDataInstalacao || "");
  const tvContrato = vendaTv ? vendaTv.contrato || "" : hasComandaTvExtra ? venda.comandaTvContrato || "" : "";
  const tvBox = vendaTv ? vendaTv.boxImediata || "" : hasComandaTvExtra ? venda.comandaTvBoxImediata || "" : "";

  const acessoriosQuantidade = vendaAcessorio ? parseNumericValue(vendaAcessorio.qty, 1) : hasComandaAcessoriosExtra ? parseNumericValue(venda.comandaAcessoriosQuantidade, 1) : "";
  const acessoriosReceita = vendaAcessorio ? parseNumericValue(vendaAcessorio.valor) : hasComandaAcessoriosExtra ? parseNumericValue(venda.comandaAcessoriosValor) : null;

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
        <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#111827"/>
      </Style>
      <Style ss:ID="ComandaTitle">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
        <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
        </Borders>
      </Style>
      <Style ss:ID="ComandaSection">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
        <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1"/>
        <Interior ss:Color="#D1D5DB" ss:Pattern="Solid"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
        </Borders>
      </Style>
      <Style ss:ID="ComandaLabel">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
        <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1"/>
        <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
        </Borders>
      </Style>
      <Style ss:ID="ComandaValue">
        <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
        </Borders>
      </Style>
      <Style ss:ID="ComandaValueCenter">
        <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
        </Borders>
      </Style>
      <Style ss:ID="ComandaCurrency">
        <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
        </Borders>
        <NumberFormat ss:Format="&quot;R$&quot; #,##0.00"/>
      </Style>
    </Styles>
    <Worksheet ss:Name="Comanda de Venda">
      <Table>
        <Column ss:AutoFitWidth="0" ss:Width="110"/>
        <Column ss:AutoFitWidth="0" ss:Width="140"/>
        <Column ss:AutoFitWidth="0" ss:Width="120"/>
        <Column ss:AutoFitWidth="0" ss:Width="140"/>
        <Column ss:AutoFitWidth="0" ss:Width="120"/>
        <Column ss:AutoFitWidth="0" ss:Width="120"/>
        ${buildComandaRow([buildComandaCell("COMANDA DE VENDAS - MUELLER PR", { style: "ComandaTitle", mergeAcross: 5 })])}
        ${buildComandaRow([buildComandaCell("Vendedor", { style: "ComandaLabel" }), buildComandaCell(vendedor, { mergeAcross: 1 }), buildComandaCell("Data da venda", { style: "ComandaLabel" }), buildComandaCell(dataVenda, { style: "ComandaValueCenter", mergeAcross: 1 })])}
        ${buildComandaRow([buildComandaCell("Ordem de venda", { style: "ComandaLabel" }), buildComandaCell(ordemVenda, { mergeAcross: 1 }), buildComandaCell("Nome do cliente", { style: "ComandaLabel" }), buildComandaCell(cliente, { mergeAcross: 1 })])}
        ${buildComandaRow([buildComandaCell("", { mergeAcross: 2 }), buildComandaCell("CPF/CNPJ do cliente", { style: "ComandaLabel" }), buildComandaCell(cpf, { mergeAcross: 1 })])}
        ${buildComandaRow([buildComandaCell("CEP", { style: "ComandaLabel" }), buildComandaCell(cep, { mergeAcross: 1 }), buildComandaCell("Data de nascimento", { style: "ComandaLabel" }), buildComandaCell(dataNascimento, { style: "ComandaValueCenter", mergeAcross: 1 })])}
        ${buildComandaRow([buildComandaCell("", { mergeAcross: 2 }), buildComandaCell("OBSERVACAO VENDA", { style: "ComandaLabel" }), buildComandaCell(observacao, { mergeAcross: 2 })])}
        ${buildComandaRow([])}
        ${buildComandaRow([buildComandaCell("Plano", { style: "ComandaSection" }), buildComandaCell("Servico", { style: "ComandaSection" }), buildComandaCell("Numero portado", { style: "ComandaSection" }), buildComandaCell("Numero provisorio", { style: "ComandaSection" }), buildComandaCell("e-sim", { style: "ComandaSection" }), buildComandaCell("ICCID", { style: "ComandaSection" })])}
        ${buildComandaRow([buildComandaCell("Titular", { style: "ComandaLabel" }), buildComandaCell(titularServico), buildComandaCell(numeroPortado, { style: "ComandaValueCenter" }), buildComandaCell(numeroProvisorio, { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell(titularIccid, { style: "ComandaValueCenter" })])}
        ${dependentesRowsXml}
        ${buildComandaRow([])}
        ${buildComandaRow([buildComandaCell("DADOS DOS APARELHOS", { style: "ComandaSection", mergeAcross: 3 }), buildComandaCell("SEGURO", { style: "ComandaSection", mergeAcross: 1 })])}
        ${buildComandaRow([buildComandaCell("Modelo", { style: "ComandaLabel" }), buildComandaCell(modelo, { mergeAcross: 2 }), buildComandaCell("Seguro", { style: "ComandaLabel" }), buildComandaCell(seguroTexto, { mergeAcross: 1 })])}
        ${buildComandaRow([buildComandaCell("IMEI", { style: "ComandaLabel" }), buildComandaCell(imei, { mergeAcross: 2 }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { mergeAcross: 1 })])}
        ${buildComandaRow([buildComandaCell("Valor no pre", { style: "ComandaLabel" }), buildComandaCell(valorPre > 0 ? valorPre : "", { style: valorPre > 0 ? "ComandaCurrency" : "ComandaValue", type: valorPre > 0 ? "Number" : "String", mergeAcross: 2 }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { mergeAcross: 1 })])}
        ${buildComandaRow([])}
        ${buildComandaRow([buildComandaCell("Servico Contratado", { style: "ComandaSection" }), buildComandaCell("TV", { style: "ComandaSection" }), buildComandaCell("Internet", { style: "ComandaSection" }), buildComandaCell("HFC / Gpon", { style: "ComandaSection" }), buildComandaCell("Periodo", { style: "ComandaSection" }), buildComandaCell("", { style: "ComandaSection" })])}
        ${buildComandaRow([buildComandaCell("Plano Contratado", { style: "ComandaLabel" }), buildComandaCell(tvPlano, { style: "ComandaValueCenter" }), buildComandaCell(internetPlano, { style: "ComandaValueCenter" }), buildComandaCell(internetHfcGpon, { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" })])}
        ${buildComandaRow([buildComandaCell("Data da Instalacao", { style: "ComandaLabel" }), buildComandaCell(tvDataInstalacao, { style: "ComandaValueCenter" }), buildComandaCell(internetDataInstalacao, { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell(internetPeriodo, { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" })])}
        ${buildComandaRow([buildComandaCell("Numero do Contrato", { style: "ComandaLabel" }), buildComandaCell(tvContrato, { style: "ComandaValueCenter" }), buildComandaCell(internetContrato, { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" })])}
        ${buildComandaRow([buildComandaCell("BOX IMEDIATA", { style: "ComandaLabel" }), buildComandaCell(tvBox, { style: "ComandaValueCenter" }), buildComandaCell(internetBox, { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" })])}
        ${buildComandaRow([])}
        ${buildComandaRow([buildComandaCell("Acessorios", { style: "ComandaSection", mergeAcross: 5 })])}
        ${buildComandaRow([buildComandaCell("Quantidade", { style: "ComandaLabel" }), buildComandaCell(acessoriosQuantidade, { mergeAcross: 5 })])}
        ${buildComandaRow([buildComandaCell("Valor de Receita", { style: "ComandaLabel" }), acessoriosReceita !== null ? buildComandaCell(acessoriosReceita, { style: "ComandaCurrency", type: "Number", mergeAcross: 5 }) : buildComandaCell("", { mergeAcross: 5 })])}
      </Table>
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
