import { Github, Plug2, Terminal, Workflow } from 'lucide-react';
import SimplePanelCard from '../../components/shared/SimplePanelCard';
import CloudConnectorsPanel from '../../components/operations/CloudConnectorsPanel';

export default function IntegrationHub() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
      <SimplePanelCard
        eyebrow="Tích hợp"
        title="Kết nối đang dùng"
        description="Tập trung vào các kết nối thật sự cần cho một người dùng: GitHub (native connector) / Replit để sửa code, local tools để chạy app, AI key để hỗ trợ."
        icon={Plug2}
        status="Tối giản"
        tone="cyan"
        items={[
          'GitHub (native connector): lưu code, review diff, CI, PR control',
          'Replit/local: chạy preview và xem terminal',
          'AI Provider: cấu hình trong AI Gateway khi cần',
          'Không dàn toàn bộ connector thí nghiệm ra màn hình chính',
        ]}
        actions={["GitHub", "Local", "AI"]}
      />
      <SimplePanelCard
        eyebrow="Handoff"
        title="Quy trình review gọn"
        description="Khi cần sửa module: tạo việc nhỏ, chạy preview, gửi ảnh lỗi hoặc terminal, rồi merge khi ổn."
        icon={Workflow}
        status="Review"
        tone="emerald"
        items={[
          'Một module/lần để tránh rối',
          'Không để agent tự refactor lan rộng',
          'Chụp màn hình trước/sau khi đổi UI',
          'Giữ GitHub làm nguồn code sạch',
        ]}
        actions={["Issue", "Preview", "Merge"]}
      />
      <SimplePanelCard
        eyebrow="Dev tools"
        title="Mở công cụ khi cần"
        description="Các công cụ như GitHub, terminal, Replit logs chỉ nên mở lúc có lỗi. Bình thường module cài đặt chỉ cần trạng thái tổng quan."
        icon={Terminal}
        status="Theo nhu cầu"
        tone="slate"
        items={[
          'Terminal/log không hiển thị dài trên UI',
          'Sửa lỗi runtime trong Replit hoặc VSCode',
          'Dùng GitHub để kiểm tra commit gần nhất',
          'Ẩn connector thử nghiệm khỏi luồng chính',
        ]}
        actions={["Logs", "Terminal", "Diff"]}
      />
      <SimplePanelCard
        eyebrow="Giao thức chuẩn"
        title="Model Context Protocol (MCP) Gateway"
        description="Quản lý giao tiếp JSON-RPC 2.0 chuẩn MCP qua SSE và Stdio. Kết nối trực tiếp với Cursor, Claude Desktop và các MCP Server ngoài."
        icon={Plug2}
        status="Hoạt động"
        tone="amber"
        items={[
          'Server Endpoint: GET /api/mcp/sse (JSON-RPC 2.0)',
          'External MCP Clients: Cursor, Claude Desktop, Windsurf',
          'External MCP Servers: GitHub MCP, Postgres MCP, Brave Search',
          'Bảo mật: Phân quyền theo Tool Manifest SHA-256 Fingerprint',
        ]}
        actions={["MCP SSE", "Manifest Catalog", "Test Tool"]}
      />
      </div>
      <CloudConnectorsPanel />
    </div>
  );
}
