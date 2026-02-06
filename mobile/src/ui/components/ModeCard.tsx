import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

type Props = {
  title: string;
  colors: [string, string];
  onPress?: () => void;
  badge?: string;
  width?: number;
  height?: number;
  children?: React.ReactNode;
};

export const ModeCard = ({ title, colors: gradientColors, onPress, badge, width, height, children }: Props) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cardWrap, pressed && styles.cardPressed]}>
      <LinearGradient colors={gradientColors} style={[styles.card, width ? { width } : null, height ? { height } : null]}>
        <View style={styles.artArea}>{children}</View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <View style={styles.buttonPill}>
          <Text style={styles.buttonText}>{title}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardWrap: {
    shadowColor: colors.cardShadow,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    padding: 16,
    gap: 10,
    height: 230,
    width: 300,
  },
  artArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPill: {
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.btnDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    left: 16,
    bottom: 62,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
