import fs from "fs";
import path from "path";
import { AGENT_SYSTEM_PROMPTS, AgentRoleId } from "./agentRoles";

export const AI_PROMPT_TASKS = [
  "general",
  "accounting",
  "analytics",
  "marketing",
  "sales",
  "coding",
  "Chief of Staff",
  "AI CFO",
  "AI Dev",
  "AI DevOps",
  "AI PM",
  "AI Designer",
  "AI Game Dev",
  "AI QA",
  "AI Marketer",
  "AI Research",
  "AI Sales",
  "AI Accountant",
  "AI Auditor",
  "AI Legal",
  "AI Onboarding",
  "AI Support",
  "AI Analyst"
] as const;
export type AIPromptTask = (typeof AI_PROMPT_TASKS)[number];

export interface AIPromptVersion {
  version: number;
  content: string;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface AIPromptTemplate {
  task: AIPromptTask;
  label: string;
  description: string;
  activeVersion: number;
  versions: AIPromptVersion[];
}

interface PromptRegistryFile {
  version: 1;
  templates: AIPromptTemplate[];
}

const REGISTRY_FILE = path.join(process.cwd(), "ai_prompt_registry.json");

const DEFAULT_TEMPLATES: AIPromptTemplate[] = [
  {
    task: "general",
    label: "General Assistant",
    description: "Tro ly tong quat cho tac vu van phong va dieu hanh.",
    activeVersion: 1,
    versions: [
      {
        version: 1,
        createdAt: new Date().toISOString(),
        createdBy: "system",
        content: "Ban la tro ly AI cua LedgerFlow Studio. Tra loi ngan gon, de hieu, uu tien tieng Viet va de xuat buoc hanh dong ro rang.",
        note: "Baseline",
      },
    ],
  },
  {
    task: "accounting",
    label: "Accounting Analyst",
    description: "Phan tich but toan, dong tien, va bao cao ke toan.",
    activeVersion: 1,
    versions: [
      {
        version: 1,
        createdAt: new Date().toISOString(),
        createdBy: "system",
        content: "Ban la chuyen gia ke toan doanh nghiep VN. Neu thieu du lieu, neu ro gia dinh va canh bao rui ro. Trinh bay theo bullet ngan gon.",
        note: "Baseline",
      },
    ],
  },
  {
    task: "analytics",
    label: "Data Analytics",
    description: "Tong hop KPI, trend, du bao va kien nghi dieu hanh.",
    activeVersion: 1,
    versions: [
      {
        version: 1,
        createdAt: new Date().toISOString(),
        createdBy: "system",
        content: "Ban la nha phan tich du lieu. Nhan manh chi so quan trong, phat hien bat thuong, va de xuat 3 hanh dong uu tien.",
        note: "Baseline",
      },
    ],
  },
  {
    task: "marketing",
    label: "Marketing Strategist",
    description: "Xay chien luoc growth, content, funnel va CRO.",
    activeVersion: 1,
    versions: [
      {
        version: 1,
        createdAt: new Date().toISOString(),
        createdBy: "system",
        content: "Ban la chuyen gia marketing growth. Tap trung vao ICP, thong diep, kenh uu tien, va KPI do luong theo tuan.",
        note: "Baseline",
      },
    ],
  },
  {
    task: "sales",
    label: "Sales Copilot",
    description: "Ho tro lead qualification, follow-up va de xuat demo.",
    activeVersion: 1,
    versions: [
      {
        version: 1,
        createdAt: new Date().toISOString(),
        createdBy: "system",
        content: "Ban la tro ly sales B2B. Uu tien phan loai lead, next step cu the, va mau tin nhan ngan gon de chot lich demo.",
        note: "Baseline",
      },
    ],
  },
  {
    task: "coding",
    label: "Engineering Copilot",
    description: "Ho tro code review, debug, va de xuat patch an toan.",
    activeVersion: 1,
    versions: [
      {
        version: 1,
        createdAt: new Date().toISOString(),
        createdBy: "system",
        content: "Ban la tro ly ky thuat cho LedgerFlow Studio. Uu tien thay doi nho, an toan, giai thich ro rui ro va cach verify.",
        note: "Baseline",
      },
    ],
  },
];

async function readRegistry(): Promise<PromptRegistryFile> {
  try {
    if (!fs.existsSync(REGISTRY_FILE)) {
      const initial: PromptRegistryFile = { version: 1, templates: DEFAULT_TEMPLATES };
      await fs.promises.writeFile(REGISTRY_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = await fs.promises.readFile(REGISTRY_FILE, "utf-8");
    const parsed = JSON.parse(raw) as PromptRegistryFile;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.templates)) {
      throw new Error("Invalid prompt registry format.");
    }
    return parsed;
  } catch {
    return { version: 1, templates: DEFAULT_TEMPLATES };
  }
}

async function writeRegistry(registry: PromptRegistryFile): Promise<void> {
  await fs.promises.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2), "utf-8");
}

