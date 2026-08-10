export type ParsedCsv = { headers: string[]; rows: string[][] };

export function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const delimiter = pickDelimiter(clean);
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

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  // Some exports start with title/blank rows; use the widest row in the first
  // 15 as the header line so mapping works on real bank/spreadsheet files.
  let headerIdx = 0;
  let best = -1;
  for (let i = 0; i < Math.min(15, nonEmpty.length); i++) {
    const count = (nonEmpty[i] ?? []).filter((c) => c.trim() !== "").length;
    if (count > best) { best = count; headerIdx = i; }
  }

  const headerRow = nonEmpty[headerIdx] ?? [];
  const width = Math.max(...nonEmpty.map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => (headerRow[i] ?? "").trim());
  const body = nonEmpty.slice(headerIdx + 1).map((r) => headers.map((_, i) => (r[i] ?? "").trim()));
  return { headers, rows: body };
}

function pickDelimiter(text: string) {
  const lines = text.split("\n").filter((l) => l.trim() !== "").slice(0, 15);
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  for (const line of lines) {
    counts[";"]! += (line.match(/;/g) ?? []).length;
    counts[","]! += (line.match(/,/g) ?? []).length;
    counts["\t"]! += (line.match(/\t/g) ?? []).length;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ";";
}

/** Infers column roles by looking at the actual values when headers don't match. */
export function inferColumns(rows: string[][], width: number) {
  const sample = rows.slice(0, 60);
  const score = { date: -1, amount: -1, description: -1 };
  const idx = { date: "none", amount: "none", description: "none" };
  for (let c = 0; c < width; c++) {
    let dates = 0, amounts = 0, texts = 0;
    for (const r of sample) {
      const v = (r[c] ?? "").trim();
      if (!v) continue;
      if (parseDate(v)) dates++;
      else if (parseAmount(v) !== null && /\d/.test(v)) amounts++;
      if (/[a-zA-ZÀ-ú]{3,}/.test(v)) texts++;
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
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const h = headers.map(norm);
  for (const c of candidates) {
    const idx = h.findIndex((x) => x === norm(c));
    if (idx >= 0) return String(idx);
  }
  for (const c of candidates) {
    const idx = h.findIndex((x) => x.includes(norm(c)));
    if (idx >= 0) return String(idx);
  }
  return "none";
}

/** Accepts 1.234,56 / 1,234.56 / -45.90 / R$ 45,90 / (45,90) */
export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw.replace(/\s/g, "").replace(/r\$/i, "");
  let negative = false;
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }
  if (s.startsWith("-")) { negative = true; s = s.slice(1); }
  if (s.startsWith("+")) s = s.slice(1);
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Accepts dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, dd/mm/yy */
export function parseDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim().slice(0, 10);
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/.exec(s);
  if (m) {
    const d = m[1]!.padStart(2, "0");
    const mo = m[2]!.padStart(2, "0");
    let y = m[3]!;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${mo}-${d}`;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

export function normalizeName(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function parseType(raw: string, amount: number): "income" | "expense" {
  const t = normalizeName(raw);
  if (["receita", "income", "entrada", "credito", "c", "+"].includes(t)) return "income";
  if (["despesa", "expense", "saida", "debito", "d", "-"].includes(t)) return "expense";
  return amount >= 0 ? "income" : "expense";
}
