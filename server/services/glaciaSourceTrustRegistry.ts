/**
 * server/services/glaciaSourceTrustRegistry.ts
 * Bảng xếp hạng và quản lý Nguồn Tin Cậy theo Domain Kỹ Thuật cho Glacia.
 * Định hướng AI ưu tiên tìm kiếm giải pháp và tài liệu từ các nguồn chính thống và uy tín nhất.
 */

import fs from 'fs';
import path from 'path';
import { resolveRuntimeDirPath } from './runtimePaths.ts';

export type KnowledgeDomain =
  | 'fullstack_code'
  | 'blender_3d'
  | 'game_engine'
  | 'video_ffmpeg'
  | 'accounting_vas'
  | 'ai_ml_devops'
  | 'general';

export interface TrustedSourceEntry {
  id: string;
  domain: string;
  name: string;
  domainCategory: KnowledgeDomain;
  trustScore: number; // 0 - 100
  preferredUrlPatterns: string[];
  docHubUrl?: string;
  isOfficial: boolean;
  notes?: string;
}

const REGISTRY_FILE = path.join(resolveRuntimeDirPath('glacia'), 'source_trust_registry.json');

const DEFAULT_SOURCES: TrustedSourceEntry[] = [
  {
    id: 'blender_official',
    domain: 'docs.blender.org',
    name: 'Blender Official Documentation & Python API',
    domainCategory: 'blender_3d',
    trustScore: 99,
    preferredUrlPatterns: ['https://docs.blender.org/api/current/', 'https://docs.blender.org/manual/'],
    docHubUrl: 'https://docs.blender.org/manual/en/latest/',
    isOfficial: true,
    notes: 'Nguồn chuẩn xác nhất cho bpy Python scripting và EEVEE/Cycles shaders.',
  },
  {
    id: 'ffmpeg_official',
    domain: 'ffmpeg.org',
    name: 'FFmpeg Official Documentation',
    domainCategory: 'video_ffmpeg',
    trustScore: 99,
    preferredUrlPatterns: ['https://ffmpeg.org/ffmpeg-filters.html', 'https://ffmpeg.org/documentation.html'],
    docHubUrl: 'https://ffmpeg.org/documentation.html',
    isOfficial: true,
    notes: 'Bộ lọc drawtext, filter_complex, encoding codecs chuẩn.',
  },
  {
    id: 'github_issues_prs',
    domain: 'github.com',
    name: 'GitHub Issues, PRs & Release Notes',
    domainCategory: 'fullstack_code',
    trustScore: 95,
    preferredUrlPatterns: ['https://github.com/*/issues/', 'https://github.com/*/pull/', 'https://github.com/*/releases'],
    isOfficial: false,
    notes: 'Nơi cập nhật cách xử lý breaking changes và bug mới nhất.',
  },
  {
    id: 'godot_docs',
    domain: 'docs.godotengine.org',
    name: 'Godot Engine Official Docs',
    domainCategory: 'game_engine',
    trustScore: 98,
    preferredUrlPatterns: ['https://docs.godotengine.org/en/stable/'],
    docHubUrl: 'https://docs.godotengine.org/en/stable/',
    isOfficial: true,
  },
  {
    id: 'unity_docs',
    domain: 'docs.unity3d.com',
    name: 'Unity Scripting Reference & Manual',
    domainCategory: 'game_engine',
    trustScore: 97,
    preferredUrlPatterns: ['https://docs.unity3d.com/ScriptReference/', 'https://docs.unity3d.com/Manual/'],
    docHubUrl: 'https://docs.unity3d.com/Manual/index.html',
    isOfficial: true,
  },
  {
    id: 'mdn_web_docs',
    domain: 'developer.mozilla.org',
    name: 'MDN Web Docs',
    domainCategory: 'fullstack_code',
    trustScore: 98,
    preferredUrlPatterns: ['https://developer.mozilla.org/en-US/docs/'],
    docHubUrl: 'https://developer.mozilla.org',
    isOfficial: true,
  },
  {
    id: 'thuvienphapluat_vas',
    domain: 'thuvienphapluat.vn',
    name: 'Thư Viện Pháp Luật & Bộ Tài Chính VAS/VFRS',
    domainCategory: 'accounting_vas',
    trustScore: 96,
    preferredUrlPatterns: ['https://thuvienphapluat.vn/van-ban/Tai-chinh-nha-nuoc/'],
    isOfficial: true,
    notes: 'Chuẩn mực kế toán Việt Nam TT200, TT133, Nghị định 123 hóa đơn điện tử.',
  },
  // ── COMMUNITY FORUMS & DEVELOPER HUBS ──
  {
    id: 'reddit_communities',
    domain: 'reddit.com',
    name: 'Reddit Dev, Game & Video Communities (r/webdev, r/gamedev, r/blender, r/filmmaking)',
    domainCategory: 'general',
    trustScore: 90,
    preferredUrlPatterns: ['https://www.reddit.com/r/'],
    isOfficial: false,
    notes: 'Cộng đồng thảo luận thực chiến, feedback người dùng và case study thực tế.',
  },
  {
    id: 'hackernews_ycombinator',
    domain: 'news.ycombinator.com',
    name: 'Hacker News (Y Combinator Tech & Startup Discussions)',
    domainCategory: 'fullstack_code',
    trustScore: 94,
    preferredUrlPatterns: ['https://news.ycombinator.com/item?id='],
    isOfficial: false,
    notes: 'Kiến trúc phần mềm quy mô lớn, insight từ các Founder và Senior Engineers toàn cầu.',
  },
  {
    id: 'stackoverflow_hub',
    domain: 'stackoverflow.com',
    name: 'Stack Overflow Verified Solutions & Discussions',
    domainCategory: 'fullstack_code',
    trustScore: 93,
    preferredUrlPatterns: ['https://stackoverflow.com/questions/'],
    isOfficial: false,
    notes: 'Giải pháp sửa lỗi, tối ưu thuật toán và giải thích cơ chế sâu.',
  },
  {
    id: 'threejs_official',
    domain: 'threejs.org',
    name: 'Three.js 3D WebGL Library Docs & Examples',
    domainCategory: 'game_engine',
    trustScore: 98,
    preferredUrlPatterns: ['https://threejs.org/docs/', 'https://threejs.org/examples/'],
    docHubUrl: 'https://threejs.org/docs/',
    isOfficial: true,
    notes: 'Chuẩn đồ họa 3D WebGL tương tác, GLTF loading, PBR shaders và Matrix transforms.',
  },
  {
    id: 'blender_artists_forum',
    domain: 'blenderartists.org',
    name: 'Blender Artists Community Forum',
    domainCategory: 'blender_3d',
    trustScore: 91,
    preferredUrlPatterns: ['https://blenderartists.org/t/'],
    isOfficial: false,
    notes: 'Kỹ thuật dựng hình 3D, nodes procedural, rigging và geometry nodes từ chuyên gia.',
  },
  {
    id: 'devto_community',
    domain: 'dev.to',
    name: 'Dev.to Technical Blog & Community Guides',
    domainCategory: 'fullstack_code',
    trustScore: 89,
    preferredUrlPatterns: ['https://dev.to/'],
    isOfficial: false,
    notes: 'Hướng dẫn thực hành kiến trúc hiện đại, Fullstack TypeScript, Electron và AI agents.',
  },
];

