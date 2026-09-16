import fs from 'node:fs';
import path from 'node:path';

export type ReleaseArtifactState = {
  id: 'frontend' | 'server' | 'assistant-daemon' | 'windows-desktop';
  label: string;
  required: boolean;
  present: boolean;
  location: string;
  sizeBytes?: number;
  modifiedAt?: string;
};

function inspectArtifact(id: ReleaseArtifactState['id'], label: string, required: boolean, location: string): ReleaseArtifactState {
  try {
    const stat = fs.statSync(location);
    return { id, label, required, present: stat.isFile(), location, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString() };
  } catch {
    return { id, label, required, present: false, location };
  }
}

/**
 * Reports artifact evidence only. It deliberately never executes build, test or packaging commands.
 */
export function getReleaseReadinessSnapshot(workspaceRoot = process.cwd()): {
  checkedAt: string;
  runtime: 'desktop' | 'development';
  ready: boolean;
  artifacts: ReleaseArtifactState[];
} {
  const desktopRuntime = process.env.ELECTRON_DESKTOP === 'true';
  const windowsExecutable = desktopRuntime
    ? process.execPath
    : path.join(workspaceRoot, 'release', 'win-unpacked', 'LedgerFlow Hub.exe');
  const artifacts = [
    inspectArtifact('frontend', 'Giao diện đã build', true, path.join(workspaceRoot, 'dist', 'index.html')),
    inspectArtifact('server', 'Backend runtime', true, path.join(workspaceRoot, 'dist', 'server.cjs')),
    inspectArtifact('assistant-daemon', 'Assistant daemon', true, path.join(workspaceRoot, 'dist', 'assistant-daemon.cjs')),
    inspectArtifact('windows-desktop', 'LedgerFlow Hub.exe', true, windowsExecutable),
  ];
  return {
    checkedAt: new Date().toISOString(),
    runtime: desktopRuntime ? 'desktop' : 'development',
    ready: artifacts.every((artifact) => !artifact.required || artifact.present),
    artifacts,
  };
}
