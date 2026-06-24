/**
 * dataMigrationAI.ts
 * ============================================================
 * Data Migration AI — tự động sinh migration scripts
 * từ schema changes, phân tích diff giữa các version,
 * và tạo SQL code tương ứng.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue?: string;
  references?: { table: string; column: string };
  unique: boolean;
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
  indexes: Array<{ name: string; columns: string[]; unique: boolean }>;
}

export interface SchemaDiff {
  id: string;
  addedTables: TableSchema[];
  removedTables: string[];
  addedColumns: Array<{ table: string; column: TableColumn }>;
  removedColumns: Array<{ table: string; columnName: string }>;
  modifiedColumns: Array<{ table: string; columnName: string; before: TableColumn; after: TableColumn }>;
  addedIndexes: Array<{ table: string; index: { name: string; columns: string[]; unique: boolean } }>;
  removedIndexes: Array<{ table: string; indexName: string }>;
}

export interface MigrationScript {
  id: string;
  name: string;
  upSQL: string;
  downSQL: string;
  dialect: 'postgresql' | 'mysql' | 'sqlite' | 'mssql';
  description: string;
  risks: string[];
  generatedAt: string;
  appliedAt?: string;
  status: 'pending' | 'applied' | 'failed' | 'rolled_back';
}

// ─── Storage ────────────────────────────────────────────────────────
const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');
const INDEX_FILE = path.join(MIGRATIONS_DIR, '_index.json');

let migrations: MigrationScript[] = [];

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(MIGRATIONS_DIR)) await fs.promises.mkdir(MIGRATIONS_DIR, { recursive: true });
    if (fs.existsSync(INDEX_FILE)) migrations = JSON.parse(await fs.promises.readFile(INDEX_FILE, 'utf8'));
  } catch { }
}
init().catch(() => undefined);

async function saveIndex(): Promise<void> {
  await fs.promises.writeFile(INDEX_FILE, JSON.stringify(migrations, null, 2), 'utf8');
}

// ─── Schema Diff Engine ─────────────────────────────────────────────

export function parseSchema(content: string): TableSchema[] {
  const tables: TableSchema[] = [];
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(([\s\S]*?)\);/gi;

  let match: RegExpExecArray | null;
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const bodyRaw = match[2];

    const columns: TableColumn[] = [];
    const colLines = bodyRaw.split(',').map(l => l.trim()).filter(l => !l.startsWith('--') && !l.toUpperCase().startsWith('PRIMARY') && !l.toUpperCase().startsWith('FOREIGN') && !l.toUpperCase().startsWith('UNIQUE') && !l.toUpperCase().startsWith('INDEX'));

    for (const line of colLines) {
      const colMatch = line.match(/["'`]?(\w+)["'`]?\s+(\w+(?:\s*\(\d+(?:,\d+)?\))?)\s*(NOT\s+NULL)?\s*(DEFAULT\s+[^,]+)?\s*(PRIMARY\s+KEY)?\s*(UNIQUE)?\s*(?:REFERENCES\s+["'`]?(\w+)["'`]?\s*\(["'`]?(\w+)["'`]?\))?/i);
      if (colMatch) {
        columns.push({
          name: colMatch[1],
          type: colMatch[2]?.toLowerCase() || 'text',
          nullable: !colMatch[3],
          primaryKey: !!colMatch[5],
          defaultValue: colMatch[4]?.replace(/^DEFAULT\s+/i, ''),
          references: colMatch[6] ? { table: colMatch[6], column: colMatch[7] } : undefined,
          unique: !!colMatch[6],
        });
      }
    }

    const indexes: TableSchema['indexes'] = [];
    const idxLines = bodyRaw.split(',').map(l => l.trim()).filter(l => l.toUpperCase().startsWith('UNIQUE') || l.toUpperCase().startsWith('INDEX'));
    for (const line of idxLines) {
      const idxMatch = line.match(/(?:UNIQUE\s+)?INDEX\s+["'`]?(\w+)["'`]?\s*\(([^)]+)\)/i);
      if (idxMatch) {
        indexes.push({
          name: idxMatch[1],
          columns: idxMatch[2].split(',').map(c => c.trim().replace(/["'`]/g, '')),
          unique: line.toUpperCase().startsWith('UNIQUE'),
        });
      }
    }

    tables.push({ name: tableName, columns, indexes });
  }

  return tables;
}

export function diffSchemas(before: TableSchema[], after: TableSchema[]): SchemaDiff {
  const beforeMap = new Map(before.map(t => [t.name, t]));
  const afterMap = new Map(after.map(t => [t.name, t]));

  const addedTables: TableSchema[] = [];
  const removedTables: string[] = [];
  const addedColumns: SchemaDiff['addedColumns'] = [];
  const removedColumns: SchemaDiff['removedColumns'] = [];
  const modifiedColumns: SchemaDiff['modifiedColumns'] = [];
  const addedIndexes: SchemaDiff['addedIndexes'] = [];
  const removedIndexes: SchemaDiff['removedIndexes'] = [];

  // Added/removed tables
  for (const [name, table] of afterMap) {
    if (!beforeMap.has(name)) addedTables.push(table);
  }
  for (const [name] of beforeMap) {
    if (!afterMap.has(name)) removedTables.push(name);
  }

  // Column diffs for matching tables
  for (const [name, afterTable] of afterMap) {
    const beforeTable = beforeMap.get(name);
    if (!beforeTable) continue;

    const beforeCols = new Map(beforeTable.columns.map(c => [c.name, c]));
    const afterCols = new Map(afterTable.columns.map(c => [c.name, c]));

    for (const [colName, col] of afterCols) {
      if (!beforeCols.has(colName)) {
        addedColumns.push({ table: name, column: col });
      } else {
        const beforeCol = beforeCols.get(colName)!;
        if (col.type !== beforeCol.type || col.nullable !== beforeCol.nullable || col.defaultValue !== beforeCol.defaultValue) {
          modifiedColumns.push({ table: name, columnName: colName, before: beforeCol, after: col });
        }
      }
    }
    for (const [colName] of beforeCols) {
      if (!afterCols.has(colName)) {
        removedColumns.push({ table: name, columnName: colName });
      }
    }
  }

  return {
    id: `diff_${Date.now()}`,
    addedTables, removedTables, addedColumns, removedColumns, modifiedColumns, addedIndexes, removedIndexes,
  };
}

// ─── Migration Generation ───────────────────────────────────────────

export function generateMigrationSQL(diff: SchemaDiff, dialect: MigrationScript['dialect'] = 'postgresql'): { upSQL: string; downSQL: string } {
  const up: string[] = [];
  const down: string[] = [];

  // -- UP migration --
  for (const table of diff.addedTables) {
    const cols = table.columns.map(c =>
      `${quote(c.name, dialect)} ${c.type}${c.nullable ? '' : ' NOT NULL'}${c.primaryKey ? ' PRIMARY KEY' : ''}${c.defaultValue ? ` DEFAULT ${c.defaultValue}` : ''}${c.references ? ` REFERENCES ${quote(c.references.table, dialect)}(${quote(c.references.column, dialect)})` : ''}`
    ).join(',\n  ');
    up.push(`CREATE TABLE ${quote(table.name, dialect)} (\n  ${cols}\n);`);
    down.push(`DROP TABLE IF EXISTS ${quote(table.name, dialect)};`);
  }

  for (const { table, column } of diff.addedColumns) {
    const def = `${column.type}${column.nullable ? '' : ' NOT NULL'}${column.defaultValue ? ` DEFAULT ${column.defaultValue}` : ''}`;
    up.push(`ALTER TABLE ${quote(table, dialect)} ADD COLUMN ${quote(column.name, dialect)} ${def};`);
    down.push(`ALTER TABLE ${quote(table, dialect)} DROP COLUMN IF EXISTS ${quote(column.name, dialect)};`);
  }

  for (const { table, columnName } of diff.removedColumns) {
    up.push(`ALTER TABLE ${quote(table, dialect)} DROP COLUMN IF EXISTS ${quote(columnName, dialect)};`);
    down.push(`-- Re-add ${columnName} manually`); // Cannot auto-reconstruct removed column fully
  }

  for (const { table, columnName, before, after } of diff.modifiedColumns) {
    if (before.type !== after.type) {
      up.push(`ALTER TABLE ${quote(table, dialect)} ALTER COLUMN ${quote(columnName, dialect)} TYPE ${after.type};`);
    }
    if (before.nullable !== after.nullable) {
      up.push(`ALTER TABLE ${quote(table, dialect)} ALTER COLUMN ${quote(columnName, dialect)} ${after.nullable ? 'DROP NOT NULL' : 'SET NOT NULL'};`);
    }
  }

  for (const tableName of diff.removedTables) {
    up.push(`DROP TABLE IF EXISTS ${quote(tableName, dialect)};`);
  }

  return {
    upSQL: up.join('\n\n'),
    downSQL: down.reverse().join('\n\n'),
  };
}

function quote(name: string, dialect: MigrationScript['dialect']): string {
  switch (dialect) {
    case 'postgresql': return `"${name}"`;
    case 'mysql': return `\`${name}\``;
    case 'mssql': return `[${name}]`;
    default: return `"${name}"`;
  }
}

// ─── Core API ───────────────────────────────────────────────────────

export async function createMigration(
  name: string,
  beforeSchema: string,
  afterSchema: string,
  options?: { dialect?: MigrationScript['dialect']; description?: string },
): Promise<MigrationScript> {
  const before = parseSchema(beforeSchema);
  const after = parseSchema(afterSchema);
  const diff = diffSchemas(before, after);
  const dialect = options?.dialect || 'postgresql';

  const { upSQL, downSQL } = generateMigrationSQL(diff, dialect);

  // AI-powered description and risk analysis
  let description = options?.description || '';
  let risks: string[] = [];

  const hasDestructiveChanges = diff.removedTables.length > 0 || diff.removedColumns.length > 0;

  if (hasDestructiveChanges) {
    try {
      const aiPrompt = `Analyze this database migration for risks:

UP MIGRATION:
${upSQL.slice(0, 1500)}

DOWN MIGRATION:
${downSQL.slice(0, 1500)}

Return in format:
RISKS: [comma-separated risk factors, or NONE]
DESCRIPTION: [1 sentence migration summary]`;

      const result = await dispatchTextThroughFabric(aiPrompt, undefined, {
        domain: 'coding', localFallback: true,
      });
      if (result.winner?.contentPreview) {
        const riskMatch = result.winner.contentPreview.match(/RISKS:\s*(.+)/i);
        risks = riskMatch ? riskMatch[1].split(',').map(r => r.trim()).filter(r => r.toUpperCase() !== 'NONE') : [];
        const descMatch = result.winner.contentPreview.match(/DESCRIPTION:\s*(.+)/i);
        if (descMatch) description = descMatch[1];
      }
    } catch { }
  }

  if (!description) {
    description = diff.addedTables.length > 0
      ? `Add ${diff.addedTables.length} table(s), ${diff.addedColumns.length} column(s)`
      : `Modify ${diff.modifiedColumns.length} column(s), drop ${diff.removedColumns.length} column(s)`;
  }

  if (risks.length === 0 && hasDestructiveChanges) {
    risks.push('Dropping tables/columns is irreversible without backup.');
  }

  const migration: MigrationScript = {
    id: `mig_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: name.slice(0, 120),
    upSQL, downSQL, dialect, description, risks,
    generatedAt: new Date().toISOString(),
    status: 'pending',
  };

  migrations.push(migration);

  // Write to file
  const fileName = `${Date.now()}_${name.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 60)}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  await fs.promises.writeFile(filePath, `-- UP\n${upSQL}\n\n-- DOWN\n${downSQL}`, 'utf8');

  await appendAuditEvent({
    actor: 'system', workspace: 'Data Migration', action: 'migration.generate',
    target: name, risk: hasDestructiveChanges ? 'HIGH' : 'MEDIUM', status: 'executed',
    summary: `Migration: ${diff.addedTables.length}A/${diff.removedTables.length}D/${diff.modifiedColumns.length}M`,
    connectorId: 'data-migration',
    evidence: { migrationId: migration.id, dialect, filePath },
  }).catch(() => undefined);

  saveIndex().catch(() => undefined);
  return migration;
}

export function getMigration(id: string): MigrationScript | undefined { return migrations.find(m => m.id === id); }
export function listMigrations(): MigrationScript[] { return [...migrations].reverse(); }

export function applyMigration(id: string): boolean {
  const migration = migrations.find(m => m.id === id);
  if (!migration || migration.status === 'applied') return false;
  migration.status = 'applied';
  migration.appliedAt = new Date().toISOString();
  saveIndex().catch(() => undefined);
  return true;
}

export function rollbackMigration(id: string): boolean {
  const migration = migrations.find(m => m.id === id);
  if (!migration || migration.status !== 'applied') return false;
  migration.status = 'rolled_back';
  saveIndex().catch(() => undefined);
  return true;
}
