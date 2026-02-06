import AsyncStorage from '@react-native-async-storage/async-storage';
import { REWARD_TABLE, SEASON_DURATION_DAYS, getRank } from './constants';
import { UserProfile } from './types';

const USER_KEY = 'officequest:user';

export const loadUser = async (): Promise<UserProfile | null> => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
};

export const saveUser = async (user: UserProfile) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const createGuestUser = (): UserProfile => {
  const uid = `guest-${Math.random().toString(36).slice(2, 10)}`;
  return {
    uid,
    displayName: '마스터',
    email: null,
    photoURL: null,
    stats: {
      seasonNum: 1,
      seasonStartDate: Date.now(),
      vacations: 0,
      totalGames: 0,
      lifetimeGames: 0,
      lifetimeWins: 0,
      lifetimeVacations: 0,
      bestRankId: 1,
      bestRankSeason: 1,
      bestRankCount: 0,
    },
  };
};

export const profileFromFirebaseUser = (u: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null; }) => {
  return {
    uid: u.uid,
    displayName: u.displayName || '마스터',
    email: u.email || null,
    photoURL: u.photoURL || null,
    stats: {
      seasonNum: 1,
      seasonStartDate: Date.now(),
      vacations: 0,
      totalGames: 0,
      lifetimeGames: 0,
      lifetimeWins: 0,
      lifetimeVacations: 0,
      bestRankId: 1,
      bestRankSeason: 1,
      bestRankCount: 0,
    },
  };
};

export const updateSeasonIfNeeded = (user: UserProfile) => {
  const now = Date.now();
  const days = (now - user.stats.seasonStartDate) / (1000 * 60 * 60 * 24);
  if (days >= SEASON_DURATION_DAYS) {
    user.stats.seasonNum += 1;
    user.stats.seasonStartDate = now;
    user.stats.totalGames = 0;
  }
  return user;
};

export const applyGameRewards = (user: UserProfile, totalPlayers: number, winnerId: number, myId: number) => {
  const rewards = REWARD_TABLE[totalPlayers] || REWARD_TABLE[2];
  const gain = rewards[myId] || 0;
  const isWin = myId === winnerId;

  user.stats.vacations += gain;
  user.stats.totalGames += 1;
  user.stats.lifetimeGames += 1;
  user.stats.lifetimeVacations += gain;
  if (isWin) user.stats.lifetimeWins += 1;

  const currentRank = getRank(user.stats.vacations);
  if (currentRank.id > user.stats.bestRankId) {
    user.stats.bestRankId = currentRank.id;
    user.stats.bestRankSeason = user.stats.seasonNum;
    user.stats.bestRankCount = 1;
  } else if (currentRank.id === user.stats.bestRankId) {
    user.stats.bestRankCount += 1;
  }
};
