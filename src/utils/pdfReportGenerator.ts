// @ts-nocheck
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

type ReportLine = { code: string; name: string; currentYear?: number; prevYear?: number; currentPeriod?: number; prevPeriod?: number };

const vnd = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

function addHeader(doc: jsPDF, companyName: string, title: string, period: string) {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName || 'LedgerFlow Company', 105, 18, { align: 'center' });
  doc.setFontSize(13);
  doc.text(title, 105, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Kỳ kế toán: ${period || new Date().getFullYear()}`, 105, 36, { align: 'center' });
  doc.text('Đơn vị tính: VND', 14, 44);
  doc.text(`Ngày in: ${new Date().toLocaleDateString('vi-VN')}`, 155, 44);
  doc.line(14, 48, 196, 48);
}

function addSignature(doc: jsPDF, startY: number) {
  const y = Math.min(startY + 24, 278);
  doc.setFontSize(10);
  doc.text('Người lập biểu', 40, y, { align: 'center' });
  doc.text('Kế toán trưởng', 105, y, { align: 'center' });
  doc.text('Giám đốc', 170, y, { align: 'center' });
}

export function generateBalanceSheet(data: { companyName: string; period: string; assets: ReportLine[]; liabilities: ReportLine[]; equity: ReportLine[] }): Blob {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  addHeader(doc, data.companyName, 'BẢNG CÂN ĐỐI KẾ TOÁN', data.period);
  const assets = data.assets || [];
  const liabilities = data.liabilities || [];
  const equity = data.equity || [];
  const total = (items: ReportLine[], key: 'currentYear' | 'prevYear') => items.reduce((sum, item) => sum + Number(item[key] || 0), 0);
  const rows = [
    ['A', 'TÀI SẢN', '', ''],
    ...assets.map((item) => [item.code, item.name, vnd(item.currentYear || 0), vnd(item.prevYear || 0)]),
    ['', 'TỔNG TÀI SẢN', vnd(total(assets, 'currentYear')), vnd(total(assets, 'prevYear'))],
    ['B', 'NỢ PHẢI TRẢ VÀ VỐN CHỦ SỞ HỮU', '', ''],
    ...liabilities.map((item) => [item.code, item.name, vnd(item.currentYear || 0), vnd(item.prevYear || 0)]),
    ...equity.map((item) => [item.code, item.name, vnd(item.currentYear || 0), vnd(item.prevYear || 0)]),
    ['', 'TỔNG CỘNG NGUỒN VỐN', vnd(total([...liabilities, ...equity], 'currentYear')), vnd(total([...liabilities, ...equity], 'prevYear'))],
  ];
  autoTable(doc, { startY: 52, head: [['Mã số', 'Chỉ tiêu', 'Năm nay', 'Năm trước']], body: rows, theme: 'grid', styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' }, columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 90 }, 2: { cellWidth: 40, halign: 'right' }, 3: { cellWidth: 40, halign: 'right' } } });
  addSignature(doc, doc.lastAutoTable?.finalY || 230);
  return doc.output('blob');
}

export function generateIncomeStatement(data: { companyName: string; period: string; items: ReportLine[] }): Blob {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  addHeader(doc, data.companyName, 'BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH', data.period);
  autoTable(doc, { startY: 52, head: [['Mã số', 'Chỉ tiêu', 'Kỳ này', 'Kỳ trước']], body: (data.items || []).map((item) => [item.code, item.name, vnd(item.currentPeriod || 0), vnd(item.prevPeriod || 0)]), theme: 'grid', styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' }, columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 100 }, 2: { cellWidth: 35, halign: 'right' }, 3: { cellWidth: 35, halign: 'right' } } });
  addSignature(doc, doc.lastAutoTable?.finalY || 230);
  return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
