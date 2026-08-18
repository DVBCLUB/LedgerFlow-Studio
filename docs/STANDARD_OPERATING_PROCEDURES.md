# LedgerFlow Studio — Standard Operating Procedures (SOP) & Operational Runbook

Tài liệu quy chuẩn hóa toàn bộ quy trình vận hành hệ thống cho Solo Founder và AI Staff ngay từ đầu để loại bỏ hoàn toàn các rủi ro vận hành, đứt gãy dữ liệu và chi phí phát sinh.

---

## 1. Triết Lý Vận Hành (Operating Philosophy)
- **Tự Vận Hành 95% (Autonomous Flywheel)**: Mọi tác vụ lặp đi lặp lại (quét dọn ban đêm, kiểm tra dòng tiền, chấm điểm lead, phân phối video, test game) do Robot và AI xử lý tự động.
- **Đứng Trên Vai Người Khổng Lồ**: Sử dụng AI Frontier Cloud cho tác vụ khó, tận dụng Free Tier ($0 Gemini 2.5 Pro 2M context, Edge TTS $0) và chắt lọc mẫu vàng huấn luyện Local AI.
- **Zero-Leak Security**: Không bao giờ commit mã khóa bí mật hoặc cơ sở dữ liệu lên repository công khai.

---

## 2. 5 Quy Trình Vận Hành Tiêu Chuẩn (Core SOPs)

### SOP-01: Nhịp Vận Hành Hàng Ngày & Hàng Tuần (Daily & Weekly Cadence)
| Thời Điểm | Người Thực Thi | Nội Dung Tác Vụ | Trạng Thái |
| :--- | :---: | :--- | :---: |
| **07:00 Sáng** | Solo Founder | Đọc tóm tắt từ *Nightly Sweeper Robot*: Doanh thu, Lead mới, PR cần duyệt | Tự động |
| **12:00 Trưa** | AI Robot | Quét lead từ TikTok/Shorts, chấm điểm AI Lead Scoring và gán HOT_LEAD | Tự động |
| **23:00 Đêm** | AI Robot | Dọn dẹp uncommitted changes, kiểm tra ngân sách AI token, lưu SQLite Snapshot | Tự động |
| **Thứ 7 Hàng Tuần** | AI Staff | Xuất kho mẫu vàng ($\ge 88/100$) thành file JSONL để huấn luyện Local AI | Tự động |

### SOP-02: Sổ Tay Xử Lý Sự Cố Khẩn Cấp 24/7 (Incident Response Runbook)
1. **Sự cố AI Provider Outage / 429 Rate Limit**:
   - Hệ thống tự động chuyển vùng trong < 50ms: `Claude/OpenAI` $\rightarrow$ `Gemini 2.5 Pro Free` $\rightarrow$ `Groq 70B` $\rightarrow$ `Local Ollama $0`.
2. **Sự cố Cơ sở dữ liệu SQLite lỗi ghi**:
   - Tự động khôi phục từ snapshot gần nhất trong thư mục `runtime/` trong 3 giây.
3. **Sự cố Build CI/CD thất bại**:
   - Kích hoạt *GitHub CI Doctor* đọc log, chẩn đoán nguyên nhân và tạo PR sửa đổi.

### SOP-03: Tiêu Chuẩn Kiểm Soát Chất Lượng (Quality Gate & LLM Judge)
- Mọi câu trả lời và mã nguồn sinh ra phải vượt qua bộ đánh giá **LLM Judge** với điểm $\ge 88/100$.
- Các kết quả chất lượng cao được lưu trữ làm "Mẫu Vàng" để chắt lọc tri thức.

### SOP-04: Giao Thức Bảo Mật & Sao Lưu (Zero-Leak Protocol)
- Chìa khóa API lưu trong Vault mã hóa AES-256 (`runtime/ai_keys.vault.json`).
- Tự động kích hoạt cơ chế Auto-Lock sau 15 phút không hoạt động.
- Kiểm tra thường xuyên bằng script `npm run check:ci-safety-gate`.

### SOP-05: Vòng Đời Phát Triển & Xuất Bản 3 Dòng Sản Phẩm
1. **Phần mềm (PC & Mobile)**:
   - Viết mã nguồn $\rightarrow$ Kiểm thử 100% Green (`npm test`) $\rightarrow$ 1-Click đóng gói `.exe` Windows & `.apk` Android.
2. **Trò chơi (Game PC/Mobile)**:
   - Tạo Asset & WebAudio $\rightarrow$ Chạy AI Game Playtester 1.000 lượt đo FPS $\rightarrow$ Tinh chỉnh cân bằng $\rightarrow$ Xuất bản.
3. **Video Marketing**:
   - Viết kịch bản $\rightarrow$ Lồng tiếng Edge TTS $0 $\rightarrow$ Sinh prompt chuyển động Kling/Luma $\rightarrow$ Xuất CapCut Draft.
