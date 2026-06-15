export type V2CheckScope =
  | 'typescript'
  | 'agentops'
  | 'simulation-registry'
  | 'accounting'
  | 'founder-labs'
  | 'build'
  | 'offline';

export interface V2CommitCheckItem {
  id: string;
  scope: V2CheckScope;
  command: string;
  runWhen: string;
  purpose: string;
}

export const V2_COMMIT_CHECKLIST: V2CommitCheckItem[] = [
  {
    id: 'lint',
    scope: 'typescript',
    command: 'npm run lint',
    runWhen: 'Sau mọi thay đổi TypeScript hoặc React component.',
    purpose: 'Bắt lỗi TypeScript, import thiếu, type sai và component không compile.'
  },
  {
    id: 'agentops-contracts',
    scope: 'agentops',
    command: 'npm run check:agentops-contracts',
    runWhen: 'Khi sửa hoặc thêm tab trong AgentOps.',
    purpose: 'Đảm bảo Approval Gate key, GitHub PR phrase và contract quan trọng không bị phá.'
  },
  {
    id: 'simulations',
    scope: 'simulation-registry',
    command: 'npm run check:simulations',
    runWhen: 'Khi thêm module route hoặc sửa simulationRegistry.ts.',
    purpose: 'Đảm bảo registry module vẫn hợp lệ và không mất module cũ.'
  },
  {
    id: 'accounting-calculations',
    scope: 'accounting',
    command: 'npm run check:accounting-calculations',
    runWhen: 'Khi sửa logic kế toán, VAT, giá vốn, tạm ứng hoặc báo cáo tiền.',
    purpose: 'Giữ các mô phỏng kế toán không sai số hoặc sai quy ước.'
  },
  {
    id: 'founder-labs',
    scope: 'founder-labs',
    command: 'npm run check:founder-labs',
    runWhen: 'Khi thêm hoặc sửa lab trong FounderLabsDock.',
    purpose: 'Đảm bảo danh sách lab và script kiểm tra vẫn đồng bộ.'
  },
  {
    id: 'build',
    scope: 'build',
    command: 'npm run build',
    runWhen: 'Trước khi merge hoặc deploy.',
    purpose: 'Xác nhận bundle Vite/build production chạy được.'
  },
  {
    id: 'offline',
    scope: 'offline',
    command: 'npm run check:offline',
    runWhen: 'Khi thêm API call, storage, PWA hoặc dependency mới.',
    purpose: 'Đảm bảo offline-first không bị phá.'
  }
];

export const V2_LOW_QUOTA_SEQUENCE = [
  'Sửa data file trước.',
  'Tạo panel component nhỏ.',
  'Nối panel vào module hiện có.',
  'Chạy lint trước.',
  'Chỉ chạy check chuyên biệt nếu đụng đúng vùng liên quan.',
  'Commit nhỏ theo từng module để dễ rollback.'
];
