import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';
import { TopHudBar } from '../components/TopHudBar';
import { ModeCard } from '../components/ModeCard';

export const LobbyScreen = ({
  name = '마스터',
  onStartSingle,
  onStartLocal,
}: {
  name?: string;
  onStartSingle?: () => void;
  onStartLocal?: (count: number) => void;
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const cardWidth = (isLandscape ? Math.min(320, Math.max(280, width * 0.23)) : width * 0.88) * 0.8;
  const cardHeight = (isLandscape ? Math.min(240, Math.max(210, height * 0.32)) : 220) * 0.8;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.container}>
        <View style={styles.spotA} />
        <View style={styles.spotB} />

        <TopHudBar
          name={name}
          rank="수습"
          vacations={0}
          progress={0}
          trophyScore={0}
          coins={200}
        />

        <View style={[styles.cardsRow, !isLandscape && styles.cardsColumn]}>
          <ModeCard
            title="전체 프로젝트"
            colors={['#2F80FF', '#1A5FD6']}
            onPress={() => onStartLocal && onStartLocal(4)}
            width={cardWidth}
            height={cardHeight}
          >
            <View style={styles.stack}>
              <View style={[styles.paper, styles.paperA]} />
              <View style={[styles.paper, styles.paperB]} />
              <View style={[styles.paper, styles.paperC]} />
              <View style={[styles.token, { backgroundColor: '#29C782', top: 12, left: 12 }]} />
              <View style={[styles.token, { backgroundColor: '#FFD54A', top: 38, right: 18 }]} />
              <View style={[styles.token, { backgroundColor: '#FF5D5D', bottom: 10, left: 26 }]} />
            </View>
          </ModeCard>

          <ModeCard
            title="팀 프로젝트"
            colors={['#7D3CFF', '#4B22B8']}
            onPress={() => onStartLocal && onStartLocal(2)}
            width={cardWidth}
            height={cardHeight}
          >
            <View style={styles.lockWrap}>
              <Ionicons name="lock-closed" size={50} color={colors.accent} />
              <View style={styles.peopleRow}>
                <MaterialCommunityIcons name="account-circle" size={32} color="#E3E3FF" />
                <MaterialCommunityIcons name="account-circle" size={32} color="#E3E3FF" />
              </View>
            </View>
          </ModeCard>

          <ModeCard
            title="시즌 프로젝트"
            colors={['#29C782', '#1A9D66']}
            badge="Open!"
            onPress={() => onStartSingle && onStartSingle()}
            width={cardWidth}
            height={cardHeight}
          >
            <View style={styles.teamWrap}>
              <Ionicons name="trophy" size={48} color="#E8FFF4" />
            </View>
          </ModeCard>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  container: { flex: 1 },
  spotA: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#4CC3FF',
    opacity: 0.12,
    top: -40,
    left: 20,
  },
  spotB: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#3A8BFF',
    opacity: 0.1,
    bottom: 40,
    right: -40,
  },
  cardsRow: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  cardsColumn: {
    flexDirection: 'column',
    gap: 16,
  },
  stack: {
    width: 120,
    height: 110,
  },
  paper: {
    position: 'absolute',
    width: 84,
    height: 54,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  paperA: { top: 4, left: 18, transform: [{ rotate: '-8deg' }] },
  paperB: { top: 20, left: 8, transform: [{ rotate: '4deg' }] },
  paperC: { top: 30, left: 26, transform: [{ rotate: '-2deg' }] },
  token: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  lockWrap: {
    alignItems: 'center',
    gap: 10,
  },
  peopleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  teamWrap: {
    alignItems: 'center',
    gap: 8,
  },
});
