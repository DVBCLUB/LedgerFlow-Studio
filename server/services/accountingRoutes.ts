import type { Express } from "express";
import { z } from "zod";
import { callAI } from "./aiClient";
import { aiClassifyUnknown, reconcileStatement } from "./vietqrReconciler";

const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1),
  description: z.string().default(""),
  amount: z.number(),
  balance: z.number().default(0),
  bank: z.string().optional(),
  accountNo: z.string().optional(),
});

const reconcileSchema = z.object({
  transactions: z.array(transactionSchema).min(1, "transactions array required"),
  useAI: z.boolean().optional().default(true),
});

export function registerAccountingRoutes(app: Express) {
  app.post("/api/accounting/reconcile", async (req, res) => {
    try {
      const parsed = reconcileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues.map((issue) => issue.message).join(", ") });
      }

      const transactions = parsed.data.transactions.map((txn, index) => ({
        ...txn,
        id: txn.id || `txn-${Date.now()}-${index}`,
      }));

      const result = reconcileStatement(transactions);

      if (parsed.data.useAI && result.stats.needsReview > 0) {
        const aiEntries = await aiClassifyUnknown(transactions, async (prompt) => {
          const output = await callAI([
            { role: "system", content: "Bạn là kế toán viên Việt Nam chuyên VAS/Thông tư 200. Luôn trả JSON hợp lệ khi được yêu cầu." },
            { role: "user", content: prompt },
          ], { model: "ai-assistant" });
          return output.content || output.text || "[]";
        }).catch(() => []);

        for (const aiEntry of aiEntries) {
          const index = result.entries.findIndex((entry) => entry.transactionId === aiEntry.transactionId);
          if (index >= 0) result.entries[index] = aiEntry;
        }

        result.stats.autoClassified = result.entries.filter((entry) => !entry.needsReview).length;
        result.stats.needsReview = result.entries.filter((entry) => entry.needsReview).length;
      }

      res.json({ success: true, result, entries: result.entries, stats: result.stats });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to reconcile bank statement." });
    }
  });
}