function loadRegistry(): TrustedSourceEntry[] {
  try {
    if (!fs.existsSync(REGISTRY_FILE)) {
      const dir = path.dirname(REGISTRY_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(DEFAULT_SOURCES, null, 2), 'utf8');
      return DEFAULT_SOURCES;
    }
    const raw = fs.readFileSync(REGISTRY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SOURCES;
  }
}

function saveRegistry(sources: TrustedSourceEntry[]): void {
  try {
    const dir = path.dirname(REGISTRY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(sources, null, 2), 'utf8');
  } catch {}
}

export function listTrustedSources(category?: KnowledgeDomain): TrustedSourceEntry[] {
  const sources = loadRegistry();
  if (!category || category === 'general') return sources;
  return sources.filter((s) => s.domainCategory === category);
}

export function getSourceTrustScore(urlOrDomain: string): number {
  const sources = loadRegistry();
  const lower = urlOrDomain.toLowerCase();
  for (const s of sources) {
    if (lower.includes(s.domain.toLowerCase())) {
      return s.trustScore;
    }
  }
  // Default base trust for unknown domains
  return 50;
}

export function addTrustedSource(entry: Omit<TrustedSourceEntry, 'id'>): TrustedSourceEntry {
  const sources = loadRegistry();
  const id = `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const full: TrustedSourceEntry = { id, ...entry };
  sources.push(full);
  saveRegistry(sources);
  return full;
}

export function removeTrustedSource(id: string): boolean {
  const sources = loadRegistry();
  const idx = sources.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  sources.splice(idx, 1);
  saveRegistry(sources);
  return true;
}
