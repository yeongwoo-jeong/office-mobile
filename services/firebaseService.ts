
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, push, child, get, remove, runTransaction, query, orderByChild, equalTo, limitToFirst } from 'firebase/database';
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { GameState, SeasonStats, UserProfile } from '../types';
import { SEASON_DURATION_DAYS, getRank } from '../constants';

// =========================================================================================
// [1] Firebase 설정값 (영구 저장됨)
// =========================================================================================
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyBM0VwJOhE4dKWZCMqqQbxn6OFzKDGBV7U",
  authDomain: "office-quest-e7d38.firebaseapp.com",
  databaseURL: "https://office-quest-e7d38-default-rtdb.firebaseio.com",
  projectId: "office-quest-e7d38",
  storageBucket: "office-quest-e7d38.firebasestorage.app",
  messagingSenderId: "588391233335",
  appId: "1:588391233335:web:f7c6a62a46af7381628cb2",
  measurementId: "G-NG0M9FHB9C"
};

let app: any = null;
let db: any = null;
let auth: any = null;

const init = (config: any) => {
    try {
        if (!app) {
            app = initializeApp(config);
            db = getDatabase(app);
            auth = getAuth(app);
        }
        return true;
    } catch (e) {
        console.error("Firebase Init Error:", e);
        return false;
    }
};

const savedConfig = typeof window !== 'undefined' ? localStorage.getItem('firebase_config') : null;
if (savedConfig) {
    try { init(JSON.parse(savedConfig)); } catch (e) { console.error(e); }
} else if (DEFAULT_CONFIG.apiKey && DEFAULT_CONFIG.apiKey !== "API_KEY_를_입력하세요") {
    init(DEFAULT_CONFIG);
}

export const isFirebaseReady = () => !!app && !!auth;

export const saveFirebaseConfig = (configStr: string) => {
    try {
        let cleanStr = configStr.trim();
        cleanStr = cleanStr.replace(/(const|var|let)\s+\w+\s*=\s*/, '').replace(/;\s*$/, '');
        const firstBrace = cleanStr.indexOf('{');
        const lastBrace = cleanStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) cleanStr = cleanStr.substring(firstBrace, lastBrace + 1);
        const config = new Function("return " + cleanStr)();
        if (!config.apiKey) throw new Error("API Key not found in config");
        localStorage.setItem('firebase_config', JSON.stringify(config));
        window.location.reload(); 
    } catch (e: any) {
        alert("설정 형식을 인식할 수 없습니다.\n\nFirebase Console의 'SDK 설정 및 구성' 내용을 다시 확인해주세요.");
        console.error(e);
    }
};

export const resetFirebaseConfig = () => {
    localStorage.removeItem('firebase_config');
    window.location.reload();
};


// --- AUTH & SEASON ---

const processSeasonRotation = (currentStats: SeasonStats): SeasonStats => {
    const now = Date.now();
    const expiry = currentStats.seasonStartDate + (SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000);
    
    if (now > expiry) {
        // Calculate Rank for the finished season
        const finishedRank = getRank(currentStats.vacations || 0);
        
        let newBestRankId = currentStats.bestRankId || 0;
        let newBestRankSeason = currentStats.bestRankSeason || currentStats.seasonNum;
        let newBestRankCount = currentStats.bestRankCount || 0;

        // Check if this season's rank is better or equal
        if (finishedRank.id > newBestRankId) {
            newBestRankId = finishedRank.id;
            newBestRankSeason = currentStats.seasonNum;
            newBestRankCount = 1;
        } else if (finishedRank.id === newBestRankId) {
            newBestRankCount = (newBestRankCount || 0) + 1;
        }

        // Reset for new season but preserve records
        return {
            seasonNum: (currentStats.seasonNum || 1) + 1,
            seasonStartDate: now,
            vacations: 0,
            totalGames: 0,
            lastGameId: currentStats.lastGameId, // keep last game id
            
            // Preserve Lifetime
            lifetimeGames: currentStats.lifetimeGames || 0,
            lifetimeWins: currentStats.lifetimeWins || 0,
            lifetimeVacations: currentStats.lifetimeVacations || 0,
            
            // Update Records
            bestRankId: newBestRankId,
            bestRankSeason: newBestRankSeason,
            bestRankCount: newBestRankCount
        };
    }
    return currentStats;
};

