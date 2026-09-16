# Glacia — Embodied AI Companion & Digital Human Architecture

## 1. Giới thiệu Tổng quan (Overview)

**Glacia** là Thực thể Số (Digital Human), Trợ lý Ảo Hình thể 3D (Embodied AI Agent), Trợ lý Hội thoại (Conversational Avatar), và Thực thể Ảo Độc lập (Virtual Being) đóng vai trò làm **Linh vật Trực giác & Trợ lý Điều hành Tối cao (Executive AI Assistant)** cho Hệ điều hành Doanh nghiệp LedgerFlow Studio.

Glacia được tạo hình theo nguyên mẫu: **Mèo Tiên Tinh Thể Rồng Băng (White Frost Dragon-Fairy Crystal Cat)**, đội vương miện ngọc bích sapphire, mắt ngọc bích phát sáng, sừng rồng pha lê, mặt dây chuyền sapphire, 4 cánh tiên aurora và 5 vệ tinh AI Staff bay quanh.

---

## 2. Bốn Trụ Cột Năng Lực Cốt Lõi (4 Core Archetypes)

```
                       ┌──────────────────────────────────────────────┐
                       │          GLACIA EMBODIED AI ENGINE           │
                       └──────────────────────┬───────────────────────┘
                                              │
         ┌───────────────────┬────────────────┴──────────────────┬───────────────────┐
         ▼                   ▼                                   ▼                   ▼
┌─────────────────┐ ┌──────────────────┐               ┌───────────────────┐ ┌──────────────────┐
│  DIGITAL HUMAN  │ │ INTERACTIVE AVATAR│              │ EMBODIED AI AGENT │ │  VIRTUAL BEING   │
├─────────────────┤ ├──────────────────┤               ├───────────────────┤ ├──────────────────┤
│• Nhận diện cảm  │ │• 3D WebGL Mesh   │               │• Điều hướng 11    │ │• Chu kỳ sinh học │
│  xúc 9 trạng    │ │  (Three.js rig)  │               │  Workspaces       │ │  24h (Circadian) │
│  thái           │ │• 3D LookAt chuột │               │• Phân rã mục tiêu │ │• Nhịp tim, năng  │
│• Giọng nói TTS  │ │• Chớp mắt tự chủ │               │  cho 5 AI Staff   │ │  lượng, Coherence│
│  & STT tiếng    │ │• 3D Lip-sync     │               │• Bàn Tròn Chiến   │ │• Kho ký ức dài   │
│  Việt thời gian │ │• Vẫy 4 cánh & đuôi│              │  Lược (Roundtable)│ │  hạn (Vault)     │
│  thực           │ │• Xoa đầu 3D chạm │               │• Gợi ý Copilot    │ │• Cây tiến hóa    │
│• Hội thoại sâu  │ │• Vũ điệu xoay 360│               │  ngữ cảnh 1-click │ │  kỹ năng (Skills)│
└─────────────────┘ └──────────────────┘               └───────────────────┘ └──────────────────┘
```

---

## 3. Kiến Trúc Mã Nguồn (Source Map)

| Thành Phần | Tệp Tin Mã Nguồn | Vai Trò & Chức Năng |
|---|---|---|
| **Context & State Hub** | `src/components/glacia/GlaciaContext.tsx` | Quản lý toàn bộ State, cảm xúc, hội thoại, kết nối AI Gateway và điều phối |
| **Living Companion** | `src/components/glacia/GlaciaCompanion.tsx` | Widget nổi kéo thả 60fps, bánh xe lệnh tròn 8 hướng, phím tắt toàn cục và gợi ý Copilot |
| **3D WebGL Avatar** | `src/components/glacia/GlaciaReal3DAvatar.tsx` | Khung xương Three.js thực thụ, LookAt con trỏ chuột, chớp mắt, khẩu hình môi, 5 vệ tinh quỹ đạo |
| **Command Cockpit** | `src/components/glacia/GlaciaCommandCockpit.tsx` | Khoang chỉ huy 9 tab: Dispatch, Chat, Bàn tròn, Kỹ năng, Digital Human, Gắn kết, Ký ức, Cài đặt, Kịch bản |
| **Live Voice Call HUD** | `src/components/glacia/GlaciaLiveVoiceCallHUD.tsx` | Đàm thoại trực tiếp toàn màn hình với phổ sóng âm 16-band và 4 Skin Pha Lê |
| **Module Bridge** | `src/components/glacia/glaciaModuleBridge.ts` | Cầu nối giác quan nắm bắt Telemetry 11 phân hệ và điều hướng màn hình từ xa |
| **Voice & Audio** | `src/components/glacia/glaciaVoiceEngine.ts`<br>`src/components/glacia/glaciaAudioSynth.ts`<br>`src/components/glacia/glaciaSpeech.ts` | Tổng hợp âm thanh lượng tử Web Audio API thuần & động cơ STT/TTS tiếng Việt |
| **Skill Tree Matrix** | `src/components/glacia/GlaciaNeuralSkillTree.tsx` | Cây kỹ năng tiến hóa 5 tầng năng lực doanh nghiệp theo điểm gắn kết (Trust XP) + 7 built-in skills ($0 Token runtime) với category filter tabs |
| **Executive Briefing** | `src/components/glacia/GlaciaExecutiveBriefingModal.tsx` | Báo cáo điều hành tổng kết ngày giọng nói sáng/tối từ 5 AI Staff |
| **Fast AI Command Bar** | `src/components/shared/FastAICommandBar.tsx` | Thanh điều khiển nhanh <kbd>Shift</kbd> + <kbd>Space</kbd> kết nối trực tiếp với Glacia |

