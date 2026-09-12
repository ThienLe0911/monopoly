1. Product Definition

Tên tạm:

Đại Gia Việt Nam — Vietnam Tycoon

Mục tiêu

Người chơi di chuyển quanh thành phố, mua bất động sản, thu tiền thuê, xây dựng, giao dịch và làm đối thủ phá sản.

Số người chơi
Minimum: 2
Recommended: 3–4
Maximum: 6
Điều kiện thắng

1. Luật Mặc Định (Classic Mode): Người chơi cuối cùng còn khả năng thanh toán nợ (chưa bị phá sản) là người thắng.
2. Tùy chọn Phòng Chơi (Time/Turn Limit Mode):
   - Cho phép thiết lập Giới hạn số vòng (N Turns, ví dụ 30, 50 lượt) hoặc Giới hạn thời gian (N phút, ví dụ 15, 30, 45 phút).
   - Khi chạm mốc giới hạn, ván game dừng ngay lập tức. Người chơi có **Tổng Tài Sản** lớn nhất (Cash + Giá mua BĐS chưa thế chấp + 50% giá trị nhà/khách sạn hiện có) là người chiến thắng.

2. Bộ cờ hoàn chỉnh

Bàn cờ có 40 ô, đánh số 0 → 39.

Tôi đề xuất board như sau:

ID	Ô	Loại
0	BẮT ĐẦU	GO
1	Hội An	Property
2	Quỹ Cộng Đồng	Community
3	Huế	Property
4	Thuế Đặc Biệt	Tax
5	Ga Hà Nội	Station
6	Đà Nẵng	Property
7	Cơ Hội	Chance
8	Nha Trang	Property
9	Vũng Tàu	Property
10	Vào Trại / Thăm Trại	Jail
11	Đà Lạt	Property
12	Điện lực	Utility
13	Phú Quốc	Property
14	Cần Thơ	Property
15	Ga Sài Gòn	Station
16	Hải Phòng	Property
17	Quỹ Cộng Đồng	Community
18	Quảng Ninh	Property
19	Thanh Hóa	Property
20	Bãi Nghỉ	Free Parking
21	Vinh	Property
22	Cơ Hội	Chance
23	Nghệ An	Property
24	Bình Định	Property
25	Ga Đà Nẵng	Station
26	Đồng Nai	Property
27	Bình Dương	Property
28	Công ty Nước	Utility
29	Bà Rịa	Property
30	Đi Trại	Go To Jail
31	TP.HCM	Property
32	Hà Nội	Property
33	Quỹ Cộng Đồng	Community
34	Hải Dương	Property
35	Ga Cần Thơ	Station
36	Cơ Hội	Chance
37	Đà Nẵng Downtown	Property
38	Thuế Tài Sản	Tax
39	Hà Nội Downtown	Property
3. Các nhóm bất động sản

Đây là phần cực kỳ quan trọng khi lập trình.

Mỗi property phải có:

propertyId
name
groupId
purchasePrice
baseRent
rentWith1House
rentWith2Houses
rentWith3Houses
rentWith4Houses
rentWithHotel
houseCost
hotelCost
mortgageValue
Nhóm 1 — Nâu
Property	Giá mua	Rent
Hội An	60	2
Huế	60	4

House cost: 50

Nhóm 2 — Xanh nhạt
Property	Giá mua	Rent
Đà Nẵng	100	6
Nha Trang	100	6
Vũng Tàu	120	8

House cost: 50

Nhóm 3 — Hồng
Property	Giá mua	Rent
Đà Lạt	140	10
Phú Quốc	140	10
Cần Thơ	160	12

House cost: 100

Nhóm 4 — Cam
Property	Giá mua	Rent
Hải Phòng	180	14
Quảng Ninh	180	14
Thanh Hóa	200	16

House cost: 100

Nhóm 5 — Đỏ
Property	Giá mua	Rent
Vinh	220	18
Nghệ An	220	18
Bình Định	240	20

House cost: 150

Nhóm 6 — Vàng
Property	Giá mua	Rent
Đồng Nai	260	22
Bình Dương	260	22
Bà Rịa	280	24

House cost: 150

Nhóm 7 — Xanh lá
Property	Giá mua	Rent
TP.HCM	300	26
Hà Nội	300	26
Hải Dương	320	28

House cost: 200

