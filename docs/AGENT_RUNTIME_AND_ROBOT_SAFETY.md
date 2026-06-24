# Agent Runtime and Robot Safety

LedgerFlow uses a controlled agent runtime rather than unrestricted host execution.

## Agent run lifecycle

`AgentRun` is the backend source of truth for a goal, its plan, tool calls, observations, evidence and artifacts.

```text
planned -> running -> waiting_approval -> running -> completed
                    \-> stopped / failed
```

- Low-risk registered tools may run automatically in simulation.
- Medium/high-risk tools stop before execution and require the exact reviewed fingerprint plus `APPROVE AGENT STEP`.
- Every simulated tool result creates evidence and an audit event.
- Each run has a step limit and wall-clock runtime budget.
- Founder emergency stop halts all active runs and prevents further execution until reset.

Runtime state is local-only in `agent_runtime.local.json`. The file is ignored by Git.

## Memory safety

Agent memory is separated into company, session, procedure, observation and feedback records.

- New records are drafts unless explicitly marked reviewed.
- Normal retrieval only returns reviewed, non-expired records.
- Results include a stable citation with memory ID and source.
- Founder review can approve or reject a record.
- Feedback never becomes a system instruction automatically.

Memory state is local-only in `agent_memory.local.json` and is ignored by Git.

## Robot connector boundary

The current robot connector is a digital-twin simulation only. It does not connect to ROS, MQTT, Modbus, serial, USB, motors or physical controllers.

Safety controls:

- `mode` is fixed to `simulation`.
- Movement requires `APPROVE ROBOT SIMULATION`.
- Position is limited to a 500 mm envelope.
- Velocity is limited to 100 mm/s.
- Emergency stop latches until explicitly reset.
- Every accepted command returns timestamped state evidence.

Before any physical adapter is added, it must provide hardware emergency stop, watchdog/heartbeat, command expiry, telemetry verification, device identity, per-command authorization and an isolated safety controller that does not depend on an LLM.

## Browser boundary

Browser automation keeps the Chromium sandbox enabled. Targets must match the task-specific ChatGPT/Gemini hosts, localhost, or an explicit comma-separated `BROWSER_SANDBOX_ALLOWED_HOSTS` server setting. Profile names are validated and cannot escape the managed Chrome profile directory.

## APIs

```text
GET  /api/agent-runtime/runs
POST /api/agent-runtime/runs
POST /api/agent-runtime/runs/:id/advance
POST /api/agent-runtime/runs/:id/approve
POST /api/agent-runtime/runs/:id/stop
POST /api/agent-runtime/emergency-stop

GET   /api/agent-memory/search
POST  /api/agent-memory
PATCH /api/agent-memory/:id/review

GET  /api/robot-simulation/status
POST /api/robot-simulation/command
POST /api/robot-simulation/emergency-stop
```
