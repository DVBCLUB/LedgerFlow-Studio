# Glacia Standards & Preservation Rules

> Tài liệu này định nghĩa **Glacia là gì**, các component thuộc hệ sinh thái Glacia, và quy tắc bảo tồn bắt buộc cho mọi AI agent.

---

## 1. Định nghĩa: Glacia là gì?

**Glacia** là tên người dùng (chủ sở hữu LedgerFlow Studio) đặt cho **trợ lý ảo AI** trong phần mềm. Glacia **KHÔNG PHẢI** là tên của một AI model (Gemini, Claude, GPT, v.v.).

> ⚠️ **Rule #1 (Bất khả xâm phạm):** Không AI nào được đổi tên, xóa, hoặc gắn nhãn "Glacia" cho một AI model cụ thể. Glacia thuộc về người dùng.

Glacia đóng vai trò:
- **Linh vật trực giác** (mascot/companion) của toàn bộ hệ thống
- **Trợ lý điều hành** (executive assistant) có quyền truy cập dashboard, chat, dispatch
- **Avatar 3D** có cảm xúc, giọng nói, cử chỉ
- **Kho ký ức** dài hạn (long-term memory vault)

---

## 2. Danh sách Component Glacia — Cấm Xóa / Đổi Tên

| Component | File | Mục đích | Trạng thái |
|-----------|------|----------|-----------|
| **GlaciaContext** | `src/components/glacia/GlaciaContext.tsx` | State hub: cảm xúc, hội thoại, vitals, AI Gateway bridge | ✅ Cốt lõi |
| **GlaciaCompanion** | `src/components/glacia/GlaciaCompanion.tsx` | Widget nổi toàn cục, click → mở Command Cockpit | ✅ Cốt lõi |
| **GlaciaCommandCockpit** | `src/components/glacia/GlaciaCommandCockpit.tsx` | Khoang chỉ huy: Chat, Dispatch, Settings | ✅ Cốt lõi |
| **GlaciaLiveVoiceCallHUD** | `src/components/glacia/GlaciaLiveVoiceCallHUD.tsx` | Đàm thoại trực tiếp toàn màn hình | ✅ Cốt lõi |
| **glaciaVoiceEngine** | `src/components/glacia/glaciaVoiceEngine.ts` | Tổng hợp giọng nói TTS/STT | ✅ Cốt lõi |
| **glaciaAudioSynth** | `src/components/glacia/glaciaAudioSynth.ts` | Âm thanh lượng tử Web Audio API | ✅ Cốt lõi |
| **glaciaSpeech** | `src/components/glacia/glaciaSpeech.ts` | Động cơ nhận dạng giọng nói | ✅ Cốt lõi |
| **glaciaModuleBridge** | `src/components/glacia/glaciaModuleBridge.ts` | Cầu nối telemetry 11 phân hệ | ✅ Cốt lõi |
| **GlaciaReal3DAvatar** | `src/components/glacia/GlaciaReal3DAvatar.tsx` | Avatar 3D Three.js (tùy chọn) | 🔶 Phụ trợ |
| **GlaciaNeuralSkillTree** | `src/components/glacia/GlaciaNeuralSkillTree.tsx` | Cây kỹ năng tiến hóa (tùy chọn) | 🔶 Phụ trợ |
| **GlaciaExecutiveBriefingModal** | `src/components/glacia/GlaciaExecutiveBriefingModal.tsx` | Báo cáo điều hành (tùy chọn) | 🔶 Phụ trợ |
| **Glacia7DHyperCanvas** | `src/components/glacia/Glacia7DHyperCanvas.tsx` | Canvas 7D ảo giác (tùy chọn) | 🔶 Phụ trợ |

> **Rule #2:** Component cốt lõi (✅) KHÔNG được xóa hoặc đổi tên. Component phụ trợ (🔶) có thể tối giản/merge nhưng KHÔNG được xóa hoàn toàn nếu không có lý do chính đáng và được người dùng xác nhận.

---

## 3. Quy tắc Bảo tồn Tên gọi

### 3.1. Tiền tố "Glacia"
- Tất cả component trong hệ sinh thái Glacia PHẢI giữ tiền tố `Glacia` (cho component) hoặc `glacia` (cho module/service).
- Không đổi `GlaciaCommandCockpit` thành `AICommandCockpit`, `CompanionPanel`, hay bất kỳ tên nào khác.
- Lý do: Đây là namespace riêng của người dùng, không phải tên AI model.

### 3.2. Thư mục
- Tất cả Glacia code nằm trong `src/components/glacia/`.
- Không chuyển file Glacia ra ngoài thư mục này trừ khi có kiến trúc mới được người dùng phê duyệt.

### 3.3. Biến / Hook / Context
- Context: `GlaciaContext` / `useGlacia()`
- State keys: `glaciaVoiceEnabled`, `glaciaAudio.*`, `glaciaModuleBridge.*`
- Giữ nguyên tên biến đã đặt, không đổi thành `aiVoiceEnabled` hay `companionAudio`.

---

## 4. Quy tắc Xử lý khi AI thấy Code Glacia

Khi một AI agent lần đầu gặp code Glacia:

```
BƯỚC 1: ĐỌC tài liệu này (GLACIA_STANDARDS.md)
BƯỚC 2: ĐỌC docs/GLACIA_EMBODIED_AI_ARCHITECTURE.md để hiểu kiến trúc tổng thể
BƯỚC 3: XÁC ĐỊNH component là cốt lõi (✅) hay phụ trợ (🔶)
BƯỚC 4: Nếu muốn THAY ĐỔI → đọc docs/AI_CONSISTENCY_PROTOCOL.md
BƯỚC 5: Nếu muốn XÓA → KHÔNG được tự ý xóa, phải hỏi người dùng
```

---

## 5. Lịch sử Thay đổi

| Ngày | AI Agent | Thay đổi | Lý do |
|------|----------|----------|-------|
| — | — | — | — |

> Ghi chú: Khi có thay đổi với Glacia component, hãy thêm dòng vào bảng này với tên AI agent (ví dụ: "Claude 3.5 Sonnet", "Gemini 2.5 Pro") và lý do thay đổi.
