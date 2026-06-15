import { z } from "zod";

export const uuidSchema = z.string().uuid("ID không hợp lệ");
export const optionalUuid = z.string().uuid().optional();
export const shortText = z.string().min(1).max(200).trim();
export const longText = z.string().min(1).max(10000).trim();
export const emailSchema = z.string().email("Email không hợp lệ").toLowerCase();
export const urlSchema = z.string().url("URL không hợp lệ");
export const vndAmount = z.number().int().min(0).max(999_999_999_999);
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không đúng định dạng YYYY-MM-DD");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}
