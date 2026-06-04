import React, { useState } from 'react';
import { 
  Cpu, 
  Database, 
  ArrowRight, 
  Workflow, 
  TrendingUp, 
  Layers, 
  Eye, 
  CheckCircle2, 
  Flame, 
  HelpCircle, 
  Sparkles, 
  RefreshCw, 
  Network,
  Share2,
  FileText,
  Terminal,
  Activity,
  ChevronRight,
  ShieldCheck,
  Lock,
  Compass,
  MessageSquare,
  BookOpen,
  Search,
  Check,
  Code,
  Link,
  Sliders,
  Mail,
  Smartphone,
  Cloud,
  FileSpreadsheet
} from 'lucide-react';

// Interfaces
interface DiagramNode {
  id: string;
  title: string;
  tech: string;
  desc: string;
  vietStandard: string;
  category: 'raw' | 'ai' | 'etl' | 'double_entry' | 'dw' | 'alert';
  cost: string;
}

interface ToolEcosystem {
  id: string;
  name: string;
  provider: string;
  category: 'ai_agent' | 'existing_software' | 'database' | 'hosting';
  freeTierLimit: string;
  role: string;
  cookRecipe: string;
  codeSnippet?: string;
  link?: string;
}

// Diagram nodes for central architecture flow
const DIAGRAM_NODES: DiagramNode[] = [
  {
    id: 'source_raw',
    title: '1. Nguồn Dữ Liệu Thô (Raw Input)',
    tech: 'XML ròng / PDF báo cáo / Excel ngân hàng / POS',
    desc: 'Sao kê ngân hàng VCB/TCB thô cực kỳ lộn xộn, file XML hóa đơn VAT của Tổng cục Thuế, ảnh chụp hóa đơn mờ hoặc biên lai bán hàng.',
    vietStandard: 'Nghị định 123/2020/NĐ-CP của Chính phủ về hóa đơn điện tử.',
    category: 'raw',
    cost: 'Miễn phí đầu vào'
  },
  {
    id: 'google_drive_cloud',
    title: '2. Kho Lưu Trữ Đám Mây Google Drive 0đ',
    tech: 'Google Drive API / Google Apps Script (15GB)',
    desc: 'Nơi tàng trữ tập trung tất cả tệp gốc hóa đơn điện tử (XML/PDF), ảnh chụp biên lai thanh toán và các bản sao lưu (backup) cơ sở dữ liệu SQLite định kỳ tuyệt đối an toàn.',
    vietStandard: 'Lưu trữ chứng từ kế toán 10 năm theo Luật Kế toán 88/2015/QH13.',
    category: 'raw',
    cost: '0đ / Tận dụng 15GB tài khoản Google'
  },
  {
    id: 'gemini_ocr',
    title: '3. Trí Tuệ Nhân Tạo AI Agent Parser',
    tech: 'Google AI Studio (Gemini 2.0 Flash)',
    desc: 'Bóc tách cấu trúc hóa đơn siêu tốc. Không chỉ đọc chữ cơ bản, Gemini hiểu ngữ cảnh để trích chính xác Tên Người bán, Tên Người mua, MST, Tiền Thuế VAT, Tiền Trước Thuế sang mẫu JSON cứng.',
    vietStandard: 'Chống mờ mắt rủi ro thuế ẩn, bầy lỗi số từ rác.',
    category: 'ai',
    cost: '0đ / 15 requests mỗi phút'
  },
  {
    id: 'pandas_etl',
    title: '4. Bộ Dọn Dẹp Chuẩn Hóa Dữ Liệu (ETL Pipeline)',
    tech: 'Pandas Python / Streamlit Cloud',
    desc: 'Phép dọn dẹp lọc tất cả ký tự lạ chữ đ tiền tệ (bóc "2.500.000 đ" thành số 2500000), đồng bộ kiểu dữ liệu date "DD-MM-YYYY" sang ISO "YYYY-MM-DD" để lưu trữ ròng vào SQL.',
    vietStandard: 'Bảo toàn số dư đầu kỳ phát sinh tính chính xác 100%.',
    category: 'etl',
    cost: '0đ Host trên Streamlit/HuggingFace'
  },
  {
    id: 'double_entry',
    title: '5. Tự Động Định Khoản Kép (Auto Ledger)',
    tech: 'Rule-Based Engine & AI Semantic Match',
    desc: 'Quy đổi giao dịch dẹt thương mại sang tài khoản kế toán kép chuẩn hạch toán Nợ - Có. Tự quét nội dung: Nộp tiền mặt -> Nợ 111 / Có 112; Khách thanh toán -> Nợ 112 / Có 131.',
    vietStandard: 'Hệ thống tài khoản chi tiết theo Thông tư 200/133 của Bộ Tài chính.',
    category: 'double_entry',
    cost: '0đ Chạy trực tiếp Vercel serverless API'
  },
  {
    id: 'github_central',
    title: '6. Đầu Mối Trung Tâm GitHub (Single Source of Truth)',
    tech: 'GitHub API / GitOps Workflow / Private Repositories',
    desc: 'Trọng tâm đầu não của toàn bộ hệ thống. Tất cả mã nguồn, cấu hình hoạt động và dữ liệu phẳng (CSV/JSON/SQLite) đều đổ về GitHub, đảm bảo lưu vết lịch sử phiên bản tuyệt đối minh bạch.',
    vietStandard: 'Hệ thống lưu vết kiểm toán (Audit Trail) chống sửa xóa sai lệch.',
    category: 'dw',
    cost: '0đ / Repository riêng tư bảo mật'
  },
  {
    id: 'star_dw',
    title: '7. Cất Kho Dữ Liệu Mô Hình Sao (DW SQL)',
    tech: 'Supabase Postgres / Neon serverless Postgres',
    desc: 'Lưu trữ thông tin chuẩn hóa vào mô hình Star Schema. Bảng Fact chính (Giao dịch Sổ cái Ledger) liên kết chặt chẽ bảng Dimension (Mô tả tài khoản, Danh mục khách hàng).',
    vietStandard: 'Chống lỗi mâu thuẫn dữ liệu quan hệ, truy vấn báo cáo dưới 30ms.',
    category: 'dw',
    cost: '0đ / 500MB DB miễn phí của Supabase'
  },
  {
    id: 'alerts_bi',
    title: '8. Cảnh Báo Tài Chính Dòng Tiền & Kế Toán',
    tech: 'Telegram Bot API / Webhook trigger',
    desc: 'Sau khi hạch toán, tự động tính Doanh thu ròng, Chi phí thực tế, Dòng tiền. Nếu phát hiện rủi ro âm quỹ hoặc chi phí phát sinh kỳ lạ, bot tự nhắn tin cập nhật trực tiếp về điện thoại Boss.',
    vietStandard: 'Hỗ trợ kiểm kê giám sát dòng tiền nội bộ tức thì.',
    category: 'alert',
    cost: '0đ Telegram Bot API không giới hạn'
  }
];

