# Feature Specification: Game Core Engine

## Goal
Xây dựng Core Game Engine thuần TypeScript cho game Cờ Tỉ Phú (Đại Gia Việt Nam). Engine này quản lý 100% trạng thái trò chơi (State Machine), logic di chuyển, thanh toán tiền thuê, mua bán tài sản, đàm phán giao dịch (Trade), rút thẻ Cơ Hội/Quỹ Cộng Đồng, xử lý nợ/phá sản và kiểm tra điều kiện chiến thắng.

## Business Context
Game Engine là trái tim của hệ thống. Bằng cách tách biệt hoàn toàn Core Engine khỏi UI (Presentation), ứng dụng đảm bảo tính nhất quán của dữ liệu, dễ kiểm thử tự động (Unit Test), ngăn ngừa mọi lỗ hổng gian lận logic và sẵn sàng kết nối Backend WebSocket ở các giai đoạn mở rộng về sau.

## User Stories
- Là một người chơi, tôi muốn đổ xí ngầu và di chuyển token quanh bàn cờ 40 ô đúng theo luật.
- Là một người chơi, khi đáp xuống đất chưa có chủ, tôi muốn chọn Mua (Buy) hoặc Bỏ qua (Pass).
- Là một người chơi, khi đáp xuống ô đất của đối thủ, tôi phải tự động trả tiền thuê.
- Là một người chơi, tôi muốn thực hiện giao dịch (Trade) với người chơi khác trước khi lắc xí ngầu.
- Là một người chơi, khi hết tiền trả nợ, tôi muốn thanh lý tài sản (bán nhà 50%, thế chấp 50%) hoặc tuyên bố phá sản.

## Functional Requirements
1. **Game Initialization & Room State**: Khởi tạo ván chơi Online Multiplayer từ 2-6 người qua Room Code, phát $1,500 ban đầu, xáo bài 2 bộ thẻ 16 Chance + 16 Community.
2. **Room Management Engine**: Tạo phòng (Create Room), Tham gia phòng bằng mã 6 ký tự (Join Room), Quản lý danh sách người chơi trong phòng và trạng thái Sẵn Sàng (Ready State).
3. **Server-Authoritative State Synchronization & History Log**:
   - Kiểm soát State Machine tập trung trên Server Node.js, broadcast State updates tới tất cả các kết nối Client WebSocket khi có Command hợp lệ.
   - Ghi nhật ký từng hành động (`GameEventLog`) với timestamp, playerId, eventType, parameters.
   - Hỗ trợ tính năng **Reconnect**: Khi người chơi bị rớt mạng và kết nối lại phòng chơi, Server tự động gửi lại toàn bộ `GameState` hiện tại và `GameHistoryLog` để khôi phục màn hình và bảng tin tức thời.
4. **Dice & Movement**: Tạo ngẫu nhiên D6 cho 2 xí ngầu. Tính vị trí mới `% 40`. Nhận $200 khi đi qua ô GO. Xử lý 3 lần double liên tiếp -> Jail.
5. **Property Purchase & Rent Calculation**:
   - Mua đất trực tiếp theo `purchasePrice`. Không đấu giá.
   - Nhân 2 tiền thuê đất gốc nếu sở hữu trọn bộ nhóm màu (chưa thế chấp và chưa xây nhà).
   - Tính tiền thuê theo số lượng nhà/khách sạn hoặc số ga/utility sở hữu.
6. **Building & Mortgage**:
   - Xây nhà đều theo nhóm màu (tối đa 4 nhà/đất -> 1 khách sạn). Limit 32 nhà / 12 khách sạn toàn bàn cờ.
   - Thế chấp đất nhận 50% giá mua. Mở thế chấp trả 50% + 10% lãi.
7. **Trading Protocol**:
   - Giao dịch trong lượt trước khi roll. Luồng Offer -> Accept / Reject / Counter-offer qua WebSocket messaging.
   - Bắt buộc bán hết nhà trước khi trade đất trong nhóm màu.
8. **Debt & Bankruptcy**:
   - Chuyển trạng thái `DEBT_RESOLUTION` khi `cash < rent`.
   - Nếu thanh lý xong vẫn không đủ trả nợ -> Tuyên bố `BANKRUPT`, chuyển tài sản cho Creditor/Bank.
9. **Victory Condition**:
   - Classic: Người sống sót cuối cùng.
   - Time/Turn Limit: Ai có Tổng Tài Sản lớn nhất khi hết mốc.

## Business Rules
- Tuân thủ 100% tài liệu `RULES.md` đã cập nhật.
- Không áp dụng đấu giá khi người chơi chọn PASS không mua đất.
- Không cho phép số dư tiền âm (`cash < 0`). Khi cash âm phải chuyển sang giai đoạn xử lý nợ.

## Permissions
- Chỉ người chơi hiện tại (`currentPlayerId`) có kết nối Socket hợp lệ mới có quyền thực hiện các lệnh Roll, Buy, Pass, EndTurn, InitiateTrade trong lượt của mình.

## Integrations
- Tích hợp với WebSocket Gateway (Socket.io hoặc `ws`) để tiếp nhận `PlayerCommand` và phát đi `GameStateUpdate`.

## Non Functional Requirements
- **Performance**: Mọi thao tác Command Execution phải phản hồi < 10ms trên Server.
- **Testability**: Đạt Unit Test Coverage > 90% logic Engine & Room Management.

## Acceptance Criteria
- [ ] Khởi tạo phòng chơi (Room) với mã 6 ký tự và hỗ trợ 2-6 người kết nối Online.
- [ ] Khởi tạo bàn cờ 40 ô đúng cấu trúc `RULES.md`.
- [ ] Đồng bộ trạng thái GameState thời gian thực qua WebSockets.
- [ ] Lắc xí ngầu, di chuyển token, nhận $200 qua GO chuẩn xác.
- [ ] Mua đất / Bỏ qua mua đất hoạt động đúng (không đấu giá).
- [ ] Tính rent chính xác cho Property, Ga, Utility, Monopoly.
- [ ] Xây nhà / Khách sạn đúng quy tắc xây đều và giới hạn kho nhà.
- [ ] Giao dịch Trade đúng luồng Offer/Accept/Reject/Counter-offer trực tuyến.
- [ ] Xử lý Nợ và Phá sản chuyển nhượng tài sản chính xác.
- [ ] Đạt chiến thắng ở Classic Mode lẫn Time/Turn Limit Mode.

## Out Of Scope
- Chế độ Single-player đấu với Bot AI (Tạm hoãn sang Release 2).
- Hệ thống nạp tiền / thanh toán tài khoản (Microtransactions).
