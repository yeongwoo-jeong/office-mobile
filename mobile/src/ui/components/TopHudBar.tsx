import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

type Props = {
  name: string;
  rank: string;
  vacations: number;
  progress: number; // 0..1
  trophyScore: number;
  coins: number;
  onMenu?: () => void;
  onGetCoins?: () => void;
  onDaily?: () => void;
};

export const TopHudBar = ({
  name,
  rank,
  vacations,
  progress,
  trophyScore,
  coins,
  onMenu,
  onGetCoins,
  onDaily,
}: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        <View style={styles.leftBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.rankText}>{rank}</Text>
            <Text style={styles.nameText}>{name}</Text>
            <View style={styles.nameBox}>
              <Text style={styles.nameBoxText}>닉네임변경</Text>
            </View>
          </View>
          <View style={styles.expRow}>
            <View style={styles.expTrack}>
              <View style={[styles.expFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
            </View>
            <Text style={styles.expLabel}>0 / 3</Text>
          </View>
          <Text style={styles.vacText}>휴가 {vacations}개</Text>
        </View>

        <View style={styles.centerBlock}>
          <View style={styles.centerRow}>
            <LinearGradient colors={['rgba(20,70,120,0.65)', 'rgba(20,70,120,0.4)']} style={styles.centerPill}>
              <Ionicons name="trophy" size={18} color={colors.accent} />
              <Text style={styles.centerText}>{trophyScore}</Text>
            </LinearGradient>
            <LinearGradient colors={['rgba(20,70,120,0.65)', 'rgba(20,70,120,0.4)']} style={styles.centerPill}>
              <MaterialCommunityIcons name="currency-usd" size={18} color={colors.accent} />
              <Text style={styles.centerText}>{coins}</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.rightBlock}>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnGhost} onPress={onDaily}>
              <Text style={styles.btnGhostText}>일일 보상</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={onMenu}>
              <Ionicons name="menu" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pill: {
    minHeight: 64,
    backgroundColor: colors.hudBg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.hudBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leftBlock: {
    flex: 1.3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rankText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  nameText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  nameBox: {
    minWidth: 120,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBoxText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  expTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  expFill: {
    height: 8,
    backgroundColor: colors.accent,
  },
  expLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  vacText: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  centerBlock: {
    alignItems: 'center',
    gap: 4,
  },
  centerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  centerPill: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hudBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  rightBlock: {
    flex: 1.4,
    alignItems: 'flex-end',
    gap: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  btnGhostText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(20,70,120,0.65)',
    borderWidth: 1,
    borderColor: colors.hudBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
