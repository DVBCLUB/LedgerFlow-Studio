# GLACIA AUTONOMY ENGINE v2.1
## Master Technical Specification & Coding Blueprint
### Target: DeepSeek / AI Coding Agent

> **Purpose:** This document is the primary implementation blueprint for upgrading Glacia from a simulated AI/game-style prototype into a production-oriented Autonomous Creation OS.
>
> **Important:** Do not treat names such as "Consciousness", "Singularity", or "Reality Engine" as literal claims of consciousness or AGI. Convert them into measurable engineering capabilities.

> **v2.1 changelog (added after external architecture review):** refined Section 11 (Computer Use — GUI-automation allowlist and third-party ToS risk), Section 15 (Model Router — concrete gateway/fallback pattern), Section 18 (Knowledge Acquisition — license compliance for open-source ingestion), Section 26 (Self-Improvement — human approval gate for orchestration-core patches), Section 41 (Benchmark System — external reference benchmarks + cost-per-task gate), Section 49 (added Rule 11 — verifiable evidence over self-reported completion), and new Section 48A (Solo-Founder Execution Priority).

---

# 0. SOURCE BASELINE

The current codebase is a TypeScript/Node.js monolithic event-driven application called **Glacia Autonomy Engine**.

Current audit baseline:

- 34 source files
- TypeScript / Node.js
- Express dashboard
- WebSocket dashboard
- Gemini API proxy
- MCP hub
- JSON persistence
- Singleton `GlaciaCore`
- EventEmitter communication
- Simulated Level 5–7 intelligence modules
- Current architecture maturity: prototype / early-stage
- Critical problems include:
  - unauthenticated WebSocket command execution
  - wildcard CORS
  - API key exposure in logs
  - blocking / poorly isolated AI execution
  - silent error swallowing
  - JSON persistence without transactional guarantees
  - unsafe dynamic plugin loading
  - weak input validation
  - minimal MCP tests
  - simulated rather than real autonomous intelligence

This document is the **target architecture**, not a request to preserve every current implementation detail.

---

# 1. PRODUCT VISION

## 1.1 Product Definition

Glacia is an:

> **Autonomous Creation OS**

It is not intended to compete with foundation-model companies by training a better general-purpose LLM.

Instead, Glacia must orchestrate existing AI models, specialized AI tools, software applications, IDEs, game engines, video tools, APIs, MCP servers, external agents and local/open-source models.

Core principle:

> **Stand on the shoulders of giants.**

Glacia should build the orchestration, execution, memory, evaluation, safety and workflow layer while reusing best-in-class external capabilities.

---

# 2. CORE USER EXPERIENCE

The user gives Glacia a high-level goal.

Example:

> "Create a small Windows survival game with a unique art direction."

Glacia must transform the goal into:

```text
USER GOAL
  ↓
PROJECT SPECIFICATION
  ↓
RESEARCH
  ↓
ARCHITECTURE
  ↓
TASK GRAPH
  ↓
AGENT TEAM
  ↓
MODEL / TOOL ROUTING
  ↓
SANDBOX EXECUTION
  ↓
BUILD
  ↓
TEST
  ↓
EVALUATE
  ↓
REPAIR / ITERATE
  ↓
FINAL ARTIFACT
  ↓
RELEASE
```

Glacia should minimize the need for the user to manually coordinate individual AI tools.

---

# 3. ARCHITECTURE PRINCIPLES

## 3.1 Control Plane vs Execution Plane

### Control Plane

Responsible for:

- goals
- planning
- agent orchestration
- task graph
- memory
- policies
- permissions
- model routing
- cost budgets
- workflow state
- evaluation
- audit
- observability

### Execution Plane

Responsible for:

- code execution
- terminal commands
- Git
- package installation
- IDE integration
- browser/computer use
- game engine execution
- 3D pipelines
- video pipelines
- testing
- builds
- rendering
- deployment

Do not let arbitrary model-generated code run with unrestricted host privileges.

---

# 4. TARGET ARCHITECTURE

```text
                         HUMAN USER
                             |
                             v
                    +-------------------+
                    |   GLACIA PRIME    |
                    | Goal + Planning   |
                    +---------+---------+
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
      MEMORY             WORLD MODEL          POLICY
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                    +-------------------+
                    |   TASK GRAPH      |
                    | Workflow Engine   |
                    +---------+---------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
           RESEARCHER       CODER            QA
           DESIGNER         ARTIST          SECURITY
           VIDEO            GAME            RELEASE
                              |
                              v
                    +-------------------+
                    |   AGENT RUNTIME   |
                    +---------+---------+
                              |
                   +----------+----------+
                   |                     |
                   v                     v
             MODEL ROUTER           TOOL FABRIC
                                       |
                    +------------------+------------------+
                    |                  |                  |
                    v                  v                  v
                   MCP                API            COMPUTER USE
                    |                  |                  |
                    +------------------+------------------+
                                       |
                                       v
                                SECURE SANDBOX
                                       |
                     +-----------------+-----------------+
                     |                 |                 |
                     v                 v                 v
                   CODE              GAME              VIDEO
                     |                 |                 |
                     +-----------------+-----------------+
                                       |
                                       v
                                EVALUATION ENGINE
                                       |
                                  +----+----+
                                  |         |
                                  v         v
                                 PASS      FAIL
                                  |         |
                                  v         v
                               RELEASE    REPAIR
                                            |
                                            +----> LOOP
```

