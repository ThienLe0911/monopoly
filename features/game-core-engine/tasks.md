# Feature Implementation Tasks: Game Core Engine & Online Room System

## Core Engine Module Implementation Plan

- [x] **Task 1: Setup Project Structure & Packages**
  - Khởi tạo monorepo/package `@monopoly/engine` & `@monopoly/server` với TypeScript configuration (Strict Mode) và Vitest test runner.
  - Định nghĩa các interface Core: `GameState`, `Player`, `Tile`, `Property`, `Card`, `Command`, `GameEvent`, `RoomState`, `RoomPlayer`.

- [x] **Task 2: Board & Data Model Constants**
  - Khai báo mảng 40 ô cờ chuẩn theo `RULES.md` (Tên, Loại ô, Nhóm màu, Giá mua, Bảng Rent, Giá nhà, Giá thế chấp).
  - Khai báo danh sách 32 thẻ (16 Chance + 16 Community) theo `cards-spec.md`.

- [x] **Task 3: Room Manager Engine, Action Log & WebSocket Gateway**
  - Viết `RoomManager` module quản lý phòng chơi Online (Tạo phòng, sinh Room Code 6 ký tự, Join phòng, Quản lý trạng thái Sẵn Sàng / Ready).
  - Viết `ActionLogEngine` lưu trữ nhật ký chuỗi sự kiện `GameEventLog[]` để hiển thị In-Game Action Feed trên UI và hỗ trợ Reconnect Sync khi rớt mạng.
  - Tích hợp WebSocket Server (Socket.io hoặc `ws`) để broadcast `RoomState`, `GameStateUpdate` và `GameEventLog` tới các client.

- [x] **Task 4: State Machine & Game Initialization**
  - Viết `GameEngine` class khởi tạo ván game cho 2-6 người chơi với $1,500 ban đầu khi chủ phòng bấm Bắt Đầu.
  - Xây dựng State Transition handler (`START_TURN` -> `ROLL_DICE` -> `MOVE` -> `LAND` -> `RESOLVE_TILE` -> `DEBT_RESOLUTION` -> `CHECK_BANKRUPTCY` -> `END_TURN`).

- [x] **Task 5: Dice Roll & Movement Engine**
  - Xử lý lắc 2 xí ngầu D6 ngẫu nhiên trên Server, đếm double và quy tắc 3 lần double liên tiếp vào Jail.
  - Xử lý di chuyển token, tính toán mốc đi qua/đáp xuống ô GO (cộng $200).

- [x] **Task 6: Tile Resolution & Property Engine**
  - Implement xử lý ô đất chưa có chủ: `BUY` hoặc `PASS` (không đấu giá).
  - Implement Rent Engine: tính tiền thuê đất, ga, utility, double base rent khi có monopoly.
  - Implement `transferMoney(from, to, amount)` tập trung.

- [x] **Task 7: Building & Mortgage Engine**
  - Implement mua/bán nhà & khách sạn với quy tắc xây đều và kho 32 nhà / 12 khách sạn.
  - Implement thế chấp (Mortgage 50%) và Giải chấp (Unmortgage +10%).

- [x] **Task 8: Online Trade Engine**
  - Implement luồng giao dịch trực tuyến qua WebSocket trước khi lắc xí ngầu: `CreateOffer` -> `AcceptOffer` / `RejectOffer` / `CounterOffer`.
  - Validate ràng buộc không được trade đất đang có nhà trong nhóm màu.

- [x] **Task 9: Card Engine & Jail Resolver**
  - Implement rút bài Chance/Community và giải thi hành các Action Type (`MOVE_TO`, `RECEIVE_BANK`, `PAY_BANK`, `RECEIVE_ALL_PLAYERS`, `PAY_ALL_PLAYERS`, `GO_TO_JAIL`, `GET_OUT_OF_JAIL_CARD`, `REPAIR_BUILDINGS`).
  - Implement 3 cách thoát tù ($50, Thẻ ra tù, Lắc double).

- [x] **Task 10: Debt Resolution, Bankruptcy & Victory Engine**
  - Implement xử lý thanh lý tài sản khi không đủ cash và tuyên bố Phá sản.
  - Implement Victory Engine cho cả Classic Mode và Time/Turn Limit Mode.

- [x] **Task 11: Complete Unit Test Suite & Validation**
  - Viết bộ Unit Test toàn diện với Vitest kiểm thử tất cả các edge cases, Room logic và WebSocket commands (đạt coverage > 90%).
  - Xuất báo cáo validation.
