export type AgentOpsV2Priority = 'P0' | 'P1' | 'P2';
export type AgentOpsV2Status = 'planned' | 'ready' | 'blocked';

export interface AgentOpsV2BacklogItem {
  id: string;
  title: string;
  priority: AgentOpsV2Priority;
  status: AgentOpsV2Status;
  targetArea: string;
  whyItMatters: string;
  implementationHint: string;
  acceptance: string[];
}

export const AGENTOPS_V2_BACKLOG: AgentOpsV2BacklogItem[] = [
  {
    id: 'openclaw-workboard-flow',
    title: 'AI Ops Workboard flow',
    priority: 'P0',
    status: 'ready',
    targetArea: 'agent-ops/workboard',
    whyItMatters: 'Founder cần nhìn được việc AI đang ở Inbox, Planning, Waiting Approval, Ready hay Done.',
    implementationHint: 'Tận dụng WorkboardTab hiện có, chưa tạo route mới.',
    acceptance: [
      'Có cột trạng thái rõ ràng.',
      'Mỗi card có owner agent và next action.',
      'Không dùng API ngoài để giữ offline-first.'
    ]
  },
  {
    id: 'tool-card-inspection',
    title: 'Tool Cards inspect-before-execute',
    priority: 'P0',
    status: 'planned',
    targetArea: 'agent-ops/tools',
    whyItMatters: 'Mỗi AI action cần được xem trước trước khi thực thi để giảm rủi ro thao tác nhầm.',
    implementationHint: 'Dùng ToolCardsTab và Approval Gate key hiện có.',
    acceptance: [
      'Card hiển thị intent, input, output kỳ vọng.',
      'Có trạng thái chờ duyệt.',
      'Không tự động execute khi chưa có founder approval.'
    ]
  },
  {
    id: 'knowledge-first-ai-response',
    title: 'Knowledge Library-first AI response',
    priority: 'P1',
    status: 'planned',
    targetArea: 'agent-ops/knowledge',
    whyItMatters: 'AI response phải ưu tiên context nội bộ thay vì trả lời lan man.',
    implementationHint: 'Tách prompt và context retrieval thành service sau; trước mắt seed checklist trong Knowledge tab.',
    acceptance: [
      'Có checklist nguồn tri thức.',
      'Có nhãn mock/offline khi chưa nối RAG thật.',
      'Không gọi trực tiếp AI provider từ frontend.'
    ]
  },
  {
    id: 'github-pr-human-gate',
    title: 'GitHub PR flow with human gate',
    priority: 'P0',
    status: 'ready',
    targetArea: 'agent-ops/githubPr',
    whyItMatters: 'AI không nên push thẳng main; nên qua branch, draft PR và founder approval.',
    implementationHint: 'Giữ GitHubPRControlTab và các founder phrase đã có trong check script.',
    acceptance: [
      'Có phrase approval rõ ràng.',
      'Có trạng thái CI.',
      'Có đường rollback hoặc đóng PR.'
    ]
  }
];