---

# 5. REPOSITORY TARGET STRUCTURE

Target structure:

```text
glacia/
├── apps/
│   ├── control-plane/
│   ├── dashboard/
│   └── gateway/
│
├── core/
│   ├── cognition/
│   ├── planning/
│   ├── orchestration/
│   ├── policy/
│   ├── memory/
│   ├── routing/
│   └── project-world/
│
├── agents/
│   ├── prime/
│   ├── researcher/
│   ├── architect/
│   ├── coder/
│   ├── game-designer/
│   ├── 3d-artist/
│   ├── animator/
│   ├── video-director/
│   ├── audio/
│   ├── qa/
│   ├── security/
│   ├── performance/
│   ├── reviewer/
│   └── release/
│
├── runtime/
│   ├── agent-runtime/
│   ├── sandbox/
│   ├── workers/
│   └── workflow/
│
├── tools/
│   ├── registry/
│   ├── mcp/
│   ├── api/
│   ├── filesystem/
│   ├── git/
│   ├── browser/
│   ├── ide/
│   ├── shell/
│   └── computer-use/
│
├── memory/
│   ├── working/
│   ├── episodic/
│   ├── semantic/
│   └── project/
│
├── evaluation/
│   ├── benchmarks/
│   ├── judges/
│   ├── regression/
│   └── safety/
│
├── projects/
│   ├── software/
│   ├── games/
│   └── video/
│
├── persistence/
│   ├── postgres/
│   ├── redis/
│   └── object-storage/
│
├── observability/
│   ├── tracing/
│   ├── metrics/
│   └── audit/
│
└── tests/
    ├── unit/
    ├── integration/
    ├── security/
    ├── workflow/
    ├── agent/
    ├── e2e/
    └── evaluation/
```

Use a modular architecture first. Do **not** split everything into microservices prematurely.

Preferred initial deployment model:

> **Modular Monolith + Workers + Sandbox**

Later, high-load components can be extracted into services.

---

# 6. GLACIA PRIME

`Glacia Prime` is the top-level orchestration agent.

Responsibilities:

- interpret user goals
- create project specification
- decompose goals into tasks
- create task graph
- select agents
- assign tools
- choose model routes
- manage budgets
- monitor progress
- detect blockers
- re-plan
- request approval when required
- verify final quality
- stop when acceptance criteria are met

Prime should NOT directly perform every task itself.

It is primarily an orchestrator / planner.

---

# 7. AGENT MODEL

Every agent must be represented by structured metadata.

Example:

```ts
interface AgentDefinition {
  id: string;
  name: string;
  role: string;

  systemInstructions: string;

  modelPolicy: ModelPolicy;
  tools: string[];

  permissions: PermissionSet;

  memoryScopes: string[];

  maxConcurrency: number;
  maxRetries: number;

  budget: BudgetPolicy;

  evaluationPolicy: EvaluationPolicy;
}
```

Agent runtime loop:

```text
OBSERVE
  ↓
UNDERSTAND
  ↓
PLAN
  ↓
ACT
  ↓
OBSERVE RESULT
  ↓
VERIFY
  ↓
REFLECT
  ↓
CONTINUE / DELEGATE / REPLAN / STOP
```

The runtime must support:

- timeout
- retry
- cancellation
- pause
- resume
- checkpoint
- recovery
- structured result
- structured error
- tool-call recording
- token/cost accounting

---

# 8. AGENT ROLES

Initial agents:

## Prime Agent
Overall project orchestration.

## Research Agent
Finds and validates external knowledge and documentation.

## Architect Agent
Creates technical architecture and dependency decisions.

## Coding Agent
Writes and modifies source code.

## Game Designer Agent
Designs mechanics, progression, systems and game design documents.

## 3D Asset Agent
Coordinates generation and processing of 3D assets.

## Animation Agent
Coordinates rigging and animation workflows.

## Video Director Agent
Handles scripts, storyboards, scenes, shot lists and video production.

## Audio Agent
Coordinates music, SFX and voice pipelines.

## QA Agent
Runs automated tests and gameplay checks.

## Security Agent
Performs security review and policy validation.

## Performance Agent
Measures performance and identifies bottlenecks.

## Reviewer / Judge Agent
Evaluates outputs against acceptance criteria.

## Release Agent
Packages and publishes approved artifacts.

Agents can share the same foundation model while using different prompts, tools, policies and memory.

---

# 9. MCP, A2A AND API STRATEGY

Use three connection layers:

```text
MCP = Agent → Tool / Context
A2A = Agent → Agent
API = Glacia → External Service
```

## MCP

Use MCP as the main tool/context integration mechanism where practical.

Create a Tool Registry.

Tool metadata:

```ts
interface ToolDefinition {
  id: string;
  name: string;
  description: string;

  inputSchema: unknown;
  outputSchema: unknown;

  riskLevel: "low" | "medium" | "high" | "critical";

  permissions: PermissionSet;

  costEstimate?: number;
  latencyEstimateMs?: number;

  sideEffects: boolean;
  reversible: boolean;
  requiresApproval: boolean;
}
```

## A2A

