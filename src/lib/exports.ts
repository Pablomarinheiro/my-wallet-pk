import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { currency } from "./mock-data";

export type ExportRow = {
  date: string;
  description: string;
  category: string;
  account: string;
  type: string;
  status: string;
  amount: number;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function typeLabel(t: string) {
  return t === "income" ? "Receita" : t === "expense" ? "Despesa" : "Transferência";
}

export function exportCSV(rows: ExportRow[], filename: string) {
  const headers = ["Data", "Descrição", "Categoria", "Conta", "Tipo", "Status", "Valor"];
  const lines = [headers.join(";")];
  for (const r of rows) {
    const cells = [
      fmtDate(r.date),
      r.description,
      r.category,
      r.account,
      typeLabel(r.type),
      r.status === "confirmed" ? "Confirmada" : "Pendente",
      r.amount.toFixed(2).replace(".", ","),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(cells.join(";"));
  }
  // BOM for Excel-friendly UTF-8
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${filename}.csv`);
}

export function exportExcel(rows: ExportRow[], filename: string, summary?: Record<string, number>) {
  const wb = XLSX.utils.book_new();

  const data = rows.map((r) => ({
    Data: fmtDate(r.date),
    Descrição: r.description,
    Categoria: r.category,
    Conta: r.account,
    Tipo: typeLabel(r.type),
    Status: r.status === "confirmed" ? "Confirmada" : "Pendente",
    Valor: Number(r.amount),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 12 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Transações");

  if (summary) {
    const sumRows = Object.entries(summary).map(([k, v]) => ({ Indicador: k, Valor: v }));
    const ws2 = XLSX.utils.json_to_sheet(sumRows);
    ws2["!cols"] = [{ wch: 24 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Resumo");
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPDF(
  rows: ExportRow[],
  filename: string,
  meta: { title: string; period: string; summary?: Record<string, number> },
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(meta.title, 40, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(meta.period, 40, 66);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, pageWidth - 40, 66, { align: "right" });

  let y = 90;
  if (meta.summary) {
    const entries = Object.entries(meta.summary);
    const boxW = (pageWidth - 80 - (entries.length - 1) * 12) / entries.length;
    entries.forEach(([k, v], i) => {
      const x = 40 + i * (boxW + 12);
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, boxW, 56, 10, 10, "FD");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(k, x + 12, y + 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(currency(v), x + 12, y + 42);
      doc.setFont("helvetica", "normal");
    });
    y += 76;
  }

  autoTable(doc, {
    startY: y,
    head: [["Data", "Descrição", "Categoria", "Conta", "Tipo", "Status", "Valor"]],
    body: rows.map((r) => [
      fmtDate(r.date),
      r.description,
      r.category,
      r.account,
      typeLabel(r.type),
      r.status === "confirmed" ? "Confirmada" : "Pendente",
      currency(Number(r.amount)),
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: [15, 23, 42] },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 6: { halign: "right" } },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${filename}.pdf`);
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
