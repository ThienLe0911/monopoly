# Feature Implementation Tasks: Web Presentation UI (`@monopoly/web`)

## Web UI Implementation Plan

- [x] **Task 1: Setup React + Vite Project Package (`packages/web`)**
  - Khởi tạo package `@monopoly/web` sử dụng Vite + React + TypeScript.
  - Tích hợp Google Fonts (Outfit / Inter) và hệ thống CSS Tokens (Glassmorphism, Vibrant Colors, Animations).

- [x] **Task 2: WebSocket Client Integration Service**
  - Xây dựng `SocketClientService` kết nối tới Backend Gateway (`@monopoly/server`).
  - Lắng nghe các event `ROOM_STATE_UPDATED`, `GAME_STATE_UPDATED`, `ACTION_LOG_EMITTED`, `RECONNECT_SYNC`.

- [x] **Task 3: Landing Page & Room Lobby View**
  - Thi công màn hình Trang chủ: Form Tạo phòng mới (Select Room Mode, Time/Turn Limit) và Form Join phòng (Mã 6 ký tự).
  - Thi công màn hình Sảnh chờ (Waiting Room): Danh sách 2-6 người chơi, nút Toggle Ready, nút Start Game cho Host.

- [x] **Task 4: Responsive 2D Game Board Component**
  - Thi công `GameBoard` component rendering 40 ô cờ Việt Nam thiết kế dạng Grid 11x11 responsive.
  - Hỗ trợ hiển thị 8 nhóm màu, tên địa danh, icon bến ga/utility, cờ thế chấp và số lượng nhà/khách sạn trên ô đất.
  - Thêm hiệu ứng token di chuyển mượt mà giữa các ô cờ.

- [x] **Task 5: Player HUD & Action Control Panel**
  - Thi công `PlayerHUD` hiển thị Avatar, Tên, Cash, Trạng thái ACTIVE/IN_JAIL/BANKRUPT của tất cả người chơi.
  - Thi công `ControlPanel` chứa các nút hành động chính: `Lắc xí ngầu`, `Mua đất`, `Thế chấp`, `Tạo Trade`, `Kết thúc lượt`.

- [x] **Task 6: Interactive Modals & Trade Negotiation View**
  - Thi công `LandPurchaseModal` (Mua/Pass đất).
  - Thi công `TradeDialog` đàm phán giao dịch trước khi lắc xí ngầu.
  - Thi công `CardDrawModal` (Hiệu ứng lật thẻ Chance/Community).
  - Thi công `DebtLiquidationModal` (Thanh lý tài sản khi thiếu cash).

- [x] **Task 7: In-Game Action Feed & Reconnect Handler**
  - Thi công `ActionFeed` hiển thị nhật ký sự kiện `GameEventLog[]` thời gian thực.
  - Tích hợp luồng Reconnect Handler khi rớt mạng tự động kết nối lại và khôi phục UI.

- [x] **Task 8: End Game & Victory Modal**
  - Thi công màn hình Tổng kết ván đấu (Victory Modal), vinh danh người chiến thắng và hiển thị bảng xếp hạng Tổng Tài Sản (Net Worth).

