export type ReleaseArtifactState = {
  id: 'frontend' | 'server' | 'assistant-daemon' | 'windows-desktop';
  label: string;
  required: boolean;
  present: boolean;
  location: string;
  sizeBytes?: number;
  modifiedAt?: string;
};

export type ReleaseReadinessSnapshot = {
  checkedAt: string;
  runtime: 'desktop' | 'development';
  ready: boolean;
  artifacts: ReleaseArtifactState[];
};

export async function fetchReleaseReadiness(): Promise<ReleaseReadinessSnapshot> {
  const response = await fetch('/api/release/readiness');
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.error || 'Không thể kiểm tra artifact phát hành.');
  return data.snapshot as ReleaseReadinessSnapshot;
}
