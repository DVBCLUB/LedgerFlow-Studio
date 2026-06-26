export type AIWorkforceCapability = {
  id: string;
  title: string;
  status: 'live' | 'guarded' | 'ready' | 'planned';
  owner: string;
  summary: string;
  inputs: string[];
  outputs: string[];
  backgroundMode: boolean;
};

export type AIWorkforceLane = {
  id: string;
  title: string;
  mission: string;
  signal: string;
  guardrail: string;
  capabilities: string[];
};

export type AIWorkforceRunbookStep = {
  step: string;
  owner: string;
  action: string;
  evidence: string;
};

export type AIWorkforceGapRow = {
  id: string;
  target: string;
  current: string;
  score: number;
  status: 'achieved' | 'partial' | 'gap';
  missing: string[];
  upgrade: string;
};

export type AIWorkforceBacklogItem = {
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  mode: 'background' | 'human_review' | 'lab_only';
  acceptance: string[];
};

export const AI_WORKFORCE_CAPABILITIES: AIWorkforceCapability[] = [
  {
    id: 'agent-orchestration',
    title: 'Agent Orchestration Core',
    status: 'live',
    owner: 'AgentOps',
    summary: 'Điều phối nhiều agent theo mission, role, SLA, input/output và quyền công cụ.',
    inputs: ['Mission brief', 'Tool permissions', 'Knowledge context', 'Founder constraints'],
    outputs: ['Work order', 'Agent assignment', 'Execution trace', 'Founder review queue'],
    backgroundMode: true,
  },
  {
    id: 'memory-rag-kg',
    title: 'Memory + RAG + Knowledge Graph',
    status: 'ready',
    owner: 'KnowledgeOps',
    summary: 'Gom trí nhớ dự án, SOP, tài liệu và quyết định thành lớp tri thức truy xuất có kiểm soát.',
    inputs: ['Documents', 'Decision log', 'SOP library', 'Product/accounting context'],
    outputs: ['Grounded context pack', 'Source map', 'Contradiction alert', 'Reusable brief'],
    backgroundMode: true,
  },
  {
    id: 'tool-mcp-registry',
    title: 'Tool & MCP Registry',
    status: 'guarded',
    owner: 'PlatformOps',
    summary: 'Đăng ký tool nội bộ, MCP connector, browser automation, file ops và robot/IoT dưới một policy chung.',
    inputs: ['Tool manifest', 'MCP endpoint', 'Risk level', 'Credential scope'],
    outputs: ['Tool card', 'Permission policy', 'Audit event', 'Rollback instruction'],
    backgroundMode: true,
  },
  {
    id: 'software-factory',
    title: 'Self-Healing Software Factory',
    status: 'ready',
    owner: 'DevOps Agent',
    summary: 'Agent tự đọc issue, sửa code, chạy check, tạo patch, review diff và chuẩn bị PR an toàn.',
    inputs: ['Bug report', 'Repo context', 'CI logs', 'Acceptance criteria'],
    outputs: ['Patch plan', 'Code diff', 'Test result', 'PR handoff'],
    backgroundMode: true,
  },
  {
    id: 'computer-browser-robotics',
    title: 'Computer, Browser & Robot Lab',
    status: 'planned',
    owner: 'Automation Lab',
    summary: 'Một khu thử nghiệm cho browser/computer use, thao tác màn hình và tích hợp robot/IoT có checkpoint.',
    inputs: ['Scenario', 'Allowed surface', 'Safety rule', 'Human checkpoint'],
    outputs: ['Recorded run', 'Failure reason', 'Action replay', 'Safety exception'],
    backgroundMode: false,
  },
];