Nhóm 8 — Xanh đậm
Property	Giá mua	Rent
Đà Nẵng Downtown	350	35
Hà Nội Downtown	400	50

House cost: 200

4. Công thức tiền thuê

Để tránh bug, không hard-code logic rent ở nhiều nơi.

Mỗi property có bảng:

Ví dụ Hội An
Buildings	Rent
0	2
1	10
2	30
3	90
4	160
Hotel	250
Đà Nẵng
Buildings	Rent
0	6
1	30
2	90
3	270
4	400
Hotel	550

Các property còn lại cũng cần lưu rent table riêng.

Điều này tốt hơn việc viết:

rent = baseRent * something

vì game economy có thể được balance sau này mà không phải sửa business logic.

5. Bộ tài sản đặc biệt

Có 4 ga:

Ga	Giá
Ga Hà Nội	200
Ga Sài Gòn	200
Ga Đà Nẵng	200
Ga Cần Thơ	200

Rent:

Số ga sở hữu	Rent
1	25
2	50
3	100
4	200
6. Utility

Có 2 utility:

Điện lực
Công ty Nước

Giá mua:

150

Rent phụ thuộc vào tổng hai xúc xắc.

Nếu sở hữu 1 utility
rent = diceTotal × 4
Nếu sở hữu 2 utility
rent = diceTotal × 10

Ví dụ:

dice = 3 + 5
total = 8

1 utility:
8 × 4 = 32

2 utilities:
8 × 10 = 80
7. Tiền ban đầu

Mỗi người chơi bắt đầu:

1.500

Phân bổ:

Mệnh giá	Số lượng
500	2
100	2
50	2
20	6
10	5
5	5
1	5

Tổng:

1.500

8. Luật lượt chơi

Mỗi turn:

START TURN
    ↓
Check player status
    ↓
Player rolls 2 dice
    ↓
Move token
    ↓
Resolve landed space
    ↓
Optional actions
    ↓
Check bankruptcy
    ↓
End turn
9. Xúc xắc

Sử dụng:

2 xúc xắc D6

Mỗi xúc xắc:

1–6

Tổng:

2–12
Double

Nếu:

dice1 == dice2

người chơi được:

thêm một lượt ngay sau khi xử lý ô hiện tại.

Ví dụ:

Roll 3 + 3
↓
Move
↓
Resolve
↓
Roll again
Ba lần Double liên tiếp

Nếu một người chơi roll double 3 lần liên tiếp trong cùng một turn chain:

lập tức vào Jail.

Không xử lý movement của lần roll thứ ba.

Đây là một rule rất quan trọng để tránh vòng lặp vô hạn.

10. Ô BẮT ĐẦU

Khi người chơi:

đi qua hoặc đáp xuống ô 0

nhận:

200

Ví dụ:

Position = 35
Roll = 7

35 + 7 = 42
42 % 40 = 2

Người chơi đã đi qua GO:

cash += 200
11. Mua bất động sản

Nếu người chơi đáp xuống property chưa có owner:

Game cung cấp 2 lựa chọn:
- **BUY**: Nếu `cash >= purchasePrice`, người chơi có thể trả tiền để mua bất động sản.
- **PASS**: Bỏ qua không mua, kết thúc giai đoạn quyết định mua đất.

12. Quy tắc Đất Chưa Có Chủ (Không Áp Dụng Đấu Giá)

- Dự án KHÔNG áp dụng cơ chế đấu giá (Auction).
- Nếu người chơi hiện tại chọn **PASS** (không mua) hoặc không đủ tiền mua:
  - Property giữ nguyên trạng thái chưa sở hữu (`unowned`).
  - Lượt chơi tiếp tục bình thường.
- Bất kỳ người chơi nào đáp xuống ô đó ở các lượt sau đều có quyền mua đúng giá niêm yết `purchasePrice` (miễn là ô đất đó chưa thuộc về ai).

13. Thu tiền thuê

Nếu landing vào property của người khác:

if property.mortgaged:
    rent = 0
else:
    calculateRent()

Người landing phải trả rent.

player.cash -= rent
owner.cash += rent
Nếu player không đủ tiền

Không được tự động trừ âm tiền.

Phải bước vào:

DEBT_RESOLUTION

Người chơi có thể:

bán nhà
bán property
mortgage property
trade property
thanh toán nợ

Nếu vẫn không đủ:

