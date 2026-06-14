# LedgerFlow Studio — Auth Setup

LedgerFlow hỗ trợ 2 chế độ đăng nhập:

1. **Supabase Auth** cho bản web/deploy nhiều người dùng.
2. **Local/offline unlock** cho bản desktop hoặc môi trường chưa cấu hình Supabase.

Không dùng tài khoản hoặc mật khẩu mặc định trong source code.

---

## 1. Setup Supabase Auth

### Bước 1 — Tạo Supabase project

1. Vào Supabase Dashboard.
2. Tạo project mới.
3. Ghi lại Project URL, anon public key và service role key.

> Lưu ý: service role key chỉ để trong server `.env`, không đưa vào frontend, không commit lên GitHub.

### Bước 2 — Enable Email provider

1. Vào **Authentication → Providers**.
2. Bật **Email**.
3. Với giai đoạn dev nội bộ, có thể tắt email confirmation để test nhanh.
4. Khi deploy thật, nên bật email confirmation và cấu hình SMTP riêng.

### Bước 3 — Tạo user test

1. Vào **Authentication → Users**.
2. Chọn **Add user**.
3. Nhập email/password test.
4. Dùng email/password này để đăng nhập trên màn hình LedgerFlow.

### Bước 4 — Cấu hình `.env`

Copy `.env.example` thành `.env.local` hoặc `.env` theo môi trường chạy, rồi điền các biến Supabase và local fallback đã ghi trong file mẫu.

Giải thích:

- `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`: frontend dùng để login bằng email/password.
- `SUPABASE_URL` và `SUPABASE_SERVICE_KEY`: backend dùng để verify Bearer token.
- `LOCAL_ADMIN_TOKEN`: fallback cho protected API routes khi chưa cấu hình Supabase.

### Bước 5 — Test login

1. Chạy app bằng `npm run dev`.
2. Mở app.
3. Chọn tab **Supabase** trên màn hình đăng nhập.
4. Nhập email/password đã tạo trong Supabase.
5. Nếu đăng nhập thành công, góc phải trên sẽ hiện session Supabase.

---

## 2. Local/offline mode

Khi chưa cấu hình Supabase URL/key, app sẽ hiện local/offline mode.

Quy trình:

1. Lần đầu mở app trên máy đó, nhập một **mã mở khóa local** tối thiểu 8 ký tự.
2. App lưu hash local trong trình duyệt/môi trường desktop.
3. Các lần sau nhập lại mã đó để mở app.

Local mode chỉ dành cho desktop/offline/dev. Khi deploy cho khách hàng hoặc nhiều người dùng, dùng Supabase Auth.

---

## 3. Checklist

- [ ] Không còn hardcoded username/password trong source.
- [ ] Supabase Email provider đã bật.
- [ ] `.env` có đủ biến Supabase cần thiết.
- [ ] Service role key không xuất hiện trong frontend hoặc file public.
- [ ] Local/offline unlock vẫn dùng được khi không cấu hình Supabase.
- [ ] `npm run lint` và `npm run build` pass.
