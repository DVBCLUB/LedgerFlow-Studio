export function generateBalanceSheet(data: unknown): Blob {
  return new Blob([JSON.stringify({ type: 'balance_sheet', data }, null, 2)], { type: 'application/json' });
}

export function generateIncomeStatement(data: unknown): Blob {
  return new Blob([JSON.stringify({ type: 'income_statement', data }, null, 2)], { type: 'application/json' });
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