BANKRUPT.

14. Monopoly / Complete Color Group

Khi một player sở hữu toàn bộ property trong một group:

property chưa xây nhà có:

double base rent

Ví dụ:

Hội An = 2
Huế = 4

Nếu sở hữu cả hai:

Hội An rent = 4
Huế rent = 8

Điều này chỉ áp dụng khi property:

buildingCount == 0
15. Xây nhà

Điều kiện:

player owns entire group
AND
property is not mortgaged

Không được xây nếu chưa hoàn thành group.

Building balance rule

Không được:

A = 3 houses
B = 1 house
C = 0 houses

Phải xây đều.

Ví dụ:

A = 1
B = 1
C = 1

Sau đó:

A = 2
B = 1
C = 1

sai.

Phải:

A = 2
B = 2
C = 1
16. Số nhà

Toàn game có:

32 houses

Mỗi property tối đa:

4 houses

Sau 4 houses:

có thể đổi thành Hotel.

Toàn game có:

12 hotels

Đây là cấu trúc tương ứng với bộ classic của Hasbro.

17. Hotel

Điều kiện:

property.houseCount == 4

Player trả hotel cost.

Sau đó:

houses -= 4
hotel += 1

Một property:

maxHotel = 1

Không được:

hotel + house

trên cùng property.

18. Bán nhà

Nhà bán lại cho Bank với:

50% giá mua.

Ví dụ:

houseCost = 100

sell = 50

Nhà phải được bán đều, ngược với thứ tự xây. Đây cũng là quy tắc trong luật Hasbro.

19. Mortgage

Player có thể mortgage property chưa xây nhà.

Mortgage value:

purchasePrice / 2

Ví dụ:

Property = 200
Mortgage = 100

Khi mortgage:

property.mortgaged = true
player.cash += 100

Property mortgaged:

không thu rent.

20. Unmortgage

Để mở mortgage:

payment = mortgageValue × 1.10

Ví dụ:

mortgage = 100

repayment = 110

Quy tắc 10% interest này cũng được quy định trong luật Monopoly chính thức.

21. Bán property cho người chơi khác

Cho phép giao dịch:

Player A
    ↓
Property
    +
Cash
    ↓
Player B

Giá giao dịch:

do hai người tự thỏa thuận.

Ví dụ:

Property value = 200

A bán cho B = 350

hợp lệ.

Nhưng:

Property đang có buildings:

không được bán riêng property đó.

Phải bán buildings trước.

Đây cũng là quy tắc của classic Monopoly.

22. Jail

Có hai cách vào Jail:

Cách 1

Landing vào:

GO TO JAIL

Cách 2

Roll double 3 lần liên tiếp.

Player chuyển tới:

position = JAIL
status = IN_JAIL

Không nhận 200 cho việc đi qua GO khi bị đưa vào Jail.

23. Jail

Trong Jail, player có 3 cách thoát:

Cách 1

Trả:

50

Cách 2

Dùng:

Get Out of Jail Free

Cách 3

Roll double.

Nếu thành công:

exit jail
move according to dice

Nếu không:

turn kết thúc.

Điểm này cần quy định rõ trong code vì Jail là một state riêng.

24. Free Parking

Tôi không khuyến nghị biến Free Parking thành "jackpot".

Trong phiên bản này:

Free Parking không làm gì.

Player chỉ:

land → nothing

Tiền phạt không được đưa vào Free Parking.

Lý do: nếu chúng ta thêm jackpot, game economy sẽ thay đổi đáng kể và cần một bộ balance khác.

25. Tax

Có 2 ô:

Thuế Đặc Biệt

200

Thuế Tài Sản

100

Tiền:

player → bank

Không vào Free Parking.

26. Chance / Community

Tôi đề xuất mỗi loại:

16 cards

Tổng:

32 cards

Không nên để card trực tiếp mutate game state tùy tiện.

Nên định nghĩa card bằng action type:

MOVE_TO
MOVE_RELATIVE
PAY_BANK
RECEIVE_BANK
PAY_PLAYER
RECEIVE_PLAYER
GET_OUT_OF_JAIL
REPAIR_BUILDINGS

Ví dụ:

{
  id: "CHANCE_01",
  action: "MOVE_TO",
  target: 39
}

hoặc:

{
  id: "COMMUNITY_05",
  action: "RECEIVE_BANK",
  amount: 100
}