Support agent-to-agent interoperability as a future-facing integration layer.

Do not tightly couple Glacia to one external agent framework.

## APIs

APIs remain first-class because many specialized services do not need MCP.

---

# 10. TOOL FABRIC

Create a unified abstraction:

```ts
interface ToolExecutor {
  execute(
    tool: ToolDefinition,
    input: unknown,
    context: ExecutionContext
  ): Promise<ToolResult>;
}
```

Supported categories:

- filesystem
- terminal
- Git
- browser
- IDE
- database
- web/search
- game engine
- Blender/3D tools
- video tools
- image tools
- audio tools
- model APIs
- MCP tools
- external agent APIs

Tool calls must always pass through:

```text
Agent
 ↓
Tool Registry
 ↓
Policy Engine
 ↓
Permission Check
 ↓
Sandbox / Executor
 ↓
Tool
 ↓
Result
 ↓
Audit
```

Never execute arbitrary tool commands directly from a model response.

---

# 11. COMPUTER USE

Glacia should support two integration levels.

## Level A — Native integration

Preferred order:

1. API
2. SDK
3. CLI
4. MCP
5. Plugin
6. Computer use

## Level B — Computer Use

For applications without suitable APIs:

- screen capture
- window targeting
- mouse
- keyboard
- browser interaction
- application launch
- UI state inspection

Computer-use operations must be constrained by policy and sandbox boundaries.

### 11.1 Computer Use Safety Constraints (added)

GUI-level automation carries materially higher risk than API/MCP integration and must be treated as a separate trust tier, not a fallback of equal standing:

- Maintain an explicit **allowlist of applications** Glacia is permitted to control via computer use. Glacia must never autonomously decide to start controlling a new, previously unapproved application — that requires a human-approved addition to the allowlist.
- Before automating any third-party software or web platform, check whether the action would violate that platform's Terms of Service (e.g. automated account actions, scraping behind login walls, bulk actions that look like bot abuse). Flag ToS-risk targets for human review rather than silently proceeding.
- Treat computer-use credentials/sessions as high-value secrets: never share them with the same isolation boundary as sandboxed code execution, and log every computer-use action to the audit trail with before/after screenshots where feasible.
- Prefer Level A (API/SDK/CLI/MCP/Plugin) whenever it exists, even if it requires more upfront integration work — computer use is the option of last resort, not convenience.

---

# 12. SANDBOX RUNTIME

Every untrusted or model-generated execution should run in an isolated environment when possible.

Sandbox policy:

```text
CPU quota
RAM quota
disk quota
process limit
network policy
filesystem policy
secret isolation
timeout
snapshot
rollback
```

Example:

```text
Task #842
  ↓
Sandbox #842
  ↓
Agent works
  ↓
Tests
  ↓
Evaluation
  ↓
Artifact
  ↓
Destroy or checkpoint
```

Production host secrets must not automatically become available to agents.

---

# 13. POLICY ENGINE

Replace regex-based security decisions with a structured policy engine.

Every tool request becomes:

```text
Tool Request
  ↓
Identity
  ↓
Resource
  ↓
Action
  ↓
Risk Classification
  ↓
Policy Evaluation
  ↓
Allow / Deny / Approval / Sandbox
```

Risk examples:

```text
read source file            LOW
write source file           MEDIUM
git commit                  MEDIUM
install package             MEDIUM/HIGH
network access              MEDIUM/HIGH
publish release             HIGH
delete repository           CRITICAL
```

Policy engine requirements:

- default deny for sensitive operations
- allowlists
- per-agent permissions
- per-project permissions
- path restrictions
- network restrictions
- command restrictions
- rate limits
- approval rules
- full audit trail

---

# 14. PERMISSION MATRIX

Example default:

| Agent | Read | Write | Shell | Internet | Git | Deploy |
|---|---:|---:|---:|---:|---:|---:|
| Research | yes | no | limited | yes | no | no |
| Architect | yes | docs | no | yes | no | no |
| Coder | yes | yes | sandbox | limited | yes | no |
| QA | yes | temp | sandbox | no | no | no |
| Security | yes | reports | sandbox | limited | no | no |
| Release | yes | yes | sandbox | yes | yes | yes |

Treat this as a starting default, not an immutable configuration.

---

# 15. MODEL ROUTER

Glacia must be model-agnostic.

Never hard-code one model as the intelligence layer.

Create:

```ts
interface ModelRouter {
  selectModel(task: ModelTask): Promise<ModelRoute>;
}
```

Route based on:

- task difficulty
- reasoning requirement
- coding requirement
- vision requirement
- context length
- latency target
- reliability
- cost budget
- provider availability

Support:

```text
strong reasoning model
coding model
fast/cheap model
vision model
video model
3D-specialized model
local/open-source model
```

Implement escalation:

```text
cheap model
  ↓
quality check
  ↓
insufficient
  ↓
stronger model
  ↓
quality check
  ↓
specialist agent
```

### 15.1 Gateway Pattern (added)

Implement the Model Router as a single **Model Gateway** service that every agent calls through — never let an agent hold a direct SDK client for a specific vendor. This is the same pattern used by production model-routing layers (e.g. LiteLLM-style or OpenRouter-style gateways):