const fetchUserData = async (uid: string): Promise<SeasonStats> => {
  const defaultStats: SeasonStats = {
      seasonNum: 1,
      seasonStartDate: Date.now(),
      vacations: 0,
      totalGames: 0,
      lifetimeGames: 0,
      lifetimeWins: 0,
      lifetimeVacations: 0,
      bestRankId: 0,
      bestRankSeason: 0,
      bestRankCount: 0
  };

  if (!db) {
      // LocalStorage fallback for guests
      const local = localStorage.getItem(`user_stats_${uid}`);
      let stats = local ? JSON.parse(local) : defaultStats;
      stats = processSeasonRotation(stats);
      localStorage.setItem(`user_stats_${uid}`, JSON.stringify(stats));
      return stats;
  }

  try {
    const snapshot = await get(child(ref(db), `users/${uid}`));
    if (snapshot.exists()) {
      let stats = snapshot.val();
      
      // Data Migration: Add new fields if missing
      if (stats.lifetimeGames === undefined) {
          stats.lifetimeGames = stats.totalGames || 0;
          stats.lifetimeVacations = stats.vacations || 0;
          stats.lifetimeWins = 0; // Can't recover history accurately
          stats.bestRankId = 0;
          stats.bestRankSeason = 0;
          stats.bestRankCount = 0;
      }

      const updatedStats = processSeasonRotation(stats);
      if (updatedStats.seasonNum !== stats.seasonNum) {
          await set(ref(db, `users/${uid}`), updatedStats);
      }
      return updatedStats;
    }
    await set(ref(db, `users/${uid}`), defaultStats);
    return defaultStats;
  } catch (e) {
    console.error("Fetch User Stats Error", e);
    return defaultStats;
  }
};

export const loginWithGoogle = async () => { if (!auth) throw new Error("Auth not init"); return signInWithPopup(auth, new GoogleAuthProvider()); };
export const loginWithApple = async () => { if (!auth) throw new Error("Auth not init"); return signInWithPopup(auth, new OAuthProvider('apple.com')); };
export const loginWithKakao = async () => { if (!auth) throw new Error("Auth not init"); return signInWithPopup(auth, new OAuthProvider('oidc.kakao')); };
export const loginWithNaver = async () => { if (!auth) throw new Error("Auth not init"); return signInWithPopup(auth, new OAuthProvider('oidc.naver')); };
export const logout = async () => { if (!auth) return; return signOut(auth); };

export const subscribeToAuth = (callback: (user: UserProfile | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
          const stats = await fetchUserData(firebaseUser.uid);
          callback({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || "익명 사원",
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              stats: stats
          });
      } else {
          callback(null);
      }
  });
};

export const updateUserVacations = async (uid: string, earned: number, isWin: boolean, gameId: string) => {
    if (!db) return;
    const userRef = ref(db, `users/${uid}`);
    await runTransaction(userRef, (currentStats) => {
        if (!currentStats) {
             // Fallback default
             return {
                seasonNum: 1, seasonStartDate: Date.now(), vacations: earned, totalGames: 1, 
                lifetimeGames: 1, lifetimeWins: isWin?1:0, lifetimeVacations: earned, 
                bestRankId: 0, bestRankSeason: 0, bestRankCount: 0,
                lastGameId: gameId
             };
        }
        
        // Idempotency check
        if (currentStats.lastGameId === gameId) return; 
        
        // Update Current Season
        currentStats.vacations = (currentStats.vacations || 0) + earned;
        currentStats.totalGames = (currentStats.totalGames || 0) + 1;
        
        // Update Lifetime
        currentStats.lifetimeGames = (currentStats.lifetimeGames || 0) + 1;
        currentStats.lifetimeVacations = (currentStats.lifetimeVacations || 0) + earned;
        if (isWin) {
            currentStats.lifetimeWins = (currentStats.lifetimeWins || 0) + 1;
        }

        currentStats.lastGameId = gameId;
        return currentStats;
    });
};


// --- DATABASE & ROOMS ---

export const createRoom = async (roomId: string, initialState: GameState) => {
  if (!db) return;
  await set(ref(db, `rooms/${roomId}`), {
    ...initialState,
    createdAt: Date.now()
  });
};

export const joinRoom = async (roomId: string) => {
  if (!db) return null;
  const snapshot = await get(child(ref(db), `rooms/${roomId}`));
  if (snapshot.exists()) return snapshot.val();
  return null;
};

// Find a public room with slots available matching player count (or 0 for any)
export const findPublicRoom = async (preferredCount: number): Promise<string | null> => {
    if (!db) return null;
    
    // Simplification: Fetch the last 20 waiting rooms and filter in memory
    const roomsRef = query(ref(db, 'rooms'), orderByChild('status'), equalTo('waiting'), limitToFirst(20));
    const snapshot = await get(roomsRef);
    
    if (!snapshot.exists()) return null;
    
    const rooms = snapshot.val();
    for (const [id, room] of Object.entries(rooms) as [string, GameState][]) {
        if (!room.isPublic) continue;
        
        // 1. Check Max Players
        // If preferred is 0 (Any), we take any room
        // If preferred is specific (e.g., 3), we want room.maxPlayers == 3 OR room.maxPlayers == 0
        if (preferredCount !== 0 && room.maxPlayers !== 0 && room.maxPlayers !== preferredCount) continue;
        
        // 2. Check if full
        const capacity = room.maxPlayers === 0 ? 4 : room.maxPlayers;
        if (room.players.length < capacity) {
            return id;
        }
    }
    return null;
};

export const subscribeToRoom = (roomId: string, callback: (data: GameState) => void) => {
  if (!db) return () => {};
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (data) callback(data);
  });
};

export const updateGameState = async (roomId: string, newState: GameState) => {
  if (!db) return;
  await update(ref(db, `rooms/${roomId}`), newState);
};
