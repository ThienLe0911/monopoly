# Product Vision — Đại Gia Việt Nam (Vietnam Tycoon)

## 1. Executive Summary
Đại Gia Việt Nam là một trò chơi cờ tỉ phú (Monopoly) phiên bản Web hiện đại, lấy cảm hứng từ các tỉnh thành và địa danh nổi tiếng của Việt Nam. Mục tiêu chính của phiên bản MVP là tập trung hoàn toàn vào **trải nghiệm phòng chơi Online Multiplayer thời gian thực (Real-time Online Multiplayer)** qua kết nối WebSockets giữa các người chơi.

## 2. Core Value Proposition
- **Trải nghiệm Online Multiplayer thời gian thực**: Tạo phòng chơi (Room Lobby), tham gia bằng mã phòng (Room Code), đồng bộ trạng thái trò chơi tức thì (Server-Authoritative State Sync).
- **Trải nghiệm chơi mượt mà & chính xác**: Đảm bảo 100% quy tắc game Monopoly chuẩn hóa, zero bug logic nhờ kiến trúc Game Engine độc lập chạy trên Server.
- **Bối cảnh Việt Nam thân thuộc**: Sử dụng địa danh Việt Nam (Hà Nội Downtown, TP.HCM, Đà Nẵng, Phú Quốc, Huế...) cùng giao diện hình ảnh đậm chất văn hóa Việt.
- **Linh hoạt thời lượng chơi**: Hỗ trợ thiết lập phòng chơi Chơi Nhanh (Giới hạn số vòng / giới hạn thời gian) hoặc Sinh Tồn Cổ Điển (Classic Mode).

## 3. Key Target Audiences
- Nhóm bạn bè hoặc người chơi kết nối trực tuyến tạo phòng chơi chung trên trình duyệt web.
- Hỗ trợ trình duyệt cả máy tính (Desktop) và di động (Mobile Web).

## 4. Scope & Strategic Roadmap
- **Phase 1 (MVP — Online Multiplayer focus)**:
  - Core Pure TS Game Engine (Server-Authoritative).
  - WebSockets Server & Room Management (Tạo phòng, Join phòng, Sảnh chờ Ready).
  - Real-time Game State Synchronization & Action Broadcasting.
  - Web UI Responsive (React/Vite) kết nối WebSocket Client.
- **Phase 2 (Future Release — Single-player & AI Expansion)**:
  - Chế độ chơi đơn đấu với Bot AI (Smart AI Bot behavior).
  - Hệ thống Matchmaking tự động ghép phòng ngẫu nhiên.
