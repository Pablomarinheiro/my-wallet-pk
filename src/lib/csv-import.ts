export type ParsedCsv = { headers: string[]; rows: string[][] };

function splitRows(clean: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === delimiter) { row.push(field); field = ""; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  // Try every candidate delimiter and keep the one that yields the most
  // consistent, widest table — counting characters alone misreads files where
  // decimal commas or thousands separators outnumber the real delimiter.
  let rows: string[][] = [];
  let bestScore = -Infinity;
  for (const d of [";", ",", "\t", "|"]) {
    const candidate = splitRows(clean, d).filter((r) => r.some((c) => c.trim() !== ""));
    if (candidate.length === 0) continue;
    const widths = candidate.slice(0, 50).map((r) => r.length);
    const mode = widths.sort((a, b) =>
      widths.filter((w) => w === b).length - widths.filter((w) => w === a).length)[0] ?? 1;
    if (mode < 2) continue;
    const consistency = widths.filter((w) => w === mode).length / widths.length;
    const score = mode * consistency;
    if (score > bestScore) { bestScore = score; rows = candidate; }
  }
  if (rows.length === 0) rows = splitRows(clean, ";").filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) return { headers: [], rows: [] };

  // Some exports start with title/blank rows; use the widest row in the first
  // 15 as the header line so mapping works on real bank/spreadsheet files.
  let headerIdx = 0;
  let best = -1;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const count = (rows[i] ?? []).filter((c) => c.trim() !== "").length;
    if (count > best) { best = count; headerIdx = i; }
  }

  const headerRow = rows[headerIdx] ?? [];
  const width = Math.max(...rows.map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => (headerRow[i] ?? "").trim());
  const body = rows.slice(headerIdx + 1).map((r) => headers.map((_, i) => (r[i] ?? "").trim()));
  return { headers, rows: body };
}

/** Infers column roles by looking at the actual values when headers don't match. */
export function inferColumns(rows: string[][], width: number) {
  const sample = rows.slice(0, 80);
  const score = { date: 0, amount: 0, description: 0 };
  const idx = { date: "none", amount: "none", description: "none" };
  for (let c = 0; c < width; c++) {
    let dates = 0, amounts = 0, texts = 0;
    for (const r of sample) {
      const v = (r[c] ?? "").trim();
      if (!v) continue;
      if (parseDate(v)) dates++;
      else if (parseAmount(v) !== null) amounts++;
      else if (/[a-zA-ZÀ-ú]{3,}/.test(v)) texts++;
    }
    if (dates > score.date) { score.date = dates; idx.date = String(c); }
    if (amounts > score.amount) { score.amount = amounts; idx.amount = String(c); }
    if (texts > score.description) { score.description = texts; idx.description = String(c); }
  }
  return {
    date: score.date > 0 ? idx.date : "none",
    amount: score.amount > 0 ? idx.amount : "none",
    description: score.description > 0 ? idx.description : "none",
  };
}


/** Detects common column names (pt-BR and en) and returns the header index. */
export function guessColumn(headers: string[], candidates: string[]) {
  const h = headers.map(normalizeName);
  for (const c of candidates) {
    const idx = h.findIndex((x) => x === normalizeName(c));
    if (idx >= 0) return String(idx);
  }
  for (const c of candidates) {
    const idx = h.findIndex((x) => x !== "" && x.includes(normalizeName(c)));
    if (idx >= 0) return String(idx);
  }
  return "none";
}

/** Accepts 1.234,56 / 1,234.56 / -45.90 / R$ 45,90 / (45,90) / 45,90 D */
export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw.replace(/\s|\u00a0/g, "").replace(/r\$/i, "");
  let negative = false;
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }
  if (/^-/.test(s)) { negative = true; s = s.slice(1); }
  if (/-$/.test(s)) { negative = true; s = s.slice(0, -1); }
  if (s.startsWith("+")) s = s.slice(1);
  if (/^[dD]$/.test(s.slice(-1)) && /\d/.test(s)) { negative = true; s = s.slice(0, -1); }
  if (/^[cC]$/.test(s.slice(-1)) && /\d/.test(s)) s = s.slice(0, -1);
  // Reject values that are mostly text (e.g. "Mercado 24h")
  if (/[a-zA-ZÀ-ú]{2,}/.test(s)) return null;
  s = s.replace(/[^\d.,]/g, "");
  if (!s || !/\d/.test(s)) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else if (lastDot > lastComma) s = s.replace(/,/g, "");
  else s = s.replace(/[.,]/g, "");
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

const MONTHS: Record<string, string> = {
  jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06",
  jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
  feb: "02", apr: "04", may: "05", aug: "08", sep: "09", oct: "10", dec: "12",
};

/** Accepts dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, dd/mm/yy, dd/mm, "12 ago 2026", "01/ago" */
export function parseDate(raw: string, fallbackYear = new Date().getFullYear()): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;

  m = /^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?$/.exec(s);
  if (m) {
    const d = m[1]!.padStart(2, "0");
    const mo = m[2]!.padStart(2, "0");
    let y = m[3] ?? String(fallbackYear);
    if (y.length === 2) y = `20${y}`;
    if (Number(mo) < 1 || Number(mo) > 12 || Number(d) < 1 || Number(d) > 31) return null;
    return `${y}-${mo}-${d}`;
  }

  // 12/ago/2026, 12 ago 2026, 12-ago-26
  m = /^(\d{1,2})[\s/\-.]+([a-zA-ZÀ-ú]{3,})\.?(?:[\s/\-.]+(\d{2,4}))?$/.exec(s);
  if (m) {
    const mo = MONTHS[normalizeName(m[2]!).slice(0, 3)];
    if (mo) {
      let y = m[3] ?? String(fallbackYear);
      if (y.length === 2) y = `20${y}`;
      return `${y}-${mo}-${m[1]!.padStart(2, "0")}`;
    }
  }

  // Excel serial date (days since 1899-12-30)
  if (/^\d{5}$/.test(s)) {
    const n = Number(s);
    if (n > 20000 && n < 60000) {
      return new Date(Date.UTC(1899, 11, 30) + n * 86400000).toISOString().slice(0, 10);
    }
  }
  return null;
}

export function normalizeName(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function parseType(raw: string, amount: number): "income" | "expense" {
  const t = normalizeName(raw);
  if (["receita", "income", "entrada", "credito", "crédito", "c", "+", "ganho", "provento"].includes(t)) return "income";
  if (["despesa", "expense", "saida", "debito", "d", "-", "gasto", "pagamento"].includes(t)) return "expense";
  return amount >= 0 ? "income" : "expense";
}
