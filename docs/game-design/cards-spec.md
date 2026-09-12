# 32 Cards Data Specification — Chance & Community Chest

## Deck 1: CHANCE (16 Cards)
```json
[
  { "id": "CHANCE_01", "name": "Tiến tới ô BẮT ĐẦU (GO)", "action": "MOVE_TO", "params": { "target": 0, "passGoSalary": true } },
  { "id": "CHANCE_02", "name": "Chuyến đi Hà Nội Downtown", "action": "MOVE_TO", "params": { "target": 39, "passGoSalary": true } },
  { "id": "CHANCE_03", "name": "Ghé thăm Đà Nẵng Downtown", "action": "MOVE_TO", "params": { "target": 37, "passGoSalary": true } },
  { "id": "CHANCE_04", "name": "Di chuyển tới Ga Hà Nội", "action": "MOVE_TO", "params": { "target": 5, "passGoSalary": true } },
  { "id": "CHANCE_05", "name": "Di chuyển tới Bãi Nghỉ (Free Parking)", "action": "MOVE_TO", "params": { "target": 20, "passGoSalary": true } },
  { "id": "CHANCE_06", "name": "Tiến 3 ô", "action": "MOVE_RELATIVE", "params": { "steps": 3, "passGoSalary": true } },
  { "id": "CHANCE_07", "name": "Lùi 3 ô", "action": "MOVE_RELATIVE", "params": { "steps": -3, "passGoSalary": false } },
  { "id": "CHANCE_08", "name": "Nhận thưởng đầu tư bất động sản", "action": "RECEIVE_BANK", "params": { "amount": 150 } },
  { "id": "CHANCE_09", "name": "Thắng cổ phiếu thị trường", "action": "RECEIVE_BANK", "params": { "amount": 100 } },
  { "id": "CHANCE_10", "name": "Nộp thuế thu nhập cá nhân", "action": "PAY_BANK", "params": { "amount": 50 } },
  { "id": "CHANCE_11", "name": "Phạt vi phạm giao thông", "action": "PAY_BANK", "params": { "amount": 100 } },
  { "id": "CHANCE_12", "name": "Tiệc mừng sinh nhật", "action": "RECEIVE_ALL_PLAYERS", "params": { "amount": 20 } },
  { "id": "CHANCE_13", "name": "Đi thẳng vào Trại Giam", "action": "GO_TO_JAIL", "params": { "target": 10, "passGoSalary": false } },
  { "id": "CHANCE_14", "name": "Thẻ Ra Tù Miễn Phí", "action": "GET_OUT_OF_JAIL_CARD", "params": { "keepable": true } },
  { "id": "CHANCE_15", "name": "Sửa chữa nhà cửa toàn diện", "action": "REPAIR_BUILDINGS", "params": { "perHouse": 25, "perHotel": 100 } },
  { "id": "CHANCE_16", "name": "Tái thiết đô thị", "action": "REPAIR_BUILDINGS", "params": { "perHouse": 40, "perHotel": 115 } }
]
```

## Deck 2: COMMUNITY CHEST (16 Cards)
```json
[
  { "id": "COMMUNITY_01", "name": "Nhận cổ tức từ ngân hàng", "action": "RECEIVE_BANK", "params": { "amount": 200 } },
  { "id": "COMMUNITY_02", "name": "Nhận hoàn thuế thu nhập", "action": "RECEIVE_BANK", "params": { "amount": 100 } },
  { "id": "COMMUNITY_03", "name": "Bán cổ phiếu quỹ cộng đồng", "action": "RECEIVE_BANK", "params": { "amount": 50 } },
  { "id": "COMMUNITY_04", "name": "Nhận tiền trúng thưởng xổ số", "action": "RECEIVE_BANK", "params": { "amount": 75 } },
  { "id": "COMMUNITY_05", "name": "Nhận thưởng sinh nhật", "action": "RECEIVE_ALL_PLAYERS", "params": { "amount": 10 } },
  { "id": "COMMUNITY_06", "name": "Nhận hỗ trợ bảo hiểm y tế", "action": "RECEIVE_BANK", "params": { "amount": 100 } },
  { "id": "COMMUNITY_07", "name": "Nhận thưởng quỹ từ thiện", "action": "RECEIVE_BANK", "params": { "amount": 25 } },
  { "id": "COMMUNITY_08", "name": "Thanh toán viện phí", "action": "PAY_BANK", "params": { "amount": 100 } },
  { "id": "COMMUNITY_09", "name": "Nộp học phí đại học", "action": "PAY_BANK", "params": { "amount": 50 } },
  { "id": "COMMUNITY_10", "name": "Nộp phí tư vấn pháp lý", "action": "PAY_BANK", "params": { "amount": 150 } },
  { "id": "COMMUNITY_11", "name": "Đóng góp từ thiện", "action": "PAY_ALL_PLAYERS", "params": { "amount": 20 } },
  { "id": "COMMUNITY_12", "name": "Trở về ô BẮT ĐẦU (GO)", "action": "MOVE_TO", "params": { "target": 0, "passGoSalary": true } },
  { "id": "COMMUNITY_13", "name": "Đi thẳng vào Trại Giam", "action": "GO_TO_JAIL", "params": { "target": 10, "passGoSalary": false } },
  { "id": "COMMUNITY_14", "name": "Thẻ Ra Tù Miễn Phí", "action": "GET_OUT_OF_JAIL_CARD", "params": { "keepable": true } },
  { "id": "COMMUNITY_15", "name": "Sửa chữa nâng cấp khu phố", "action": "REPAIR_BUILDINGS", "params": { "perHouse": 40, "perHotel": 115 } },
  { "id": "COMMUNITY_16", "name": "Kiểm tra sức khỏe định kỳ", "action": "PAY_BANK", "params": { "amount": 25 } }
]
```