```text
Agent
  ↓
ModelGateway.call(task, constraints)
  ↓
ModelRouter.selectModel(task)
  ↓
Provider Adapter (Anthropic / OpenAI / Gemini / local model)
  ↓
Automatic retry on a different provider on failure/timeout
  ↓
Normalized response + cost/latency metadata returned to agent
```

Every call must return cost and latency metadata regardless of provider, so the Cost/Budget Engine (Section 45) and Benchmark System (Section 41) can compare routes on equal footing.

---

# 16. MEMORY ARCHITECTURE

Create four memory layers.

## Working Memory

Current task state.

## Episodic Memory

Previous experiences:

```text
task
action
result
error
solution
```

## Semantic Memory

General validated knowledge.

## Project Memory

Project-specific knowledge:

- architecture
- design decisions
- code conventions
- assets
- dependencies
- bugs
- requirements
- previous runs
- known failures

Do not rely on vector search alone.

Use structured metadata + semantic retrieval + project graph.

---

# 17. PROJECT WORLD MODEL

Create a machine-readable graph of the project.

Entities:

```text
Project
Requirement
Feature
Task
Agent
Module
File
Dependency
Asset
API
Test
Bug
Decision
Artifact
Evaluation
Release
```

Relationships:

```text
depends_on
implements
uses
tested_by
generated_from
affects
blocked_by
verified_by
released_as
```

Example:

```text
PlayerController.ts
  ├─ depends_on → InputSystem
  ├─ depends_on → PhysicsSystem
  ├─ affects → Player
  └─ tested_by → PlayerController.test.ts
```

The world model should allow Glacia to reason about impact analysis.

---

# 18. KNOWLEDGE ACQUISITION ENGINE

Replace hardcoded research data with a real research pipeline:

```text
Question
  ↓
Search / Discovery
  ↓
Source Ranking
  ↓
Read
  ↓
Extract
  ↓
Cross-check
  ↓
Summarize
  ↓
Store
  ↓
Link to Knowledge Graph
  ↓
Confidence Score
```

Every knowledge item should store:

```text
source
timestamp
confidence
topic
dependencies
contradictions
expiration / freshness
license (for code sources)
```

Do not blindly ingest external content.

### 18.1 Open-Source Code Licensing Compliance (added)

When the Knowledge Acquisition Engine ingests open-source repositories for learning:

```text
Discover repository
  ↓
Read license file
  ↓
Classify: permissive (MIT / Apache-2.0 / BSD) vs restrictive (GPL / AGPL / proprietary / unlicensed)
  ↓
Permissive → allowed as retrieval/reference source (RAG), pattern learning
Restrictive/unlicensed → index for research/context only, block from code-generation reuse
  ↓
Store license metadata alongside every ingested chunk
```

The Knowledge Acquisition Engine must never copy substantial verbatim code from a restrictively-licensed or unlicensed repository into a generated artifact. Treat this as a hard policy rule enforced in the Evaluation Engine (Section 24), not just a guideline — a generated artifact that reproduces licensed code it shouldn't should fail evaluation automatically.

---

# 19. WORKFLOW / TASK GRAPH

Replace a simple task queue with a directed task graph.

Example:

```text
CREATE GAME
  |
  +-- Research
  |
  +-- Game Design
  |      |
  |      +-- Architecture
  |
  +-- Coding
  |
  +-- Assets
  |      +-- 3D
  |      +-- Texture
  |      +-- Animation
  |
  +-- Audio
  |
  +-- QA
         |
         +-- Build
         |
         +-- Judge
```

Support:

- dependencies
- parallel execution
- retries
- checkpoints
- pause
- resume
- cancellation
- deadlines
- priorities
- budget limits
- approval gates
- failure recovery

---

# 20. DURABLE WORKFLOW STATE

Long-running tasks must survive process restarts.

Persist:

```text
workflow
task
task state
agent run
tool calls
checkpoints
artifacts
evaluation
errors
approvals
```

Do not rely on in-memory `EventEmitter` state for durable workflows.

---

# 21. EVENT SYSTEM

Keep events for decoupling, but introduce durable event/workflow infrastructure.

Every important event should have:

```ts
interface DomainEvent {
  id: string;
  type: string;
  timestamp: string;
  correlationId: string;
  causationId?: string;
  actorId?: string;
  payload: unknown;
  version: number;
}
```

Need:

- idempotency
- retry
- ordering where required
- persistence
- correlation IDs
- dead-letter handling

---

# 22. DATABASE

Replace JSON persistence as the primary system of record.

Preferred architecture:

```text
PostgreSQL
Redis
Object Storage
Vector storage / pgvector
```

PostgreSQL stores:

- users
- projects
- agents
- tasks
- workflows
- runs
- tools
- permissions
- events
- artifacts
- evaluations
- memory metadata
- approvals

Redis stores:

- queue state
- locks
- cache
- transient state

Object storage stores:

- images
- videos
- 3D assets
- builds
- logs
- snapshots
- generated files

---

# 23. ARTIFACT GRAPH

Artifacts are first-class objects.

Supported artifact types:

```text
source code
binary
build
image
texture
3D model
animation
audio
video
document
dataset
```

Relationships:

```text
Requirement
  ↓
Task
  ↓
Artifact
  ↓
Evaluation
  ↓
Release
```

Artifacts need:

- hash
- version
- metadata
- creator agent
- source task
- dependencies
- evaluation results
- timestamp

---

# 24. EVALUATION ENGINE

This is mandatory.

Glacia must not decide "done" based only on an agent saying it is done.

Build an evaluation framework:

```text
Artifact
  ↓
Functional Evaluation
Security Evaluation
Performance Evaluation
Quality Evaluation
Requirement Match
  ↓
Score
```

Example:

```text
Build Success        100
Unit Tests             94
Integration Tests      91
Security               98
Performance             82
Visual Quality          87
Requirement Match       93
```

Evaluation output:

```ts
interface EvaluationResult {
  score: number;
  passed: boolean;
  criteria: EvaluationCriterion[];
  failures: EvaluationFailure[];
  recommendations: string[];
}
```

---

# 25. JUDGE AGENT

Use independent evaluation.

Pattern:

```text
Builder Agent
   ↓
Artifact
   ↓
Judge Agent
   ↓
PASS / FAIL
   ↓
Repair Agent
```

Do not let the same agent be the sole judge of its own work.

---

# 26. SELF-IMPROVEMENT

The system should use measurable engineering feedback.

Required loop:

```text
Observe
  ↓
Detect Bottleneck
  ↓
Create Hypothesis
  ↓
Create Patch / Change
  ↓
Run Tests
  ↓
Run Benchmark
  ↓
Security Check
  ↓
Compare Baseline
  ↓
Accept / Reject
```

Self-improvement must happen inside controlled branches/sandboxes.

Never allow unrestricted autonomous modification of production.

### 26.1 Approval Gate for Core Changes (added)

Not all self-improvement patches carry the same risk. Distinguish:

```text
Peripheral change (a single agent's prompt, a tool wrapper, a benchmark task)
  → may auto-merge after passing tests + benchmark + security check

Core change (Glacia Prime's planning logic, the Policy Engine, the Model Router,
  the Sandbox Runtime, permission defaults)
  → tests + benchmark passing is necessary but NOT sufficient —
    requires an explicit human approval step before merge, regardless of
    how confident the self-improvement loop is in its own result
```

The system must never mark a core-layer patch as "accepted" purely on the strength of its own benchmark comparison — Glacia is not permitted to fully self-certify changes to the part of itself that decides what it's allowed to do.

---

# 27. CONTINUOUS LEARNING

Use:

```text
external knowledge
  ↓
research
  ↓
validate
  ↓
knowledge store
  ↓
retrieve
  ↓
task performance
  ↓
evaluation
  ↓
feedback
  ↓
policy / prompt / tool optimization
```

Prefer learning from verified experience.

Do not automatically treat every web page, repository or generated answer as ground truth.

---

# 28. COGNITIVE STATE

Replace literal "consciousness" simulation with measurable state.

Example:

```ts
interface CognitiveState {
  goal: string;
  currentBeliefs: string[];
  uncertainty: number;
  currentPlan: string[];
  activeTasks: string[];
  constraints: string[];
  confidence: number;
  blockers: string[];
  nextAction?: string;
}
```

This is the operational representation of Glacia's current reasoning state.

---

# 29. PERSONALITY / EMOTION

Personality may exist as a UX layer.

Use it for:

- response style
- tone
- interaction preferences

Do not use simulated emotions as a substitute for intelligence.

---

# 30. OBSERVABILITY

Implement structured observability from the beginning.

Every agent run should track:

```text
run ID
project ID
task ID
agent ID
model
input tokens
output tokens
tool calls
tool latency
retries
errors
cost
artifacts
evaluation score
```

Use:

- structured logs
- distributed traces
- metrics
- audit logs
- correlation IDs
- health endpoints

Recommended direction:

> OpenTelemetry-compatible tracing and metrics.

---

# 31. SECURITY BASELINE

Before enabling real autonomous execution, implement:

## Authentication

- dashboard authentication
- API authentication
- WebSocket authentication
- service-to-service authentication where applicable

## Authorization

- RBAC / capability-based permissions
- per-agent permissions
- per-project permissions

## Network Security

- restricted outbound network
- allowlists where practical
- no unrestricted host-network access for sandboxed agents

## Secrets

- do not log API keys
- secret manager / environment isolation
- agents only receive secrets required for the current operation

## Input Validation

Use schema validation for:

- API requests
- commands
- tool inputs
- agent outputs
- workflow definitions

## Rate Limits

Implement per-user / per-project / per-agent limits.

## Audit

Record security-sensitive actions.

---

# 32. WEBSOCKET SECURITY

Current unauthenticated WebSocket command execution must be eliminated.

Required:

```text
TLS / trusted reverse proxy
authentication
authorization
origin validation
message schema validation
rate limiting
connection heartbeat
reconnection strategy
audit logging
```

Never execute a command directly because a WebSocket client requested it.

Every command must pass:

```text
WebSocket
 ↓
Authenticate
 ↓
Authorize
 ↓
Validate Schema
 ↓
Policy Engine
 ↓
Task / Tool Executor
```

---

# 33. DASHBOARD

Dashboard should show:

## System

- health
- workers
- queues
- model status
- tool status
- sandbox status

## Project

- goals
- task graph
- active agents
- progress
- blockers
- artifacts

## Agent

