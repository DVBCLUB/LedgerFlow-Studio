/**
 * projectTimelineAI.ts
 * ============================================================
 * Project Timeline AI — AI tạo project schedule với
 * Gantt chart data, milestone tracking, và auto re-scheduling.
 *
 * Output: structured JSON cho Gantt visualization
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface TimelineTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  progress: number;          // 0-100
  dependencies: string[];
  assignee: string;
  status: 'planned' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  risk: string;
  notes: string;
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  description: string;
  status: 'upcoming' | 'achieved' | 'missed';
}

export interface ProjectTimeline {
  id: string;
  projectName: string;
  description: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  tasks: TimelineTask[];
  milestones: Milestone[];
  criticalPath: string[];        // Task IDs on critical path
  ganttData: {                   // Ready for visualization
    tasks: TimelineTask[];
    milestones: Milestone[];
    timeline: { start: string; end: string; totalDays: number };
  };
  riskSummary: string;
  generatedAt: string;
  complexity: 'simple' | 'medium' | 'complex';
}

// ─── Storage ────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'project_timelines.json');
let timelines: ProjectTimeline[] = [];

async function load(): Promise<void> {
  try { if (fs.existsSync(FILE)) timelines = JSON.parse(await fs.promises.readFile(FILE, 'utf8')); } catch { }
}
load().catch(() => undefined);

async function save(): Promise<void> {
  await fs.promises.writeFile(FILE, JSON.stringify(timelines.slice(-20), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export async function generateTimeline(projectName: string, description: string): Promise<ProjectTimeline> {
  const timelineId = `tl_${Date.now()}`;
  const now = new Date();

  // Try AI decomposition first
  let tasks: TimelineTask[] = [];
  let milestones: Milestone[] = [];
  let criticalPath: string[] = [];
  let riskSummary = '';

  try {
    const prompt = `Create a project timeline for:

PROJECT: ${projectName}
DESCRIPTION: ${description}

Generate a detailed schedule with:
- 4-8 tasks with durations, dependencies, and assignees
- 2-4 key milestones
- Critical path identification
- Risk assessment

Return in this exact format:

## TASKS
TASK: [name] | [durationDays] | [deps:taskNames,comma] | [assignee:role] | [priority:high/medium/low] | [risk:description]

## MILESTONES  
MILESTONE: [name] | [dayOffset:fromStart] | [description]

## CRITICAL_PATH
[tasks on critical path, comma separated task names]

## RISKS
[risk summary paragraph]`;

    const result = await dispatchTextThroughFabric(prompt, undefined, { domain: 'general', localFallback: true });

    if (result.winner?.contentPreview) {
      const content = result.winner.contentPreview;

      // Parse tasks
      const taskLines = content.split('\n').filter(l => l.trim().toUpperCase().startsWith('TASK:'));
      const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Start tomorrow
      let currentDay = 0;

      for (let i = 0; i < taskLines.length; i++) {
        const parts = taskLines[i].replace(/^TASK:\s*/i, '').split('|').map(s => s.trim());
        const name = parts[0] || `Task ${i + 1}`;
        const durationDays = parseInt(parts[1]) || 3;

        const startDateStr = new Date(startDate.getTime() + currentDay * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const endDateStr = new Date(startDate.getTime() + (currentDay + durationDays) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        tasks.push({
          id: `tsk_${Date.now()}_${i}`,
          name, startDate: startDateStr, endDate: endDateStr,
          durationDays,
          progress: 0,
          dependencies: (parts[2] || '').replace('deps:', '').split(',').map(s => s.trim()).filter(Boolean),
          assignee: parts[3]?.replace('assignee:', '').trim() || 'TBD',
          status: 'planned',
          priority: (parts[4] as any) || 'medium',
          risk: parts[5] || '',
          notes: '',
        });
        currentDay += durationDays;
      }

      // Parse milestones
      const msLines = content.split('\n').filter(l => l.trim().toUpperCase().startsWith('MILESTONE:'));
      for (let i = 0; i < msLines.length; i++) {
        const parts = msLines[i].replace(/^MILESTONE:\s*/i, '').split('|').map(s => s.trim());
        const dayOffset = parseInt(parts[1]) || (i + 1) * 7;
        const msDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        milestones.push({
          id: `ms_${Date.now()}_${i}`,
          name: parts[0] || `Milestone ${i + 1}`,
          date: msDate,
          description: parts[2] || '',
          status: 'upcoming',
        });
      }

      // Parse critical path
      const cpMatch = content.match(/## CRITICAL_PATH\s*\n([\s\S]*?)(?=\n##|$)/i);
      if (cpMatch) {
        criticalPath = tasks.filter(t =>
          cpMatch[1].toLowerCase().includes(t.name.toLowerCase())
        ).map(t => t.id);
      }

      // Parse risks
      const riskMatch = content.match(/## RISKS?\s*\n([\s\S]*?)(?=\n##|$)/i);
      riskSummary = riskMatch ? riskMatch[1].trim() : '';
    }
  } catch { /* fallback */ }

  // Fallback to heuristic if AI failed
  if (tasks.length === 0) {
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const taskDefs = [
      { name: 'Requirements Analysis', days: 3, deps: [], assignee: 'Analyst' },
      { name: 'Architecture Design', days: 2, deps: ['Requirements Analysis'], assignee: 'Architect' },
      { name: 'Implementation', days: 5, deps: ['Architecture Design'], assignee: 'Developer' },
      { name: 'Testing', days: 3, deps: ['Implementation'], assignee: 'QA' },
      { name: 'Deployment', days: 1, deps: ['Testing'], assignee: 'DevOps' },
      { name: 'Documentation', days: 2, deps: ['Implementation'], assignee: 'Tech Writer' },
    ];

    let currentDay = 0;
    for (let i = 0; i < taskDefs.length; i++) {
      const d = taskDefs[i];
      tasks.push({
        id: `tsk_h_${i}`, name: d.name,
        startDate: new Date(startDate.getTime() + currentDay * 86400000).toISOString().slice(0, 10),
        endDate: new Date(startDate.getTime() + (currentDay + d.days) * 86400000).toISOString().slice(0, 10),
        durationDays: d.days, progress: 0,
        dependencies: d.deps, assignee: d.assignee,
        status: 'planned', priority: 'medium', risk: '', notes: '',
      });
      if (i < taskDefs.length - 1) currentDay += d.days;
    }

    milestones = [
      { id: 'ms_h_1', name: 'Project Kickoff', date: startDate.toISOString().slice(0, 10), description: 'Project officially starts', status: 'upcoming' },
      { id: 'ms_h_2', name: 'MVP Ready', date: new Date(startDate.getTime() + 10 * 86400000).toISOString().slice(0, 10), description: 'Minimum viable product ready for review', status: 'upcoming' },
    ];

    criticalPath = tasks.filter(t => ['Requirements Analysis', 'Architecture Design', 'Implementation', 'Testing', 'Deployment'].includes(t.name)).map(t => t.id);
    riskSummary = 'Standard project risks: scope creep, resource availability, technical unknowns.';
  }

  const endDate = tasks.length > 0 ? tasks[tasks.length - 1].endDate : now.toISOString().slice(0, 10);
  const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(tasks[0]?.startDate || now.toISOString()).getTime()) / 86400000);

  const timeline: ProjectTimeline = {
    id: timelineId,
    projectName: projectName.slice(0, 100),
    description: description.slice(0, 500),
    startDate: tasks[0]?.startDate || now.toISOString().slice(0, 10),
    endDate,
    totalDays: Math.max(1, totalDays),
    tasks,
    milestones,
    criticalPath,
    ganttData: {
      tasks,
      milestones,
      timeline: { start: tasks[0]?.startDate || '', end: endDate, totalDays: Math.max(1, totalDays) },
    },
    riskSummary: riskSummary || 'No specific risks identified.',
    generatedAt: now.toISOString(),
    complexity: tasks.length <= 4 ? 'simple' : tasks.length <= 7 ? 'medium' : 'complex',
  };

  timelines.push(timeline);
  if (timelines.length % 3 === 0) save().catch(() => undefined);

  return timeline;
}

export function updateTaskProgress(timelineId: string, taskId: string, progress: number, status?: TimelineTask['status']): boolean {
  const tl = timelines.find(t => t.id === timelineId);
  if (!tl) return false;
  const task = tl.tasks.find(t => t.id === taskId);
  if (!task) return false;
  task.progress = Math.min(100, Math.max(0, progress));
  if (status) task.status = status;
  if (progress >= 100) task.status = 'completed';
  save().catch(() => undefined);
  return true;
}

export function getTimeline(id: string): ProjectTimeline | undefined { return timelines.find(t => t.id === id); }
export function listTimelines(): ProjectTimeline[] { return [...timelines].reverse(); }
export function deleteTimeline(id: string): boolean {
  const idx = timelines.findIndex(t => t.id === id);
  if (idx < 0) return false;
  timelines.splice(idx, 1);
  save().catch(() => undefined);
  return true;
}
