# AgentOps Pipeline Debugging & Testing

This document describes how to verify the new pipeline orchestration, realtime SSE streaming, approvals, and desktop/browser notification behavior in LedgerFlow.

## Local verification flows

### 1. Start the app
- Run the app in development or desktop mode as usual.
- If using desktop packaging, make sure the embedded server is running and the renderer can access the app.

### 2. Configure Supabase auth
- Enter `Supabase URL` and `Supabase anon key` in the `AI Pipelines` tab.
- Sign in using a valid Supabase email/password.
- The app stores `agentops_token` in local storage for API calls.

### 3. Start a pipeline
- Select a pipeline template and enter input context.
- Click `Start Pipeline`.
- The pipeline should be created via `/api/pipelines/start` and the UI should load the pipeline details.

### 4. Validate SSE streaming
- When a pipeline is running or waiting for approval, the `Pipeline details` panel should display live updates.
- The status banner and active SSE client count should update when connected.
- Use the `Test SSE` button to emit a local debug chunk event:
  - This calls `/api/pipelines/:id/debug-event` and sends a simulated chunk payload.
  - The pipeline’s step output should update immediately.

### 5. Validate approval state
- Use the `Test Approval` button to simulate a step entering `waiting_approval` state.
- The UI should show the approval state and the approval action button for that step.
- Approving the step should call `/api/pipelines/:id/approve`, persist the approval, and resume the pipeline.

### 6. Validate notifications
- Click `Enable Notifications` to grant browser permissions.
- Use the `Test Notification` button to verify browser notifications.
- In desktop mode, the same button should trigger the Electron `ledgerflow:notify` bridge.
- When the pipeline emits an approval or completion update, the UI should show a toast and notification.

### 7. Debugging SSE event delivery
- The server maintains a registry of SSE clients and uses a 180ms debounce window to coalesce rapid updates.
- If the client disconnects, the frontend reconnects with exponential backoff.
- The backend debug event route is useful for local validation without Supabase realtime events.

## Backend debug route

### `POST /api/pipelines/:id/debug-event`
- Accepts a JSON body with fields:
  - `type`: `chunk` or `update`
  - `stepIndex`: numeric step index
  - `chunk`: string for chunk payload
  - `step`: object for update payload
- Example bodies:
  - `{ "type": "chunk", "stepIndex": 0, "chunk": "Debug chunk" }`
  - `{ "type": "update", "stepIndex": 0, "step": { "status": "waiting_approval" } }`

## Notes

- If Supabase env is not available, the debug buttons and local route can still verify the frontend SSE and notification logic.
- The pipeline stream uses incremental step output diffs, so large step outputs are sent as appended chunks.
- Approval events are surfaced by the pipeline `update` messages and should trigger `waiting_approval` UI state.
