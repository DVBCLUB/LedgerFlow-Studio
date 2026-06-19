/**
 * assistant-daemon.types.ts
 * Shared types between assistant-daemon.ts and telegramBot.ts
 */

export interface PendingSuggestion {
  filePath: string;
  originalContent: string;
  suggestedContent: string;
  explanation: string;
  modelUsed?: string;
  createdAt: string;
}
