export type ApprovedGitHubChangeFile = {
  path: string;
  content: string;
};

export type ApprovedGitHubChangeInput = {
  repo?: string;
  title: string;
  summary: string;
  approvalPhrase: 'APPROVE AI GITHUB PUSH';
  baseBranch?: string;
  branchName?: string;
  draft?: boolean;
  files: ApprovedGitHubChangeFile[];
};

export type ApprovedGitHubChangeResult = {
  branch: string;
  pullRequest: {
    number: number;
    title: string;
    htmlUrl?: string;
    url?: string;
  };
};

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export async function createApprovedGitHubChangeRequest(input: ApprovedGitHubChangeInput): Promise<ApprovedGitHubChangeResult> {
  const data = await readJson<{ success: true; result: ApprovedGitHubChangeResult }>(
    await fetch('/api/integrations/github/approved-change-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
  return data.result;
}
