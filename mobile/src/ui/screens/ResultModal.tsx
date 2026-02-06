import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GameState } from '../../game/types';

export const ResultModal = ({
  state,
  onRestart,
  onLobby,
}: {
  state: GameState;
  onRestart: () => void;
  onLobby: () => void;
}) => {
  if (state.winner === null) return null;
  const sorted = [...state.players].sort((a, b) => b.points - a.points);
  const winner = state.players[state.winner];

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>게임 종료</Text>
        <Text style={styles.subtitle}>{winner.name || 'Player'} 승리!</Text>
        <View style={styles.rankBox}>
          {sorted.map((p, idx) => (
            <Text key={p.id} style={styles.rankText}>
              {idx + 1}. {p.name || `Player ${p.id + 1}`} · {p.points}점
            </Text>
          ))}
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={onRestart}>
          <Text style={styles.primaryText}>다시하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onLobby}>
          <Text style={styles.secondaryText}>로비로</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(2,6,23,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    width: '100%',
    maxWidth: 360,
    gap: 10,
  },
  title: { color: '#e2e8f0', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: 12 },
  rankBox: { gap: 4, marginTop: 8 },
  rankText: { color: '#cbd5f5', fontSize: 12 },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#0b1220', fontWeight: '800' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#cbd5f5', fontWeight: '700' },
});
