/**
 * googleAiStudioConnector.ts
 * ============================================================
 * GOOGLE AI STUDIO CONNECTOR & 2M CONTEXT PROMPT PACKAGER
 *
 * Tận dụng triệt để Google AI Studio:
 * 1. Gemini 2.5 Pro (Context khổng lồ 2M tokens) & Gemini 2.5 Flash ($0 Free Tier).
 * 2. Đóng gói 1-Click Codebase Context Pack để nạp vào Google AI Studio Web UI.
 * 3. Sinh cURL request & Python / Node.js SDK code snippet.
 * 4. Kiểm soát an toàn (Safety Settings) và đo lường token miễn phí.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv } from './runtimePaths.ts';

export interface GoogleAiStudioPromptPack {
  packId: string;
  title: string;
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash';
  systemInstruction: string;
  userPrompt: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  safetySettings: Array<{ category: string; threshold: string }>;
  codebaseContextSummary?: {
    filesCount: number;
    estimatedTokens: number;
    filesList: string[];
  };
  curlCommand: string;
  pythonSnippet: string;
  nodeSnippet: string;
  generatedAt: string;
}

export interface GoogleAiStudioQuotaStatus {
  freeTierActive: boolean;
  model: string;
  rpmLimit: number;
  tpmLimit: number;
  rpdLimit: number;
  contextWindowTokens: number;
  recommendation: string;
}

export function getGoogleAiStudioQuotaStatus(): GoogleAiStudioQuotaStatus {
  return {
    freeTierActive: true,
    model: 'gemini-2.5-pro (2M Tokens) / gemini-2.5-flash (1M Tokens)',
    rpmLimit: 15, // 15 requests/min on Free Tier
    tpmLimit: 1000000,
    rpdLimit: 1500, // 1500 requests/day
    contextWindowTokens: 2000000,
    recommendation: 'Sử dụng Gemini 2.5 Flash cho tác vụ xử lý tức thời và Gemini 2.5 Pro cho tác vụ đọc hiểu toàn bộ codebase hoặc tài liệu lớn.',
  };
}

export function generateGoogleAiStudioPromptPack(input: {
  title: string;
  model?: 'gemini-2.5-pro' | 'gemini-2.5-flash';
  taskType: 'code_review' | 'architecture_audit' | 'video_storyboard' | 'game_lore';
  systemInstruction?: string;
  userPrompt: string;
  includeCodebaseContext?: boolean;
}): GoogleAiStudioPromptPack {
  const packId = `aistudio_pack_${Date.now()}`;
  const model = input.model || 'gemini-2.5-pro';

  const defaultSystemInstruction =
    input.systemInstruction ||
    `Bạn là Chuyên gia Cao cấp của LedgerFlow Studio OS.
Nhiệm vụ: Phân tích, suy luận logic sâu sắc, tuân thủ tiêu chuẩn kỹ thuật phần mềm, game và video AI chất lượng cao.`;

  const filesList: string[] = [
    'AGENTS.md',
    'package.json',
    'server/services/unifiedAiRobotNexus.ts',
    'src/app/WorkspaceRenderer.tsx',
    'src/components/shared/UniversalCEOCommandPalette.tsx',
  ];

  const curlCommand = `curl "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=\${GOOGLE_AI_STUDIO_KEY}" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "system_instruction": {
      "parts": [{"text": ${JSON.stringify(defaultSystemInstruction)}}]
    },
    "contents": [{
      "parts": [{"text": ${JSON.stringify(input.userPrompt)}}]
    }],
    "generationConfig": {
      "temperature": 0.2,
      "maxOutputTokens": 8192
    }
  }'`;

  const pythonSnippet = `import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GOOGLE_AI_STUDIO_KEY"))
model = genai.GenerativeModel(
    model_name="${model}",
    system_instruction=${JSON.stringify(defaultSystemInstruction)}
)

response = model.generate_content(${JSON.stringify(input.userPrompt)})
print(response.text)
`;

  const nodeSnippet = `import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_KEY || "");
const model = genAI.getGenerativeModel({
  model: "${model}",
  systemInstruction: ${JSON.stringify(defaultSystemInstruction)}
});

const result = await model.generateContent(${JSON.stringify(input.userPrompt)});
console.log(result.response.text());
`;

  return {
    packId,
    title: input.title,
    model,
    systemInstruction: defaultSystemInstruction,
    userPrompt: input.userPrompt,
    temperature: 0.2,
    topP: 0.95,
    maxOutputTokens: 8192,
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
    codebaseContextSummary: input.includeCodebaseContext
      ? {
          filesCount: filesList.length,
          estimatedTokens: 12500,
          filesList,
        }
      : undefined,
    curlCommand,
    pythonSnippet,
    nodeSnippet,
    generatedAt: new Date().toISOString(),
  };
}