// Directory of all Free Tools & AI platforms
const FREE_TOOL_DIRECTORY: ToolEcosystem[] = [
  {
    id: 'gemini_studio',
    name: 'Google AI Studio (Gemini API)',
    provider: 'Google AI',
    category: 'ai_agent',
    freeTierLimit: '15 Requests/phút, 1.500 requests/ngày miễn phí hoàn toàn.',
    role: 'Trích xuất dữ liệu mờ, bóc ảnh hóa đơn đỏ PDF/PNG sang JSON định chuẩn chính xác.',
    cookRecipe: 'Cung cấp Key API miễn phí trong Settings, viết System Prompt gò cấu trúc JSON ép AI trả về schema có sẵn.',
    codeSnippet: `// Ví dụ tích hợp Gemini 1.5 Flash bóc hóa đơn chuẩn JSON
const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY, {
  method: "POST",
  body: JSON.stringify({
    contents: [{ parts: [
      { text: "Bóc hóa đơn đỏ VAT Việt Nam sau sang JSON: Tên_Mua, mst_mua, tong_chua_thue, tien_thue, tong_thanh_toan." },
      { inline_data: { mime_type: "image/jpeg", data: base65Image } }
    ]}],
    generationConfig: { responseMimeType: "application/json" }
  })
});`,
    link: 'https://aistudio.google.com/'
  },
  {
    id: 'supabase',
    name: 'Supabase Serverless Postgres',
    provider: 'Supabase Inc.',
    category: 'database',
    freeTierLimit: '500MB Postgres database miễn phí, sao lưu tự động.',
    role: 'Kho lưu trữ dữ liệu an toàn (Data Warehouse) cho mô hình giao dịch Star Schema, hóa đơn và hạch toán.',
    cookRecipe: 'Tạo Project miễn phí, copy chuỗi Connection URL (Postgresql://) dán vào mã nguồn kết nối của bạn.',
    codeSnippet: `-- DDL Khởi tạo bảng Fact Sổ cái hạch toán 0đ trên Supabase
CREATE TABLE fact_ledger (
    id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    journal_no VARCHAR(50) UNIQUE,
    debit_account VARCHAR(10) NOT NULL, -- Ví dụ: 1121
    credit_account VARCHAR(10) NOT NULL, -- Ví dụ: 5111
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);`,
    link: 'https://supabase.com/'
  },
  {
    id: 'neon_postgres',
    name: 'Neon Serverless Cloud Postgres',
    provider: 'Neon.tech',
    category: 'database',
    freeTierLimit: '0.5 GiB dung lượng lưu trữ, tự động tắt khi không dùng, khởi động lại trong 1 giây.',
    role: 'Database dự phòng cho cấu hình micro-services của Solo Founder, hỗ trợ branching (phát triển riêng một nhánh số liệu thử nghiệm).',
    cookRecipe: 'Tạo tài khoản neon, khởi sinh branch dev và prod, hỗ trợ kiểm thử hạch toán thử trước khi đẩy về prod.',
    link: 'https://neon.tech/'
  },
  {
    id: 'turso_sqlite',
    name: 'Turso SQLite Cloud',
    provider: 'ChiselStrike (Turso)',
    category: 'database',
    freeTierLimit: '9GB dung lượng lưu trữ, 500 DBs miễn phí vô đối.',
    role: 'Siêu tối ưu cho lưu giữ sổ sách máy bay siêu rẻ. Rất được ưa chuộng bởi các công cụ CLI kế toán cục bộ.',
    cookRecipe: 'Cài đặt CLI Turso, khởi tạo db SQLite trên cloud, liên kết API key sqlite để truy vấn mượt mà dột ngột.',
    link: 'https://turso.tech/'
  },
  {
    id: 'huggingface_spaces',
    name: 'Hugging Face Spaces',
    provider: 'Hugging Face Co.',
    category: 'hosting',
    freeTierLimit: 'Free CPU basic container (16GB RAM, vCPU) 100% không giới hạn thời gian chạy.',
    role: 'Chạy động cơ Python dọn dẹp dữ liệu lớn lâu dài (Pandas, Numpy), host công cụ Gradio hoặc Streamlit.',
    cookRecipe: 'Tạo Space mới loại Streamlit hoặc Docker, kéo code python của bạn lên Github / HF repo để tự build container.',
    codeSnippet: `# pandas_cleaner.py - Chạy trên Hugging Face Spaces miễn phí
import pandas as pd
import streamlit as st

st.title("Bộ Dọn Dẹp Sao Kê Ngân Hàng Kế Toán")
uploaded_file = st.file_uploader("Kéo thả file sao kê thô (.xlsx/.csv)")
if uploaded_file:
    df = pd.read_excel(uploaded_file)
    # Lọc bỏ dòng rỗng, dọn chữ 'đ'
    df['Số tiền'] = df['Số tiền'].astype(str).str.replace(' đ', '').str.replace('.', '').astype(float)
    st.dataframe(df)
    st.success("Đã lọc sạch dư liệu thô đạt tiêu chuẩn Nợ-Có!")`,
    link: 'https://huggingface.co/spaces'
  },
  {
    id: 'vercel',
    name: 'Vercel Static & Serverless Hosting',
    provider: 'Vercel Inc.',
    category: 'hosting',
    freeTierLimit: 'Băng thông 100GB/tháng miễn phí, chạy API serverless 10 giây mỗi lượt.',
    role: 'Host giao diện web React/Vite (như LedgerFlow này), làm proxy API bảo mật che giấu API key của Gemini.',
    cookRecipe: 'Đăng nhập Vercel bằng Github, chọn dự án của bạn để tự động triển khai sau mỗi lượt push code.',
    link: 'https://vercel.com/'
  },
  {
    id: 'streamlit_cloud',
    name: 'Streamlit Community Cloud',
    provider: 'Snowflake Inc.',
    category: 'hosting',
    freeTierLimit: 'Host tối đa 3 ứng dụng Python tương tác miễn phí ròng.',
    role: 'Thiết kế nhanh các trang Dashboard biểu đồ dọn dẹp số liệu kế toán thô trước khi đưa vào kho Supabase.',
    cookRecipe: 'Kết nối GitHub, chọn tệp Python chính, Streamlit tự nhận diện dependencies và cấp URL trực tuyến.',
    link: 'https://streamlit.io/cloud'
  },
  {
    id: 'google_sheets_apps',
    name: 'Google Sheets & Apps Script',
    provider: 'Google Workspace',
    category: 'existing_software',
    freeTierLimit: '15GB lưu trữ Google Drive, 20.000 requests API Apps Script mỗi ngày miễn phí.',
    role: 'Bảng quản trị kế toán di động cho vị khách hàng không rành IT, đồng bộ ngược thời gian thực về SQL.',
    cookRecipe: 'Thiết kế cột hạch toán trên Sheet, viết Google Apps Script làm HTTP POST chuyển giao dịch sang Supabase API hoặc Telegram.',
    codeSnippet: `// Apps Script tự đồng bộ sang Telegram khi hạch toán trên Sheet
function onEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getName() == "SoCai" && range.getColumn() == 6) { // Khi cột Ghi Chú được sửa
    var row = range.getRow();
    var money = sheet.getRange(row, 5).getValue();
    var msg = "🔔 Boss ơi! Có hạch toán mới phát sinh: " + money + "đ - " + range.getValue();
    
    // Gửi sang Telegram
    UrlFetchApp.fetch("https://api.telegram.org/bot<BOT_TOKEN>/sendMessage", {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify({ chat_id: "<CHAT_ID>", text: msg })
    });
  }
}`,
    link: 'https://sheets.google.com/'
  },
  {
    id: 'telegram_bot_api',
    name: 'Telegram Bot Alerts Engine',
    provider: 'Telegram OS',
    category: 'existing_software',
    freeTierLimit: 'Hoàn toàn miễn phí, tốc độ gửi tối đa 30 thông điệp/giây cực nhanh.',
    role: 'Gửi tin cảnh báo khẩn cấp về dòng tiền âm, cảnh báo đột biến chi phí vượt ngân sách cho CEO.',
    cookRecipe: 'Tìm @BotFather trên Telegram gõ /newbot để lấy TOKEN, mời BOT vào group và bắt đầu gửi HTTP POST alert.',
    link: 'https://telegram.org/'
  },
  {
    id: 'make_com',
    name: 'Make.com Automation Web',
    provider: 'Make.com S.r.o',
    category: 'existing_software',
    freeTierLimit: '1.000 tác vụ chạy webhook miễn phí mỗi tháng liên tục.',
    role: 'Cầu nối tự động hóa: Gửi email hóa đơn mới -> Tự kích hoạt API xử lý -> Đưa kết quả JSON về Google Sheets.',
    cookRecipe: 'Tạo kịch bản (Scenario) với Mail Trigger -> HTTP tool gọi Gemini -> Google Sheets Row adder.',
    link: 'https://make.com/'
  },
  {
    id: 'dify_coze',
    name: 'Dify.ai / Coze Workflow Builders',
    provider: 'Dify / Coze (ByteDance)',
    category: 'ai_agent',
    freeTierLimit: 'Miễn phí một lượng quota AI chạy định kỳ dồi dào hàng tháng.',
    role: 'Tạo AI Agent phân tích báo cáo: Cho phép khách hàng gửi ảnh sao kê ngân hàng thô vào bot Zalo/Telegram, AI Agent tự xử lý phân loại trả về báo cáo tóm tắt.',
    cookRecipe: 'Vẽ sơ đồ luồng dữ liệu (Flow), gắn API key của Gemini và xuất chatbot ra kênh Zalo/Telegram cá nhân.',
    link: 'https://dify.ai/'
  }
];

