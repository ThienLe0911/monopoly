# Feature Specification: Web Presentation UI (`@monopoly/web`)

## Goal
Xây dựng giao diện người dùng Web ấn tượng, hiện đại, hỗ trợ hiệu ứng sống động (Rich Aesthetics, Glassmorphism, Responsive 2D Board, Micro-animations) cho trò chơi Cờ Tỉ Phú (Đại Gia Việt Nam). UI kết nối thời gian thực qua WebSocket với Server Gateway (`@monopoly/server`).

## Business Context
Giao diện người dùng là điểm chạm trực tiếp wows người chơi. UI phải phản ánh chân thực bàn cờ 40 ô địa danh Việt Nam, sảnh chờ phòng chơi thời gian thực (Room Lobby), bảng tin lịch sử nước đi (In-game Action Feed), bảng điều khiển thuộc tính người chơi (Player HUD) và các modal tương tác (Mua đất, Đàm phán Trade, Rút thẻ Chance/Community).

## User Stories
- Là một người chơi, tôi muốn Tạo phòng (Create Room) hoặc Nhập mã 6 ký tự (Join Room) để tham gia sảnh chờ trực tuyến cùng bạn bè.
- Là một người chơi, tôi muốn nhìn thấy bàn cờ 40 ô địa danh Việt Nam thiết kế đẹp mắt, linh hoạt (Responsive) trên cả Desktop và Mobile.
- Là một người chơi, tôi muốn bấm nút Đổ xí ngầu (Roll Dice) với hiệu ứng animation xí ngầu xoay mượt mà và thấy token di chuyển quanh bàn cờ.
- Là một người chơi, tôi muốn mở màn hình Đàm phán (Trade Dialog) chọn tài sản/tiền để thương lượng với người chơi khác trước khi đổ xí ngầu.
- Là một người chơi, tôi muốn theo dõi Bảng tin Lịch sử nước đi (Action Feed) để biết mọi diễn biến ván đấu.

## Functional Requirements
1. **Lobby & Room Management View**:
   - Màn hình chính (Landing Page): Nút Create Room, Input Join Room (6 mã ký tự), Chọn tên hiển thị & Avatar token.
   - Màn hình Sảnh Chờ (Waiting Room): Danh sách 2-6 người chơi, nút Bật/Tắt Ready, nút Bắt Đầu (dành cho Host), Tùy chỉnh chế độ thắng (Classic / Time/Turn Limit).
2. **Game Board 2D View**:
   - Layout bàn cờ vuông 40 ô linh hoạt (Responsive CSS Grid/Flex / SVG).
   - Render 8 nhóm màu địa danh Việt Nam (Hội An, Huế, Đà Nẵng, TP.HCM, Hà Nội Downtown...) cùng các icon ô Ga, Utility, Thuế, Tù.
   - Hiển thị vị trí Token người chơi trên bàn cờ với hiệu ứng di chuyển mượt mà (CSS transition).
   - Hiển thị số lượng nhà (Houses) / Khách sạn (Hotels) / Cờ thế chấp trên từng ô đất.
3. **Player HUD & Control Panel**:
   - Bảng thông số Player (Avatar, Tên, Cash, Trạng thái ACTIVE/IN_JAIL/BANKRUPT).
   - Bảng điền điều khiển hành động: Nút `Lắc xí ngầu`, `Mua đất`, `Bỏ qua`, `Bán nhà`, `Thế chấp`, `Tạo Giao dịch Trade`, `Kết thúc lượt`.
4. **Interactive Modals & Dialogs**:
   - **Land Purchase Modal**: Hiển thị thông tin ô đất, giá mua, bảng rent -> Nút `BUY` / `PASS`.
   - **Trade Dialog**: Chọn đối tác, chọn tài sản (Cash, BĐS, Thẻ ra tù) -> Nút `Tạo Offer` / `Chấp Nhận` / `Từ Chối`.
   - **Card Draw Modal**: Hiển thị lá bài Chance / Community nâng cấp animation lật thẻ.
   - **Debt Liquidation Panel**: Màn hình ép bán nhà / thế chấp khi tiền cash âm.
5. **In-game Action Feed & Reconnect Sync**:
   - Khung chat/lịch sử nước đi hiển thị toàn bộ `GameEventLog[]` theo thời gian thực.
   - Nhận sự kiện WebSocket `STATE_SYNC` tự động khôi phục 100% UI khi reconnect.

## Non Functional Requirements
- **Design Aesthetics**: Sử dụng bảng màu tailored, Glassmorphism, font chữ hiện đại (Google Fonts Inter/Outfit), hiệu ứng micro-animations.
- **Responsiveness**: Hiển thị hoàn hảo trên Desktop (màn hình rộng) và Mobile (vuốt/xem thông minh).

## Acceptance Criteria
- [ ] Màn hình Sảnh chờ Tạo/Join phòng 6 ký tự qua WebSocket hoạt động trơn tru.
- [ ] Bàn cờ 40 ô địa danh Việt Nam hiển thị đầy đủ, chính xác nhóm màu & token di chuyển mượt.
- [ ] Modal Mua đất (Buy/Pass) hiển thị tức thì khi người chơi landing.
- [ ] Luồng Giao dịch Trade thời gian thực hiển thị đề nghị và nút bấm Accept/Reject.
- [ ] Bảng tin Action Feed hiển thị đầy đủ lịch sử nước đi.
- [ ] Thao tác mượt mà trên cả trình duyệt máy tính lẫn điện thoại.
