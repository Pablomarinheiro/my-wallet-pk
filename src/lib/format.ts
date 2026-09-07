export type TxType = "income" | "expense" | "transfer";

export const currency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Interpreta "YYYY-MM-DD" (data sem hora) como data LOCAL, não UTC.
 * `new Date("2026-09-06")` é meia-noite UTC e recua um dia em UTC-3;
 * esta função monta com ano/mês/dia no fuso do navegador.
 */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export const shortDate = (iso: string) =>
  parseLocalDate(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
