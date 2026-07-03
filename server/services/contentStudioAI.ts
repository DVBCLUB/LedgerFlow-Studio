/**
 * contentStudioAI.ts
 * ============================================================
 * Content Studio AI — sinh nội dung chuyên nghiệp:
 * blog posts, emails, social posts, đa ngôn ngữ.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type ContentType = 'blog_post' | 'email' | 'social_post' | 'tech_doc' | 'tutorial' | 'linkedin_post' | 'video_script' | 'comic_storyboard' | 'image_prompt_set' | '3d_concept';

export type ContentTone = 'professional' | 'casual' | 'technical' | 'enthusiastic' | 'formal';

export interface ContentAsset {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  tone: ContentTone;
  language: string;
  tags: string[];
  wordCount: number;
  readingTime: number;
  seoScore: number;
  hasCallToAction: boolean;
  filePath: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRequest {
  type: ContentType;
  topic: string;
  tone?: ContentTone;
  language?: string;
  targetAudience?: string;
  keyPoints?: string[];
  callToAction?: string;
  maxWords?: number;
  saveToFile?: boolean;
}

// ─── Storage ────────────────────────────────────────────────────────
const CONTENT_DIR = path.join(process.cwd(), 'content_studio');
let assets: ContentAsset[] = [];

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(CONTENT_DIR)) await fs.promises.mkdir(CONTENT_DIR, { recursive: true });
  } catch { }
}
init().catch(() => undefined);

// ─── Core API ───────────────────────────────────────────────────────

export async function generateContent(request: ContentRequest): Promise<ContentAsset> {
  const assetId = `ct_${Date.now()}`;
  const started = Date.now();

  const tone = request.tone || 'professional';
  const lang = request.language || 'en';
  const audience = request.targetAudience || 'developers';

  // Build content-specific prompt
  let prompt = '';
  let format = '';

  switch (request.type) {
    case 'video_script':
      format = `**Title**: [Video Title]
**Target Duration**: [e.g., 60 seconds]
**Visual Style**: [e.g., Cinematic, 3D Render, Anime]

## Scene 1
**Visuals/Camera**: [Detailed prompt for Runway/Luma API: subject, camera movement, lighting]
**Voice-over**: [Text for ElevenLabs API]
**Duration**: [e.g., 5s]

## Scene 2
[continue...]`;
      prompt = `Write a ${tone} video script and prompt structure about: ${request.topic}
Target audience: ${audience}
Language: ${lang}
This script is designed to be fed directly into Multi-modal AI (Runway/Luma for video, ElevenLabs for voice).
Ensure the 'Visuals/Camera' prompt is highly descriptive.
Follow this format:
${format}`;
      break;

    case 'comic_storyboard':
      format = `**Comic Title**: [Title]
**Art Style**: [e.g., Cyberpunk, Studio Ghibli, Marvel Comic]

## Panel 1
**Image Prompt**: [Detailed prompt for Leonardo.Ai: character description, background, framing, lighting]
**Caption**: [Narration text]
**Dialogue**: [Character speech]

## Panel 2
[continue...]`;
      prompt = `Write a comic storyboard about: ${request.topic}
Tone: ${tone}
Language: ${lang}
This storyboard is designed to generate images via Leonardo.Ai or Replicate.
Ensure the 'Image Prompt' is highly descriptive for image generation models.
Follow this format:
${format}`;
      break;

    case '3d_concept':
      format = `**Asset Name**: [Name of 3D asset]
**Style**: [e.g., Low-poly, Photorealistic, Stylized]

**Luma Dream Machine Prompt**: [Detailed prompt describing the object from all angles, materials, lighting]
**Use Case**: [How this 3D model will be used in the software/game]`;
      prompt = `Write a 3D model concept and AI generation prompt about: ${request.topic}
Tone: ${tone}
Language: ${lang}
This is designed to be fed into Luma AI's 3D generation API.
Follow this format:
${format}`;
      break;

    case 'blog_post':
      format = `**Title**: [catchy title]
**Subtitle**: [engaging subtitle]
**Main Content**:
## Introduction
[hook the reader]

## [Section 1 Header]
[content]

## [Section 2 Header] 
[content]

## [Section 3 Header]
[content]

## Conclusion
[summary + call to action]`;
      prompt = `Write a ${tone} blog post about: ${request.topic}
Target audience: ${audience}
Language: ${lang}
Key points to cover: ${request.keyPoints?.join(', ') || 'explain the topic clearly'}
${request.callToAction ? `Call to action: ${request.callToAction}` : ''}
Max words: ${request.maxWords || 800}

Follow this format:
${format}`;
      break;

    case 'email':
      prompt = `Write a ${tone} email about: ${request.topic}
Target audience: ${audience}
Language: ${lang}
${request.callToAction ? `Call to action: ${request.callToAction}` : ''}
Max words: ${request.maxWords || 300}

Format:
**Subject**: [compelling subject line]
**Body**:
[greeting]
[main message, 2-3 paragraphs]
[call to action]
[signature]`;
      break;

    case 'social_post':
      prompt = `Write a ${tone} social media post about: ${request.topic}
Platform context: appropriate for Twitter/LinkedIn
Language: ${lang}
${request.keyPoints?.length ? `Include these points: ${request.keyPoints.join(', ')}` : ''}
Max words: ${request.maxWords || 150}

Include relevant hashtags.`;
      break;

    case 'tech_doc':
      prompt = `Write ${tone} technical documentation about: ${request.topic}
Language: ${lang}
${request.keyPoints?.length ? `Cover: ${request.keyPoints.join(', ')}` : ''}

Format:
# [Title]
## Overview
[what this is and why it matters]
## Prerequisites
[what you need]
## [Section headers as needed with code examples]
\`\`\`[language]
[code examples]
\`\`\`
## API Reference
[if applicable]
## Troubleshooting
[common issues]`;
      break;

    case 'tutorial':
      prompt = `Write a ${tone} tutorial about: ${request.topic}
Language: ${lang}
Skill level: ${audience}
Max steps: ${request.maxWords ? Math.ceil(request.maxWords / 200) : 6}

Format:
# [Title]
## What You'll Learn
[brief learning objectives]
## Prerequisites
## Step 1: [Title]
[explanation + code]
## Step 2: [Title]
...
## Conclusion
[what you built + next steps]`;
      break;

    case 'linkedin_post':
      prompt = `Write a ${tone} LinkedIn post about: ${request.topic}
Language: ${lang}
${request.keyPoints?.length ? `Key messages: ${request.keyPoints.join(', ')}` : ''}

Make it engaging, start with a hook, end with a question or call to action.
Max: ${request.maxWords || 200} words. Include 3-5 relevant hashtags.`;
      break;
  }

  // Generate content
  let content = '';
  try {
    const result = await dispatchTextThroughFabric(prompt, undefined, { domain: 'general', localFallback: true });
    content = result.winner?.contentPreview || '';
  } catch { }

  if (!content) {
    content = `# ${request.topic}\n\n[Content generation unavailable - please try again later]\n\nKey points: ${(request.keyPoints || []).join(', ')}`;
  }

  // Calculate metrics
  const wordCount = content.split(/\s+/).filter(w => w.length > 1).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const hasCallToAction = !!(request.callToAction || content.toLowerCase().includes('try') || content.toLowerCase().includes('get started') || content.toLowerCase().includes('learn more'));

  // Simple SEO score
  const seoScore = Math.min(100, 30
    + (wordCount > 300 ? 20 : 0)
    + (wordCount > 800 ? 15 : 0)
    + ((content.match(/## /g) || []).length * 5)
    + (hasCallToAction ? 10 : 0)
    + ((content.match(/```/g) || []).length > 0 ? 10 : 0)
  );

  // Extract title
  const titleMatch = content.match(/(?:^#\s+|^\*\*Title\*\*:\s*)(.+?)(?:\n|$)/im);
  const title = titleMatch ? titleMatch[1].trim() : request.topic;

  // Detect tags
  const tags: string[] = [request.type, tone];
  if (content.includes('code') || content.includes('```')) tags.push('technical');
  if (wordCount > 800) tags.push('long-form');
  if (request.type === 'blog_post') tags.push('blog');
  if (request.type === 'social_post' || request.type === 'linkedin_post') tags.push('social');

  // Generate file name and save
  const safeTopic = request.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 40);
  const ext = request.type.includes('doc') || request.type === 'tutorial' ? 'md' : 'txt';
  const fileName = `${request.type}_${safeTopic}_${Date.now()}.${ext}`;
  const filePath = path.join(CONTENT_DIR, fileName);

  await fs.promises.writeFile(filePath, `# ${title}\n\n${content}`, 'utf8');

  const asset: ContentAsset = {
    id: assetId,
    type: request.type,
    title,
    content,
    tone,
    language: lang,
    tags: tags.slice(0, 8),
    wordCount,
    readingTime,
    seoScore,
    hasCallToAction,
    filePath,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assets.push(asset);

  await appendAuditEvent({
    actor: 'system', workspace: 'Content Studio', action: 'content.generate',
    target: title, risk: 'LOW', status: 'executed',
    summary: `Generated ${request.type}: ${title} (${wordCount} words)`,
    connectorId: 'content-studio',
    evidence: { assetId, type: request.type, wordCount },
  }).catch(() => undefined);

  return asset;
}

export function getAsset(id: string): ContentAsset | undefined { return assets.find(a => a.id === id); }
export function listAssets(filter?: { type?: ContentType; limit?: number }): ContentAsset[] {
  let result = [...assets];
  if (filter?.type) result = result.filter(a => a.type === filter.type);
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result.slice(0, filter?.limit || 50);
}

export function getContentTypes(): ContentType[] {
  return ['blog_post', 'email', 'social_post', 'tech_doc', 'tutorial', 'linkedin_post'];
}

export function getContentStats(): {
  total: number; byType: Record<string, number>; totalWords: number;
} {
  const byType: Record<string, number> = {};
  for (const a of assets) byType[a.type] = (byType[a.type] || 0) + 1;
  return {
    total: assets.length,
    byType,
    totalWords: assets.reduce((s, a) => s + a.wordCount, 0),
  };
}