export const AI_WORKFORCE_LANES: AIWorkforceLane[] = [
  {
    id: 'mission-control',
    title: 'Mission Control',
    mission: 'Nhận yêu cầu từ founder, chuẩn hóa thành mission brief và chia nhỏ thành work order.',
    signal: 'Có yêu cầu mới, lỗi sản phẩm, cơ hội growth hoặc tác vụ kế toán cần xử lý.',
    guardrail: 'Không chạy tool rủi ro cao nếu thiếu quyền, thiếu evidence hoặc thiếu checkpoint.',
    capabilities: ['agent-orchestration', 'software-factory'],
  },
  {
    id: 'knowledge-spine',
    title: 'Knowledge Spine',
    mission: 'Cung cấp ngữ cảnh đúng, nguồn rõ, phát hiện mâu thuẫn và lưu quyết định dài hạn.',
    signal: 'Agent cần tài liệu, SOP, lịch sử quyết định hoặc dữ liệu nghiệp vụ trước khi hành động.',
    guardrail: 'Không dùng tri thức không có nguồn cho output quan trọng như tài chính, pháp lý, thuế hoặc bảo mật.',
    capabilities: ['memory-rag-kg'],
  },
  {
    id: 'execution-layer',
    title: 'Execution Layer',
    mission: 'Kết nối tool, MCP, browser automation, code runner và robot/IoT theo policy thống nhất.',
    signal: 'Mission cần thao tác file, repo, trình duyệt, dữ liệu hoặc thiết bị ngoài.',
    guardrail: 'Mọi hành động ghi/xóa/gửi/merge đều phải có audit event và khả năng rollback hoặc human review.',
    capabilities: ['tool-mcp-registry', 'computer-browser-robotics'],
  },
];

export const AI_WORKFORCE_RUNBOOK: AIWorkforceRunbookStep[] = [
  {
    step: '1. Intake',
    owner: 'CEO Agent',
    action: 'Tóm tắt yêu cầu thành mission brief gồm mục tiêu, phạm vi, deadline, rủi ro và output mong muốn.',
    evidence: 'Mission brief có tiêu chí hoàn thành và nguồn dữ liệu cần dùng.',
  },
  {
    step: '2. Plan',
    owner: 'Planner Agent',
    action: 'Chọn lane, agent, tool, checkpoint và fallback trước khi chạy tự động.',
    evidence: 'Work order có owner, tool scope, risk class và expected output.',
  },
  {
    step: '3. Execute',
    owner: 'Worker Agents',
    action: 'Chạy tác vụ nền, cập nhật trạng thái, ghi trace và dừng khi gặp rủi ro vượt ngưỡng.',
    evidence: 'Execution trace, artifact, log lỗi và output trung gian.',
  },
  {
    step: '4. Review',
    owner: 'QA/Safety Agent',
    action: 'Soát chất lượng, kiểm chứng nguồn, phát hiện hallucination, kiểm tra quyền và rollback path.',
    evidence: 'QA verdict, safety note, confidence score và danh sách vấn đề còn lại.',
  },
  {
    step: '5. Ship/Learn',
    owner: 'Founder + Memory Agent',
    action: 'Đẩy kết quả qua PR, report hoặc automation; lưu quyết định và bài học vào memory.',
    evidence: 'PR/report/link artifact, decision log và next action.',
  },
];

