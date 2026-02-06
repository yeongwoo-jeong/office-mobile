import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Card as CardType, GameAction, GameState, GemColor, UserProfile } from '../../game/types';
import { canAfford, getBonuses } from '../../game/logic';
import { Card } from '../Card';
import { GemIcon, gemLabel } from '../GemIcon';

export const GameScreen = ({
  user,
  state,
  viewerId,
  onAction,
  onExit,
}: {
  user: UserProfile;
  state: GameState;
  viewerId: number;
  onAction: (action: GameAction) => void;
  onExit: () => void;
}) => {
  const [selectedTokens, setSelectedTokens] = useState<GemColor[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const me = state.players[viewerId];
  const isMyTurn = state.currentPlayerIndex === viewerId && state.winner === null;
  const bonuses = useMemo(() => getBonuses(me), [me]);

  const toggleToken = (color: GemColor) => {
    if (!isMyTurn) return;
    if (selectedTokens.includes(color)) {
      setSelectedTokens(selectedTokens.filter((t) => t !== color));
    } else {
      if (selectedTokens.length >= 3) return;
      setSelectedTokens([...selectedTokens, color]);
    }
  };

  const handleConfirmTokens = () => {
    if (selectedTokens.length === 0) return;
    if (selectedTokens.length === 1) {
      const color = selectedTokens[0];
      if (state.tokens[color] >= 4) {
        onAction({ type: 'TAKE_2_SAME', gems: [color, color] });
        setSelectedTokens([]);
        return;
      }
    }
    if (selectedTokens.length >= 2) {
      onAction({ type: 'TAKE_3_DIFF', gems: selectedTokens });
      setSelectedTokens([]);
    }
  };

  const handleBuy = () => {
    if (!selectedCard) return;
    if (!canAfford(me, selectedCard)) return;
    onAction({ type: 'BUY', cardId: selectedCard.id });
    setSelectedCard(null);
  };

  const handleReserve = () => {
    if (!selectedCard) return;
    if (me.reserved.length >= 3) return;
    onAction({ type: 'RESERVE', cardId: selectedCard.id });
    setSelectedCard(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.turnLabel}>{isMyTurn ? 'MY TURN' : 'WAIT'}</Text>
          <Text style={styles.turnSub}>업무일지 {state.turnCount}턴</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowExitConfirm(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.exitText}>로비로</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.board} contentContainerStyle={styles.boardContent}>
        <View style={styles.opponents}>
          {state.players.filter((p) => p.id !== viewerId).map((p) => (
            <View key={p.id} style={styles.opponentCard}>
              <Text style={styles.opponentName}>{p.name || `AI ${p.id}`}</Text>
              <Text style={styles.opponentScore}>점수 {p.points}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>부장님 결재 인감</Text>
          <View style={styles.tokenRow}>
            {(Object.values(GemColor) as GemColor[]).map((c) => (
              <TouchableOpacity key={c} onPress={() => toggleToken(c)} disabled={!isMyTurn}>
                <View style={[styles.tokenWrap, selectedTokens.includes(c) && styles.tokenSelected]}>
                  <GemIcon color={c} size={36} />
                  <Text style={styles.tokenCount}>{state.tokens[c]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleConfirmTokens} disabled={!isMyTurn}>
            <Text style={styles.actionText}>인감 가져오기 확정</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>추천서</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nobleRow}>
            {state.nobles.map((n) => (
              <View key={n.id} style={styles.nobleCard}>
                <Text style={styles.nobleName}>{n.name}</Text>
                <View style={styles.nobleReqRow}>
                  {Object.entries(n.requirements).map(([k, v]) => (
                    <Text key={k} style={styles.nobleReqText}>
                      {gemLabel(k as GemColor)} {v}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {[3, 2, 1].map((tier) => (
          <View key={tier} style={styles.section}>
            <Text style={styles.sectionTitle}>티어 {tier}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {state.visibleCards[tier as 1 | 2 | 3].map((c) => (
                <Card
                  key={c.id}
                  card={c}
                  selected={selectedCard?.id === c.id}
                  onPress={() => setSelectedCard(c)}
                />
              ))}
            </ScrollView>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>예약 카드</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {me.reserved.map((c) => (
              <Card key={c.id} card={c} selected={selectedCard?.id === c.id} onPress={() => setSelectedCard(c)} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>내 점수</Text>
          <Text style={styles.scoreValue}>{me.points} / 15</Text>
        </View>
        <View style={styles.meTokens}>
          {(Object.values(GemColor) as GemColor[]).map((c) => (
            <View key={c} style={styles.meToken}>
              <GemIcon color={c} size={26} />
              <Text style={styles.meTokenCount}>{me.tokens[c]}</Text>
              {c !== GemColor.Gold && bonuses[c] > 0 && (
                <Text style={styles.bonusText}>+{bonuses[c]}</Text>
              )}
            </View>
          ))}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleBuy} disabled={!isMyTurn}>
            <Text style={styles.secondaryText}>카드 구매</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleReserve} disabled={!isMyTurn}>
            <Text style={styles.secondaryText}>카드 찜</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowLogs((s) => !s)}>
            <Text style={styles.secondaryText}>업무일지</Text>
          </TouchableOpacity>
        </View>
        {showLogs && (
          <View style={styles.logBox}>
            {state.logs.map((l, i) => (
              <Text key={i} style={styles.logText}>
                {l}
              </Text>
            ))}
          </View>
        )}
      </View>

      {showExitConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>업무실적을 포기하겠습니까?</Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmNo]}
                onPress={() => setShowExitConfirm(false)}
              >
                <Text style={styles.confirmNoText}>아니오</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmYes]}
                onPress={() => {
                  setShowExitConfirm(false);
                  onExit();
                }}
              >
                <Text style={styles.confirmYesText}>예</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  turnLabel: { color: '#34d399', fontWeight: '800' },
  turnSub: { color: '#64748b', fontSize: 12 },
  exitText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  board: { flex: 1 },
  boardContent: { padding: 16, paddingBottom: 140, gap: 16 },
  opponents: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  opponentCard: { padding: 10, backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b' },
  opponentName: { color: '#e2e8f0', fontWeight: '700', fontSize: 12 },
  opponentScore: { color: '#94a3b8', fontSize: 11 },
  section: { gap: 8 },
  sectionTitle: { color: '#cbd5f5', fontSize: 12, fontWeight: '700' },
  tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tokenWrap: { alignItems: 'center', gap: 4 },
  tokenSelected: { transform: [{ scale: 1.05 }] },
  tokenCount: { color: '#e2e8f0', fontSize: 11 },
  actionBtn: {
    marginTop: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#0b1220', fontWeight: '800' },
  nobleRow: { gap: 8 },
  nobleCard: { padding: 8, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' },
  nobleName: { color: '#e2e8f0', fontSize: 12, fontWeight: '700' },
  nobleReqRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  nobleReqText: { color: '#94a3b8', fontSize: 10 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 12,
    gap: 8,
  },
  scoreBox: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreLabel: { color: '#94a3b8', fontSize: 12 },
  scoreValue: { color: '#e2e8f0', fontWeight: '800' },
  meTokens: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  meToken: { alignItems: 'center' },
  meTokenCount: { color: '#e2e8f0', fontSize: 10 },
  bonusText: { color: '#10b981', fontSize: 9 },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  secondaryText: { color: '#cbd5f5', fontSize: 12, fontWeight: '700' },
  logBox: { backgroundColor: '#0b1220', borderRadius: 10, padding: 8, gap: 4 },
  logText: { color: '#94a3b8', fontSize: 11 },
  confirmOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(2,6,23,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 12,
  },
  confirmTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmNo: {
    borderWidth: 1,
    borderColor: '#334155',
  },
  confirmYes: {
    backgroundColor: '#ef4444',
  },
  confirmNoText: {
    color: '#cbd5f5',
    fontWeight: '700',
  },
  confirmYesText: {
    color: '#0b1220',
    fontWeight: '800',
  },
});
