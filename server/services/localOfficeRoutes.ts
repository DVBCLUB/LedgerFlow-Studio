import { Router } from 'express';
import fs from 'fs';
import path from 'path';

export const localOfficeRoutes = Router();

// Thư mục cục bộ nơi AI sẽ xuất file (nằm trong thư mục gốc dự án)
const EXPORT_DIR = path.join(process.cwd(), 'exports');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

localOfficeRoutes.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync(EXPORT_DIR);
    const fileList = files.map(file => {
      const stats = fs.statSync(path.join(EXPORT_DIR, file));
      return {
        name: file,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, files: fileList });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

localOfficeRoutes.post('/analyze', async (req, res) => {
  try {
    const { prompt, title } = req.body;
    if (!prompt) throw new Error('Cần có prompt hoặc dữ liệu đầu vào.');

    const safeTitle = (title || 'Bao_cao_phan_tich').replace(/[^a-z0-9_-]/gi, '_');
    const filename = `${safeTitle}_${Date.now()}.md`;
    const filepath = path.join(EXPORT_DIR, filename);

    // Mô phỏng quá trình AI đọc file và phân tích:
    // Trong thực tế, đây là nơi ta gọi `callAI` truyền vào dữ liệu thô.
    const reportContent = `# BÁO CÁO PHÂN TÍCH
*Tự động sinh bởi AI Local Office Agent*

**Chủ đề yêu cầu:** ${prompt}

## 1. Tổng quan
Theo phân tích từ dữ liệu (Simulated), hệ thống cho thấy mức độ quan tâm của người dùng đạt ngưỡng ổn định.
Quá trình tự động hóa đã giảm thiểu 80% thời gian tạo báo cáo thủ công.

## 2. Kết luận
- **Tiến độ:** Hoàn thành tốt.
- **Rủi ro:** Không có rủi ro đáng kể.
- **Khuyến nghị:** Cần tiếp tục duy trì và mở rộng luồng Automation này.

---
*Báo cáo được xuất và lưu trữ an toàn tại ổ cứng cục bộ (Thư mục /exports).*`;

    // Agent ghi file thẳng vào ổ cứng máy tính
    fs.writeFileSync(filepath, reportContent, 'utf-8');

    res.json({
      success: true,
      message: `Đã xuất báo cáo thành công ra file: ${filename}`,
      file: { name: filename, path: filepath }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cho phép người dùng đọc nội dung file ngay trên giao diện
localOfficeRoutes.get('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(EXPORT_DIR, filename);
    
    // Ngăn chặn Path Traversal
    if (!filepath.startsWith(EXPORT_DIR)) throw new Error('Truy cập file không hợp lệ.');
    if (!fs.existsSync(filepath)) throw new Error('Không tìm thấy file.');

    const content = fs.readFileSync(filepath, 'utf-8');
    res.json({ success: true, content });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});
