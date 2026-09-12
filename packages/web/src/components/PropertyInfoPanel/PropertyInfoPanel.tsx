import React from 'react';
import type {
  GameState,
  PropertyTileDefinition,
  StationTileDefinition,
  UtilityTileDefinition,
  TaxTileDefinition,
  ColorGroup,
  PlayerCommand,
} from '@monopoly/engine';
import { BOARD_TILES, STATION_TILES, UTILITY_TILES } from '@monopoly/engine';
import { getAvatarForPlayer } from '../../constants/avatars';
import './PropertyInfoPanel.css';

const HEADER_COLOR_MAP: Record<ColorGroup, string> = {
  BROWN: '#8B6914',
  LIGHT_BLUE: '#87CEEB',
  PINK: '#E91E8C',
  ORANGE: '#FF8C00',
  RED: '#DC143C',
  YELLOW: '#FFD700',
  GREEN: '#228B22',
  DARK_BLUE: '#00008B',
};

interface PropertyInfoPanelProps {
  tileId: number | null;
  gameState: GameState;
  currentUserId: string;
  onClose: () => void;
  onSendCommand?: (command: PlayerCommand) => void;
}

export const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({
  tileId,
  gameState,
  currentUserId,
  onClose,
  onSendCommand,
}) => {
  if (tileId === null) return null;

  const tile = BOARD_TILES[tileId];
  if (!tile) return null;

  const propertyState = gameState.properties[tileId];
  const owner = propertyState?.ownerId
    ? gameState.players.find((p) => p.id === propertyState.ownerId)
    : null;
  const ownerIndex = owner ? gameState.players.findIndex((p) => p.id === owner.id) : -1;
  const ownerAvatar = ownerIndex >= 0 ? getAvatarForPlayer(ownerIndex) : null;

  const me = gameState.players.find((p) => p.id === currentUserId);
  const isMine = owner?.id === currentUserId;

  const getHeaderGradient = () => {
    if (tile.type === 'PROPERTY') {
      const hex = HEADER_COLOR_MAP[tile.group] || '#1e293b';
      return `linear-gradient(135deg, ${hex} 0%, rgba(15, 23, 42, 0.9) 100%)`;
    }
    if (tile.type === 'STATION') return 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)';
    if (tile.type === 'UTILITY') return 'linear-gradient(135deg, #d97706 0%, #0f172a 100%)';
    if (tile.type === 'JAIL' || tile.type === 'GO_TO_JAIL')
      return 'linear-gradient(135deg, #e11d48 0%, #0f172a 100%)';
    if (tile.type === 'CHANCE' || tile.type === 'COMMUNITY')
      return 'linear-gradient(135deg, #a855f7 0%, #0f172a 100%)';

    return 'linear-gradient(135deg, #334155 0%, #0f172a 100%)';
  };

  const handleBuildHouse = () => {
    if (onSendCommand) {
      onSendCommand({
        type: 'BUILD_HOUSE',
        playerId: currentUserId,
        payload: { tileId },
      });
    }
  };

  const handleSellHouse = () => {
    if (onSendCommand) {
      onSendCommand({
        type: 'SELL_HOUSE',
        playerId: currentUserId,
        payload: { tileId },
      });
    }
  };

  return (
    <div className="property-info-panel-overlay" onClick={onClose}>
      <div
        className="property-info-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="panel-header" style={{ background: getHeaderGradient() }}>
          <button className="panel-close-btn" onClick={onClose} type="button">
            ✕
          </button>
          <span className="panel-tag">
            #{tile.id} &bull; {tile.type}
          </span>
          <h2 className="panel-title">{tile.name}</h2>
        </div>

        {/* Panel Content Body */}
        <div className="panel-body">
          {/* 1. PROPERTY TYPE */}
          {tile.type === 'PROPERTY' && (
            <>
              {/* Owner Status & Direct House Building Section */}
              <div className="panel-section">
                <span className="section-title">CHỦ SỞ HỮU & THAO TÁC TRỰC TIẾP</span>
                {owner ? (
                  <div className="info-row">
                    <span>Chủ đất:</span>
                    <div className="owner-badge" style={{ borderColor: ownerAvatar?.color }}>
                      <span>{ownerAvatar?.emoji}</span>
                      <strong>{owner.name} {isMine && '(Bạn)'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="info-row">
                    <span>Trạng thái:</span>
                    <strong style={{ color: 'var(--color-emerald)' }}>✨ Chưa có chủ</strong>
                  </div>
                )}

                <div className="info-row">
                  <span>Trạng thái tài sản:</span>
                  <strong>
                    {propertyState?.isMortgaged ? '🔒 Đang thế chấp' : '✅ Hoạt động tốt'}
                  </strong>
                </div>

                <div className="info-row">
                  <span>Công trình hiện tại:</span>
                  <strong>
                    {propertyState?.hasHotel
                      ? '🏨 1 Khách sạn'
                      : propertyState?.houses
                      ? `🏠 ${propertyState.houses} Căn nhà`
                      : 'Đất trống'}
                  </strong>
                </div>

                {/* Direct House Building & Selling Buttons for Owner */}
                {isMine && !propertyState?.isMortgaged && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      className="glass-button glass-button-primary"
                      onClick={handleBuildHouse}
                      disabled={(me?.cash || 0) < tile.houseCost || propertyState?.hasHotel}
                      style={{ flex: 1, fontSize: '0.8rem', padding: '10px' }}
                    >
                      🏗️ Xây Nhà (+${tile.houseCost})
                    </button>

                    <button
                      className="glass-button glass-button-danger"
                      onClick={handleSellHouse}
                      disabled={!propertyState?.houses && !propertyState?.hasHotel}
                      style={{ flex: 1, fontSize: '0.8rem', padding: '10px' }}
                    >
                      🏚️ Bán Nhà (+${Math.floor(tile.houseCost / 2)})
                    </button>
                  </div>
                )}
              </div>

              {/* Price & Cost Section */}
              <div className="panel-section">
                <span className="section-title">BẢNG GIÁ & CHI PHÍ</span>
                <div className="info-row">
                  <span>Giá mua đất:</span>
                  <strong style={{ color: 'var(--color-gold)', fontSize: '1rem' }}>
                    ${tile.purchasePrice}
                  </strong>
                </div>
                <div className="info-row">
                  <span>Giá xây mỗi nhà:</span>
                  <strong>${tile.houseCost}</strong>
                </div>
                <div className="info-row">
                  <span>Giá thế chấp (50%):</span>
                  <strong>${tile.mortgageValue}</strong>
                </div>
              </div>

              {/* 6 Rent Levels Table */}
              <div className="panel-section">
                <span className="section-title">📊 BẢNG BIỂU PHÍ THUÊ (RENT TABLE)</span>
                <div className="rent-table-list">
                  {tile.rentTable.map((rentVal, idx) => {
                    const isCurrentLevel =
                      owner &&
                      !propertyState.isMortgaged &&
                      ((idx === 5 && propertyState.hasHotel) ||
                        (!propertyState.hasHotel && propertyState.houses === idx));

                    const levelLabel =
                      idx === 0
                        ? 'Đất trống (0 nhà)'
                        : idx === 5
                        ? '🏨 1 Khách sạn'
                        : `🏠 ${idx} Căn nhà`;

                    return (
                      <div
                        key={idx}
                        className={`rent-row-item ${isCurrentLevel ? 'active' : ''}`}
                      >
                        <span>{levelLabel}</span>
                        <strong>${rentVal}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 2. STATION TYPE */}
          {tile.type === 'STATION' && (
            <>
              <div className="panel-section">
                <span className="section-title">THÔNG TIN BẾN GA</span>
                <div className="info-row">
                  <span>Giá mua ga:</span>
                  <strong style={{ color: 'var(--color-gold)', fontSize: '1rem' }}>
                    ${(tile as StationTileDefinition).purchasePrice}
                  </strong>
                </div>
                <div className="info-row">
                  <span>Giá thế chấp:</span>
                  <strong>${(tile as StationTileDefinition).mortgageValue}</strong>
                </div>
              </div>

              <div className="panel-section">
                <span className="section-title">📊 BẢNG BIỂU PHÍ THUÊ THEO SỐ GA</span>
                <div className="rent-table-list">
                  <div className="rent-row-item">
                    <span>Sở hữu 1 Bến Ga:</span>
                    <strong>$25</strong>
                  </div>
                  <div className="rent-row-item">
                    <span>Sở hữu 2 Bến Ga:</span>
                    <strong>$50</strong>
                  </div>
                  <div className="rent-row-item">
                    <span>Sở hữu 3 Bến Ga:</span>
                    <strong>$100</strong>
                  </div>
                  <div className="rent-row-item">
                    <span>Sở hữu 4 Bến Ga:</span>
                    <strong>$200</strong>
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <span className="section-title">🚂 DANH SÁCH 4 BẾN GA TOÀN BÀN CỜ</span>
                {STATION_TILES.map((stId) => {
                  const stTile = BOARD_TILES[stId];
                  const stState = gameState.properties[stId];
                  const stOwner = stState?.ownerId
                    ? gameState.players.find((p) => p.id === stState.ownerId)
                    : null;

                  return (
                    <div key={stId} className="station-item">
                      <span>🚂 {stTile.name}</span>
                      <strong>{stOwner ? stOwner.name : 'Chưa có chủ'}</strong>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 3. UTILITY TYPE */}
          {tile.type === 'UTILITY' && (
            <>
              <div className="panel-section">
                <span className="section-title">THÔNG TIN CÔNG TY TIỆN ÍCH</span>
                <div className="info-row">
                  <span>Giá mua:</span>
                  <strong style={{ color: 'var(--color-gold)', fontSize: '1rem' }}>
                    ${(tile as UtilityTileDefinition).purchasePrice}
                  </strong>
                </div>
                <div className="info-row">
                  <span>Giá thế chấp:</span>
                  <strong>${(tile as UtilityTileDefinition).mortgageValue}</strong>
                </div>
              </div>

              <div className="panel-section">
                <span className="section-title">⚡ CƠ CHẾ TÍNH TIỀN THUÊ TIỆN ÍCH</span>
                <div className="rent-table-list">
                  <div className="rent-row-item">
                    <span>Sở hữu 1 Công ty Tiện ích:</span>
                    <strong>4 × Nút Xúc Xắc</strong>
                  </div>
                  <div className="rent-row-item">
                    <span>Sở hữu cả 2 Công ty Tiện ích:</span>
                    <strong>10 × Nút Xúc Xắc</strong>
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <span className="section-title">💧 DANH SÁCH 2 CÔNG TY TIỆN ÍCH</span>
                {UTILITY_TILES.map((uId) => {
                  const uTile = BOARD_TILES[uId];
                  const uState = gameState.properties[uId];
                  const uOwner = uState?.ownerId
                    ? gameState.players.find((p) => p.id === uState.ownerId)
                    : null;

                  return (
                    <div key={uId} className="utility-item">
                      <span>{uId === 12 ? '⚡' : '💧'} {uTile.name}</span>
                      <strong>{uOwner ? uOwner.name : 'Chưa có chủ'}</strong>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 4. GO TILE */}
          {tile.type === 'GO' && (
            <div className="special-desc">
              🏁 <strong>BẮT ĐẦU (GO)</strong>
              <br /><br />
              Mỗi khi người chơi di chuyển đi qua hoặc dừng lại tại ô BẮT ĐẦU, Ngân hàng sẽ thưởng ngay <strong>$200</strong> lương trợ cấp đô thị!
            </div>
          )}

          {/* 5. TAX TILE */}
          {tile.type === 'TAX' && (
            <div className="special-desc">
              💸 <strong>{tile.name}</strong>
              <br /><br />
              Khi dừng tại ô này, bạn có nghĩa vụ nộp khoản tiền thuế cố định <strong>${(tile as TaxTileDefinition).amount}</strong> trực tiếp vào Ngân hàng Trung ương.
            </div>
          )}

          {/* 6. JAIL TILE */}
          {tile.type === 'JAIL' && (
            <div className="special-desc">
              ⛓️ <strong>VÀO TRẠI / THĂM TRẠI (JAIL)</strong>
              <br /><br />
              Nếu bạn chỉ ghé thăm: Không bị ảnh hưởng.<br /><br />
              <strong>3 cách để ra khỏi Trại Giam:</strong>
              <ol style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>Trả tiền phạt <strong>$50</strong> trước khi đổ xí ngầu.</li>
                <li>Sử dụng thẻ <strong>"Thẻ Ra Tù Miễn Phí"</strong>.</li>
                <li>Đổ được <strong>Xí ngầu Đôi</strong> (2 mặt giống nhau) trong vòng 3 lượt.</li>
              </ol>
            </div>
          )}

          {/* 7. CHANCE TILE */}
          {tile.type === 'CHANCE' && (
            <div className="special-desc">
              ❓ <strong>Ô CƠ HỘI (CHANCE)</strong>
              <br /><br />
              Rút ngẫu nhiên 1 trong 16 lá bài Cơ Hội! Thẻ có thể thưởng tiền, phạt tiền, cho di chuyển đặc biệt hoặc Thẻ Ra Tù miễn phí.
            </div>
          )}

          {/* 8. COMMUNITY TILE */}
          {tile.type === 'COMMUNITY' && (
            <div className="special-desc">
              📦 <strong>QUỸ CỘNG ĐỒNG (COMMUNITY CHEST)</strong>
              <br /><br />
              Rút ngẫu nhiên 1 trong 16 lá bài Quỹ Cộng Đồng! Mang lại các phần thưởng cổ tức ngân hàng, hoàn thuế hoặc đóng góp bảo hiểm.
            </div>
          )}

          {/* 9. FREE PARKING TILE */}
          {tile.type === 'FREE_PARKING' && (
            <div className="special-desc">
              🅿️ <strong>BÃI NGHỈ (FREE PARKING)</strong>
              <br /><br />
              Nơi thư giãn an toàn! Không có tác động hay chi phí phát sinh nào, người chơi được nghỉ ngơi thoải mái.
            </div>
          )}

          {/* 10. GO TO JAIL TILE */}
          {tile.type === 'GO_TO_JAIL' && (
            <div className="special-desc">
              🚨 <strong>ĐI TRẠI (GO TO JAIL)</strong>
              <br /><br />
              ⚠️ Bạn lập tức bị giải thẳng vào Trại Giam! Khi đi trại theo lệnh này, bạn <strong>KHÔNG</strong> được nhận tiền $200 trợ cấp từ ô GO.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