- current plan
- current action
- tool calls
- memory context
- cost
- confidence

## Evaluation

- quality score
- failures
- regressions
- benchmark history

## Security

- blocked actions
- approvals
- risky actions
- audit events

---

# 34. CREATION FACTORY: SOFTWARE

Pipeline:

```text
Idea
 ↓
Requirements
 ↓
Architecture
 ↓
Task Graph
 ↓
Coding
 ↓
Testing
 ↓
Security
 ↓
Performance
 ↓
Review
 ↓
Build
 ↓
Release
```

---

# 35. CREATION FACTORY: GAME

Pipeline:

```text
Idea
 ↓
Game Design Document
 ↓
Technical Architecture
 ↓
Prototype
 ↓
Code
 ↓
3D Assets
 ↓
Textures
 ↓
Animation
 ↓
Audio
 ↓
Gameplay Tests
 ↓
Performance Tests
 ↓
Playtest
 ↓
Judge
 ↓
Repair
 ↓
Build
```

Future goal:

> A Playtest Agent that can launch the game, observe the screen, interact with keyboard/mouse/controller and identify gameplay defects.

---

# 36. CREATION FACTORY: VIDEO

Pipeline:

```text
Idea
 ↓
Script
 ↓
Storyboard
 ↓
Shot List
 ↓
Visual Generation
 ↓
Character Consistency
 ↓
Voice
 ↓
Music / SFX
 ↓
Editing
 ↓
Quality Judge
 ↓
Render
```

Glacia acts as production director and coordinator rather than attempting to replace every specialist tool.

---

# 37. MODEL / TOOL FAILOVER

Every external dependency should support failure modes.

Example:

```text
Primary model
  ↓ failure
Secondary model
  ↓ failure
Local model
  ↓ failure
Human approval / graceful stop
```

Tool failures:

```text
timeout
retry
alternate tool
checkpoint
replan
```

Never silently swallow errors.

---

# 38. ERROR HANDLING

Replace empty catches such as:

```ts
.catch(() => {})
```

with explicit handling.

Every failure must have:

```text
error type
message
context
task ID
run ID
tool ID
retryable
severity
recovery action
```

Use typed error classes.

---

# 39. TYPESCRIPT QUALITY

Enable:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Eliminate unnecessary `any`.

Use schemas for runtime validation.

Suggested validation direction:

> Zod or equivalent schema library.

---

# 40. TESTING STRATEGY

Minimum layers:

## Unit Tests

- planners
- policy engine
- model router
- memory
- task graph
- tool registry
- state transitions

## Integration Tests

- agent + tools
- agent + database
- workflow + workers
- MCP
- APIs

## Security Tests

- WebSocket auth
- command injection
- path traversal
- SSRF
- privilege escalation
- secret leakage
- unsafe tool access

## Workflow Tests

- retry
- resume
- crash recovery
- checkpoint
- cancellation

## E2E

Full goal-to-artifact flow.

## Evaluation Tests

Benchmark fixed tasks over time.

Never rely only on happy-path tests.

---

# 41. BENCHMARK SYSTEM

Create a reproducible benchmark suite.

Categories:

```text
coding
debugging
research
planning
tool use
game creation
video workflow
error recovery
security
cost efficiency
```

For each task store:

```text
task specification
expected outcome
evaluation rubric
allowed tools
budget
timeout
baseline
```

Track:

```text
success rate
quality
cost
latency
tool failure rate
repair count
safety violations
```

### 41.1 External Reference Benchmarks (added)

Internal benchmark tasks are necessary but not sufficient — they can drift toward measuring "what Glacia is already good at." Anchor the coding-agent capability claims against small subsets modeled on established public benchmarks so progress is comparable to industry reference points, not just self-referential:

```text
Coding / repo-level bug fixing  → SWE-bench-style tasks (real GitHub issue + failing test → patch)
General tool-use / multi-step  → GAIA-style tasks (multi-hop tasks requiring several tools)
```

A capability level in Section 42 should not be claimed as achieved solely on internal benchmark results; a small reference-benchmark subset should also pass.

### 41.2 Cost-Per-Task Gate (added)

Before scaling any multi-agent pipeline (Section 8) to production use, measure and record the **total model-call cost per completed task** end-to-end (planning → research → coding → QA → evaluation). If the cost-per-task for a simple reference task (e.g. "small CLI tool") is not sustainable at the intended usage volume, treat this as a blocking finding — do not proceed to add more agents or creation factories (Sections 34–36) until the cost curve is understood and acceptable.

---

# 42. CAPABILITY LEVELS

Replace the old numeric "Level 1–7" concept with measurable capabilities:

```text
C0 Assistant
C1 Tool User
C2 Task Agent
C3 Workflow Agent
C4 Multi-Agent System
C5 Autonomous Engineer
C6 Autonomous Creator
C7 Self-Evaluating System
C8 Adaptive Creation OS
C9 Agent Ecosystem
C10 Autonomous Organization
```

A capability level is achieved only when benchmark criteria are met.

---

# 43. CURRENT MODULE MIGRATION MAP

Do not blindly delete old modules. Migrate their responsibilities.