Điều này sẽ giúp frontend/backend không phải hard-code từng card.

27. Một số card nên có
Chance

Ví dụ:

Đi đến GO → nhận 200
Đi đến Hà Nội Downtown
Đi đến Ga Hà Nội
Tiến 3 ô
Lùi 3 ô
Nhận 100
Nhận 50
Trả Bank 50
Trả Bank 100
Mỗi người chơi trả bạn 20
Đi thẳng vào Jail
Get Out of Jail Free
Sửa mỗi house 25
Sửa mỗi hotel 100
Đi tới property gần nhất
Nhận 150
Community
Nhận 200
Nhận 100
Nhận 50
Nhận 20
Trả 50
Trả 100
Trả 150
Nhận tiền từ mỗi player
Nhận 100 từ Bank
Get Out of Jail Free
Đi vào Jail
Nhận 25
Nhận 75
Trả 40
Nhận 10 từ mỗi player
Nhận 200

Nhưng đây mới là draft card set. Khi implement production, tôi sẽ chuyển toàn bộ 32 card thành specification có:

cardId
deck
description
trigger
action
parameters
target
amount
movement
canChain

để không có card nào gây ambiguity.

28. Bankruptcy — phần quan trọng nhất

Đây là nơi game board thường phát sinh bug.

Giả sử:

Player A owes Player B = 500

nhưng:

A.cash = 100

A phải liquidate assets.

Nếu:

A.cash + liquidatableAssets < 500

→ Bankruptcy.

Bankruptcy đối với Player

Nếu nợ player khác:

Toàn bộ tài sản còn lại của A chuyển cho creditor.

Bao gồm:

cash
properties
mortgaged properties
Get Out of Jail cards

Buildings:

bán lại cho Bank trước.

Tiền bán buildings được đưa cho creditor.

Đây là cơ chế bankruptcy của luật classic.

29. Bankruptcy đối với Bank

Nếu player nợ Bank:

Ví dụ:

Tax = 200
cash = 50

player phải liquidate.

Nếu vẫn không đủ:

player bankrupt.

Tài sản quay về Bank.

Các property đó:

trở thành available và có thể auction lại.

30. Trình tự xử lý một ô

Đây là phần tôi muốn đặc biệt nhấn mạnh khi bạn lập trình.

Không viết kiểu:

if (tile.type === "PROPERTY") {
   ...
}

mà nên có game engine:

resolveLanding(player, tile)

và state machine:

ROLLING
    ↓
MOVING
    ↓
LANDING
    ↓
RESOLVING_TILE
    ↓
PLAYER_DECISION
    ↓
PAYMENT
    ↓
DEBT_RESOLUTION
    ↓
CHECK_BANKRUPTCY
    ↓
END_TURN
31. Player State

Mỗi player nên có:

Player {
    id
    name
    cash
    position

    status
    properties[]

    houses
    hotels

    getOutOfJailCards

    doublesCount
}

status nên giới hạn:

ACTIVE
IN_JAIL
BANKRUPT

Không nên dùng boolean:

isJail
isBankrupt
isActive

vì rất dễ tạo state không hợp lệ:

isJail = true
isBankrupt = true
isActive = true
32. Property State
Property {
    id
    name
    groupId

    ownerId

    purchasePrice

    rent[]

    houseCost
    hotelCost

    houseCount
    hasHotel

    mortgageValue
    isMortgaged
}

Invariant:

ownerId == null
    →
houseCount = 0
hasHotel = false
isMortgaged = false

và:

hasHotel == true
    →
houseCount == 0
33. Board State
GameState {
    gameId

    status

    currentPlayerId

    players[]

    properties[]

    board[]

    bank

    chanceDeck

    communityDeck

    chanceDiscard[]

    communityDiscard[]

    turnNumber

    dice
}

Game status:

WAITING
STARTING
PLAYING
FINISHED
34. Bank

Bank là unlimited money.

Không nên implement:

bank.cash = 100000

vì có thể hết tiền khi game dài.

Thay vào đó:

Bank money = conceptually unlimited

Chỉ cần track:

houses available
hotels available
property ownership
transactions
35. Transaction Engine

Tất cả tiền phải đi qua một abstraction:

transferMoney(from, to, amount)

Không nên để code:

player.cash -= 100
bank.cash += 100

rải rác khắp project.

