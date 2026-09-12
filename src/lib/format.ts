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

/**
 * Verifica se uma data "YYYY-MM-DD" cai no mês/ano informados, tratando a
 * string como data local (via parseLocalDate) em vez de UTC. `month` é
 * 0-indexado (janeiro = 0), igual ao retorno de `Date#getMonth()`.
 *
 * Centraliza o agrupamento "esta transação é deste mês?" repetido em
 * Dashboard/Orçamento/Relatórios, para que um teste cubra as três telas.
 */
export function isInMonth(iso: string, month: number, year: number): boolean {
  const d = parseLocalDate(iso);
  return d.getMonth() === month && d.getFullYear() === year;
}
