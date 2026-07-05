# Autonomous SWE Agent Loop

This backend loop connects the existing Web AI browser automation, Docker sandbox test runner, and GitHub approved change request flow.

It is intentionally separate from `agenticLoopEngine.ts` and the multi-agent runtime.

## Flow

1. Create a mission with a goal, Web AI platform, test command, and target file whitelist.
2. Copy the repo into `.agent_sandbox/mission_<id>/`.
3. Require Docker isolation before running any command.
4. Ask Web AI for full-file changes using `<code_block file="...">`.
5. Write only whitelisted files into the sandbox copy.
6. Run the test command in Docker.
7. If tests fail, send the error log back to Web AI and retry up to `maxAttempts`.
8. If tests pass, stop at `awaiting_human_approval` by default.
9. Generate a unified diff for each pending file so the founder can review before approval.
10. After approval, create an `ai/*` branch and draft PR through the GitHub connector.

## Endpoints

```http
POST /api/company-os/swe-agent/mission
```

```json
{
  "goalPrompt": "Fix the failing unit test in the selected file.",
  "platform": "chatgpt",
  "profileId": "optional-web-ai-profile-id",
  "testCommand": "npm test",
  "targetFiles": ["server/services/example.ts"],
  "maxAttempts": 3,
  "repoBaseBranch": "main",
  "requireHumanApprovalBeforePush": true
}
```

```http
GET /api/company-os/swe-agent/mission/:id
```

```http
GET /api/company-os/swe-agent/missions?limit=20
```

```http
POST /api/company-os/swe-agent/mission/:id/approve-push
```

## UI

The first control panel is mounted in:

```text
AI Nhân sự -> Mở chẩn đoán nâng cao -> Autonomous SWE Agent Loop
```

The panel can create a mission, poll an existing mission ID, show attempts and test stderr previews, and approve GitHub push when the mission reaches `awaiting_human_approval`.

The panel also includes:

- Mission presets for build fixes, UI component fixes, test writing, small refactors, and draft PR preparation.
- Docker Doctor, which checks Docker CLI, Docker engine readiness, local `node:22-alpine` image availability, and a no-network Node container smoke test.
- Diff preview for every pending file before the founder approves a GitHub push.
- Local mission history loaded from `runtime/swe_agent_missions.json`.

## Safety Notes

- `GITHUB_TOKEN` and `GH_TOKEN` are read only inside `githubConnector.ts`.
- Mission prompts and previews redact GitHub token values if they are ever present in process env.
- Docker is required for the autonomous loop. If Docker is unavailable, the mission fails instead of falling back to host execution.
- The sandbox copy excludes runtime folders, `.env*`, vault files, Git metadata, build outputs, browser profiles, and previous `.agent_sandbox` data.
- GitHub push remains human-gated by default.
- Mission history is stored in `runtime/`, which is local machine state and should not be committed.