function ensureTemplate(registry: PromptRegistryFile, task: AIPromptTask): AIPromptTemplate {
  let template = registry.templates.find((item) => item.task === task);
  if (!template) {
    const defaultContent = AGENT_SYSTEM_PROMPTS[task as AgentRoleId] || "";
    template = {
      task,
      label: task,
      description: defaultContent ? `System prompt cho vai trò ${task}` : `Custom prompt template cho ${task}`,
      activeVersion: 1,
      versions: [
        {
          version: 1,
          content: defaultContent,
          createdAt: new Date().toISOString(),
          createdBy: "system",
          note: "Baseline",
        },
      ],
    };
    registry.templates.push(template);
  }
  return template;
}

export async function listPromptTemplates(): Promise<AIPromptTemplate[]> {
  const registry = await readRegistry();
  let modified = false;
  for (const task of AI_PROMPT_TASKS) {
    const existing = registry.templates.find((item) => item.task === task);
    if (!existing) {
      ensureTemplate(registry, task);
      modified = true;
    }
  }
  if (modified) {
    await writeRegistry(registry);
  }
  return registry.templates.slice().sort((a, b) => a.task.localeCompare(b.task));
}

export async function getActivePrompt(task: AIPromptTask): Promise<{ task: AIPromptTask; activeVersion: number; content: string } | null> {
  const registry = await readRegistry();
  const template = registry.templates.find((item) => item.task === task);
  if (!template) return null;
  const active = template.versions.find((v) => v.version === template.activeVersion);
  if (!active) return null;
  return { task, activeVersion: active.version, content: active.content };
}

export async function createPromptVersion(input: {
  task: AIPromptTask;
  content: string;
  createdBy?: string;
  note?: string;
  activate?: boolean;
  label?: string;
  description?: string;
}): Promise<AIPromptTemplate> {
  const content = input.content.trim();
  if (!content) {
    throw new Error("Prompt content is required.");
  }

  const registry = await readRegistry();
  const template = ensureTemplate(registry, input.task);
  if (input.label) template.label = input.label.trim().slice(0, 80) || template.label;
  if (input.description) template.description = input.description.trim().slice(0, 200) || template.description;

  const nextVersion = (template.versions.at(-1)?.version ?? 0) + 1;
  template.versions.push({
    version: nextVersion,
    content,
    createdAt: new Date().toISOString(),
    createdBy: (input.createdBy || "local-admin").trim().slice(0, 80),
    note: input.note?.trim().slice(0, 200) || undefined,
  });
  if (input.activate !== false) {
    template.activeVersion = nextVersion;
  }

  await writeRegistry(registry);
  return template;
}

export async function activatePromptVersion(task: AIPromptTask, version: number): Promise<AIPromptTemplate> {
  if (!Number.isFinite(version)) {
    throw new Error("Version is invalid.");
  }
  const registry = await readRegistry();
  const template = ensureTemplate(registry, task);
  const exists = template.versions.some((item) => item.version === version);
  if (!exists) {
    throw new Error(`Version ${version} does not exist for task ${task}.`);
  }
  template.activeVersion = version;
  await writeRegistry(registry);
  return template;
}
