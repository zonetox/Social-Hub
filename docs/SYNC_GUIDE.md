# 🚀 Hướng Dẫn Đồng Bộ Hóa Dự Án (Social HUB)

Tài liệu này giúp bạn ghi nhớ các lệnh quan trọng để kết nối từ máy tính cá nhân lên Cloud (Supabase & Vercel) một cách chính xác nhất.

---

## 🏎️ 1. Lệnh Chạy Ở Máy Cục Bộ (Local)
Dùng khi bạn muốn xem thay đổi ngay lập tức trên máy mình:
- **Chạy thử:** `npm run dev` (Mở `localhost:3000`)
- **Kiểm tra lỗi:** `npm run build`

---

## ☁️ 2. Đồng Bộ Với Supabase (Database)
Dùng để đẩy các cấu hình bảng (Tables), bảo mật (RLS) lên mạng.

1. **Đăng nhập:** `npx supabase login`
2. **Liên kết dự án:** `npx supabase link --project-ref <your-project-id>`
3. **Đẩy database lên:** `npx supabase db push` (Lệnh này sẽ chạy các file trong `supabase/migrations`)
4. **Kéo database về máy (nếu cần):** `npx supabase db pull`

---

## ⚡ 3. Đồng Bộ Với Vercel (Hosting)
Dùng để đẩy giao diện và logic web lên internet.

1. **Đăng nhập:** `npx vercel login`
2. **Liên kết web:** `npx vercel link`
3. **Đẩy bản nháp:** `npx vercel`
4. **Đẩy bản chính thức (Production):** `npx vercel --prod`
5. **Đồng bộ biến môi trường:** `npx vercel env pull .env.local`

---

## 🛠️ 4. Công Cụ Hỗ Trợ "Xịn" Nhất
Để code nhẹ nhàng và chuẩn xác hơn, bạn nên dùng:

### 🤖 Trình soạn thảo AI
- **[Cursor](https://cursor.sh/):** (Khuyên dùng số 1) Giống VS Code nhưng có AI cực mạnh bên trong. Bạn có thể hỏi "Lỗi này sửa sao?" hay "Viết cho tôi hàm này" bằng tiếng Việt.

### 🧩 VS Code Extensions (Tiện ích mở rộng)
Bạn hãy vào mục Extensions (hình 4 ô vuông) trong VS Code/Cursor và cài:
1. **ES7+ React/Redux/React-Native snippets:** Gõ tắt code React cực nhanh.
2. **Tailwind CSS IntelliSense:** Tự động gợi ý màu sắc, khoảng cách khi sửa giao diện (CSS).
3. **Prettier - Code formatter:** Tự động căn chỉnh code cho đẹp và dễ đọc khi bạn lưu file.
4. **Prisma:** Hỗ trợ đọc các file database dễ hơn.
5. **GitLens:** Xem lại lịch sử ai đã sửa code dòng nào, lúc nào.

### 🖱️ Công cụ thao tác nhanh
- **GitHub Desktop:** Dùng chuột để đẩy code lên GitHub, không cần gõ lệnh Git.
- **Supabase Dashboard (Web):** Quản lý data trực tiếp trên trình duyệt nếu không muốn gõ lệnh.

---

> [!TIP]
> **Mẹo nhỏ:** Mỗi khi bạn sửa code mà thấy web trên mạng không cập nhật, hãy kiểm tra xem bạn đã `git push` lên GitHub chưa. Vercel sẽ tự động làm phần còn lại!