export const AI_WORKFORCE_GAP_MATRIX: AIWorkforceGapRow[] = [
  {
    id: 'orchestration',
    target: 'Multi-agent orchestration',
    current: 'Đã có pipeline templates, step approval và resume flow.',
    score: 4,
    status: 'achieved',
    missing: ['Mission planner tự chọn pipeline/tool theo intent', 'Dependency graph và SLA tracking'],
    upgrade: 'Thêm mission planner để biến yêu cầu founder thành work order có pipeline, tool, risk và artifact.',
  },
  {
    id: 'memory_rag_kg',
    target: 'Memory + RAG + Knowledge Graph',
    current: 'Có company memory injection và read_knowledge tool.',
    score: 3,
    status: 'partial',
    missing: ['Source map bắt buộc', 'Contradiction detector', 'Knowledge graph entity/relationship'],
    upgrade: 'Nâng memory thành grounded context pack có source id, confidence và contradiction flag.',
  },
  {
    id: 'mcp_tool_registry',
    target: 'MCP/tool registry',
    current: 'Có tool contracts, permission, risk, timeout, attempts và approval policy.',
    score: 4,
    status: 'achieved',
    missing: ['MCP manifest import/export', 'Credential scope per connector', 'Tool health telemetry'],
    upgrade: 'Bổ sung MCP-compatible manifest schema và health score cho từng connector/tool.',
  },
  {
    id: 'computer_browser_robotics',
    target: 'Computer/browser/robot automation',
    current: 'Có browser_check, robot_inspect và robot_move có approval.',
    score: 3,
    status: 'partial',
    missing: ['Screenshot/action replay evidence', 'UI surface allowlist', 'Emergency stop contract'],
    upgrade: 'Giữ lab-only và thêm replay evidence, allowlist, emergency stop trước khi chạy thực tế.',
  },
  {
    id: 'software_factory',
    target: 'Self-healing software factory',
    current: 'Có software product pipeline, draft_patch, QA và DevOps handoff.',
    score: 4,
    status: 'achieved',
    missing: ['Diff risk classifier', 'CI log summarizer', 'PR readiness score'],
    upgrade: 'Thêm PR readiness scoring trước khi handoff/merge.',
  },
  {
    id: 'workflow_engine',
    target: 'Durable workflow engine',
    current: 'Có durable queue: dedupe, lease, retry, dead-letter, retry-dead-letter, prune.',
    score: 4,
    status: 'achieved',
    missing: ['Visual graph cho nested missions', 'Mission SLA escalation'],
    upgrade: 'Đưa queue health và SLA vào AI Factory dashboard.',
  },
  {
    id: 'safety_governance',
    target: 'Safety/governance',
    current: 'High-risk tools yêu cầu approval, fingerprint binding và token một lần.',
    score: 4,
    status: 'achieved',
    missing: ['Persistent audit trail', 'Risk policy theo role/environment'],
    upgrade: 'Persist safety event và hiển thị approval history trong tab Quality.',
  },
  {
    id: 'benchmark_observability',
    target: 'Benchmark/observability',
    current: 'Đã có dashboard tĩnh; bản nâng cấp này thêm readiness service động.',
    score: 2,
    status: 'gap',
    missing: ['Latency/cost per tool', 'Quality score per output', 'Regression benchmark suite'],
    upgrade: 'Ghi run metrics và benchmark các task chuẩn theo từng agent lane.',
  },
];

export const AI_WORKFORCE_UPGRADE_BACKLOG: AIWorkforceBacklogItem[] = [
  {
    priority: 'P0',
    title: 'Grounded context pack cho Memory/RAG/Knowledge Graph',
    mode: 'background',
    acceptance: ['Source id cho từng memory item', 'Contradiction flag', 'Confidence score hiển thị trong AI Factory'],
  },
  {
    priority: 'P1',
    title: 'Computer/browser/robot safety envelope',
    mode: 'lab_only',
    acceptance: ['Allowlist UI surface', 'Action replay evidence', 'Emergency stop contract'],
  },
  {
    priority: 'P1',
    title: 'Benchmark + observability suite',
    mode: 'background',
    acceptance: ['Latency/cost metrics', 'Quality score', 'Baseline regression tasks'],
  },
  {
    priority: 'P2',
    title: 'MCP manifest + connector health telemetry',
    mode: 'human_review',
    acceptance: ['Manifest schema', 'Credential scope', 'Tool health score'],
  },
];

export const AI_WORKFORCE_METRICS = [
  { label: 'Readiness grade', value: 'B-', detail: 'Đã có nền agent runtime, queue và safety; còn thiếu RAG source map và benchmark động.' },
  { label: 'Background-ready capabilities', value: '4/5', detail: 'Agent, memory, MCP/tool và software factory có thể chạy nền có kiểm soát.' },
  { label: 'Human checkpoint coverage', value: '100%', detail: 'Tác vụ ghi/xóa/gửi/merge/thiết bị ngoài luôn cần review hoặc audit.' },
  { label: 'Gap rows tracked', value: `${AI_WORKFORCE_GAP_MATRIX.length}`, detail: 'Ma trận mới theo dõi achieved/partial/gap để ưu tiên nâng cấp.' },
];