Nên:

transferMoney(
    PLAYER,
    BANK,
    100
)

hoặc:

transferMoney(
    BANK,
    PLAYER,
    200
)

Điều này cực kỳ quan trọng khi sau này bạn cần:

transaction log
replay
audit
debugging
multiplayer synchronization
36. Một turn hoàn chỉnh

Ví dụ:

Player A
cash = 1,000
position = 7

Roll:

4 + 5 = 9

Movement:

7 + 9 = 16

Landing:

Hải Phòng

Property:

price = 180
owner = null

UI:

[BUY $180]
[AUCTION]

Player chọn BUY:

cash = 820
owner = A

Sau đó:

END_TURN
37. Trường hợp đi qua GO

Ví dụ:

position = 37
dice = 5

Tính:

37 + 5 = 42
42 % 40 = 2

Vì:

42 >= 40

→ crossed GO.

cash += 200
position = 2

Sau đó resolve Community.

38. Trường hợp rất dễ bug: GO TO JAIL

Ví dụ player đang:

position = 28

landing:

GO TO JAIL

Không:

position = 30

mà:

position = 10
status = IN_JAIL

và:

DO NOT GIVE GO SALARY
39. Trường hợp double

Ví dụ:

Roll 1:
3 + 3

→ double.

Player resolve tile.

Sau đó:

doublesCount = 1

Roll tiếp:

2 + 2

→

doublesCount = 2

Roll tiếp:

5 + 5

→

doublesCount = 3

Ngay lập tức:

sendToJail()

Không thực hiện movement của roll thứ 3.

40. Rule về trade

Thời điểm Giao dịch:
- Trade CHỈ được thực hiện trong lượt của player hiện tại, tại thời điểm **TRƯỚC KHI ĐỔ XÍ NGẦU**.

Quy trình Đề nghị Giao dịch:
- Người chơi A chọn đối tác B và tạo Đề nghị (Offer).
- Người chơi B có các lựa chọn:
  - **Accept**: Đồng ý giao dịch, tài sản lập tức chuyển đổi.
  - **Reject**: Từ chối giao dịch, phiên trade kết thúc.
  - **Counter-offer**: Đề nghị lại với các điều khoản điều chỉnh, chuyển lượt phản hồi cho A.

Thành phần giao dịch có thể bao gồm:
- Cash (tiền mặt)
- Property (bất động sản chưa thế chấp hoặc đang thế chấp)
- Thẻ Get Out of Jail Free

Quy tắc bắt buộc:
- Bất động sản thuộc nhóm màu đang có nhà/khách sạn KHÔNG ĐƯỢC giao dịch trực tiếp.
- Phải bán toàn bộ nhà/khách sạn trong nhóm màu đó lại cho Bank trước khi giao dịch bất động sản.
- Không cho giao dịch trực tiếp nhà/khách sạn độc lập.
41. Rule về xây dựng

Một player chỉ được build khi:

owns entire group

và:

property != mortgaged

Ngoài ra:

All properties in group must be unmortgaged

trước khi bắt đầu xây.

42. Một số luật tôi chủ động KHÔNG đưa vào

Để game dễ lập trình và tránh ambiguity, không sử dụng house rules sau:

❌ Free Parking jackpot

❌ Nhận thêm tiền khi landing chính xác GO

❌ Có thể cho người khác vay tiền

❌ Có thể xây nhà bất kỳ lúc nào không cần lượt

❌ Double tiền khi landing Free Parking

❌ Bỏ qua auction

❌ Roll lại vô hạn khi double

❌ Cho trade buildings trực tiếp

❌ Cho property âm tiền

❌ Cho Bank hết tiền

Những house rules này thường xuất hiện khi chơi board game ngoài đời nhưng làm game engine khó xác định state.

43. Bộ component vật lý / game asset

Một bộ hoàn chỉnh:

Component	Số lượng
Board	1
Tokens	6
Dice	2
Property Cards	28
Chance Cards	16
Community Cards	16
Houses	32
Hotels	12
Money	Không giới hạn logic
Jail marker	1

Cấu trúc này phù hợp với bộ classic của Monopoly.

44. Nhưng có một vấn đề tôi muốn sửa trước khi bạn code

Có một điểm quan trọng:

Bộ property prices ở trên mới là game design draft, chưa nên coi là economy balance cuối cùng.