// Concrete step-by-step implementation cookbook recipes
const COOKBOOK_STEPS = [
  {
    step: "Bước 1",
    title: "Thiết Lập Database & Front-End Bộ Khung 0 VNĐ",
    tools: ["Supabase", "Vercel / GitHub", "Vite React TS"],
    actions: [
      "Vào Supabase.com đăng ký tài khoản miễn phí. Khởi tạo Database Postgres mang tên 'ledgerflow_db' chọn vùng Đông Nam Á (Singapore) để truy xuất nhanh.",
      "Vào phần SQL Editor trong Supabase và copy-paste đoạn mã DDL định hình mô hình bảng hạch toán chuẩn Thông tư 200 (Bảng Fact Ledger, Dim Account).",
      "Khởi tạo repository GitHub, liên kết thẳng lên Vercel để nhận tính năng tự động deploy giao diện web React dẹp mắt."
    ],
    code: `-- Setup mô hình Sổ cái kế toán quan hệ (Supabase)
CREATE TABLE dim_accounts (
    account_code VARCHAR(10) PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    account_group VARCHAR(50) -- Tài sản, Nguồn vốn, Doanh thu, Chi phí
);

-- Thêm một vài tài khoản cốt lõi hạch toán Thông tư 200
INSERT INTO dim_accounts VALUES 
('1111', 'Tiền mặt Việt Nam Đồng', 'Tài sản'),
('1121', 'Tiền gửi ngân hàng Việt Nam Đồng', 'Tài sản'),
('131', 'Phải thu của khách hàng', 'Tài sản'),
('331', 'Phải trả cho người bán', 'Nguồn vốn'),
('5111', 'Doanh thu bán hàng hóa', 'Doanh thu'),
('642', 'Chi phí quản lý doanh nghiệp', 'Chi Phí');`,
    proTip: "Lưu trữ Connection String của Supabase kỹ lưỡng vào tệp .env trên Vercel, không bao giờ để lộ lên GitHub công khai."
  },
  {
    step: "Bước 2",
    title: "Tạo Agent Bóc Tách Hóa Đơn Bằng Gemini API Studio",
    tools: ["Google AI Studio", "Gemini 1.5/2.0 Flash SDK"],
    actions: [
      "Vào aistudio.google.com lấy API Key miễn phí và hạch định trong cấu hình máy chủ serverless.",
      "Biên soạn System Prompt cực kỳ tối quan trọng ép AI bóc tách các trường thô của ảnh hóa đơn hoặc XML thô về dạng định dạng chuỗi JSON thô không bị lỗi.",
      "Thiết đặt cấu hình generationConfig với responseMimeType='application/json' để chắc chắn định dạng đầu ra không dính rác văn bản."
    ],
    code: `/* System Prompt Thần Thánh Bóc Hóa Đơn Chống Ảo Giác */
const systemInstruction = \`
Bạn là Trợ lý Kiểm toán Cấp cao của Bộ phận Kế toán Việt Nam. 
Nhiệm vụ của bạn là phân tích ảnh/PDF hóa đơn đỏ VAT được cung cấp và trích xuất thông tin ròng sang JSON chuẩn.
Quy định xuất dữ liệu bắt buộc dạng JSON có cấu hình sau:
{
  "seller_name": "Tên đơn vị bán",
  "seller_mst": "Số mã số thuế người bán",
  "buyer_name": "Tên người mua hàng",
  "buyer_mst": "Số mã số thuế người mua",
  "pre_tax_amount": 1000000, // Kiểu NUMBER, không ghi đơn vị đ hay dấu chấm
  "tax_amount": 100000, // Kiểu NUMBER
  "total_amount": 1100000, // Kiểu NUMBER
  "tax_rate_percent": 10 // Kiểu NUMBER
}
Lưu ý bảo mật: Không tự bịa số liệu. Nếu trường nào mờ không đọc được, hãy để là null.\`;`,
    proTip: "Sử dụng Gemini 2.0 Flash để bóc ảnh cực rõ mà tốc độ bóc tách chỉ dưới 1.5 giây mỗi tấm hóa đơn VAT."
  },
  {
    step: "Bước 3",
    title: "Lập Trình Pandas ETL Dọn Dẹp Chuẩn Hóa Số Liệu",
    tools: ["Python Pandas", "Streamlit Cloud / HuggingFace Spaces"],
    actions: [
      "Sử dụng thư viện Pandas để dọn sạch sao kê cực thô tải xuống từ hệ thống Internet Banking ngân hàng (Vietcombank, Techcombank, VPBank dồi dào cột thừa).",
      "Viết các hàm Regex Việt hóa loại bỏ tất cả ký tự phi số (NaN, ký hiệu đ, dấu phẩy ngăn cách lung tung) để quy về số nguyên nguyên bản lưu giữ số dư dòng tiền.",
      "Chuẩn hóa ngày tháng năm từ các kiểu xộc xệch như 'Thứ tư, 12/03/2026' về dạng chuẩn ISO '2026-03-12'."
    ],
    code: `# File python xử lý sao kê thô cục bộ (Pandas)
import pandas as pd
import re

def clean_vietnam_statement(file_path):
    df = pd.read_excel(file_path, skiprows=3) # bỏ bớt dòng đầu tiêu đề rác ngân hàng
    
    # Định dạng cột số tiền phát sinh ròng
    def num_clean(val):
        if pd.isna(val): return 0
        cleaned = re.sub(r'[^\\d]', '', str(val)) # Chỉ lấy chữ số
        return float(cleaned) if cleaned else 0
        
    df['Money_Clean'] = df['Phát sinh có'].apply(num_clean) - df['Phát sinh nợ'].apply(num_clean)
    
    # Chuẩn hóa ngày ISO
    df['Date_ISO'] = pd.to_datetime(df['Ngày giao dịch'], format='%d/%m/%Y', errors='coerce').dt.strftime('%Y-%m-%d')
    return df.dropna(subset=['Date_ISO'])`,
    proTip: "Nếu host Python ròng rỗi lên Streamlit Cloud, dán tệp yêu cầu thư viện pandas và openpyxl vào file requirements.txt."
  },
  {
    step: "Bước 4",
    title: "Ánh Xạ Kế Toán Kép Thông Tư 200/133 Tự Động",
    tools: ["Vercel API / JS Mapping Object", "Rule Engine"],
    actions: [
      "Thiết lập một bộ định hạch tự động, duyệt các từ khóa (Keywords) phổ biến trong lịch sử giao dịch sao kê của doanh nghiệp để quy đổi ra các số hiệu tài khoản quy định.",
      "Ví dụ: Từ khóa 'THANH TOAN TIEN BAN HONG HO' -> Nợ 1121 (Tiền gửi ngân hàng) / Có 131 (Phải thu khách hàng).",
      "Cho phép cấu hình ánh xạ thủ công rải rác trên giao dịch khi hệ thống không chắc chắn tự quyết định hạch toán."
    ],
    code: `// Hàm ánh xạ tự động hạch toán kép (JavaScript)
export function mapDoubleEntryRule(description, amount) {
  const descUpper = description.toUpperCase();
  
  // Mặc định Tài khoản Tiền gửi ngân hàng là Tài khoản nộp chính
  let debitAccount = "1121"; 
  let creditAccount = "131"; // Phải thu mặc định
  let label = "Thu tiền nợ khách hàng";

  if (amount < 0) {
    // Đây là khoản chi phát sinh
    debitAccount = "331"; // Chi trả nhà cung cấp mặc định
    creditAccount = "1121";
    label = "Chi tiền trả nhà cung cấp";
    
    if (descUpper.includes("LUONG") || descUpper.includes("PAYROLL")) {
      debitAccount = "334"; // Phải trả người lao động
      label = "Chi trả lương nhân sự";
    } else if (descUpper.includes("GUI XE") || descUpper.includes("UONG NUOC") || descUpper.includes("VPP")) {
      debitAccount = "642"; // Chi phí quản lý
      label = "Chi hoạt động văn phòng thô";
    }
  } else {
    // Đây là khoản thu phát sinh
    if (descUpper.includes("DOANH THU") || descUpper.includes("CHUYEN KHOAN MUA HANG")) {
      creditAccount = "5111"; // Doanh thu bán sản phẩm
      label = "Thu doanh thu bán sản phẩm";
    }
  }

  return {
    debit: debitAccount,
    credit: creditAccount,
    amount: Math.abs(amount),
    label: label
  };
}`,
    proTip: "Đối với hóa đơn có thuế VAT hạch toán kép tách dòng thuế riêng: Nợ 1331 (Thuế VAT khấu trừ) để giảm gánh nặng tính thuế ròng cuối năm."
  },
  {
    step: "Bước 5",
    title: "Lưu Trữ Star Schema Tối Ưu Phân Tích (PostgreSQL)",
    tools: ["Supabase SQL", "Postgres Views"],
    actions: [
      "Khởi tạo bảng Giao dịch Sổ cái (ledger) là bảng Fact chính, tham chiếu trơn tru khóa ngoại (Foreign key) sang bảng Danh mục tài khoản (dim_accounts).",
      "Tạo View báo cáo tài khoản động tự động tính toán tổng số tiền hạch toán phát sinh của các tài khoản Nợ-Có đầu tháng.",
      "Không cần cài đặt cơ sở dữ liệu nặng nề, Supabase cung cấp API RESTful trực tiếp gọi SELECT cực nhanh từ client."
    ],
    code: `-- SQL View tự động cân đối phát sinh Nợ Có từng tài khoản kế toán
CREATE VIEW view_balance_sheet AS
SELECT 
    acc.account_code,
    acc.account_name,
    acc.account_group,
    COALESCE(SUM(CASE WHEN l.debit_account = acc.account_code THEN l.amount ELSE 0 END), 0) AS total_debit,
    COALESCE(SUM(CASE WHEN l.credit_account = acc.account_code THEN l.amount ELSE 0 END), 0) AS total_credit,
    -- Tính số dư rực rỡ cuối kỳ (Tài sản: Nợ - Có / Nguồn vốn: Có - Nợ)
    CASE 
        WHEN acc.account_group IN ('Tài sản', 'Chi Phí') THEN 
            COALESCE(SUM(CASE WHEN l.debit_account = acc.account_code THEN l.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN l.credit_account = acc.account_code THEN l.amount ELSE 0 END), 0)
        ELSE
            COALESCE(SUM(CASE WHEN l.credit_account = acc.account_code THEN l.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN l.debit_account = acc.account_code THEN l.amount ELSE 0 END), 0)
    END AS final_balance
FROM dim_accounts acc
LEFT JOIN fact_ledger l ON (l.debit_account = acc.account_code OR l.credit_account = acc.account_code)
GROUP BY acc.account_code, acc.account_name, acc.account_group;`,
    proTip: "Thêm chỉ mục (INDEX) trên cột debit_account và credit_account để truy vấn cân sổ cái chỉ trong vài miliseconds khi hệ thống phình to."
  },
  {
    step: "Bước 6",
    title: "Cấu Hình Telegram Bot Cảnh Báo Âm Quỹ 0 VNĐ",
    tools: ["Telegram BotFather", "HTTP Fetch Request"],
    actions: [
      "Gặp @BotFather tạo một bot Telegram tùy ý, ghi lại mã API token bảo mật.",
      "Khởi tạo một group chat riêng tư trên Telegram của công ty, thêm bot này vào quản lý và lấy ID group (chat_id).",
      "Viết hàm trigger kích hoạt gửi thông điệp dạng hỏa tốc khi có giao dịch lớn phát sinh hoặc số dư quỹ tiền mặt xuống dưới ngưỡng an toàn."
    ],
    code: `// Hàm kích hoạt gửi cảnh báo khẩn cấp (Node.js/JS)
export async function sendTelegramNotify(transaction) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!BOT_TOKEN || !CHAT_ID) return;

  const msg = \`🚨 <b>HỆ THỐNG CẢNH BÁO LEGERFLOW 0Đ</b> 🚨
------------------------------------
📝 <i>Giao dịch bất thường phát sinh!</i>
------------------------------------
• Số chứng từ: \${transaction.journal_no}
• Nội dung: \${transaction.description}
• Định khoản: Nợ \${transaction.debit} / Có \${transaction.credit}
• Số tiền hạch toán: <b>\${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount)}</b>

⚠️ <u>Khuyến cáo:</u> Giao dịch chi phí cao vượt 5% ngân sách định kỳ. Boss vui lòng kiểm duyệt xem xét!\`;

  try {
    await fetch(\`https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: msg,
        parse_mode: "HTML"
      })
    });
  } catch (error) {
    console.error("Lỗi gửi Telegram Bot API:", error);
  }
}`,
    proTip: "Đặt webhook của Telegram Bot trực tiếp trên Vercel Serverless để xử lý phản hồi lệnh chat của sếp tự giao việc dọn sổ cái ngay từ app điện thoại!"
  }
];

