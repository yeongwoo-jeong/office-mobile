import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GemColor } from '../game/types';

const COLORS: Record<GemColor, string> = {
  [GemColor.White]: '#a78bfa',
  [GemColor.Blue]: '#3b82f6',
  [GemColor.Green]: '#10b981',
  [GemColor.Red]: '#ef4444',
  [GemColor.Black]: '#f8fafc',
  [GemColor.Gold]: '#f59e0b',
};

const LABELS: Record<GemColor, string> = {
  [GemColor.White]: '하',
  [GemColor.Blue]: '박',
  [GemColor.Green]: '나',
  [GemColor.Red]: '김',
  [GemColor.Black]: '이',
  [GemColor.Gold]: '결재',
};

export const GemIcon = ({ color, size = 28 }: { color: GemColor; size?: number }) => {
  const label = LABELS[color];
  const fontSize = label.length > 1 ? Math.max(9, Math.floor(size * 0.32)) : Math.max(10, Math.floor(size * 0.42));
  return (
    <View style={[styles.gem, { width: size, height: size, backgroundColor: COLORS[color] }]}>
      <Text style={[styles.gemText, { fontSize }]}>{label}</Text>
    </View>
  );
};

export const gemColor = (color: GemColor) => COLORS[color];
export const gemLabel = (color: GemColor) => LABELS[color];

const styles = StyleSheet.create({
  gem: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0b1220',
  },
  gemText: {
    color: '#0b1220',
    fontSize: 12,
    fontWeight: '800',
  },
});
