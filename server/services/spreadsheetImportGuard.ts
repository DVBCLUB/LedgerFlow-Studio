import * as XLSX from 'xlsx';

export type SpreadsheetImportLimits = {
  maxFileBytes: number;
  maxSheets: number;
  maxRowsPerSheet: number;
  maxCells: number;
};

export type GuardedWorkbook = {
  workbook: XLSX.WorkBook;
  sheetNames: string[];
};

export const DEFAULT_SPREADSHEET_IMPORT_LIMITS: SpreadsheetImportLimits = {
  maxFileBytes: 10 * 1024 * 1024,
  maxSheets: 10,
  maxRowsPerSheet: 50_000,
  maxCells: 500_000,
};

export class SpreadsheetImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpreadsheetImportError';
  }
}

function countRangeCells(ref: string | undefined): { rows: number; cells: number } {
  if (!ref) return { rows: 0, cells: 0 };
  const range = XLSX.utils.decode_range(ref);
  const rows = Math.max(0, range.e.r - range.s.r + 1);
  const cols = Math.max(0, range.e.c - range.s.c + 1);
  return { rows, cells: rows * cols };
}

function assertWorkbookWithinLimits(workbook: XLSX.WorkBook, limits: SpreadsheetImportLimits): string[] {
  const sheetNames = workbook.SheetNames.slice(0, limits.maxSheets);
  if (workbook.SheetNames.length > limits.maxSheets) {
    throw new SpreadsheetImportError(`File Excel có quá nhiều sheet. Tối đa ${limits.maxSheets} sheet được xử lý.`);
  }

  let totalCells = 0;
  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const { rows, cells } = countRangeCells(worksheet?.['!ref']);
    if (rows > limits.maxRowsPerSheet) {
      throw new SpreadsheetImportError(`Sheet "${sheetName}" có quá nhiều dòng. Tối đa ${limits.maxRowsPerSheet.toLocaleString('vi-VN')} dòng/sheet.`);
    }
    totalCells += cells;
    if (totalCells > limits.maxCells) {
      throw new SpreadsheetImportError(`File Excel có quá nhiều ô dữ liệu. Tối đa ${limits.maxCells.toLocaleString('vi-VN')} ô.`);
    }
  }

  return sheetNames;
}

export function readWorkbookWithGuard(fileBuffer: Buffer, limits: SpreadsheetImportLimits = DEFAULT_SPREADSHEET_IMPORT_LIMITS): GuardedWorkbook {
  if (!Buffer.isBuffer(fileBuffer)) {
    throw new SpreadsheetImportError('Dữ liệu Excel không hợp lệ.');
  }

  if (fileBuffer.length <= 0) {
    throw new SpreadsheetImportError('File Excel rỗng.');
  }

  if (fileBuffer.length > limits.maxFileBytes) {
    throw new SpreadsheetImportError(`File Excel quá lớn. Tối đa ${Math.floor(limits.maxFileBytes / 1024 / 1024)} MB.`);
  }

  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false, bookVBA: false });
  const sheetNames = assertWorkbookWithinLimits(workbook, limits);

  return { workbook, sheetNames };
}

export function worksheetToRowsWithGuard(worksheet: XLSX.WorkSheet, limits: Pick<SpreadsheetImportLimits, 'maxRowsPerSheet'>): unknown[][] {
  const { rows } = countRangeCells(worksheet['!ref']);
  if (rows > limits.maxRowsPerSheet) {
    throw new SpreadsheetImportError(`Sheet có quá nhiều dòng. Tối đa ${limits.maxRowsPerSheet.toLocaleString('vi-VN')} dòng/sheet.`);
  }

  return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true }) as unknown[][];
}