export default function AIEcosystemArchitecture() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('gemini_ocr');
  const [activeWorkflowIdx, setActiveWorkflowIdx] = useState<number>(0);
  
  // Ecosystem state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'ai_agent' | 'existing_software' | 'database' | 'hosting'>('all');
  const [openedCookbookStep, setOpenedCookbookStep] = useState<number>(0);
  const [selectedEcosystemTool, setSelectedEcosystemTool] = useState<string>('gemini_studio');
  const [copiedCodeFlag, setCopiedCodeFlag] = useState<boolean>(false);
  const [selectedConfigType, setSelectedConfigType] = useState<'docker' | 'github_central' | 'gdrive_storage'>('docker');
  
  // Custom interactive states for Section 6 (SOP Folder Routing & Context Pollution Protection)
  const [strictSOP, setStrictSOP] = useState<boolean>(true);
  const [aiDirSubTab, setAiDirSubTab] = useState<'system'|'working'|'skills_agents'>('system');

  const activeNode = DIAGRAM_NODES.find(n => n.id === selectedNodeId) || DIAGRAM_NODES[0];
  const activeEcosystemTool = FREE_TOOL_DIRECTORY.find(t => t.id === selectedEcosystemTool) || FREE_TOOL_DIRECTORY[0];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'raw': return 'from-amber-600/20 via-amber-950/10 to-transparent border-amber-500/30 text-amber-400';
      case 'ai': return 'from-purple-650/20 via-purple-950/10 to-transparent border-purple-500/30 text-purple-400';
      case 'etl': return 'from-sky-600/20 via-sky-950/10 to-transparent border-sky-500/30 text-sky-450';
      case 'double_entry': return 'from-indigo-600/20 via-indigo-950/10 to-transparent border-indigo-500/30 text-indigo-400';
      case 'dw': return 'from-emerald-600/20 via-emerald-950/10 to-transparent border-emerald-500/30 text-emerald-400';
      case 'alert': return 'from-rose-600/20 via-rose-950/10 to-transparent border-rose-500/30 text-rose-455';
      default: return 'from-slate-650/20 via-slate-950/10 to-transparent border-slate-500/30 text-slate-400';
    }
  };

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'raw': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'ai': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'etl': return 'bg-sky-500/10 text-sky-450 border border-sky-500/20';
      case 'double_entry': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'dw': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'alert': return 'bg-rose-500/10 text-rose-455 border border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // Filter ecosystem listing
  const filteredTools = FREE_TOOL_DIRECTORY.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tool.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tool.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tool.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeFlag(true);
    setTimeout(() => setCopiedCodeFlag(false), 2000);
  };  return (
    <div className="space-y-6 text-slate-100 select-text pb-12">
      
      {/* 1. Header Hero Panel */}
      <section className="bg-gradient-to-r from-purple-950/20 via-[#060a12] to-emerald-950/20 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl animate-pulse"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-purple-500/5 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-start gap-4 md:items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-500/5">
              <Network className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-widest flex items-center gap-2">
                🕸️ HỆ SINH THÁI AI & QUY TRÌNH 0đ THỰC CHIẾN
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-black rounded font-mono">INTEGRATION MAP</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-4xl font-semibold">
                Toàn bộ hướng dẫn tích hợp, lắp ghép các <strong>nền tảng AI</strong>, <strong>AI agent tự hoạt động</strong>, <strong>phần mềm web hiện hữu</strong>, <strong>kho dữ liệu đám mây</strong> hoàn toàn không tốn một đồng vận hành. Giúp một Solo Founder kiểm đếm dòng tiền, làm sạch sao kê và phục vụ hàng trăm khách hàng SME trơn tru!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TABULAR VIEW OF THE APPLICATION SYSTEM DESIGN */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Interactive Flow Map Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-mono">
                <Workflow className="w-4 h-4 text-purple-400" />
                Sự Chuyển Động Dữ Liệu Sổ Sách Thực Tế
              </span>
              <span className="bg-[#0e2133] text-sky-450 text-[9.5px] font-bold px-2 py-0.5 rounded border border-sky-500/20 uppercase font-mono">
                Data Lineage
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-4">
              * Nhấn chuột vào từng nút mốc trạm phía dưới để kiểm tra sâu cơ chế hạch toán, pháp chế kế toán kiểm toán Việt Nam và cách kết nối API:
            </p>

            {/* Simulated Dataflow SVG-like CSS Nodes */}
            <div className="space-y-4 font-sans">
              {/* Node Row 1: Source Raw Input and Google Drive Cloud Backup */}
              <div className="grid grid-cols-11 items-center gap-2">
                <button
                  onClick={() => setSelectedNodeId('source_raw')}
                  className={`col-span-5 p-3.5 rounded-xl border transition-all text-left relative overflow-hidden group ${
                    selectedNodeId === 'source_raw'
                      ? 'bg-amber-500/10 border-amber-400 shadow-lg ring-1 ring-amber-500/30'
                      : 'bg-[#060b13] border-slate-850 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="absolute right-1 top-1 text-[8px] font-bold font-mono text-amber-500/40">RAW</div>
                  <span className={`text-[11.5px] font-extrabold block truncate ${selectedNodeId === 'source_raw' ? 'text-amber-400' : 'text-slate-205'}`}>
                    1. Chứng Từ Thô Sơ
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate block mt-0.5">XML Tổng Cục Thuế / Sao kê</span>
                </button>

                <div className="col-span-1 flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 animate-pulse text-amber-500" />
                </div>

                <button
                  onClick={() => setSelectedNodeId('google_drive_cloud')}
                  className={`col-span-5 p-3.5 rounded-xl border transition-all text-left relative overflow-hidden group ${
                    selectedNodeId === 'google_drive_cloud'
                      ? 'bg-sky-500/10 border-sky-400 shadow-lg ring-1 ring-sky-500/30'
                      : 'bg-[#060b13] border-slate-850 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="absolute right-1 top-1 text-[8px] font-bold font-mono text-sky-500/45 animate-pulse">DRIVE 0đ</div>
                  <span className={`text-[11.5px] font-extrabold block truncate ${selectedNodeId === 'google_drive_cloud' ? 'text-sky-400' : 'text-slate-205'}`}>
                    2. Google Drive Storage
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate block mt-0.5">Lưu file gốc & Backup SQLite</span>
                </button>
              </div>

              {/* Connector line row */}
              <div className="grid grid-cols-11">
                <div className="col-span-5"></div>
                <div className="col-span-1"></div>
                <div className="col-span-5 flex justify-center py-1">
                  <div className="w-0.5 h-3.5 border-l-2 border-dashed border-slate-750"></div>
                </div>
              </div>

              {/* Node Row 2: AI Parser & Pandas Clean */}
              <div className="grid grid-cols-11 items-center gap-2">
                <button
                  onClick={() => setSelectedNodeId('gemini_ocr')}
                  className={`col-span-5 p-3.5 rounded-xl border transition-all text-left relative overflow-hidden group ${
                    selectedNodeId === 'gemini_ocr'
                      ? 'bg-purple-500/10 border-purple-500 shadow-lg ring-1 ring-purple-500/30'
                      : 'bg-[#060b13] border-slate-850 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="absolute right-1 top-1 text-[8px] font-bold font-mono text-purple-500/40 animate-pulse">AI AGENT</div>
                  <span className={`text-[11.5px] font-extrabold block truncate ${selectedNodeId === 'gemini_ocr' ? 'text-purple-400' : 'text-slate-205'}`}>
                    3. Trực Quan AI Parser
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate block mt-0.5">Gemini phân tách cấu trúc JSON</span>
                </button>

                <div className="col-span-1 flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-purple-550" />
                </div>

                <button
                  onClick={() => setSelectedNodeId('pandas_etl')}
                  className={`col-span-5 p-3.5 rounded-xl border transition-all text-left relative overflow-hidden group ${
                    selectedNodeId === 'pandas_etl'
                      ? 'bg-sky-500/10 border-sky-400 shadow-lg ring-1 ring-sky-500/30'
                      : 'bg-[#060b13] border-slate-850 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="absolute right-1 top-1 text-[8px] font-bold font-mono text-sky-500/40">ETL</div>
                  <span className={`text-[11.5px] font-extrabold block truncate ${selectedNodeId === 'pandas_etl' ? 'text-sky-400' : 'text-slate-205'}`}>
                    4. Pandas Làm Sạch
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate block mt-0.5">Dọn đ, định dạng ngày chuẩn SQL</span>
                </button>
              </div>

              {/* Connector line row */}
              <div className="grid grid-cols-11">
                <div className="col-span-5"></div>
                <div className="col-span-1"></div>
                <div className="col-span-5 flex justify-center py-1">
                  <div className="w-0.5 h-3.5 border-l-2 border-dashed border-slate-750"></div>
                </div>
              </div>

              {/* Node Row 3: Rule Mapping & GitHub Central Source */}
              <div className="grid grid-cols-11 items-center gap-2">
                <button
                  onClick={() => setSelectedNodeId('double_entry')}
                  className={`col-span-5 p-3.5 rounded-xl border transition-all text-left relative overflow-hidden group ${
                    selectedNodeId === 'double_entry'
                      ? 'bg-indigo-500/10 border-indigo-400 shadow-lg ring-1 ring-indigo-500/30'
                      : 'bg-[#060b13] border-slate-850 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="absolute right-1 top-1 text-[8px] font-bold font-mono text-indigo-500/40">LAWS</div>
                  <span className={`text-[11.5px] font-extrabold block truncate ${selectedNodeId === 'double_entry' ? 'text-indigo-400' : 'text-slate-205'}`}>
                    5. Định Khoản Kép 200
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate block mt-0.5">Xác định Nợ - Có tài khoản ròng</span>
                </button>

                <div className="col-span-1 flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>

                <button
                  onClick={() => setSelectedNodeId('github_central')}
                  className={`col-span-5 p-3.5 rounded-xl border transition-all text-left relative overflow-hidden group ${
                    selectedNodeId === 'github_central'
                      ? 'bg-purple-500/10 border-purple-500 shadow-lg ring-1 ring-purple-500/30'
                      : 'bg-[#060b13] border-slate-850 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="absolute right-1 top-1 text-[8px] font-bold font-mono text-purple-500/40 animate-pulse">CENTRAL HUB</div>
                  <span className={`text-[11.5px] font-extrabold block truncate ${selectedNodeId === 'github_central' ? 'text-purple-400' : 'text-slate-205'}`}>
                    6. GitHub Central Source
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate block mt-0.5">Đầu mối code & flat-file DB</span>
                </button>
              </div>

              {/* Connector line row */}
              <div className="grid grid-cols-11">
                <div className="col-span-5 flex justify-center py-1">
                  <div className="w-0.5 h-3.5 border-l-2 border-dashed border-slate-755"></div>
                </div>
                <div className="col-span-1"></div>
                <div className="col-span-5"></div>
              </div>

              {/* Node Row 4: Star Schema Storage & Alerts Telegram */}
              <div className="grid grid-cols-11 items-center gap-2">
                <button
                  onClick={() => setSelectedNodeId('star_dw')}
                  className={`col-span-5 p-3.5 rounded-xl border transition-all text-left relative overflow-hidden group ${
                    selectedNodeId === 'star_dw'
                      ? 'bg-emerald-500/10 border-emerald-400 shadow-lg ring-1 ring-emerald-500/30'
                      : 'bg-[#060b13] border-slate-850 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="absolute right-1 top-1 text-[8px] font-bold font-mono text-emerald-500/40">SQL STORE</div>
                  <span className={`text-[11.5px] font-extrabold block truncate ${selectedNodeId === 'star_dw' ? 'text-emerald-400' : 'text-slate-205'}`}>
                    7. Star Schema Storage
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate block mt-0.5">Cất kho Supabase Postgres 0đ</span>
                </button>

                <div className="col-span-1 flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>

                <button
                  onClick={() => setSelectedNodeId('alerts_bi')}
                  className={`col-span-5 p-3.5 rounded-xl border transition-all text-left relative overflow-hidden group ${
                    selectedNodeId === 'alerts_bi'
                      ? 'bg-rose-500/10 border-rose-400 shadow-lg ring-1 ring-rose-500/30'
                      : 'bg-[#060b13] border-slate-850 hover:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="absolute right-1 top-1 text-[8px] font-bold font-mono text-rose-500/40">TELE BOT</div>
                  <span className={`text-[11.5px] font-extrabold block truncate ${selectedNodeId === 'alerts_bi' ? 'text-rose-400' : 'text-slate-250'}`}>
                    8. Cảnh Báo Telegram
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate block mt-0.5">Báo Boss dòng tiền biến động</span>
                </button>
              </div>

            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic mt-6 border-t border-slate-850/60 pt-3 flex items-center justify-between">
            <span>* Bấm chọn các nút trạm phía trên để mở bảng thuyết minh quy định pháp lý tương ứng.</span>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 rounded">FLOW MAP READY</span>
          </p>
        </div>

        {/* Selected Node Details (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono">
                  Chi Tiết Trạm Xử Lý Số Liệu
                </span>
                <span className={getBadgeColor(activeNode.category) + " text-[9px] font-black px-2 py-0.5 rounded font-mono uppercase"}>
                  {activeNode.category}
                </span>
              </div>

              <div className={`p-4 rounded-xl border bg-gradient-to-br ${getCategoryColor(activeNode.category)} space-y-3`}>
                <h3 className="text-sm font-black text-white">{activeNode.title}</h3>
                
                <div className="space-y-1">
                  <span className="text-[9.5px] uppercase font-mono text-slate-400 font-bold block">Công nghệ vận hành:</span>
                  <div className="px-2.5 py-1 bg-slate-950/80 rounded border border-slate-850/80 text-slate-200 font-mono text-[10.5px] font-bold inline-block">
                    {activeNode.tech}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs text-slate-300 leading-relaxed font-semibold">
                  <span className="text-[9.5px] uppercase font-mono text-slate-400 font-bold block mb-0.5">Nhiệm vụ cốt lõi:</span>
                  <p>{activeNode.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/30 space-y-1">
                  <span className="text-[9.5px] uppercase font-mono text-purple-400 font-black flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Bảo chứng Quy Định Pháp Lý Việt Nam:
                  </span>
                  <p className="text-[11px] text-slate-350 font-medium leading-relaxed font-sans">
                    {activeNode.vietStandard}
                  </p>
                </div>
              </div>

              {/* Operating Cost Card */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Chi Phí Hoạt Động (Operating Cost):</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-black text-[11px] font-mono">
                  {activeNode.cost}
                </span>
              </div>
            </div>

            <div className="bg-[#050a12]/50 border border-slate-850 p-3.5 rounded-xl space-y-1 mt-4">
              <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Mẹo giữ an toàn dữ liệu thuế:
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Khi bóc tách bằng AI bối cảnh Việt Nam, luôn đặt tham số <code className="text-purple-400">temperature: 0</code> để ép mô hình hạch toán chuẩn xác logic số học từ hóa đơn, không bao giờ bịa đặt!
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 3. CORE EXHAUSTIVE DIRECTORY OF 0đ AI & EXISTING SOFTWARE TOOLS */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute left-0 top-0 -mt-8 -ml-8 w-24 h-24 rounded-full bg-purple-500/5 blur-2xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-6">
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-mono">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Bản Đồ Tập Hợp Toàn Bộ Nền Tảng AI & Phần Mềm Hiện Hữu 0đ
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
              Tất cả các kho dữ liệu, hệ điều hành AI agent, hosting đám mây và kịch bản tự động hóa <strong>không mất phí vận hành</strong> của Solo Founder.
            </p>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', name: 'Tất cả 0đ Stack' },
              { id: 'ai_agent', name: 'Nền tảng AI / Agent' },
              { id: 'existing_software', name: 'Ứng dụng / Softwares' },
              { id: 'database', name: 'Cơ sở dữ liệu đám mây' },
              { id: 'hosting', name: 'Web Host & Run logic' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                  filterCategory === tab.id 
                    ? 'bg-emerald-600 border border-emerald-500 text-white shadow' 
                    : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-white'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search tool block */}
        <div className="relative mb-6 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
            <Search className="w-4 h-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm công cụ (ví dụ: Gemini, Supabase, Sheets)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>

        {/* Directory Grid */}
        <div className="grid md:grid-cols-12 gap-6 items-stretch">
          
          {/* Tool Card List (Left) - 5 cols */}
          <div className="md:col-span-5 space-y-2 max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-2">
            {filteredTools.map(tool => {
              const isSelected = selectedEcosystemTool === tool.id;
              let catBadge = "bg-purple-500/10 text-purple-400";
              if (tool.category === 'database') catBadge = "bg-emerald-500/10 text-emerald-400";
              if (tool.category === 'hosting') catBadge = "bg-sky-500/10 text-sky-400";
              if (tool.category === 'existing_software') catBadge = "bg-amber-500/10 text-amber-400";

              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setSelectedEcosystemTool(tool.id);
                    setCopiedCodeFlag(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isSelected 
                      ? 'bg-emerald-505/10 border-emerald-500 ring-1 ring-emerald-500/30' 
                      : 'bg-[#060a12]/80 border-slate-850/80 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-100 block truncate">{tool.name}</span>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${catBadge} uppercase shrink-0 font-mono`}>
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-450 truncate font-semibold">Tác vụ: {tool.role}</p>
                    <span className="text-[9px] text-emerald-450 font-black block font-mono">Hạn ngạch rực rỡ: {tool.freeTierLimit}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 self-center ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                </button>
              );
            })}

            {filteredTools.length === 0 && (
              <div className="text-center py-10 bg-slate-950/20 border border-slate-850 rounded-xl text-slate-500 text-xs font-semibold">
                Không tìm thấy nền tảng 0đ hay AI agent khớp từ khóa tìm kiếm.
              </div>
            )}
          </div>

          {/* Active Tool Cookbook Detailing & Integration Code (Right) - 7 cols */}
          <div className="md:col-span-7 bg-[#050912]/80 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <div>
                  <span className="text-[9.5px] font-black text-emerald-400 uppercase font-mono block">CÔNG THỨC NẠP GIAO DIỆN & TỰ ĐỘNG HẬCH TOÁN</span>
                  <h3 className="text-sm font-black text-white">{activeEcosystemTool.name}</h3>
                </div>
                {activeEcosystemTool.link && (
                  <a
                    href={activeEcosystemTool.link}
                    target="_blank"
                    rel="no-referrer"
                    className="p-1.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-emerald-400 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Mở Landing 0đ</span>
                  </a>
                )}
              </div>

              <div className="space-y-3 font-semibold text-xs text-slate-300 leading-relaxed">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Nhà cung cấp dột phá:</span>
                  <p className="text-slate-100 font-bold">{activeEcosystemTool.provider}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Vận hành chức năng:</span>
                  <p>{activeEcosystemTool.role}</p>
                </div>

                <div className="bg-slate-950/80 p-3.5 border border-slate-850/80 rounded-xl">
                  <span className="text-[10px] uppercase font-mono text-emerald-400 font-black tracking-wider block mb-1">CỦA LIÊN KẾT 0đ (Cook Recipe Recipe):</span>
                  <p className="text-slate-350">{activeEcosystemTool.cookRecipe}</p>
                </div>

                {activeEcosystemTool.codeSnippet && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] uppercase font-mono text-purple-400 font-black flex items-center gap-1">
                        <Code className="w-3.5 h-3.5" />
                        Mẫu Code / Prompt Liên Kết Mấu Chốt:
                      </span>
                      <button
                        onClick={() => handleCopyCode(activeEcosystemTool.codeSnippet!)}
                        className="text-[9px] font-bold text-slate-400 hover:text-white bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800"
                      >
                        {copiedCodeFlag ? "✓ Đã copy" : "Copy code"}
                      </button>
                    </div>
                    <pre className="p-3.5 bg-slate-950 rounded-xl text-[10.5px] font-mono text-slate-300 leading-relaxed overflow-x-auto border border-slate-850 font-medium">
                      {activeEcosystemTool.codeSnippet}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-850 flex items-center gap-2 text-[10.5px] text-slate-500 italic">
              <span>* Tự do tích hợp tất cả các modules ròng rã này để ép chi phí cơ sở hạ tầng về ranh giới 0đ tuyệt đối.</span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. ULTIMATE DETAILED COOKBOOK RECIPES FOR ALL STEPS (STEP WRITER) */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="border-b border-slate-850 pb-4 mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-mono">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Cẩm Nang Quy Trình Tích Hợp Chi Tiết Từng Bước (Công Cụ Nào? Dùng Thế Nào?)
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Kéo dãn các trạm từ 1 đến 6 để mổ xẻ mã nguồn hạch toán, an toàn quy cách hóa đơn VAT, tránh phạt hành chính kế toán.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {COOKBOOK_STEPS.map((step, idx) => {
              const isOpen = openedCookbookStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setOpenedCookbookStep(idx)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border ${
                    isOpen 
                      ? 'bg-purple-600/15 border-purple-500 text-white shadow-lg' 
                      : 'bg-slate-950 border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {step.step}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Cook step active block */}
        <div className="bg-[#050a12]/80 border border-slate-850 p-5 rounded-2xl grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Directions / Explanations (6 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-purple-600/15 border border-purple-500/30 text-purple-400 font-mono font-black text-[10px] tracking-widest rounded-lg">
                  {COOKBOOK_STEPS[openedCookbookStep].step}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-slate-100 font-sans">
                  {COOKBOOK_STEPS[openedCookbookStep].title}
                </h3>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Tổng hợp công cụ dùng cho bước này:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COOKBOOK_STEPS[openedCookbookStep].tools.map((t, tIdx) => (
                    <span key={tIdx} className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-black rounded-lg font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-350 leading-relaxed font-semibold">
                <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block mb-1">Trình tự thao tác chuẩn mực (Step-by-step Guide):</span>
                {COOKBOOK_STEPS[openedCookbookStep].actions.map((act, aIdx) => (
                  <div key={aIdx} className="flex gap-2.5 items-start">
                    <span className="w-5 h-5 rounded-full bg-slate-950 border border-dashed border-slate-800 text-[10px] font-mono font-bold text-slate-500 flex items-center justify-center shrink-0 mt-0.5 select-none">
                      {aIdx + 1}
                    </span>
                    <p className="text-slate-300 font-sans font-medium">{act}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0b1411]/80 border border-emerald-950 p-4 rounded-xl mt-4 space-y-1 select-text">
              <span className="text-[9.5px] uppercase font-mono text-emerald-400 font-black tracking-widest block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Mẹo siêu tiết kiệm ngân sách (Saving Hack):
              </span>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                {COOKBOOK_STEPS[openedCookbookStep].proTip}
              </p>
            </div>
          </div>

          {/* Code panel (7 cols) */}
          <div className="lg:col-span-7 bg-[#03060c] rounded-xl border border-slate-850 p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-[9px] uppercase font-mono text-purple-400 font-black tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-purple-400" />
                  Mã Nguồn Cốt Lõi / Trình Điều Khiển Thần Thánh
                </span>
                <button
                  onClick={() => handleCopyCode(COOKBOOK_STEPS[openedCookbookStep].code)}
                  className="text-[9px] font-black text-slate-450 hover:text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-850/80"
                >
                  Copy code
                </button>
              </div>

              <pre className="p-3.5 rounded-xl text-[10px] font-mono text-slate-300 leading-relaxed overflow-x-auto min-h-[220px] max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {COOKBOOK_STEPS[openedCookbookStep].code}
              </pre>
            </div>

            <div className="text-[9.5px] text-slate-500 italic pt-2 border-t border-slate-900 font-mono text-right flex justify-between">
              <span>* Ngôn ngữ đề xuất: Python Pandas / TypeScript NodeJS</span>
              <span>LEGERFLOW CODES v26</span>
            </div>
          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE CO-DESIGN WORKFLOW / TRIGGERS PLAYGROUND */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 -mb-10 -mr-10 w-36 h-36 rounded-full bg-purple-500/5 blur-3xl"></div>
        
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 border-b border-slate-850 pb-3 mb-4 flex items-center gap-1.5 font-mono">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Lắp Ghép Trình Kích Hoạt Tự Động (Automation Agent Trigger Playbook)
        </h2>

        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl font-semibold mb-6">
          Giả lập liên thông tín hiệu từ lúc đối tác gửi hóa đơn VAT về Email công ty, qua trạm bóc tách nợ-có và cập nhật thông tin về Google Sheet hay thông báo khẩn cấp cho sếp:
        </p>

        {/* Visual Pipeline Flows representation */}
        <div className="grid md:grid-cols-4 gap-4 items-center">
          
          {/* Trạm 1 */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2 text-center relative overflow-hidden">
            <div className="absolute top-1 right-2 text-[8px] font-black font-mono text-slate-500">TRẠM 1</div>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-black text-slate-100 block">Email Hóa Đơn Mới</span>
              <span className="text-[9px] text-slate-450 font-bold block mt-0.5">Một file XML/PDF VAT nạp về hòm thư</span>
            </div>
          </div>

          {/* Flow transition icon */}
          <div className="hidden md:flex justify-center text-slate-600 animate-pulse">
            <ArrowRight className="w-5 h-5 text-purple-400" />
          </div>

          {/* Trạm 2 */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2 text-center relative overflow-hidden">
            <div className="absolute top-1 right-2 text-[8px] font-black font-mono text-slate-500">TRẠM 2</div>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <Cpu className="w-4 h-4 text-purple-400 animate-spin" />
            </div>
            <div>
              <span className="text-[11px] font-black text-slate-100 block">AI Agent Bóc Tách</span>
              <span className="text-[9px] text-slate-450 font-bold block mt-0.5">Gemini phân tách JSON hạch toán</span>
            </div>
          </div>

          {/* Flow transition icon */}
          <div className="hidden md:flex justify-center text-slate-600 animate-pulse">
            <ArrowRight className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Trạm 3 */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2 text-center relative overflow-hidden">
            <div className="absolute top-1 right-2 text-[8px] font-black font-mono text-slate-500">TRẠM 3</div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-black text-slate-100 block">Sổ Sách Google Sheet</span>
              <span className="text-[9px] text-slate-450 font-bold block mt-0.5">Đẩy thông tin ghi dòng Nợ - Có chuẩn</span>
            </div>
          </div>

          {/* Flow transition icon */}
          <div className="hidden md:flex justify-center text-slate-600 animate-pulse">
            <ArrowRight className="w-5 h-5 text-rose-400" />
          </div>

          {/* Trạm 4 */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2 text-center relative overflow-hidden">
            <div className="absolute top-1 right-2 text-[8px] font-black font-mono text-slate-500">TRẠM 4</div>
            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Smartphone className="w-4 h-4 text-rose-400 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-black text-slate-100 block">Cảnh Báo Telegram</span>
              <span className="text-[9px] text-slate-450 font-bold block mt-0.5">Điện thoại sếp rung báo biến động 0đ</span>
            </div>
          </div>

        </div>

        {/* Real life value box */}
        <div className="mt-5 p-4 bg-emerald-500/5 border border-emerald-950 rounded-xl text-xs flex gap-3 items-center">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-slate-300 font-semibold leading-relaxed">
            <strong>Bảo chứng kết nối ròng 0 VNĐ:</strong> Toàn bộ kịch bản liên thông tự động hóa 4 trạm này có thể setup hoàn toàn miễn phí bằng cách kết hợp <strong>Google Apps Script</strong> kết nối API của <strong>Gemini Free Key</strong>, lưu trữ miễn phí <strong>Supabase</strong>, và gọi bot <strong>Telegram webhook</strong>. Giúp bạn rảnh tay tập trung mở rộng quy mô kinh doanh!
          </p>
        </div>
      </section>

      {/* 5. ADVANCED COMPLIANCE & 0đ BLUEPRINT GENERATOR - PRO LEVEL EXTRA */}
      <section className="bg-gradient-to-t from-slate-950/40 via-slate-900/40 to-slate-950/20 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 -mb-10 -mr-10 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl"></div>
        <div className="absolute left-0 top-0 -mt-10 -ml-10 w-44 h-44 rounded-full bg-purple-500/5 blur-3xl"></div>
        
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Config Generator */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase font-mono block tracking-widest">PRO LEVEL PRODUCTION EXTRAS</span>
              <h2 className="text-sm font-black uppercase text-slate-100 mt-1 flex items-center gap-1.5 font-sans">
                🛠️ Bộ Tạo Cấu Hình & Deploy Sập Sàn 0đ (Blueprint Exporter)
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                Lựa chọn nền tảng bạn mong muốn triển khai để sinh mẫu file cấu hình hoàn chỉnh ngay tại chỗ. Tải lên Github hoặc nhúng thẳng để chạy hạch toán tự động 24/7!
              </p>
            </div>

            {/* Selector Option tabs */}
            <div className="flex gap-2 border-b border-slate-850 pb-3 mt-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedConfigType('docker')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                  selectedConfigType === 'docker'
                    ? 'bg-emerald-500/10 border-emerald-550/40 text-emerald-400'
                    : 'bg-slate-950 border-transparent text-slate-400 hover:text-white'
                }`}
              >
                HuggingFace (Dockerfile Streamlit)
              </button>
              <button
                onClick={() => setSelectedConfigType('github_central')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                  selectedConfigType === 'github_central'
                    ? 'bg-purple-500/10 border-purple-550/40 text-purple-400'
                    : 'bg-slate-950 border-transparent text-slate-400 hover:text-white'
                }`}
              >
                GitHub Central Hub (GitOps & Flat DB)
              </button>
              <button
                onClick={() => setSelectedConfigType('gdrive_storage')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                  selectedConfigType === 'gdrive_storage'
                    ? 'bg-sky-500/10 border-sky-550/40 text-sky-450'
                    : 'bg-slate-950 border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Google Drive Storage (GAS Invoice Vault)
              </button>
            </div>

            {/* Config Output block */}
            <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-450" />
                  {selectedConfigType === 'docker' && 'Dockerfile - Host Python Pandas 0đ trên HF Space'}
                  {selectedConfigType === 'github_central' && '.github/workflows/central-sync.yml - GitHub Central Pipeline'}
                  {selectedConfigType === 'gdrive_storage' && 'Google Apps Script Drive & GitHub API Integration Webhook'}
                </span>
                <button
                  onClick={() => {
                    const codes: Record<string, string> = {
                      docker: `FROM python:3.9-slim\nWORKDIR /app\nRUN apt-get update && apt-get install -y \\\n    build-essential \\\n    libpq-dev \\\n    && rm -rf /var/lib/apt/lists/*\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 7860\n# Chạy Streamlit trên cổng mặc định của Hugging Face Spaces (7860)\nCMD ["streamlit", "run", "app.py", "--server.port=7860", "--server.address=0.0.0.0"]`,
                      github_central: `name: GitHub Central Source of Truth Sync Pipeline\non:\n  push:\n    branches: [ main ]\n  schedule:\n    - cron: '0 0 * * *' # Chạy đồng bộ dữ liệu phẳng định kỳ hằng ngày tự động về repo\njobs:\n  sync_and_deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout Code Base & Flat DB\n        uses: actions/checkout@v3\n\n      - name: Sync flat-file data from SQLite / Google Drive App\n        run: |\n          echo "🔄 Khởi động module đồng bộ flat-file hạch toán về GitHub..."\n          # Script python tự động tải database SQLite mới nhất và chuyển đổi thành csv phẳng để lưu lịch sử\n          python sync_data_to_git.py || echo "Không có thay đổi dữ liệu"\n\n      - name: Commit & Push Data Changes\n        run: |\n          git config --global user.name "LedgerFlow AutoBot"\n          git config --global user.email "bot@ledgerflow.github.com"\n          git add data/incoming/ data/reports/\n          git commit -m "🤖 [AutoSync] Đồng bộ dữ liệu sổ sách thực tế ngày \$(date +'%d-%m-%Y') [skip ci]" || echo "Không có thay đổi"\n          git push origin main\n\n      - name: Deploy Production to Cloud Hosting\n        run: |\n          echo "🚀 Kích hoạt Deploy Vercel cho bản code và database tĩnh tích hợp..."\n          npm install --global vercel\n          vercel deploy --prod --yes --token=\\$\\{{ secrets.VERCEL_TOKEN }\\}`,
                      gdrive_storage: `// GAS Trình quét Gmail bóc hóa đơn lên Drive 0đ & Đẩy hạch toán JSON + Chứng từ Drive Url về GitHub\nfunction processInvoiceAndBackupToDrive() {\n  var folderId = "YOUR_GOOGLE_DRIVE_FOLDER_ID"; // Thư mục lưu trữ mốc hóa đơn trên Google Drive\n  var folder = DriveApp.getFolderById(folderId);\n  \n  // 1. Quét tìm email chứa hóa đơn đỏ chưa đọc\n  var threads = GmailApp.search("subject:'Hóa đơn điện tử' is:unread");\n  for (var i = 0; i < threads.length; i++) {\n    var messages = threads[i].getMessages();\n    for (var j = 0; j < messages.length; j++) {\n      var attachments = messages[j].getAttachments();\n      for (var k = 0; k < attachments.length; k++) {\n        var file = attachments[k];\n        if (file.getName().endsWith(".xml") || file.getName().endsWith(".pdf")) {\n          // Tải file gốc lên Google Drive lưu trữ 10 năm\n          var driveFile = folder.createFile(file);\n          var driveUrl = driveFile.getUrl();\n          Logger.log("📁 Đã lưu trữ hóa đơn điện tử gốc lên Drive: " + driveUrl);\n          \n          // Trích xuất Base64 để gửi sang Gemini API\n          var base64Data = Utilities.base64Encode(file.getBytes());\n          var geminiResult = callGeminiToParseInvoice(base64Data, file.getContentType());\n          \n          // 2. Gửi kết quả JSON và liên kết Google Drive sang Github Central Hub để hạch toán\n          pushDataToGithubCentral(geminiResult, driveUrl);\n        }\n      }\n      messages[j].markRead();\n    }\n  }\n}\n\nfunction pushDataToGithubCentral(parsedJson, driveUrl) {\n  var githubRepo = "owner/ledgerflow-data-vault";\n  var filePath = "data/incoming/" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + ".json";\n  var accessToken = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN";\n  \n  var payload = {\n    message: "🤖 Đẩy thông tư giao dịch hạch toán mới kèm link chứng từ Drive",\n    content: Utilities.base64Encode(JSON.stringify({\n      accounting_data: JSON.parse(parsedJson),\n      evidence_google_drive_link: driveUrl,\n      logged_at: new Date().toISOString()\n    }, null, 2)),\n    branch: "main"\n  };\n  \n  var options = {\n    method: "put",\n    contentType: "application/json",\n    headers: { "Authorization": "token " + accessToken },\n    payload: JSON.stringify(payload)\n  };\n  \n  UrlFetchApp.fetch("https://api.github.com/repos/" + githubRepo + "/contents/" + filePath, options);\n}`
                    };
                    handleCopyCode(codes[selectedConfigType]);
                  }}
                  className="text-[9.5px] font-black text-emerald-400 hover:text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded transition-all"
                >
                  Copy Blueprint
                </button>
              </div>

              <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto max-h-[190px] scrollbar-thin scrollbar-thumb-slate-800 leading-relaxed font-semibold">
                {selectedConfigType === 'docker' && `FROM python:3.9-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \\
    build-essential \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 7860
# Chạy Streamlit trên cổng mặc định của Hugging Face Spaces (7860)
CMD ["streamlit", "run", "app.py", "--server.port=7860", "--server.address=0.0.0.0"]`}
                {selectedConfigType === 'github_central' && `name: GitHub Central Source of Truth Sync Pipeline
on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *' # Chạy đồng bộ dữ liệu phẳng định kỳ hằng ngày tự động về repo
jobs:
  sync_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code Base & Flat DB
        uses: actions/checkout@v3

      - name: Sync flat-file data from SQLite / Google Drive App
        run: |
          echo "🔄 Khởi động module đồng bộ flat-file hạch toán về GitHub..."
          # Script python tự động tải database SQLite mới nhất và chuyển đổi thành csv phẳng để lưu lịch sử
          python sync_data_to_git.py || echo "Không có thay đổi dữ liệu"

      - name: Commit & Push Data Changes
        run: |
          git config --global user.name "LedgerFlow AutoBot"
          git config --global user.email "bot@ledgerflow.github.com"
          git add data/incoming/ data/reports/
          git commit -m "🤖 [AutoSync] Đồng bộ dữ liệu sổ sách thực tế ngày \$(date +'%d-%m-%Y') [skip ci]" || echo "Không có thay đổi"
          git push origin main

      - name: Deploy Production to Cloud Hosting
        run: |
          echo "🚀 Kích hoạt Deploy Vercel cho bản code và database tĩnh tích hợp..."
          npm install --global vercel
          vercel deploy --prod --yes --token=\\$\\{{ secrets.VERCEL_TOKEN }\\}`}
                {selectedConfigType === 'gdrive_storage' && `// GAS Trình quét Gmail bóc hóa đơn lên Drive 0đ & Đẩy hạch toán JSON + Chứng từ Drive Url về GitHub
function processInvoiceAndBackupToDrive() {
  var folderId = "YOUR_GOOGLE_DRIVE_FOLDER_ID"; // Thư mục lưu trữ mốc hóa đơn trên Google Drive
  var folder = DriveApp.getFolderById(folderId);
  
  // 1. Quét tìm email chứa hóa đơn đỏ chưa đọc
  var threads = GmailApp.search("subject:'Hóa đơn điện tử' is:unread");
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      var attachments = messages[j].getAttachments();
      for (var k = 0; k < attachments.length; k++) {
        var file = attachments[k];
        if (file.getName().endsWith(".xml") || file.getName().endsWith(".pdf")) {
          // Tải file gốc lên Google Drive lưu trữ 10 năm
          var driveFile = folder.createFile(file);
          var driveUrl = driveFile.getUrl();
          Logger.log("📁 Đã lưu trữ hóa đơn điện tử gốc lên Drive: " + driveUrl);
          
          // Trích xuất Base64 để gửi sang Gemini API
          var base64Data = Utilities.base64Encode(file.getBytes());
          var geminiResult = callGeminiToParseInvoice(base64Data, file.getContentType());
          
          // 2. Gửi kết quả JSON và liên kết Google Drive sang Github Central Hub để hạch toán
          pushDataToGithubCentral(geminiResult, driveUrl);
        }
      }
      messages[j].markRead();
    }
  }
}

function pushDataToGithubCentral(parsedJson, driveUrl) {
  var githubRepo = "owner/ledgerflow-data-vault";
  var filePath = "data/incoming/" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + ".json";
  var accessToken = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN";
  
  var payload = {
    message: "🤖 Đẩy thông tư giao dịch hạch toán mới kèm link chứng từ Drive",
    content: Utilities.base64Encode(JSON.stringify({
      accounting_data: JSON.parse(parsedJson),
      evidence_google_drive_link: driveUrl,
      logged_at: new Date().toISOString()
    }, null, 2)),
    branch: "main"
  };
  
  var options = {
    method: "put",
    contentType: "application/json",
    headers: { "Authorization": "token " + accessToken },
    payload: JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch("https://api.github.com/repos/" + githubRepo + "/contents/" + filePath, options);
}`}
              </pre>
            </div>
          </div>

          {/* Legal Compass Checklist */}
          <div className="lg:col-span-1 border-r border-slate-850 hidden lg:block"></div>
          
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-black text-purple-400 uppercase font-mono block tracking-widest text-right lg:text-left">LEGAL COMPLIANCE & SAFETY</span>
              <h2 className="text-sm font-black uppercase text-slate-100 mt-1 flex items-center gap-1.5 font-sans">
                ⚖️ La Bàn Kế Toán & Bản Quyền Thuế Việt Nam
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                Tránh bẫy thuế khi tự động hóa sổ sách bằng AI ròng rã. Luôn ghi nhớ 3 quy định cốt lõi có hiệu lực pháp lý cao:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center justify-center font-mono text-[10px] font-black shrink-0">1</span>
                  <span className="text-[11px] font-extrabold text-slate-150">Định dạng File Hóa Đơn gốc Pháp lý</span>
                </div>
                <p className="text-[10.5px] text-slate-400 font-semibold leading-normal ml-7">
                  Theo <strong>Nghị định 123/2020/NĐ-CP</strong>, chỉ tệp tin <strong>XML chứa chữ ký số của bên bán</strong> mới có giá trị pháp lý là hóa đơn gốc. Bản in PDF chỉ là bản hiển thị tượng trưng. AI Agent nên lưu trữ tệp XML ròng gốc lên Supabase Storage hoặc Google Drive!
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/25 flex items-center justify-center font-mono text-[10px] font-black shrink-0">2</span>
                  <span className="text-[11px] font-extrabold text-slate-150">Bẫy Hóa Đơn Doanh Nghiệp Bỏ Trốn</span>
                </div>
                <p className="text-[10.5px] text-slate-400 font-semibold leading-normal ml-7">
                  AI Agent có thể tự động cảnh báo hóa đơn khống bằng cách gửi mã số thuế người bán (seller_mst) của hóa đơn VAT tra cứu tự động qua API Tổng cục Thuế để dò tình trạng người nộp thuế: <strong className="text-emerald-400">“NNT đang hoạt động”</strong>, tránh bị loại chi phí VAT được khấu trừ do nhà cung cấp bỏ trốn rủi ro cao.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-mono text-[10px] font-black shrink-0">3</span>
                  <span className="text-[11px] font-extrabold text-slate-150">Thời hạn hạch toán dòng tiền chính xác</span>
                </div>
                <p className="text-[10.5px] text-slate-400 font-semibold leading-normal ml-7">
                  Chứng từ ngân hàng và hạch toán kép kế toán cần khớp ngày phát sinh thực tế (giao dịch sao kê) chứ không lấy bừa ngày Boss duyệt trên Excel để bảo toàn cân đối tài khoản ngân hàng trùng khớp từng xu.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. INTERACTIVE WORKSPACE DIRECTORY & CONTEXT POLLUTION ISOLATOR CHASSIS */}
      <section className="bg-gradient-to-r from-slate-950 via-[#0a0f1d] to-purple-950/20 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-purple-500/5 blur-3xl animate-pulse"></div>
        
        <div>
          <span className="text-[10px] font-black text-purple-400 uppercase font-mono block tracking-widest">Trang 3 &amp; 4: Kiến Trúc Không Gian Làm Việc Của AI</span>
          <h2 className="text-sm font-black uppercase text-slate-100 mt-1 flex items-center gap-1.5 font-sans">
            📁 Quy Hoạch Thư Mục Hệ Thống &amp; Trình Giả Lập Ô Nhiễm Ngữ Cảnh (Context Isolation Cabinet)
          </h2>
          <p className="text-xs text-slate-405 leading-relaxed font-semibold max-w-4xl">
            Để các tác tử AI (agents) chạy nghiên cứu thị trường không gặp lỗi ảo giác, hệ thống tập tin cần được chia tách rạch ròi. Dưới đây là mô hình phân rã chiến thuật, cho phép quản lý từ xa thông qua Kanban và ngăn chặn việc tràn lấp dữ liệu không mong muốn (Context Pollution).
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* File Explorer tabbed cabinet */}
          <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-850 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Sơ đồ tập tin &amp; phân loại AI (Tree Node)
                </span>
                <span className="text-[9.5px] font-mono text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  CLAUDE.md (Master Controller Base)
                </span>
              </div>
              <p className="text-[10.5px] text-slate-450 font-semibold leading-relaxed">
                * Chọn các phân hệ thư mục để tìm hiểu chi tiết chức năng cô lập của dòng chảy Workspace:
              </p>
            </div>

            {/* Folder Selection tabs */}
            <div className="flex gap-1.5 bg-[#070b13] p-1 border border-slate-855 rounded-xl">
              <button
                onClick={() => setAiDirSubTab('system')}
                className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                  aiDirSubTab === 'system'
                    ? 'bg-purple-500/10 border-purple-500/25 text-purple-400 shadow'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                🛠️ Thư Mục Hệ Thống (System)
              </button>
              <button
                onClick={() => setAiDirSubTab('working')}
                className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                  aiDirSubTab === 'working'
                    ? 'bg-sky-500/10 border-sky-500/25 text-sky-400 shadow'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                📂 Thư Mục Làm Việc (Working)
              </button>
              <button
                onClick={() => setAiDirSubTab('skills_agents')}
                className={`flex-1 py-1.5 text-center rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                  aiDirSubTab === 'skills_agents'
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                ⚖️ Kỹ Năng vs Tác Tử (Modules)
              </button>
            </div>

            {/* Directory details display card */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-3.5">
              {aiDirSubTab === 'system' && (
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-purple-400 font-extrabold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                    SOP GUIDES &amp; STYLE RULES
                  </span>
                  <p className="text-[11px] text-slate-305 font-semibold leading-relaxed">
                    Chứa các quy trình thao tác chuẩn hóa (SOPs), hướng dẫn văn phong phát hành, và hướng dẫn kiến tạo trang đích không đổi. AI Agent khi khởi động chỉ đọc thư mục này <strong className="text-white">ĐÚNG MỘT LẦN</strong> để định hình tư duy chung, tuyệt đối không lưu vết lịch sử giao dịch ở đây.
                  </p>
                  <pre className="text-[9.5px] font-mono text-purple-300 bg-slate-950 p-2.5 rounded-lg border border-slate-850 block leading-relaxed">
{`📂 system_rules_and_prompts/
├── 📄 SOP_landing_page_creator.md   # SOP thiết lập trang đích
├── 📄 SOP_swot_creator.md           # SOP tạo ma trận SWOT
└── 📄 style_guide_guerrilla.md      # Quy tắc thiết kế 0đ`}
                  </pre>
                </div>
              )}

              {aiDirSubTab === 'working' && (
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-sky-455 font-extrabold bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                    ACTIVE JOBS &amp; KANBAN STATE
                  </span>
                  <p className="text-[11px] text-slate-305 font-semibold leading-relaxed">
                    Chứa các tác vụ đang thực thi ròng rã, danh sách ý tưởng thô sơ, và sơ đồ dòng công việc hiện tại. Thư mục này đồng bộ trực tiếp với ứng dụng <strong className="text-white">Kanban (Notion, Trello)</strong>, giúp Solo Founder kiểm soát từ xa toàn bộ quá trình nghiên cứu thị trường ngay trên điện thoại di động!
                  </p>
                  <pre className="text-[9.5px] font-mono text-sky-300 bg-slate-950 p-2.5 rounded-lg border border-slate-850 block leading-relaxed">
{`📂 working_jobs/
├── 📄 active_runs_reddit.json       # Lịch quét Reddit hàng ngày
├── 📄 swot_matrices_cache.db        # Bộ nhớ đệm SWOT tự động tạo
└── 📄 task_kanban_sync_state.csv    # File đồng bộ Notion Kanban`}
                  </pre>
                </div>
              )}

              {aiDirSubTab === 'skills_agents' && (
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-emerald-405 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    SKILLS VS AGENTS DECOUPLING
                  </span>
                  <p className="text-[11px] text-slate-305 font-semibold leading-relaxed">
                    Sự rạch ròi cốt lõi của Kiến trúc: <strong className="text-white">Kỹ Năng (Skills)</strong> hoạt động như một thư viện các hàm độc lập, có thể tái sử dụng (ví dụ: bóc hóa đơn, tra cứu ASO, kiểm toán sổ sách). Trong khi đó, <strong className="text-white">Tác Tử (Agents)</strong> giữ vai trò người điều phối, tùy nghi triệu gọi Kỹ Năng khi cần!
                  </p>
                  <pre className="text-[9.5px] font-mono text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-slate-850 block leading-relaxed">
{`📂 skills/                     📂 agents/
├── 📄 fit_scorer.py           ├── 📄 market_researcher_agent.py
├── 📄 aso_analyzer.py         └── 📄 ledger_auditor_agent.py
└── 📄 swot_generator.py           (Triệu gọi các kỹ năng tương ứng)`}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Context Pollution Simulator Sandbox widget */}
          <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-850 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-rose-455 uppercase font-mono block">CONTEXT POLLUTION BENCHMARK CABINET</span>
              <h3 className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-rose-405" />
                Bộ Kiểm Soát Cô Lập Ngữ Cảnh AI
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Nhồi nhét tất cả quy tắc, prompts, lịch sử chat và hàng trăm hóa đơn cũ vào một luồng trò chuyện duy nhất sẽ gây hiện tượng <strong className="text-rose-400">Ô nhiễm ngữ cảnh (Context Pollution)</strong>, làm suy yếu logic của LLM trầm trọng!
              </p>
            </div>

            {/* Toggle Isolation Button */}
            <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-305 font-medium">Bật "Strict SOP Isolation" (Cô lập Prompt):</span>
                <button
                  type="button"
                  onClick={() => setStrictSOP(!strictSOP)}
                  className={`relative inline-flex h-5 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    strictSOP ? 'bg-emerald-600' : 'bg-slate-750'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      strictSOP ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-slate-450 font-semibold leading-relaxed border-t border-slate-850/50 pt-2">
                * Khi <strong className="text-emerald-400">CÔ LẬP PROMPT</strong>, Agent chỉ đọc tệp định tuyến và gọi Kỹ năng thực hiện đơn lẻ, cắt bỏ hoàn toàn bộ nhớ đệm phồng rộp (Context Swelling).
              </p>
            </div>

            {/* Simulated Live Benchmarks dashboard list */}
            <div className="space-y-3 p-4 bg-slate-910 p-4 bg-slate-900 border border-slate-850 rounded-xl font-mono text-[11px] font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-slate-405">O nhiễm ngữ cảnh (Pollution):</span>
                <span className={strictSOP ? 'text-emerald-400' : 'text-rose-400 animate-pulse font-extrabold'}>
                  {strictSOP ? '4% (Tối giản)' : '92% (Loãng!)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-455">Token tiêu thụ / Request:</span>
                <span className={strictSOP ? 'text-purple-400' : 'text-slate-400'}>
                  {strictSOP ? '2,000 tokens' : '185,000 tokens'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-455">Độ chính xác suy luận:</span>
                <span className={strictSOP ? 'text-emerald-400 font-bold' : 'text-amber-500'}>
                  {strictSOP ? '98.4% (Chuẩn chỉnh)' : '42.0% (Lỗi/ảo giác)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-455">Thời gian phản hồi (Latency):</span>
                <span className="text-slate-350">{strictSOP ? '1.8s' : '8.6s'}</span>
              </div>

              {/* Status Alert text badge */}
              <div className="pt-2 border-t border-slate-900 text-[10px] leading-normal font-sans">
                {strictSOP ? (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    ✅ <strong>Vận hành xuất sắc:</strong> Agent hoạt động nhanh nhạy, giải quyết đúng nghiệp vụ và hóa đơn mục tiêu mà không bị loãng. Tiết kiệm 98% chi phí API hàng tuần!
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-420 rounded-lg">
                    ⚠️ <strong>Nguy cơ ô nhiễm:</strong> Agent bị tràn bộ nhớ, mất kiểm soát đường biên prompts, có thể tự động bóc sai tiền thuế VAT 10% trên tệp hóa đơn tiếp theo!
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