---

## 4. Bảng Phím Tắt Toàn Cục (Global Shortcuts)

* <kbd>Alt</kbd> + <kbd>G</kbd>: Mở / Đóng Khoang Chỉ Huy Lượng Tử (Glacia Command Cockpit).
* <kbd>Alt</kbd> + <kbd>V</kbd>: Mở Đàm thoại Giọng nói Trực tiếp Toàn màn hình (Live Voice Call HUD).
* <kbd>Alt</kbd> + <kbd>B</kbd>: Kích hoạt Báo cáo Điều hành Lượng tử (Executive Daily Briefing).
* <kbd>Shift</kbd> + <kbd>Space</kbd>: Mở Thanh Lệnh Nhanh Glacia Fast AI Dispatch.
* <kbd>Esc</kbd>: Đóng nhanh Bánh xe lệnh tròn hoặc các bảng phụ.

---

## 5. Tối Ưu Hóa & An Toàn Hiệu Năng (Performance Hardening)

1. **Page Visibility API:** Khi ẩn tab trình duyệt (`document.hidden`), Glacia tự động ngắt vòng lặp requestAnimationFrame của Three.js, giảm mức tiêu thụ CPU và GPU về 0%.
2. **PixelRatio Clamping:** Khống chế `window.devicePixelRatio <= 1.5` để ngăn ngừa quá tải GPU trên màn hình 4K / Retina.
3. **WebGL Context Lost Recovery:** Lắng nghe sự kiện `webglcontextlost` và tự động tái khởi tạo hoặc chuyển sang chế độ 2D an toàn khi thiết bị quá tải.
4. **RAF-throttled Dragging:** Kéo thả widget đồng bộ theo nhịp quét màn hình loại bỏ hiện tượng giật lag khung hình.

---

## 6. Quantum Sparkle & Greeting Animation

### Quantum Sparkle (Hiệu ứng Lấp Lánh Lượng Tử)
- **File:** `src/components/glacia/GlaciaReal3DAvatar.tsx`
- 60 hạt vertex-colored (30 trong compact mode) với `AdditiveBlending`
- Tự động tắt khi idle để tiết kiệm GPU
- Kích hoạt khi mood = `happy`, `curious`, `speaking`
- Quỹ đạo bay nổi + twinkle animation
- `quantumSparkleRef` quản lý vòng đời, cleanup khi unmount

### Greeting Animation (Hoạt ảnh Chào Hỏi)
- Chạy 1 lần khi mount (tracked bởi `greetingDoneRef`)
- Kéo dài 3 giây: wave tay + head tilt + sparkle burst
- Chỉ phát trên lần render đầu tiên

---

## 7. Glacia Computer Vision Engine (Doubao Vision)

- **File:** `server/services/glaciaVisionEngine.ts`
- **Frontend:** `src/components/glacia/GlaciaVisionPanel.tsx`
- **API Client:** `src/utils/glaciaVisionApi.ts`
- **API Routes:** `POST /api/glacia/vision/analyze`, `GET /api/glacia/vision/history`
- Tích hợp Doubao Vision API qua AI Gateway
- Hỗ trợ upload ảnh (JPEG, PNG, WebP, GIF) và paste từ clipboard
- Phân tích mô tả, labels, confidence score
- Lịch sử phân tích (50 kết quả gần nhất)
- Giới hạn file tối đa 10MB

---

## 8. Telegram Glacia Skill Commands

- **File:** `server/services/telegramGlaciaSkillCommands.ts`
- Tích hợp vào Telegram Bot hiện có (`server/services/telegramBot.ts`)
- Các lệnh mới:
  - `/skills` — Danh sách tất cả Glacia skills
  - `/run-skill <id>` — Thực thi skill từ xa
  - `/b2b-scrape <địa điểm> <ngành>` — Google Maps B2B lead scraping nhanh
  - `/vas-export` — Xuất báo cáo tài chính VAS ra Excel
