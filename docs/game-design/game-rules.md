# Formal Game Rules Specification — Đại Gia Việt Nam

## 1. Game Config & Setup
- **Số lượng người chơi**: 2 đến 6 người chơi.
- **Tiền khởi tạo**: $1,500 cho mỗi người chơi.
- **Lương qua ô BẮT ĐẦU (GO)**: $200 khi đi qua hoặc đáp xuống ô 0.
- **Tùy chọn kết thúc**:
  - `CLASSIC`: Người chơi cuối cùng chưa phá sản là người thắng.
  - `TIME_LIMIT`: Giới hạn $N$ phút. Kết thúc game, tính tổng tài sản: `Cash + Sum(Unmortgaged Property Price) + Sum(Building Sell Price)`.
  - `TURN_LIMIT`: Giới hạn $N$ vòng chơi. Tính tổng tài sản tương tự.

## 2. Turn State Machine
1. **START_TURN**: Kiểm tra trạng thái player (`ACTIVE`, `IN_JAIL`, `BANKRUPT`). Cho phép thực hiện **TRADE** trước khi đổ xí ngầu.
2. **ROLL_DICE**: Lắc 2 xúc xắc D6 (1-6).
   - Nếu `dice1 == dice2` -> Đếm `doublesCount += 1`.
   - Nếu `doublesCount == 3` -> Chuyển thẳng vào Trại Giam (Jail), ngưng di chuyển, kết thúc lượt.
3. **MOVE**: Cập nhật vị trí `position = (position + diceTotal) % 40`. Nếu `newPosition < oldPosition` (trừ khi vào Jail), cộng $200 cho player.
4. **LAND**: Xác định ô landed.
5. **RESOLVE_TILE**:
   - Ô đất trống (`Unowned Property`): Cung cấp 2 lựa chọn `BUY` (mua với đúng giá) hoặc `PASS` (bỏ qua). **KHÔNG ĐẤU GIÁ**. Đất chưa mua tiếp tục ở trạng thái tự do.
   - Ô đất có chủ (`Owned Property`): Nếu không thế chấp, tính rent và chuyển tiền sang Owner.
   - Ô Thuế (`Tax`): Trả tiền cho Bank ($100 hoặc $200).
   - Ô Trại Giam (`Go To Jail`): Chuyển vị trí về ô 10, status = `IN_JAIL`, không nhận $200 lương GO.
   - Ô Cơ Hội / Quỹ Cộng Đồng: Rút thẻ top deck và thi hành Action.
   - Ô Bãi Nghỉ (`Free Parking`): Không có hành động (An toàn).
6. **DEBT_RESOLUTION**: Nếu `cash < amount_due`, ngưng các thao tác khác, mở màn hình thanh lý (bán nhà 50%, thế chấp đất 50%, trade).
7. **CHECK_BANKRUPTCY**: Nếu sau khi thanh lý tài sản vẫn không đủ trả nợ -> `BANKRUPT`. Chuyển toàn bộ tài sản còn lại cho Nợ chủ (Creditor) hoặc Bank.
8. **END_TURN**: Chuyển lượt sang người chơi tiếp theo. Nếu lắc double (và không vào Jail), người chơi được lắc tiếp.

## 3. Trading Specification
- **Thời điểm**: CHỈ cho phép thực hiện trong giai đoạn `START_TURN` (trước khi lắc xí ngầu).
- **Luồng**: Player A chọn B và tạo `Offer` -> B `Accept` / `Reject` / `Counter-offer`.
- **Điều kiện bắt buộc**: Đất thuộc bộ màu đang có nhà/khách sạn KHÔNG ĐƯỢC giao dịch. Phải bán hết nhà về Bank trước.
