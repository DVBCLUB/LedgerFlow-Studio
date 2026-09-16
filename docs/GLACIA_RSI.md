# Glacia RSI — vòng cải tiến có phản hồi

## Phạm vi đã triển khai

Đây là cải tiến lặp ở tầng ứng dụng: quan sát → AI đề xuất → Owner duyệt → so sánh kết quả trước/sau → dùng bài học ở vòng tiếp theo. Không phải tự huấn luyện trọng số mô hình hoặc tự động sửa, chạy và triển khai mã nguồn.

Mở Glacia Intelligence Hub, bật nhóm Dev Tools và chọn **RSI · Cải tiến**. Panel cũng được dùng tại DevOps. Frontend gọi `src/utils/glaciaRsiApi.ts`, API `/api/glacia/rsi/*` trong `robotAutomationRoutes.ts`, lõi `glaciaRecursiveImprovementEngine.ts`.

## Cách sử dụng

1. Đo phiên bản baseline trên 1–20 ca cố định; quy đổi điểm 0–100, cao hơn là tốt hơn. Nhập mã phiên bản, tên ca, điểm và lỗi/ngữ cảnh cần cải tiến.
2. Tạo đề xuất qua AI Gateway. Tùy chọn Ollama là ưu tiên local, không đảm bảo local-only. Thiếu phản hồi model hợp lệ sẽ báo thất bại, không tạo bản vá giả thành công.
3. Xem diff và duyệt hoặc từ chối kèm ghi chú. Duyệt không đồng nghĩa bản vá đã áp dụng. Điểm AI judge chỉ tham khảo, không thay thế kiểm thử.
4. Xuất hồ sơ bàn giao; áp dụng bản vá trong checkout riêng, giữ commit rollback và chạy cùng bộ ca/cách chấm. Không chỉnh benchmark để làm đẹp kết quả.
5. Nhập phiên bản candidate, điểm từng ca, tham chiếu báo cáo và bài học. Đây là bằng chứng **Owner cung cấp**; hệ thống chưa tự chạy bài kiểm thử hoặc đọc/xác minh nội dung báo cáo.
6. Chọn chuẩn bị vòng tiếp theo. Vòng cải thiện kế thừa candidate làm baseline; vòng không cải thiện giữ baseline cũ. Tối đa ba bài học cải thiện gần nhất được đưa vào ngữ cảnh model.

## Quy tắc so sánh và trạng thái

- Cần đúng tập tên ca, không trùng, điểm hữu hạn 0–100 và candidate revision khác baseline.
- Bất kỳ ca nào giảm điểm: `regressed`, dù trung bình tăng. Không có hồi quy và trung bình tăng ít nhất 1 điểm: `improved`; còn lại `no_gain`.
- Chỉ `improved` có đánh giá mới được dùng làm bài học chung. Bài học được đánh dấu `owner_reported`, không phải xác minh độc lập.
- Fingerprint SHA-256 gắn diff, file đích và baseline với lần duyệt/đánh giá. Không cho duyệt hoặc đánh giá lặp.
- Owner session bắt buộc cho toàn bộ API RSI. Tối đa 3 vòng/chuỗi, 10 vòng/ngày UTC (kể cả thất bại), một vòng đang tạo, một con/vòng và 200 hồ sơ lưu trữ.
- Tạm dừng lưu bền vững và hủy nhận kết quả đang chờ. Provider có thể vẫn hoàn tất yêu cầu đã gửi; không coi nút dừng là hủy chi phí API.

## Lưu trữ và phục hồi

Windows desktop lưu `glacia_rsi_cycles.json` tại Electron userData (thông thường `%APPDATA%/ledgerflow-studio`), dùng ghi file tạm rồi rename tại cùng thư mục. Web/local dùng runtime path, hoặc `LEDGERFLOW_RSI_STORE_PATH` khi cấu hình cho kiểm thử. Không commit lịch sử hoặc bí mật.

Khi khởi động lại, vòng `generating` cũ được ghi thất bại vì gián đoạn. JSON hỏng làm API báo lỗi, không âm thầm ghi đè lịch sử trống: dừng ứng dụng, sao lưu file lỗi, phục hồi từ bản sao hợp lệ rồi mở lại. Hồ sơ định dạng cũ được hiển thị là chưa đo/đã từ chối và không dùng làm bài học. Khi đủ 200 hồ sơ, cần quy trình lưu trữ thủ công sau sao lưu; chưa có nút xóa tự động.

Một tiến trình backend quản lý kho dữ liệu; chưa hỗ trợ nhiều tiến trình cùng ghi. Bộ lọc che thông tin nhạy cảm chỉ nhận diện các mẫu phổ biến, không bảo đảm nhận ra mọi bí mật; kiểm tra dữ liệu trước khi gửi model.

## Kiểm tra

`npm run test:rsi` chạy kiểm thử cô lập, model giả lập và thư mục tạm, không gọi provider hoặc dùng dữ liệu Owner. Bộ này cũng chạy trong `pretest`, do đó thuộc `npm test` và build/desktop packaging. Kiểm tra wiring: `npm run check:wiring`.
