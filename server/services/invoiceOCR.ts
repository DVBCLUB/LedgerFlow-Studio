import { GoogleGenAI } from "@google/genai";

export interface InvoiceData {
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  invoiceSeries?: string | null;
  sellerName?: string | null;
  sellerTaxCode?: string | null;
  sellerAddress?: string | null;
  buyerName?: string | null;
  buyerTaxCode?: string | null;
  buyerAddress?: string | null;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: "VND" | "USD" | string;
  suggestedEntries: Array<{
    debitAccount: string;
    creditAccount: string;
    amount: number;
    description: string;
  }>;
  confidence: number;
  rawText?: string;
}

export type InvoiceMimeType = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

const INVOICE_OCR_PROMPT = `Bạn là kế toán viên Việt Nam. Đọc hóa đơn này và trả về JSON hợp lệ.

Yêu cầu JSON format, không thêm markdown, không thêm giải thích:
{
  "invoiceNumber": "string hoặc null",
  "invoiceDate": "YYYY-MM-DD hoặc null",
  "invoiceSeries": "string hoặc null",
  "sellerName": "string hoặc null",
  "sellerTaxCode": "string hoặc null",
  "sellerAddress": "string hoặc null",
  "buyerName": "string hoặc null",
  "buyerTaxCode": "string hoặc null",
  "buyerAddress": "string hoặc null",
  "subtotal": number,
  "vatRate": 0 | 0.05 | 0.1,
  "vatAmount": number,
  "total": number,
  "currency": "VND",
  "suggestedEntries": [
    {
      "debitAccount": "TK Nợ, ví dụ 156, 152, 211, 642, 154, 1331",
      "creditAccount": "TK Có, ví dụ 331, 112, 111",
      "amount": number,
      "description": "Mô tả ngắn"
    }
  ],
  "confidence": number từ 0.0 đến 1.0
}

Quy tắc gợi ý định khoản theo VAS/Thông tư 200:
- Hàng hóa mua về: Nợ 156, Nợ 1331 / Có 331.
- Nguyên vật liệu/vật tư công trình: Nợ 152 hoặc 154, Nợ 1331 / Có 331.
- Dịch vụ mua ngoài/văn phòng/hành chính: Nợ 642, Nợ 1331 / Có 331.
- Tài sản cố định: Nợ 211, Nợ 1332 / Có 331.
- Nếu chưa rõ bản chất hàng hóa dịch vụ: dùng Nợ 642, Nợ 1331 / Có 331 và giảm confidence.
- Số tiền entry không bao gồm VAT nếu dùng thêm dòng 1331/1332; tổng các dòng Nợ phải bằng tổng Có.`;

function cleanGeminiJson(rawText: string): string {
  return rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }
  return 0;
}

function normalizeInvoiceData(data: any, rawText: string): InvoiceData {
  const subtotal = toNumber(data?.subtotal);
  const vatAmount = toNumber(data?.vatAmount);
  const total = toNumber(data?.total) || subtotal + vatAmount;
  const vatRate = typeof data?.vatRate === "number" ? data.vatRate : (vatAmount > 0 && subtotal > 0 ? Number((vatAmount / subtotal).toFixed(2)) : 0);
  const confidence = Math.max(0, Math.min(1, Number(data?.confidence ?? 0.5)));

  const suggestedEntries = Array.isArray(data?.suggestedEntries)
    ? data.suggestedEntries.map((entry: any) => ({
        debitAccount: String(entry?.debitAccount || "642"),
        creditAccount: String(entry?.creditAccount || "331"),
        amount: toNumber(entry?.amount),
        description: String(entry?.description || "Hạch toán hóa đơn OCR"),
      })).filter((entry: { amount: number }) => entry.amount > 0)
    : [];

  return {
    invoiceNumber: data?.invoiceNumber ?? null,
    invoiceDate: data?.invoiceDate ?? null,
    invoiceSeries: data?.invoiceSeries ?? null,
    sellerName: data?.sellerName ?? null,
    sellerTaxCode: data?.sellerTaxCode ?? null,
    sellerAddress: data?.sellerAddress ?? null,
    buyerName: data?.buyerName ?? null,
    buyerTaxCode: data?.buyerTaxCode ?? null,
    buyerAddress: data?.buyerAddress ?? null,
    subtotal,
    vatRate,
    vatAmount,
    total,
    currency: data?.currency || "VND",
    suggestedEntries,
    confidence,
    rawText,
  };
}

export async function extractInvoiceFromImage(imageBase64: string, mimeType: InvoiceMimeType): Promise<InvoiceData> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error("GEMINI_API_KEY chưa cấu hình cho Invoice OCR.");

  const cleanedBase64 = imageBase64.includes(",") ? imageBase64.split(",").pop() || "" : imageBase64;
  if (!cleanedBase64) throw new Error("imageBase64 rỗng hoặc không hợp lệ.");

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const response: any = await ai.models.generateContent({
    model: process.env.GEMINI_VISION_MODEL || "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: cleanedBase64, mimeType } },
          { text: INVOICE_OCR_PROMPT },
        ],
      },
    ],
  });

  const rawText = response?.text || response?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || "").join("\n") || "";

  try {
    const parsed = JSON.parse(cleanGeminiJson(rawText));
    return normalizeInvoiceData(parsed, rawText);
  } catch {
    return {
      subtotal: 0,
      vatRate: 0.1,
      vatAmount: 0,
      total: 0,
      currency: "VND",
      suggestedEntries: [],
      confidence: 0.1,
      rawText,
    };
  }
}