- Nhúng params qua biến `GLACIA_PARAMS` toàn cục trong script runtime

---

## 9. ByteDance Doubao Model Selection

- **File:** `server/services/aiRouter.ts`
- `doubao-pro-128k` cho tác vụ Pro (phân tích phức tạp, code review)
- `doubao-lite-32k` mặc định (chat nhanh, tiết kiệm)
- Doubao Vision cho Computer Vision tasks

---

## 10. Danh Sách Built-in Skills ($0 Token)

| ID | Name | Category | Runtime | Mô tả |
|---|---|---|---|---|
| `skill-video-shorts` | Tạo Video Shorts Viral | media | node | Tự động tạo video ngắn từ kịch bản |
| `skill-vietqr-bill` | Tạo Mã VietQR Cho Hóa Đơn | finance | node | Sinh mã QR thanh toán |
| `skill-audit-export` | Xuất Báo Cáo Kiểm Toán | finance | node | Xuất báo cáo kiểm toán PDF/Excel |
| `skill-blender-3d` | Tạo Mô Hình 3D Cơ Bản (Blender) | coding | python | Sinh mô hình 3D qua script Blender |
| `skill-social-banner` | Tạo Banner Mạng Xã Hội | marketing | node | Tạo banner quảng cáo đa kích thước |
| `skill-scrape-b2b-leads` | Google Maps B2B Lead Scraping | marketing | node | Scrape danh bạ doanh nghiệp từ Google Maps |
| `skill-export-vas-financial-statement` | Xuất Báo Cáo Tài Chính VAS | finance | node | Xuất báo cáo tài chính theo chuẩn VAS ra Excel |

## 11. Glacia Unified Orchestration Engine

- **File:** `server/services/glaciaOrchestrationEngine.ts`
- **API Client:** `src/utils/glaciaOrchestrationApi.ts`
- **Frontend UI:** `src/components/glacia/GlaciaIntelligenceHub.tsx`
- **API Routes:** 6 endpoints in `connectorIntegrationRoutes.ts`
  - `POST /api/glacia/orchestrate/execute` — Execute single task
  - `POST /api/glacia/orchestrate/parallel` — Execute multiple tasks in parallel
  - `POST /api/glacia/orchestrate/chain` — Execute sequential task chain
  - `GET  /api/glacia/orchestrate/metrics` — Get orchestration metrics
  - `GET  /api/glacia/orchestrate/tasks` — Get queue + completed tasks
  - `POST /api/glacia/orchestrate/cancel` — Cancel a queued task

### Task Types
| Type | Description | Module |
|---|---|---|
| `skill_execute` | Execute Glacia built-in skill ($0 token) | `glaciaSkillCompiler.ts` |
| `vision_analyze` | Computer Vision analysis via Doubao | `glaciaVisionEngine.ts` |
| `web_research` | Autonomous web research & synthesis | `glaciaWebResearcher.ts` |
| `self_heal` | Self-healing code from error logs | `glaciaWebResearcher.ts` |
| `swarm_shift` | Trigger 24/7 autonomous night cycle | `glaciaShiftScheduler.ts` |
| `telegram_command` | Send notification via Telegram | `telegramBot.ts` |
| `multi_model_reason` | Multi-model AI reasoning | `aiClient.ts` |
| `auto_program` | Auto-generate code from spec | `aiClient.ts` |

### Architecture
- Priority-based task queue (critical > high > normal > low)
- Task state machine: queued → running → completed/failed
- Auto-routing: Orchestration Engine dynamically imports the correct module
- Parallel execution with `Promise.allSettled`
- Sequential chain execution with output feeding into next input
- In-memory metrics: success rate, avg latency, uptime, tasks by type

## 12. Glacia Plugin System

- **File:** `server/services/glaciaPluginSystem.ts`
- Plugin lifecycle hooks: `onRegister`, `onUnregister`, `onTask`, `onHook`
- Hook types: `before_task`, `after_task`, `on_error`, `on_startup`, `on_shutdown`
- Plugin registry with capability-based routing
- Built-in plugin factory for Glacia modules

## 13. Glacia Intelligence Hub (Command Cockpit Tab)

- **File:** `src/components/glacia/GlaciaIntelligenceHub.tsx`
- 3 tabs: Dashboard (metrics + tasks by type + quick execute), Task Queue, History
- Real-time auto-refresh every 10 seconds
- 8 quick-execute buttons for all task types
- Visual progress bars for task distribution

