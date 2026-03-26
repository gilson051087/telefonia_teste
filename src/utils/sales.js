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

export function exportVendaComanda(filename, venda = {}) {
  const plano = venda.plano || "";
  const servico = venda.tipoPlano || "";
  const planoLower = normalizeForMatch(plano);

  const isPlanoMovel =
    planoLower === "plano controle" ||
    planoLower === "plano pos-pago" ||
    planoLower === "internet movel mais" ||
    planoLower === "seguro movel celular";
  const isPlanoInternet = planoLower === "internet residencial";
  const isPlanoTv = planoLower === "tv";
  const isPlanoAparelho = planoLower === "aparelho celular";
  const isPlanoAcessorio = planoLower === "acessorios";
  const isPlanoSeguro = planoLower === "seguro movel celular";
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
  const cliente = venda.cliente || "";
  const cpf = venda.cpf || "";
  const observacao = venda.descricao || "";
  const vendedor = venda.vendedor || "";
  const ordemVenda = venda.ordemVenda || venda.ordem || "";
  const cep = venda.cep || "";
  const dataNascimento = formatDateBr(venda.dataNascimento || "");

  const titularServico = isPlanoMovel ? servico || plano : hasComandaMovelExtra ? venda.comandaMovelServico || "" : "";
  const numeroProvisorio = isPlanoMovel ? venda.numero || "" : hasComandaMovelExtra ? venda.comandaMovelNumero || "" : "";
  const numeroPortado =
    isPlanoMovel
      ? venda.portabilidade || venda.numero || ""
      : hasComandaMovelExtra
        ? venda.comandaMovelPortabilidade || venda.comandaMovelNumero || ""
        : "";
  const titularIccid = isPlanoMovel ? venda.iccid || "" : hasComandaMovelExtra ? venda.comandaMovelIccid || "" : "";
  const modelo = isPlanoAparelho ? venda.modelo || "" : hasComandaAparelhoExtra ? venda.comandaAparelhoModelo || "" : "";
  const imei = isPlanoAparelho ? venda.imei || "" : hasComandaAparelhoExtra ? venda.comandaAparelhoImei || "" : "";
  const valorPre = isPlanoAparelho ? Number(venda.valor) || 0 : hasComandaAparelhoExtra ? Number(venda.comandaAparelhoValor) || 0 : 0;

  const seguroTipoSelecionado = venda.comandaSeguroTipo || (isPlanoSeguro ? servico || plano : "");
  const seguroTexto = seguroTipoSelecionado ? `SIM - ${seguroTipoSelecionado}` : "";

  const internetPlano = isPlanoInternet ? servico : hasComandaInternetExtra ? venda.comandaInternetPlano || "" : "";
  const internetDataInstalacao = isPlanoInternet ? formatDateBr(venda.dataInstalacao || "") : formatDateBr(venda.comandaInternetDataInstalacao || "");
  const internetContrato = isPlanoInternet ? venda.contrato || "" : hasComandaInternetExtra ? venda.comandaInternetContrato || "" : "";
  const internetBox = "";
  const internetPeriodo = isPlanoInternet ? venda.periodo || "" : hasComandaInternetExtra ? venda.comandaInternetPeriodo || "" : "";
  const internetHfcGpon = isPlanoInternet ? venda.hfcGpon || venda.tecnologia || "" : hasComandaInternetExtra ? venda.comandaInternetHfcGpon || "" : "";
  const tvPlano = isPlanoTv ? servico : hasComandaTvExtra ? venda.comandaTvPlano || "" : "";
  const tvDataInstalacao = isPlanoTv ? formatDateBr(venda.dataInstalacao || "") : formatDateBr(venda.comandaTvDataInstalacao || "");
  const tvContrato = isPlanoTv ? venda.contrato || "" : hasComandaTvExtra ? venda.comandaTvContrato || "" : "";
  const tvBox = isPlanoTv ? venda.boxImediata || "" : hasComandaTvExtra ? venda.comandaTvBoxImediata || "" : "";

  const acessoriosQuantidade = isPlanoAcessorio ? Number(venda.qty) || 1 : hasComandaAcessoriosExtra ? Number(venda.comandaAcessoriosQuantidade) || 1 : "";
  const acessoriosReceita = isPlanoAcessorio ? Number(venda.valor) || 0 : hasComandaAcessoriosExtra ? Number(venda.comandaAcessoriosValor) || 0 : null;

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
        ${buildComandaRow([buildComandaCell("", { mergeAcross: 2 }), buildComandaCell("CPF do cliente", { style: "ComandaLabel" }), buildComandaCell(cpf, { mergeAcross: 1 })])}
        ${buildComandaRow([buildComandaCell("CEP", { style: "ComandaLabel" }), buildComandaCell(cep, { mergeAcross: 1 }), buildComandaCell("Data de nascimento", { style: "ComandaLabel" }), buildComandaCell(dataNascimento, { style: "ComandaValueCenter", mergeAcross: 1 })])}
        ${buildComandaRow([buildComandaCell("", { mergeAcross: 2 }), buildComandaCell("OBSERVACAO VENDA", { style: "ComandaLabel" }), buildComandaCell(observacao, { mergeAcross: 2 })])}
        ${buildComandaRow([])}
        ${buildComandaRow([buildComandaCell("Plano", { style: "ComandaSection" }), buildComandaCell("Servico", { style: "ComandaSection" }), buildComandaCell("Numero portado", { style: "ComandaSection" }), buildComandaCell("Numero provisorio", { style: "ComandaSection" }), buildComandaCell("e-sim", { style: "ComandaSection" }), buildComandaCell("ICCID", { style: "ComandaSection" })])}
        ${buildComandaRow([buildComandaCell("Titular", { style: "ComandaLabel" }), buildComandaCell(titularServico), buildComandaCell(numeroPortado, { style: "ComandaValueCenter" }), buildComandaCell(numeroProvisorio, { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell(titularIccid, { style: "ComandaValueCenter" })])}
        ${buildComandaRow([buildComandaCell("Dependente 1", { style: "ComandaLabel" }), buildComandaCell(""), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" })])}
        ${buildComandaRow([buildComandaCell("Dependente 2", { style: "ComandaLabel" }), buildComandaCell(""), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" })])}
        ${buildComandaRow([buildComandaCell("Dependente 3", { style: "ComandaLabel" }), buildComandaCell(""), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" })])}
        ${buildComandaRow([buildComandaCell("Dependente 4", { style: "ComandaLabel" }), buildComandaCell(""), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" })])}
        ${buildComandaRow([buildComandaCell("Dependente 5", { style: "ComandaLabel" }), buildComandaCell(""), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" }), buildComandaCell("", { style: "ComandaValueCenter" })])}
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
