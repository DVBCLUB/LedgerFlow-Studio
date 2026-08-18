/**
 * Standard Excel Paper-Grade Formatting Helpers for Vietnamese Accounting & Business Financials
 * 
 * Rules:
 * - Thousands separator (Hàng nghìn): Dot '.' (e.g., 1.030.000.000 đ)
 * - Decimal separator (Thập phân): Comma ',' (e.g., 6,4 tháng, 1,5x)
 * - Font style: Always pair with `font-mono` for clean paper-grade column alignment.
 */

export function formatMoneyVN(amount: number, suffix = 'đ'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `0 ${suffix}`.trim();
  const formatted = new Intl.NumberFormat('vi-VN').format(Math.round(amount));
  return suffix ? `${formatted} ${suffix}` : formatted;
}

export function formatNumberVN(val: number, decimals = 1): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: Number.isInteger(val) ? 0 : decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatPercentVN(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0%';
  return `${formatNumberVN(val, 1)}%`;
}

/**
 * Parse a Vietnamese formatted number string (e.g., "1.030.000,5") back to raw number
 */
export function parseMoneyVN(inputStr: string): number {
  if (!inputStr) return 0;
  // Replace dots (thousands) with empty string and comma (decimal) with dot
  const cleanStr = String(inputStr)
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Live format user typing input according to Vietnamese Excel standards (dots for thousands, comma for decimals)
 */
export function formatLiveInputVN(inputStr: string): string {
  if (!inputStr) return '';
  // Split integer part and fractional part by comma or dot if user pasted
  const normalized = String(inputStr).replace(/\./g, '');
  const parts = normalized.split(',');
  const integerPart = parts[0].replace(/\D/g, '');
  if (!integerPart && parts.length === 1) return '';

  const formattedInteger = integerPart ? new Intl.NumberFormat('vi-VN').format(parseInt(integerPart, 10)) : '0';
  if (parts.length > 1) {
    const decimalPart = parts[1].replace(/\D/g, '');
    return `${formattedInteger},${decimalPart}`;
  }
  return formattedInteger;
}