| Current module | Target |
|---|---|
| GlaciaCore | Control Plane / dependency injection / orchestrator |
| LevelManager | Capability + benchmark system |
| Orchestrator | Workflow + Agent Orchestrator |
| SkillEngine | Tool / Agent Runtime |
| AIProvider | Model Gateway + Model Router |
| ConsciousnessFramework | Cognitive State |
| VectorMemory | Unified Memory System |
| RAGEngine | Retrieval layer |
| MCPHub | MCP Tool Fabric |
| DatabaseManager | PostgreSQL persistence |
| AutonomousResearcher | Knowledge Acquisition Engine |
| RecursiveImprover | Engineering Self-Improvement |
| CollectiveIntelligence | Multi-Agent / A2A layer |
| RealityEngine | Project World Model + Sandbox concepts |
| TimeManipulator | Workflow timing / scheduling |
| PredictiveEngine | Analytics / forecasting |
| SecurityShield | Policy Engine |
| SmartScheduler | Task Graph / Workflow Engine |
| EmotionEngine | Optional UX personality layer |
| PersonalityEngine | Interaction personality layer |
| GlaciaGuard | Snapshot / Recovery / Backup |
| PluginManager | Signed / permissioned plugin system |
| EcosystemLinker | External integrations |
| EconomicEngine | Cost / Budget Optimizer |

---

# 44. PLUGIN SYSTEM

Do not use unrestricted dynamic `require()` for plugins.

A plugin should declare:

```text
plugin ID
version
capabilities
required permissions
tools
dependencies
entry points
signature / trust information
```

Plugin execution should be isolated where possible.

---

# 45. COST / BUDGET ENGINE

Every project and task may have budgets:

```text
token budget
API budget
GPU budget
time budget
storage budget
```

Prime must consider cost when routing models and tools.

Example:

```text
fast model first
 ↓
judge
 ↓
escalate only when quality is insufficient
```

---

# 46. HUMAN-IN-THE-LOOP

Approval gates are required for high-risk operations.

Example:

```text
LOW
  automatic

MEDIUM
  automatic under project policy

HIGH
  configurable approval

CRITICAL
  explicit approval required
```

Examples of approval gates:

- publish software
- delete major data
- deploy to production
- expose credentials
- high-cost operation
- destructive migration

---

# 47. NON-GOALS

Do not:

- build a foundation model from scratch
- claim literal machine consciousness
- give agents unlimited host privileges
- let a model directly execute arbitrary shell commands on the host
- make every component a microservice immediately
- create dozens of "AI" classes with fake intelligence
- rely on hardcoded fake responses in production mode
- use regex alone as the security architecture
- allow silent failures

---

# 48. IMPLEMENTATION ORDER

## Phase 0 — Critical Stabilization

1. WebSocket authentication
2. CORS restrictions
3. input validation
4. secret/log cleanup
5. remove silent catch blocks
6. graceful shutdown
7. strict TypeScript
8. structured logging

## Phase 1 — Persistence and Runtime Foundation

1. PostgreSQL
2. Redis
3. object storage abstraction
4. durable workflow state
5. worker architecture
6. task graph
7. dependency injection
8. typed domain events

## Phase 2 — Real Agent Runtime

1. Agent definitions
2. Agent loop
3. Tool registry
4. Tool executor
5. model gateway
6. model router
7. permission system
8. policy engine
9. sandbox integration

## Phase 3 — Memory and World Model

1. working memory
2. episodic memory
3. semantic memory
4. project memory
5. project graph
6. retrieval
7. knowledge acquisition

## Phase 4 — Multi-Agent

1. Prime agent
2. Researcher
3. Architect
4. Coder
5. QA
6. Security
7. Reviewer
8. Release
9. A2A-compatible abstraction

## Phase 5 — Evaluation

1. Judge agent
2. evaluation engine
3. benchmark suite
4. regression tracking
5. quality scoring
6. cost/latency scoring

## Phase 6 — Creation Factories

1. software factory
2. game factory
3. video factory
4. artifact graph
5. playtest automation

## Phase 7 — Self-Improvement

1. bottleneck detection
2. hypothesis generation
3. patch branches
4. benchmark comparison
5. safe merge / approval
6. continuous optimization

---

# 49. CODING INSTRUCTIONS FOR DEEPSEEK

When implementing this project:

## Rule 1 — Do not rewrite the entire repository blindly

Inspect the existing project first.

Preserve useful existing functionality.

Create a migration plan.

## Rule 2 — Work in phases

Implement one coherent phase at a time.

After each phase:

- run tests
- run type checks
- run lint
- document changes
- verify security
- verify backward compatibility where applicable

## Rule 3 — Do not fake functionality

Do not create placeholder modules that merely return:

```text
"AI successfully completed..."
```

unless explicitly marked as test fixtures.

Production paths must use actual execution.

## Rule 4 — Prefer interfaces

Major external components must be replaceable:

```text
ModelProvider
ToolProvider
MemoryProvider
SandboxProvider
WorkflowStore
ArtifactStore
EvaluationProvider
```

## Rule 5 — Keep providers replaceable

Do not hard-code one AI vendor into the business logic.

## Rule 6 — Fail visibly

No empty catches.

All errors must be logged, classified and recoverable where possible.

## Rule 7 — Security before autonomy

Do not enable unrestricted autonomous tool execution until the policy and sandbox layers are functional.

## Rule 8 — Observable by default

Every important operation should have:

