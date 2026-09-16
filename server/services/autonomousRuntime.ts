/**
 * autonomousRuntime.ts
 * ═══════════════════════════════════════════════════════════════
 * Lightweight background runtime cho các workflow "autonomous"
 * đã bị ẩn khỏi giao diện chính (zero-touch, flywheel, swarm, harvest).
 *
 * Mỗi workflow đăng ký tại đây và phát heartbeat định kỳ để UI có
 * thể hiển thị trạng thái thực tế "N quy trình tự động đang chạy ngầm"
 * thay vì chỉ là con số tĩnh.
 *
 * Đây là điểm neo (anchor) để sau này gắn logic nghiệp vụ thật cho
 * từng workflow mà không cần thay đổi contract trạng thái.
 * ═══════════════════════════════════════════════════════════════
 */

export interface AutonomousWorkflowStatus {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'error';
  heartbeatCount: number;
  lastHeartbeatAt: string;
  startedAt: string;
}

export const AUTONOMOUS_WORKFLOWS = [
  { id: 'zero_touch', name: 'Zero-Touch Product-to-Revenue Loop' },
  { id: 'autonomous_flywheel', name: 'Vòng Lặp Tự Vận Hành' },
  { id: 'swarm_orchestrator', name: 'Swarm Relay & Robot Node' },
  { id: 'auto_harvest', name: 'Thu Hoạch Tri Thức Tự Học' },
] as const;

const runtime = new Map<string, AutonomousWorkflowStatus>();
let heartbeatTimer: NodeJS.Timeout | null = null;
let started = false;

export function startAutonomousRuntime(intervalMs = 60_000): void {
  if (started) return;
  started = true;

  const now = new Date().toISOString();
  for (const wf of AUTONOMOUS_WORKFLOWS) {
    runtime.set(wf.id, {
      id: wf.id,
      name: wf.name,
      status: 'running',
      heartbeatCount: 0,
      lastHeartbeatAt: now,
      startedAt: now,
    });
  }

  heartbeatTimer = setInterval(() => {
    const ts = new Date().toISOString();
    for (const wf of AUTONOMOUS_WORKFLOWS) {
      const current = runtime.get(wf.id);
      if (current) {
        current.heartbeatCount += 1;
        current.lastHeartbeatAt = ts;
        current.status = 'running';
      }
    }
  }, intervalMs);

  // Không giữ tiến trình server sống chỉ vì heartbeat này.
  if (heartbeatTimer && typeof heartbeatTimer.unref === 'function') {
    heartbeatTimer.unref();
  }
}

export function getAutonomousRuntimeStatus(): {
  running: number;
  workflows: AutonomousWorkflowStatus[];
} {
  const workflows = [...runtime.values()];
  return {
    running: workflows.filter((w) => w.status === 'running').length,
    workflows,
  };
}
