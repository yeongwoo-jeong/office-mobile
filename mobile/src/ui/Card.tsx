import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card as CardType, GemColor } from '../game/types';
import { GemIcon, gemColor, gemLabel } from './GemIcon';

export const Card = ({
  card,
  selected,
  onPress,
}: {
  card: CardType;
  selected?: boolean;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.header}>
        <Text style={styles.points}>{card.points > 0 ? card.points : ''}</Text>
        <View style={[styles.bonus, { backgroundColor: gemColor(card.bonus) }]}>
          <Text style={styles.bonusText}>{gemLabel(card.bonus)}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {card.name}
      </Text>
      <View style={styles.costs}>
        {Object.entries(card.cost).map(([c, v]) => (
          <View key={c} style={styles.costRow}>
            <GemIcon color={c as GemColor} size={14} />
            <Text style={styles.costText}>{v}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 130,
    height: 176,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginRight: 10,
  },
  cardSelected: {
    borderColor: '#34d399',
    shadowColor: '#34d399',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  points: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '800',
  },
  bonus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusText: {
    color: '#0b1220',
    fontWeight: '800',
    fontSize: 11,
  },
  name: {
    color: '#cbd5f5',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    minHeight: 34,
  },
  costs: {
    marginTop: 'auto',
    gap: 4,
    backgroundColor: '#0b1220',
    borderRadius: 8,
    padding: 6,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
});
