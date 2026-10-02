# Hệ thống Thi Trắc nghiệm TNTHPT 2025

Ứng dụng web quản lý và tổ chức thi trực tuyến theo cấu trúc đề thi Tốt nghiệp THPT 2025 của Bộ Giáo dục và Đào tạo.

## Tính năng chính

### 1. Thí sinh
- Đăng nhập bằng họ tên và số báo danh.
- Giao diện thi chuyên nghiệp, hỗ trợ 3 phần thi:
  - **Phần 1**: Trắc nghiệm 4 phương án (18 câu).
  - **Phần 2**: Trắc nghiệm Đúng/Sai (4 câu, mỗi câu 4 ý).
  - **Phần 3**: Trả lời ngắn (6 câu).
- Đồng hồ đếm ngược, tự động nộp bài khi hết giờ.
- Chế độ chống gian lận: Cảnh báo khi chuyển tab, hỗ trợ toàn màn hình.
- Xem kết quả ngay sau khi nộp bài với bảng điểm chi tiết từng phần.

### 2. Quản trị viên
- Đăng nhập bằng tài khoản quản trị viên với mật khẩu mặc định hệ thống là `admin123`.
- Dashboard thống kê kết quả thi bằng biểu đồ trực quan.
- Quản lý ngân hàng câu hỏi (hiện tại hỗ trợ qua JSON API).
- Xuất danh sách kết quả thi ra file Excel (.xlsx).
- Theo dõi phổ điểm và tỷ lệ đạt yêu cầu.

## Cấu trúc điểm thi (TNTHPT 2025)
- **Phần 1**: 18 câu x 0.25đ = 4.5đ.
- **Phần 2**: 4 câu x 1.0đ = 4.0đ (Tính điểm theo số ý đúng: 1 ý = 0.1đ, 2 ý = 0.25đ, 3 ý = 0.5đ, 4 ý = 1.0đ).
- **Phần 3**: 6 câu x 0.5đ = 3.0đ.
- **Tổng cộng**: 10 điểm.

## Hướng dẫn cài đặt và chạy
1. Cài đặt dependencies: `npm install`
2. Chạy ứng dụng: `npm run dev`
3. Truy cập: `http://localhost:3000`

## Công nghệ sử dụng
- **Frontend**: React, Tailwind CSS, Motion, Lucide Icons.
- **Backend**: Node.js (Express).
- **Database**: Local JSON Storage (trong thư mục `/data`).
- **Thư viện**: XLSX (Excel), Recharts (Biểu đồ).
