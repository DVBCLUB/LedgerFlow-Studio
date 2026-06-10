# CT1 - Bảng đánh giá xây dựng công ty phần mềm thu nhỏ bằng AI

## 1. Định nghĩa CT1

CT1 là bảng đánh giá do founder cung cấp để định hướng LedgerFlow-Studio.

LedgerFlow-Studio không phải phần mềm kế toán nhập liệu/xuất báo cáo như MISA AMIS, Bravo hoặc ERP truyền thống.

LedgerFlow-Studio là:

- phần mềm học tập;
- phòng R&D;
- phòng mô phỏng;
- nơi lập kế hoạch ý tưởng phần mềm/ứng dụng/game;
- hệ điều hành công ty solo founder;
- nơi founder điều phối AI và AI agent như nhân viên ảo;
- nơi kiểm soát chi phí thấp nhất/free-first;
- nơi chuẩn bị thương mại hóa sản phẩm số.

## 2. Các trụ cột CT1

### 2.1 Kiến trúc kỹ thuật

Định hướng ưu tiên:

- TypeScript mental model thống nhất;
- React/Next.js/Tailwind;
- Supabase/PostgreSQL khi cần database thật;
- Vercel/free-tier cho MVP;
- component nhỏ, data module rõ ràng;
- không nhồi mọi thứ vào một file dài.

### 2.2 AI workforce

AI là nhân viên ảo, không phải người quyết định cuối.

Mỗi AI agent cần có:

- vai trò;
- nhiệm vụ;
- input;
- expected output;
- acceptance criteria;
- guardrail;
- founder review.

### 2.3 Mô phỏng và synthetic users

Mô phỏng là năng lực lõi của app.

Cần phát triển:

- persona lab;
- synthetic survey;
- A/B testing mô phỏng;
- pricing simulation;
- UX friction simulation;
- bias warning;
- đối chiếu với khảo sát thực tế.

Kết quả mô phỏng không được xem là sự thật tuyệt đối.
Nó là giả thuyết để founder quyết định khảo sát tiếp, build MVP nhỏ, hoặc dừng.

### 2.4 Tài chính, burn rate và MoR

Solo founder cần kiểm soát:

- tool cost;
- burn rate;
- runway;
- MRR;
- gross margin;
- pricing;
- Stripe vs Merchant of Record;
- rủi ro thuế quốc tế khi bán sản phẩm số.

MVP nên có Tool Budget Ledger và SaaS Finance Lab.

### 2.5 Marketing, sales và distribution

Không có phân phối thì phần mềm không thương mại hóa được.

Cần phát triển:

- lead board;
- content engine;
- survey feedback board;
- community research;
- demo script;
- n8n automation blueprint;
- anti-spam guardrail.

AI có thể soạn nháp, nhưng founder phải duyệt trước khi đăng/gửi.

### 2.6 Kế toán - kiểm toán đa ngành

Không được khóa vào ngành xây dựng.

Phải bao phủ:

- thương mại;
- sản xuất;
- dịch vụ;
- xây dựng/dự án;
- tài chính founder;
- kiểm toán nội bộ;
- audit red flags;
- case học tập đa ngành.

Mục tiêu là học tập, mô phỏng, kiểm soát tư duy và thiết kế sản phẩm, không phải thay phần mềm kế toán chính thức.

### 2.7 Game giáo dục

CT1 mở hướng app/game giáo dục.

Nguyên tắc:

- ưu tiên 2D, decision game, scenario game;
- tránh 3D phức tạp quá sớm;
- mỗi game phải có learning objective;
- mỗi game phải có core loop;
- mỗi game phải có win/lose condition;
- dùng asset pack/Canva/2D trước.

## 3. Các tab UI nên thêm tiếp

### 3.1 CT1 Scorecard

Hiển thị:

- định vị sản phẩm;
- điểm từng trụ cột;
- current grade;
- next upgrade;
- CT1 release guardrails.

Data source: `src/data/ct1CompanyAssessment.ts`

### 3.2 CT1 Roadmap

Hiển thị `CT1_PRIORITY_BACKLOG` theo P0/P1/P2.

### 3.3 Synthetic User Lab

Tạo persona mô phỏng, câu hỏi khảo sát, willingness-to-pay, bias warning.

### 3.4 SaaS Finance Lab

Input:

- MRR;
- churn;
- tool cost;
- infra cost;
- MoR fee;
- Stripe fee;
- runway cash.

Output:

- net revenue;
- gross margin;
- runway months;
- MoR/Stripe warning;
- GO/HOLD recommendation.

### 3.5 Distribution CRM

Input:

- lead name;
- source;
- pain;
- feedback;
- willingness-to-pay;
- next action.

Output:

- lead score;
- follow-up list;
- content idea;
- product insight.

### 3.6 Game Design Lab

Input:

- learning objective;
- persona;
- core loop;
- mechanic;
- win condition;
- reward;
- engine choice.

Output:

- MVP scope;
- game risk;
- asset rule;
- build/no-build recommendation.

## 4. Quy tắc cải tiến từ nay

1. Mọi cải tiến phải bám CT1.
2. Không biến app thành ERP kế toán.
3. Không cố định một ngành xây dựng.
4. Không thêm tool trả phí nếu chưa có bằng chứng.
5. Không để AI tự quyết thay founder.
6. Không build lớn nếu chưa có mô phỏng/survey.
7. Không nhồi tiếp vào component lớn nếu đã có thể tách module.
8. Ưu tiên tạo dữ liệu/simulator trước, backend sau.
9. Ưu tiên app học tập, mô phỏng, vận hành, thương mại hóa.
10. Founder là CEO, AI là nhân viên.

## 5. Prompt giao AI coder tiếp theo

```text
Dựa trên CT1 trong src/data/ct1CompanyAssessment.ts, hãy thêm tab CT1 Scorecard vào AccountingVietnam hoặc component tương ứng.
Không xóa tab cũ, không đổi router, không phá style dark/cyan hiện tại.
Hiển thị CT1_META, CT1_SCORECARD, CT1_ASSESSMENT_DIMENSIONS, CT1_PRIORITY_BACKLOG và CT1_RELEASE_GUARDRAILS.
Nếu file component quá dài, hãy tách component nhỏ thay vì nhồi tiếp.
```