- run ID
- task ID
- agent ID
- timing
- outcome
- error
- cost where available

## Rule 9 — Test every new subsystem

No major subsystem is complete without tests.

## Rule 10 — Prefer simple architecture over premature complexity

Start with:

```text
modular monolith
+
workers
+
durable workflow
+
sandbox
```

Extract services only when there is a measured reason.

## Rule 11 — Verifiable evidence over self-reported completion (added)

Never accept "tests pass" or "phase complete" as a bare narrative claim. Every phase-completion report must include:

```text
the actual diff / list of changed files
the actual test run output (not a paraphrase of it)
the actual type-check output
before/after benchmark numbers where applicable
```

If a report claims completion without these artifacts attached, treat the phase as **not verified** and re-request the evidence before proceeding to the next phase. This rule exists specifically because Rule 3 (do not fake functionality) is easy to violate silently — a coding agent under pressure to show progress can produce placeholder passes; requiring raw evidence, not summaries, is the check against that.

---

# 48A. SOLO-FOUNDER EXECUTION PRIORITY (added)

This specification describes the full target architecture. For a single founder implementing it (rather than a funded team), the phases in Section 48 should be pursued in this order of actual investment, not all in parallel:

```text
1. Security Phase 0 — fixed incrementally, one vulnerability group at a time,
   with a real human diff review after each group (not a batch trust-and-move-on)

2. Software Creation Factory ONLY (Section 34) — reach a working, benchmarked
   coding agent (sandbox + single model + evaluation loop) before touching
   game (35) or video (36) factories at all

3. Model Router + MCP tool ecosystem (Sections 9, 15) — once the single-model
   coding agent is reliable, generalize it across models and tools

4. Multi-agent + Judge loop (Sections 7, 8, 24, 25) — only once cost-per-task
   (Section 41.2) is known and acceptable

5. Game Factory, Video Factory, and Self-Improvement (Sections 26, 35, 36) —
   last, and only after the software path has cleared its own benchmark bar
```

Rationale: the software creation factory is the hardest and most valuable capability to get right, and every other factory (game, video) reuses the same orchestration, sandbox, policy, and evaluation infrastructure. Building three factories in parallel before any one of them is proven multiplies risk without multiplying learning.

---

# 50. DEFINITION OF DONE

A subsystem is complete only when:

```text
Implementation
+
Types
+
Validation
+
Tests
+
Error Handling
+
Logging
+
Security
+
Documentation
```

For agent functionality, additionally:

```text
Tool access
+
Permission model
+
Evaluation
+
Recovery
+
Cost tracking
```

---

# 51. FIRST DEVELOPMENT MILESTONE

The first practical milestone is NOT "build AGI."

It is:

> **Glacia can receive a real software task and autonomously complete it inside a controlled sandbox.**

Example:

```text
USER:
Create a small TypeScript CLI application that manages a todo list.

GLACIA:
1. interprets requirements
2. plans architecture
3. creates task graph
4. assigns coding agent
5. creates sandbox
6. writes code
7. runs tests
8. detects failures
9. repairs code
10. evaluates result
11. produces final artifact
12. reports exact result and score
```

Once this works reliably, expand the same architecture to game and video creation.

---

# 52. FINAL ARCHITECTURAL PRINCIPLE

The goal is not:

```text
"one giant AI that does everything"
```

The goal is:

```text
                     GLACIA
                       |
          intelligent orchestration layer
                       |
      +----------------+----------------+
      |                |                |
    Models           Agents            Tools
      |                |                |
      +----------------+----------------+
                       |
                 Secure Runtime
                       |
       +---------------+---------------+
       |               |               |
    Software          Game           Video
```

Glacia's competitive advantage should be:

> **orchestration + execution + memory + world model + evaluation + safety + interoperability**

rather than attempting to reproduce every capability internally.

---

# 53. DEEPSEEK IMPLEMENTATION COMMAND

Use the following as the initial instruction when starting implementation:

> Read this entire specification first.
>
> Then inspect the current Glacia repository and compare the existing code against this target architecture.
>
> Do not immediately rewrite everything.
>
> First produce:
>
> 1. Current architecture map
> 2. File-by-file migration map
> 3. Dependency risks
> 4. Security risks
> 5. Proposed implementation phases
> 6. Files to create
> 7. Files to modify
> 8. Files to deprecate
> 9. Database migration plan
> 10. Test plan
>
> Then implement **Phase 0 only**.
>
> After Phase 0 passes all tests and type checks, proceed to Phase 1.
>
> Never mark functionality as complete without tests.
>
> Never replace real functionality with fake responses.
>
> Never bypass the policy engine or sandbox for convenience.
>
> Preserve a clean, modular, provider-independent architecture.
>
> The final product must be capable of becoming a real autonomous software/game/video creation platform.

---

# 54. SUCCESS CRITERIA

Long-term Glacia success is measured by:

```text
Task Completion Rate
Quality Score
Reliability
Safety
Recovery Rate
Tool Success Rate
Agent Coordination Quality
Cost Efficiency
Latency
User Intervention Rate
```

The system should improve these metrics over time.

---

## END OF SPECIFICATION

Version: 2.0
Document role: Primary architecture / coding blueprint
Target implementation style: production-oriented, modular, observable, secure, agentic