Ví dụ:

Starting money = 1,500
Property range = 60–400
Rent range = 2–50

nhưng để đảm bảo game thực sự chơi tốt, chúng ta cần chạy simulation.

Tôi sẽ coi các thông số sau là những balance variables:

startingCash
goSalary

propertyPrice
baseRent

houseCost
hotelCost

tax

stationRent

utilityMultiplier

mortgageRatio

mortgageInterest

jailFine

Sau đó mô phỏng hàng chục nghìn / hàng trăm nghìn trận để xem:

thời lượng trung bình
probability bankrupt
property nào quá mạnh
property nào gần như vô dụng
expected cash per turn
house ROI
hotel ROI
probability complete monopoly
tỷ lệ thắng theo vị trí turn order
45. Kiến trúc tôi khuyên dùng cho game

Nếu bạn đang chuẩn bị lập trình game này, tôi sẽ tách thành:

Game Engine
│
├── Board
│
├── Player
│
├── Property
│
├── Dice
│
├── Movement Engine
│
├── Tile Resolver
│
├── Rent Engine
│
├── Building Engine
│
├── Mortgage Engine
│
├── Trading Engine
│
├── Auction Engine
│
├── Card Engine
│
├── Payment Engine
│
├── Debt Engine
│
├── Bankruptcy Engine
│
└── Victory Engine

Đặc biệt:

UI không được chứa game rule.

Ví dụ React không nên quyết định:

if (player.cash >= property.price) {
   ...
}

UI chỉ gửi command:

BUY_PROPERTY

Game engine quyết định:

isLegal?
→ yes
→ execute
→ update state
→ emit events
46. Tôi đề xuất coi đây là một "Game Rule Specification"

Thay vì ngay lập tức code, bước tiếp theo nên tạo 4 tài liệu chuẩn:

docs/
│
├── game-design/
│   ├── game-rules.md
│   ├── board-spec.md
│   ├── cards-spec.md
│   └── economy-spec.md
│
├── architecture.md
│
└── features/
    ├── movement.md
    ├── property.md
    ├── auction.md
    ├── building.md
    ├── trading.md
    ├── jail.md
    ├── cards.md
    └── bankruptcy.md

Trong đó game-rules.md sẽ là source of truth.

Mỗi rule nên có dạng:

RULE-ID: MOVEMENT-001

WHEN:
Player rolls dice.

GIVEN:
Player position = 37
Dice total = 5

THEN:
Player passes GO.

RESULT:
Player receives 200.

INVARIANT:
Player position becomes 2.

Như vậy khi bạn dùng AI agent để code, agent không phải "hiểu Monopoly" bằng suy đoán nữa.

Quan trọng nhất

Tôi không khuyên bạn bắt đầu code ngay từ bộ luật phía trên. Với yêu cầu của bạn là:

"đầy đủ, chính xác và không có lỗi để tạo bug khi lập trình"

thì bước chuyên nghiệp tiếp theo phải là formalize toàn bộ rules thành một state-machine specification, rồi tạo bảng dữ liệu hoàn chỉnh cho cả 40 ô + 28 property + 32 card + toàn bộ rent/building/mortgage values, sau đó viết edge cases + invariants + test cases.

Đặc biệt cần xử lý trước khi code các case như:

player vừa đi qua GO vừa rút card
card đưa player về GO
card đưa player đến property khác
card yêu cầu trả tiền nhưng player không đủ tiền
bankrupt trong lúc đang trade
bankrupt khi đang mortgage
trade property đang mortgage
trade làm mất monopoly
xây nhà rồi trade
hotel shortage
house shortage
auction giữa nhiều người
double + Chance
double + Go To Jail
3 doubles
Jail + double
bankruptcy đúng bằng số tiền nợ
nhiều người cùng có thể bị bankrupt
game kết thúc giữa một transaction

Đó mới là phần quyết định game có "không bug" hay không, chứ không chỉ là việc có một bộ luật chơi.

Nếu làm theo hướng PM/Software Architect, tôi sẽ coi bộ trên là Game Rule Draft v0.1, chưa phải bản production-ready; bước kế tiếp là khóa Rule Specification v1.0 trước khi implementation. Hasbro cũng có các biến thể "short game"/time-limit riêng, nên chúng ta cần cố định một ruleset duy nhất thay vì vô tình trộn các phiên bản.