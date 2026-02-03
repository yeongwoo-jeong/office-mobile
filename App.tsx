
import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerState, GemColor, Card as CardType, ActionType, UserProfile } from './types';
import { INITIAL_TOKENS, TIER_1_CARDS, TIER_2_CARDS, TIER_3_CARDS, NOBLES, WINNING_SCORE, getRank, getNextRank, RANK_SYSTEM, SEASON_DURATION_DAYS, REWARD_TABLE } from './constants';
import { getBestMove } from './services/geminiService';
import { 
  createRoom, joinRoom, subscribeToRoom, updateGameState, isFirebaseReady, findPublicRoom,
  loginWithGoogle, loginWithApple, loginWithKakao, loginWithNaver, logout, subscribeToAuth,
  saveFirebaseConfig, resetFirebaseConfig, updateUserVacations
} from './services/firebaseService';
import { Card } from './components/Card';
import { GemIcon, getGemColorBg } from './components/GemIcon';
import { Briefcase, Building, Coffee, Trophy, User, UserX, AlertCircle, Play, Stamp, FileText, Smartphone, Monitor, Users, Cpu, ArrowLeft, Menu, X, LogOut, MessageCircle, Apple, Settings, Save, ShieldAlert, Ghost, Copy, Check, Plane, Crown, Calendar, Globe, Lock, Plus, LogIn } from 'lucide-react';

// Utils
const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

const getBonuses = (player: PlayerState): Record<string, number> => {
  const bonuses: Record<string, number> = {};
  player.cards.forEach(c => {
    const color = c.bonus as string;
    bonuses[color] = (bonuses[color] || 0) + 1;
  });
  return bonuses;
};

const canAfford = (player: PlayerState, card: CardType): boolean => {
  let goldNeeded = 0;
  const bonuses = getBonuses(player);
  
  for (const [color, cost] of Object.entries(card.cost)) {
    const costVal = cost as number;
    const bonus = bonuses[color as GemColor] || 0;
    const owned = player.tokens[color as GemColor] || 0;
    
    const needed = Math.max(0, costVal - bonus);
    if (owned < needed) {
      goldNeeded += (needed - owned);
    }
  }
  return player.tokens[GemColor.Gold] >= goldNeeded;
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<GemColor[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [gameMode, setGameMode] = useState<'lobby' | 'single' | 'multi'>('lobby');
  const [multiStatus, setMultiStatus] = useState<'init' | 'creating' | 'joining' | 'waiting'>('init');
  const [roomId, setRoomId] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // New States for Features
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createConfig, setCreateConfig] = useState({ players: 2, isPublic: true }); 
  const [joinConfig, setJoinConfig] = useState(() => {
      const saved = localStorage.getItem('last_join_count');
      return { players: saved ? parseInt(saved) : 0 };
  });
  const [autoStartCount, setAutoStartCount] = useState<number | null>(null);

  // Config UI State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configInput, setConfigInput] = useState("");
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Error State
  const [authError, setAuthError] = useState<{ type: string, hostname: string } | null>(null);

  // Rank Update Lock
  const lastProcessedGameId = useRef<string | null>(null);

  const getHostname = () => typeof window !== 'undefined' && window.location ? window.location.hostname : 'unknown';

  useEffect(() => {
    if (!isFirebaseReady()) setShowConfigModal(true);
  }, []);

  useEffect(() => {
    return subscribeToAuth((u) => {
        if (u) setUser(u);
        else {
            setUser(prev => prev?.uid.startsWith('guest-') ? prev : null);
            if (!user?.uid.startsWith('guest-')) setGameMode('lobby');
        }
    });
  }, []);

  // Multi Logic
  useEffect(() => {
    if (gameMode === 'multi' && roomId && multiStatus === 'waiting') {
       return subscribeToRoom(roomId, (data) => {
          if (!data) return;
          setGameState(data);
          
          // Auto Start Logic
          if (data.status === 'waiting' && data.maxPlayers > 0) {
             if (data.players.length === data.maxPlayers) {
                 if (autoStartCount === null) {
                     setAutoStartCount(3);
                 }
             } else {
                 setAutoStartCount(null); 
             }
          }
       });
    }
  }, [gameMode, roomId, multiStatus, autoStartCount]);

  // Countdown Effect
  useEffect(() => {
      if (autoStartCount === null) return;
      if (autoStartCount > 0) {
          const timer = setTimeout(() => setAutoStartCount(autoStartCount - 1), 1000);
          return () => clearTimeout(timer);
      }
      if (autoStartCount === 0 && gameState?.hostId === user?.uid && gameState?.status === 'waiting') {
          updateGameState(roomId, { ...gameState, status: 'playing' });
          setAutoStartCount(null);
      }
  }, [autoStartCount, gameState, user, roomId]);

  // Reward Logic
  useEffect(() => {
      if (gameState?.winner !== null && gameState?.winner !== undefined && user && !user.uid.startsWith('guest-')) {
          const currentGameId = gameState.roomId || `local-${gameState.turnCount}-${Date.now()}`;
          if (lastProcessedGameId.current !== currentGameId) {
             const myId = getMyPlayerId();
             const sortedPlayers = [...gameState.players].map((p, idx) => ({ ...p, originalIdx: idx })).sort((a, b) => b.points - a.points);
             const myRankIdx = sortedPlayers.findIndex(p => p.originalIdx === myId);
             const rewardList = REWARD_TABLE[gameState.players.length] || REWARD_TABLE[2];
             const earnedVacation = rewardList[myRankIdx] || 0;
             const isWin = myRankIdx === 0;

             updateUserVacations(user.uid, earnedVacation, isWin, currentGameId).then(() => {
                 setUser(prev => prev ? { 
                     ...prev, 
                     stats: { 
                         ...prev.stats, 
                         vacations: prev.stats.vacations + earnedVacation, 
                         totalGames: prev.stats.totalGames + 1,
                         // Increment local knowns for UI update
                         lifetimeGames: (prev.stats.lifetimeGames || 0) + 1,
                         lifetimeVacations: (prev.stats.lifetimeVacations || 0) + earnedVacation,
                         lifetimeWins: isWin ? (prev.stats.lifetimeWins || 0) + 1 : (prev.stats.lifetimeWins || 0)
                     } 
                 } : null);
             });
             lastProcessedGameId.current = currentGameId;
          }
      }
  }, [gameState?.winner, user]);

  const initGameData = (count: number, isPublic: boolean): GameState => {
    const deck1 = shuffle([...TIER_1_CARDS]);
    const deck2 = shuffle([...TIER_2_CARDS]);
    const deck3 = shuffle([...TIER_3_CARDS]);
    const visible1 = deck1.splice(0, 4);
    const visible2 = deck2.splice(0, 4);
    const visible3 = deck3.splice(0, 4);
    const selectedNobles = shuffle([...NOBLES]).splice(0, count + 1);

    const players: PlayerState[] = [{ 
          id: 0, 
          uid: user?.uid,
          isAI: false, 
          name: user?.displayName || '나 (호스트)', 
          photoURL: user?.photoURL || undefined,
          vacations: user?.stats.vacations || 0,
          tokens: { White: 0, Blue: 0, Green: 0, Red: 0, Black: 0, Gold: 0 }, 
          cards: [], reserved: [], points: 0, nobles: [] 
    }];

    return {
      roomId: undefined,
      maxPlayers: count,
      isPublic: isPublic,
      players: players,
      currentPlayerIndex: 0,
      tokens: INITIAL_TOKENS(count),
      decks: { 1: deck1, 2: deck2, 3: deck3 },
      visibleCards: { 1: visible1, 2: visible2, 3: visible3 },
      nobles: selectedNobles,
      winner: null,
      logs: ["신입사원, 환영하네. 성과(15점)를 달성하면 휴가를 보내주지."],
      turnCount: 0,
      status: 'waiting',
      hostId: user?.uid
    };
  };

  const startSinglePlayer = () => {
    const newState = initGameData(2, false);
    newState.players.push({ 
          id: 1, 
          isAI: true, 
          name: 'AI 상무님', 
          vacations: 130,
          tokens: { White: 0, Blue: 0, Green: 0, Red: 0, Black: 0, Gold: 0 }, 
          cards: [], reserved: [], points: 0, nobles: [] 
    });
    newState.status = 'playing';
    setGameState(newState);
    setGameMode('single');
  };

  const handleCreateRoom = async () => {
      if (!isFirebaseReady()) { setShowConfigModal(true); return; }
      
      const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      const newState = initGameData(createConfig.players, createConfig.isPublic);
      newState.roomId = roomCode;
      
      await createRoom(roomCode, newState);
      setRoomId(roomCode);
      setGameState(newState);
      setGameMode('multi');
      setMultiStatus('waiting');
      setShowCreateModal(false);
  };

  const handleQuickJoin = async () => {
      if (!isFirebaseReady()) { setShowConfigModal(true); return; }
      localStorage.setItem('last_join_count', joinConfig.players.toString());
      
      const foundRoomId = await findPublicRoom(joinConfig.players);
      if (foundRoomId) {
          await performJoin(foundRoomId);
      } else {
          alert("조건에 맞는 대기 중인 방이 없습니다.");
      }
  };

  const handleCodeJoin = async () => {
      const code = prompt("방 코드를 입력하세요:");
      if (code) performJoin(code.toUpperCase());
  };

  const performJoin = async (targetId: string) => {
    const roomData = await joinRoom(targetId);
    if (!roomData) { alert("방을 찾을 수 없습니다."); return; }
    if (roomData.status !== 'waiting') { alert("이미 시작된 게임입니다."); return; }
    const max = roomData.maxPlayers === 0 ? 4 : roomData.maxPlayers;
    if (roomData.players.length >= max) { alert("방이 꽉 찼습니다."); return; }

    const newId = roomData.players.length;
    const newPlayer: PlayerState = {
        id: newId,
        uid: user?.uid,
        isAI: false,
        name: user?.displayName || `참가자${newId}`,
        photoURL: user?.photoURL || undefined,
        vacations: user?.stats.vacations || 0,
        tokens: { White: 0, Blue: 0, Green: 0, Red: 0, Black: 0, Gold: 0 },
        cards: [], reserved: [], points: 0, nobles: []
    };
    
    const updatedState = { ...roomData };
    updatedState.players.push(newPlayer);
    updatedState.logs.unshift(`${user?.displayName}님이 입장했습니다.`);
    
    await updateGameState(targetId, updatedState);
    setRoomId(targetId);
    setGameMode('multi');
    setMultiStatus('waiting');
    setShowJoinModal(false);
  };

  const handleGuestLogin = () => {
      setUser({
          uid: `guest-${Math.random().toString(36).substr(2, 9)}`,
          displayName: "게스트 사원",
          email: null,
          photoURL: null,
          stats: { seasonNum: 1, seasonStartDate: Date.now(), vacations: 0, totalGames: 0, lifetimeGames: 0, lifetimeWins: 0, lifetimeVacations: 0, bestRankId: 0, bestRankSeason: 0, bestRankCount: 0 }
      });
  };

  const handleLogin = async (provider: string) => {
    if(!isFirebaseReady()) { setShowConfigModal(true); return; }
    try {
        setAuthError(null);
        if (provider === 'google') await loginWithGoogle();
        else if (provider === 'apple') await loginWithApple();
        else if (provider === 'kakao') {
            try { await loginWithKakao(); } catch(e: any) { alert(e.message); }
        }
        else if (provider === 'naver') {
            try { await loginWithNaver(); } catch(e: any) { alert(e.message); }
        }
    } catch (e: any) {
        if (e.code === 'auth/unauthorized-domain' || e.message.includes('unauthorized domain')) {
            setAuthError({ type: 'unauthorized-domain', hostname: getHostname() });
        } else {
            alert(`로그인 실패: ${e.message}`);
        }
    }
  };

  const handleLogout = async () => {
      if (user?.uid.startsWith('guest-')) {
          setUser(null);
          setGameMode('lobby');
      } else {
          await logout();
      }
  };

  const handleSaveConfig = () => {
      saveFirebaseConfig(configInput);
      setShowConfigModal(false);
  }

  const getMyPlayerId = (): number => {
      if (!gameState || !user) return 0; 
      const me = gameState.players.find(p => p.uid === user.uid);
      return me ? me.id : 0;
  };

  const myPlayerId = getMyPlayerId();

  const handleTokenSelect = (color: GemColor) => {
    if (!gameState) return;
    if (gameState.currentPlayerIndex !== myPlayerId) return; 
    if (gameState.winner !== null) return;
    
    // Gold Token Toggle Logic (Reserve Mode)
    if (color === GemColor.Gold) {
        if (selectedTokens.includes(GemColor.Gold)) {
            setSelectedTokens([]); // Toggle Off
        } else {
            setSelectedTokens([GemColor.Gold]); // Toggle On (Reserve Mode)
        }
        return;
    }

    // Block other selection if Gold is selected
    if (selectedTokens.includes(GemColor.Gold)) {
        return; 
    }

    // Toggle Logic
    const currentTokens = [...selectedTokens];
    if (currentTokens.includes(color)) {
      // If already selected, Deselect it (Undo)
      setSelectedTokens(currentTokens.filter(t => t !== color));
    } else {
      // Add selection
      const newSelection = [...currentTokens, color];
      if (newSelection.length === 3) { 
          executeAction('TAKE_3_DIFF', newSelection); 
          setSelectedTokens([]); 
      } else {
          setSelectedTokens(newSelection);
      }
    }
  };

  const handleTakeTwo = (color: GemColor) => {
    if (!gameState) return;
    if (gameState.currentPlayerIndex !== myPlayerId) return;
    
    if (gameState.tokens[color] < 4) {
        alert("4개 미만일 땐 2개를 가져올 수 없습니다.");
        return;
    }
    executeAction('TAKE_2_SAME', [color, color]);
    setSelectedTokens([]);
  };

  const handleCardClick = (card: CardType, isReservedHand: boolean = false) => {
    if (!gameState) return;
    if (gameState.currentPlayerIndex !== myPlayerId) return;
    if (gameState.winner !== null) return;

    const player = gameState.players[myPlayerId];
    const isGoldMode = selectedTokens.includes(GemColor.Gold);

    // NEW: Reserve Mode (via Gold Token Selection)
    if (isGoldMode) {
        if (isReservedHand) {
            alert("이미 찜한 업무입니다.");
            return;
        }
        if (player.reserved.length >= 3) {
            alert("더 이상 찜할 수 없습니다 (최대 3개).");
            return;
        }
        executeAction('RESERVE', [], card.id);
        setSelectedTokens([]); // Reset selection after reserve
        return;
    }

    // Normal Mode: Buy only. No implicit reserve.
    if (canAfford(player, card)) {
        executeAction('BUY', [], card.id);
    } else if (!isReservedHand) {
        // Prevent accidental reserve if not in Gold Mode
        // Implicitly do nothing (or show UI feedback via Card props)
    }
  };

  const executeAction = async (type: ActionType, gems: GemColor[] = [], cardId?: string) => {
    if (!gameState) return;
    const newState = { ...gameState };
    const playerIndex = newState.currentPlayerIndex;
    
    const player = { 
        ...newState.players[playerIndex],
        tokens: { ...newState.players[playerIndex].tokens },
        reserved: [...newState.players[playerIndex].reserved],
        cards: [...newState.players[playerIndex].cards],
        nobles: [...newState.players[playerIndex].nobles]
    };

    const newTokens = { ...newState.tokens };
    let logs = [...newState.logs];
    
    let newVisibleCards = { 
        1: [...newState.visibleCards[1]], 
        2: [...newState.visibleCards[2]], 
        3: [...newState.visibleCards[3]] 
    };
    let newDecks = { 
        1: [...newState.decks[1]], 
        2: [...newState.decks[2]], 
        3: [...newState.decks[3]] 
    };

    const findAndRemoveCard = (id: string) => {
        if (player.reserved.find(c => c.id === id)) {
           const c = player.reserved.find(c => c.id === id)!;
           player.reserved = player.reserved.filter(card => card.id !== id);
           return { card: c }; 
        }
        for (let tier of [1, 2, 3] as const) {
          const idx = newVisibleCards[tier].findIndex(c => c.id === id);
          if (idx !== -1) {
            const card = newVisibleCards[tier][idx];
            const newCard = newDecks[tier].length > 0 ? newDecks[tier].pop()! : null;
            if (newCard) newVisibleCards[tier][idx] = newCard;
            else newVisibleCards[tier].splice(idx, 1);
            return { card };
          }
        }
        return { card: null };
    };

    const name = player.name;

    if (type.startsWith('TAKE')) {
        gems.forEach(g => { player.tokens[g]++; newTokens[g]--; });
        logs.unshift(`${name}: 승인 도장 획득`);
    }

    if (type === 'RESERVE' && cardId) {
        const { card } = findAndRemoveCard(cardId);
        if (card) {
            player.reserved.push(card);
            if (newTokens[GemColor.Gold] > 0) { player.tokens[GemColor.Gold]++; newTokens[GemColor.Gold]--; }
            logs.unshift(`${name}: 업무 찜 (조커 획득)`);
        }
    }

    if (type === 'BUY' && cardId) {
        const { card } = findAndRemoveCard(cardId);
        if (card) {
            const bonuses = getBonuses(player);
            for (const [color, cost] of Object.entries(card.cost)) {
                const need = Math.max(0, (cost as number) - (bonuses[color as GemColor] || 0));
                const available = player.tokens[color as GemColor];
                if (available >= need) { player.tokens[color as GemColor] -= need; newTokens[color as GemColor] += need; }
                else {
                    player.tokens[color as GemColor] -= available; newTokens[color as GemColor] += available;
                    const diff = need - available; player.tokens[GemColor.Gold] -= diff; newTokens[GemColor.Gold] += diff;
                }
            }
            player.cards.push(card); player.points += card.points;
            logs.unshift(`${name}: [${card.name}] 완료! (+${card.points})`);
        }
    }

    const playerBonuses = getBonuses(player);
    const earnedNobles = newState.nobles.filter(n => Object.entries(n.requirements).every(([c, r]) => (playerBonuses[c as GemColor] || 0) >= (r as number)));
    if (earnedNobles.length > 0) {
        const noble = earnedNobles[0]; player.nobles.push(noble); player.points += noble.points;
        const nobleIdx = newState.nobles.findIndex(n => n.id === noble.id);
        const newNobles = [...newState.nobles]; newNobles.splice(nobleIdx, 1);
        logs.unshift(`>> ${name}, ${noble.name} 획득! (+${noble.points})`);
        newState.nobles = newNobles;
    }

    const newPlayers = [...newState.players]; newPlayers[playerIndex] = player;
    newState.players = newPlayers; newState.tokens = newTokens;
    newState.visibleCards = newVisibleCards; newState.decks = newDecks;
    newState.logs = logs.slice(0, 5); newState.turnCount = newState.turnCount + 1;
    
    if (player.points >= WINNING_SCORE) newState.winner = playerIndex;
    if (newState.winner === null) newState.currentPlayerIndex = (playerIndex + 1) % newState.players.length;

    setGameState(newState);
    if (gameMode === 'multi' && roomId) await updateGameState(roomId, newState);
  };

  useEffect(() => {
    if (gameMode === 'single' && gameState && gameState.players[gameState.currentPlayerIndex].isAI && !gameState.winner) {
      setTimeout(async () => {
        setAiThinking(true);
        const move = await getBestMove(gameState);
        setAiThinking(false);
        if (move) {
           let actionGems = move.gems as GemColor[];
           if (move.action === 'TAKE_2_SAME' && actionGems && actionGems.length === 1) actionGems = [actionGems[0], actionGems[0]];
           executeAction(move.action as ActionType, actionGems, move.cardId);
        } else {
           setGameState(prev => prev ? {...prev, currentPlayerIndex: 0} : null);
        }
      }, 1500);
    }
  }, [gameState?.currentPlayerIndex, gameState?.turnCount, gameMode]);


  if (!user) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
             {authError && authError.type === 'unauthorized-domain' && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
                      <div className="bg-slate-900 border-2 border-red-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                          <h3 className="text-xl font-bold text-red-500 mb-4">도메인 승인 필요</h3>
                          <p className="text-slate-300 text-sm mb-4">Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains에 <span className="text-yellow-400 font-mono">{authError.hostname}</span>을 추가하세요.</p>
                          <button onClick={() => setAuthError(null)} className="w-full py-2 bg-slate-700 text-white rounded-lg">닫기</button>
                      </div>
                  </div>
             )}
             {showConfigModal && !authError && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                     <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg border border-slate-700">
                         <h3 className="text-xl font-bold text-emerald-400 mb-4">Firebase 설정</h3>
                         <textarea value={configInput} onChange={(e) => setConfigInput(e.target.value)} placeholder="const firebaseConfig = { ... }" className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 mb-4"/>
                         <div className="flex justify-end gap-3">
                             <button onClick={() => setShowConfigModal(false)} className="px-4 py-2 text-slate-300">취소</button>
                             <button onClick={handleSaveConfig} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">저장</button>
                         </div>
                     </div>
                 </div>
             )}

             <div className="z-10 text-center w-full max-w-sm">
                <div className="inline-block p-5 rounded-3xl bg-slate-800 border border-slate-700 shadow-2xl mb-8">
                    <Building size={56} className="text-emerald-500" />
                </div>
                <h1 className="text-4xl font-black text-white mb-2">오피스 퀘스트</h1>
                <p className="text-slate-400 mb-10 text-sm">직장인의, 직장인에 의한, 직장인을 위한 게임</p>

                <button onClick={handleGuestLogin} className="w-full bg-slate-700 text-white font-bold py-4 rounded-xl mb-4 flex items-center justify-center gap-2"><Ghost size={20}/> 게스트로 체험하기</button>
                <div className="border-t border-slate-700 my-4"></div>
                <button onClick={() => handleLogin('google')} className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl mb-3">Google로 시작하기</button>
                <button onClick={() => handleLogin('apple')} className="w-full bg-black text-white font-bold py-3.5 rounded-xl mb-3 flex items-center justify-center gap-2"><Apple size={20}/> Apple로 시작하기</button>
                <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => handleLogin('naver')} className="bg-[#03C75A] text-white font-bold py-3.5 rounded-xl">N 네이버</button>
                     <button onClick={() => handleLogin('kakao')} className="bg-[#FEE500] text-black font-bold py-3.5 rounded-xl">K 카카오</button>
                </div>
                <button onClick={() => setShowConfigModal(true)} className="text-xs text-slate-600 underline mt-8 flex items-center justify-center gap-1 mx-auto"><Settings size={12} /> 설정</button>
             </div>
          </div>
      )
  }

  if (gameMode === 'lobby') {
    const currentRank = getRank(user.stats.vacations);
    const nextRank = getNextRank(user.stats.vacations);
    const progressPercent = nextRank ? Math.max(0, Math.min(100, ((user.stats.vacations - currentRank.threshold) / (nextRank.threshold - currentRank.threshold)) * 100)) : 100;
    
    // Stats Calculations for Dashboard
    const bestRankItem = RANK_SYSTEM.find(r => r.id === user.stats.bestRankId) || { name: '기록 없음' };
    const winRate = user.stats.lifetimeGames > 0 ? Math.round((user.stats.lifetimeWins / user.stats.lifetimeGames) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            <div className="absolute top-6 right-6 z-20 flex items-center gap-3 bg-slate-800/80 backdrop-blur pl-4 pr-2 py-2 rounded-full border border-slate-700 shadow-xl cursor-pointer" onClick={() => setIsDashboardOpen(true)}>
                 <div className="text-right">
                     <div className="text-xs text-slate-400 font-bold">{currentRank.name}</div>
                     <div className="text-sm text-white font-bold">{user.displayName}님</div>
                 </div>
                 {user.photoURL ? <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-emerald-500" /> : <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white border-2 border-emerald-400">{user.displayName?.[0]}</div>}
            </div>

            <div className="z-10 text-center max-w-md w-full">
                <div className="inline-block p-6 rounded-full bg-slate-800/80 border-4 border-emerald-500/30 shadow-2xl mb-6 backdrop-blur-sm relative">
                    <Building size={48} className="text-emerald-500" />
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold border border-slate-900">Season {user.stats.seasonNum}</div>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg mb-2">오피스 퀘스트</h1>
                <p className="text-slate-400 mb-8 font-medium">오늘도 무사히 퇴근하셨습니까?</p>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-8 backdrop-blur-sm cursor-pointer" onClick={() => setIsDashboardOpen(true)}>
                    <div className="flex justify-between items-end mb-2">
                         <div><span className="text-xs text-slate-500 font-bold block text-left">현재 직급</span><div className={`text-xl font-black ${currentRank.color}`}>{currentRank.name}</div></div>
                         <div className="text-right"><span className="text-xs text-slate-500 font-bold block">{nextRank ? `다음 승진까지` : "최고 직급"}</span><div className="text-sm text-white font-mono"><span className="text-emerald-400 font-bold">{user.stats.vacations}</span>{nextRank && <span className="text-slate-500"> / {nextRank.threshold}</span>}</div></div>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-700/50"><div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500" style={{ width: `${progressPercent}%` }}></div></div>
                </div>
                
                <div className="space-y-4">
                    <button onClick={startSinglePlayer} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3"><Cpu size={24} /> AI 상무님과 대결</button>
                    <button onClick={() => setShowCreateModal(true)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3"><Monitor size={24} /> 방 만들기 (호스트)</button>
                    <button onClick={() => setShowJoinModal(true)} className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3"><Users size={24} /> 방 참가하기</button>
                    <button onClick={handleLogout} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold text-lg border border-slate-700 flex items-center justify-center gap-2 mt-4"><LogOut size={20} /> 로그아웃</button>
                </div>
            </div>

            {/* Dashboard Modal */}
            {isDashboardOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setIsDashboardOpen(false)}>
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-700 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsDashboardOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={24}/></button>
                        
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2"><Briefcase className="text-emerald-500"/> 내 인사 기록부</h2>
                            <div className="text-xs text-slate-500 mt-1">시즌 종료일: {new Date(user.stats.seasonStartDate + SEASON_DURATION_DAYS*24*60*60*1000).toLocaleDateString()}</div>
                        </div>

                        {/* Season & Games */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-800 p-3 rounded-xl text-center border border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">현재 시즌</div>
                                <div className="text-lg font-bold text-white">Season {user.stats.seasonNum}</div>
                                <div className="text-[10px] text-slate-500">총 {user.stats.totalGames}판 진행</div>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-xl text-center border border-slate-700">
                                <div className="text-xs text-slate-400 mb-1">전체 통산</div>
                                <div className="text-lg font-bold text-white">{user.stats.lifetimeGames}판</div>
                                <div className="text-[10px] text-emerald-400 font-bold">승률 {winRate}%</div>
                            </div>
                        </div>

                        {/* Highest Rank Stats */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Crown size={14} className="text-yellow-500"/> 역대 최고 기록</h3>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-300 text-sm">최고 직급</span>
                                <span className="text-yellow-400 font-bold">{bestRankItem.name} <span className="text-slate-500 text-xs font-normal">({user.stats.bestRankSeason ? `Season ${user.stats.bestRankSeason}` : '기록없음'})</span></span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 text-sm">달성 횟수</span>
                                <span className="text-white font-bold">{user.stats.bestRankCount}회</span>
                            </div>
                        </div>

                        {/* Lifetime Vacations */}
                        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                <Plane size={20}/>
                                <span>총 획득 휴가</span>
                            </div>
                            <span className="text-2xl font-black text-white">{user.stats.lifetimeVacations}<span className="text-sm font-normal text-slate-400 ml-1">일</span></span>
                        </div>

                    </div>
                </div>
            )}

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-6">방 만들기</h3>
                        <div className="mb-6">
                            <label className="text-sm text-slate-400 font-bold mb-3 block">인원</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[2, 3, 4, 0].map(n => (
                                    <button key={n} onClick={() => setCreateConfig({...createConfig, players: n})} className={`py-3 rounded-xl font-bold text-sm border ${createConfig.players === n ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{n === 0 ? '상관없음' : `${n}명`}</button>
                                ))}
                            </div>
                        </div>
                        <div className="mb-8">
                            <label className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700 cursor-pointer">
                                <div className="flex items-center gap-3">{createConfig.isPublic ? <Globe className="text-blue-400"/> : <Lock className="text-red-400"/>}<div><div className="font-bold text-white text-sm">{createConfig.isPublic ? '공개 방' : '비공개 방'}</div><div className="text-xs text-slate-500">{createConfig.isPublic ? '누구나 입장 가능' : '코드로만 입장'}</div></div></div>
                                <input type="checkbox" checked={createConfig.isPublic} onChange={e => setCreateConfig({...createConfig, isPublic: e.target.checked})} className="w-5 h-5 accent-emerald-500"/>
                            </label>
                        </div>
                        <button onClick={handleCreateRoom} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg">생성하기</button>
                    </div>
                </div>
            )}

            {/* Join Room Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowJoinModal(false)}>
                    <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-6">참여하기</h3>
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3"><span className="text-sm text-slate-400 font-bold">빠른 참여 (인원 선택)</span></div>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {[2, 3, 4, 0].map(n => (
                                    <button key={n} onClick={() => setJoinConfig({...joinConfig, players: n})} className={`py-2 rounded-lg font-bold text-xs border ${joinConfig.players === n ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{n === 0 ? '상관없음' : `${n}명`}</button>
                                ))}
                            </div>
                            <button onClick={handleQuickJoin} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Globe size={18} /> 빠른 입장</button>
                        </div>
                        <div className="relative flex py-2 items-center mb-6"><div className="flex-grow border-t border-slate-700"></div><span className="flex-shrink mx-4 text-slate-500 text-xs">또는</span><div className="flex-grow border-t border-slate-700"></div></div>
                        <button onClick={handleCodeJoin} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Lock size={18} /> 코드로 입장</button>
                    </div>
                </div>
            )}
        </div>
    );
  }

  // WAITING SCREEN
  if (gameMode === 'multi' && multiStatus === 'waiting' && (!gameState || gameState.status === 'waiting')) {
      const filled = gameState ? gameState.players.length : 1;
      const max = gameState && gameState.maxPlayers > 0 ? gameState.maxPlayers : 4;
      const isHost = gameState?.hostId === user?.uid;
      
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 w-full max-w-md relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">{gameState?.isPublic ? '공개 방' : '비공개 방'} ({filled}/{max === 4 && gameState?.maxPlayers === 0 ? '?' : max})</div>
                  <h2 className="text-2xl font-bold text-white mb-2">대기실</h2>
                  <div className="text-4xl font-black text-emerald-400 bg-slate-900/50 py-4 rounded-xl cursor-pointer select-all mb-4" onClick={() => navigator.clipboard.writeText(roomId)}>{roomId}</div>
                  <p className="text-xs text-slate-500 mb-8">친구에게 코드를 공유하세요</p>
                  <div className="space-y-3 mb-8">
                      {gameState?.players.map((p, i) => (
                          <div key={i} className="flex items-center gap-3 bg-slate-700/50 p-3 rounded-xl">
                              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">{p.photoURL ? <img src={p.photoURL} className="rounded-full"/> : <User size={16}/>}</div>
                              <span className="font-bold text-slate-200">{p.name}</span>
                              {i===0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded ml-auto">HOST</span>}
                          </div>
                      ))}
                      {Array.from({length: Math.max(0, max - filled)}).map((_, i) => (
                          <div key={`empty-${i}`} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-dashed border-slate-700"><div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"><UserX size={16} className="text-slate-600"/></div><span className="text-slate-600 text-sm">대기 중...</span></div>
                      ))}
                  </div>
                  {autoStartCount !== null ? (
                      <div className="text-3xl font-black text-white animate-bounce">{autoStartCount}초 후 시작!</div>
                  ) : (
                      isHost ? <button onClick={() => updateGameState(roomId, {...gameState!, status: 'playing'})} disabled={filled < 2} className={`w-full py-4 rounded-xl font-bold text-lg ${filled < 2 ? 'bg-slate-700 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>{filled < 2 ? '인원 부족 (최소 2명)' : '게임 시작'}</button> : <div className="text-slate-400 animate-pulse font-bold">호스트가 시작하길 기다리는 중...</div>
                  )}
                  <button onClick={() => setGameMode('lobby')} className="mt-4 text-slate-500 text-sm underline">나가기</button>
              </div>
          </div>
      );
  }

  if (!gameState) return null;

  const player = gameState.players[myPlayerId];
  const opponents = gameState.players.filter(p => p.id !== myPlayerId);
  const isMyTurn = gameState.currentPlayerIndex === myPlayerId;
  const playerBonuses = getBonuses(player);
  const isGoldMode = selectedTokens.includes(GemColor.Gold);

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden flex flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-50">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg"><Briefcase className="text-white" size={16} /></div>
            <span className="font-bold text-sm">Office Quest</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                <User size={14} className={isMyTurn ? "text-emerald-400" : "text-slate-500"} />
                <span className={`text-xs font-bold ${isMyTurn ? "text-emerald-400" : "text-slate-500"}`}>{isMyTurn ? "MY TURN" : "WAIT"}</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} className="text-slate-300" /></button>
          </div>
      </div>

      {/* MOBILE DRAWER / SIDEBAR (Identical to preserved code) */}
      <div className={`fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md transition-transform duration-300 md:translate-x-0 md:relative md:w-80 md:bg-slate-900 md:border-r md:border-slate-800 md:flex md:flex-col md:shrink-0 md:z-20 md:shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 md:hidden p-2 bg-slate-800 rounded-full text-white"><X size={24} /></button>
         <div className="p-5 flex flex-col h-full overflow-y-auto">
            <div className="hidden md:flex mb-8 items-center gap-3"><div className="bg-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-900/50"><Briefcase className="text-white" size={24} /></div><div><h2 className="font-bold text-lg leading-none">오피스 퀘스트</h2><span className="text-xs text-slate-500 font-mono">Ver 3.0 (Multi)</span></div></div>
            <div className="flex-1 overflow-y-auto mb-4 bg-black/20 rounded-xl p-3 border border-slate-800 scrollbar-thin md:max-h-[300px] max-h-[200px]">
                <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2 sticky top-0 bg-transparent flex items-center gap-2"><FileText size={12}/> 업무 일지</h3>
                <div className="space-y-3 text-sm text-slate-300">{gameState.logs.map((log, i) => (<div key={i} className={`flex gap-2 leading-snug ${i===0 ? 'text-white font-bold animate-pulse' : 'opacity-60'}`}><span className="text-emerald-600 font-mono text-xs">[{gameState.turnCount - i}]</span><span>{log}</span></div>))}</div>
            </div>
            <div className="mb-6 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2"><Stamp size={14} /> 추천서 (목표)</h3>
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">{gameState.nobles.map(noble => (<div key={noble.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex flex-col gap-2 shadow-sm min-w-[140px] md:min-w-0"><div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-200 truncate">{noble.name}</span><span className="text-xs font-bold text-yellow-500 shrink-0">3점</span></div><div className="flex gap-1 flex-wrap">{Object.entries(noble.requirements).map(([color, count]) => (<div key={color} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${getGemColorBg(color as GemColor)}`}>{count}</div>))}</div></div>))}</div>
            </div>
            <button onClick={() => window.location.reload()} className="mt-auto flex items-center justify-center gap-2 text-slate-500 hover:text-white py-2"><ArrowLeft size={16} /> 메인으로 돌아가기</button>
         </div>
      </div>

      {/* MAIN GAME AREA */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* OPPONENT INFO BAR (Expanded for 2-4 players) */}
        <div className="h-16 md:h-20 shrink-0 border-b border-slate-800 flex items-center px-4 md:px-8 bg-slate-900/50 backdrop-blur-md z-10 overflow-x-auto gap-4 scrollbar-hide">
             {opponents.map(opponent => {
                 const rank = getRank(opponent.vacations || 0);
                 const opBonuses = getBonuses(opponent);
                 return (
                     <div key={opponent.id} className={`flex items-center gap-3 min-w-fit p-2 pr-4 rounded-xl border transition-all duration-300 ${gameState.currentPlayerIndex === opponent.id ? 'border-emerald-500 bg-slate-800 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-800/50 bg-slate-900/30'}`}>
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden ring-2 ring-slate-800">
                                {opponent.photoURL ? <img src={opponent.photoURL} className="w-full h-full object-cover" /> : <User size={18} className="text-slate-400"/>}
                            </div>
                            {gameState.currentPlayerIndex === opponent.id && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-slate-900"></div>}
                        </div>
                        
                        {/* Name & Points */}
                        <div className="flex flex-col min-w-[70px]">
                            <div className="flex items-center gap-1 mb-0.5">
                                <span className="font-bold text-slate-200 text-xs truncate max-w-[60px]">{opponent.name}</span>
                                <span className={`text-[8px] px-1 py-0.5 rounded border border-slate-700 bg-slate-900/50 ${rank.color}`}>{rank.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono leading-none">
                                Score: <span className="text-white text-sm font-black text-emerald-400">{opponent.points}</span>
                            </div>
                        </div>

                        {/* Resources (Tokens + Bonuses) */}
                        <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-1.5 rounded-lg border border-slate-800/50">
                            {[GemColor.White, GemColor.Blue, GemColor.Green, GemColor.Red, GemColor.Black, GemColor.Gold].map(color => {
                                const tokenCount = opponent.tokens[color] || 0;
                                const bonusCount = opBonuses[color] || 0;
                                if (color === GemColor.Gold && tokenCount === 0) return null;

                                return (
                                    <div key={color} className="flex flex-col items-center w-4 md:w-5">
                                        <div className="relative">
                                            <GemIcon color={color} size={12} className="" />
                                            {/* Bonus Badge */}
                                            {color !== GemColor.Gold && bonusCount > 0 && (
                                                <div className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-[7px] text-white font-bold w-3 h-3 flex items-center justify-center rounded-full border border-slate-900 z-10 shadow-sm">
                                                    {bonusCount}
                                                </div>
                                            )}
                                        </div>
                                        {/* Token Count */}
                                        <span className={`text-[9px] md:text-[10px] font-bold mt-0.5 leading-none ${tokenCount > 0 ? 'text-white' : 'text-slate-700'}`}>
                                            {tokenCount}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                     </div>
                 );
             })}
        </div>

        {/* BOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col md:gap-8 gap-4 pb-24 md:pb-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 justify-center">
                <div className="flex md:flex-col flex-row gap-3 md:gap-4 justify-center shrink-0 overflow-x-auto py-2 md:py-0 px-2 min-h-[90px] md:min-h-0">
                    {(Object.values(GemColor) as GemColor[]).map(color => {
                    const isSelected = selectedTokens.includes(color);
                    const count = gameState.tokens[color];
                    const isGold = color === GemColor.Gold;
                    const canTake = isMyTurn && (isGold || (!isGoldMode && count > 0));
                    // Check logic for x2 button
                    const showX2 = isMyTurn && isSelected && !isGold && selectedTokens.length === 1 && count >= 4;
                    
                    return (
                        <div key={color} className="relative shrink-0 flex flex-col items-center justify-center">
                            <button 
                                disabled={!canTake} 
                                onClick={() => handleTokenSelect(color)} 
                                className={`
                                    relative group md:w-20 md:h-20 w-16 h-16 flex items-center justify-center transition-all duration-300 rounded-full 
                                    ${isSelected ? 'scale-110 ring-4 ring-offset-4 ring-offset-slate-900 ring-emerald-500 z-10' : 'hover:scale-105 active:scale-95'} 
                                    ${!canTake ? 'opacity-30 grayscale cursor-not-allowed' : ''} 
                                    ${isGold ? 'cursor-pointer' : ''}
                                `}
                            >
                                <GemIcon color={color} size={window.innerWidth < 768 ? 40 : 64} className="shadow-2xl" />
                                <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-xs md:text-sm font-bold w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full border-2 border-slate-600 z-10 shadow-lg">{count}</span>
                            </button>
                            
                            {/* x2 Button Overlay */}
                            {showX2 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTakeTwo(color);
                                    }}
                                    className="absolute -bottom-2 z-20 bg-emerald-500 text-white font-black text-xs md:text-sm py-1 px-3 rounded-full border-2 border-slate-900 shadow-lg hover:scale-110 hover:bg-emerald-400 transition-transform animate-in zoom-in"
                                >
                                    x2
                                </button>
                            )}
                        </div>
                    );
                    })}
                </div>
                <div className="flex-1 flex flex-col gap-4 md:gap-6 justify-center max-w-5xl">
                    {[3, 2, 1].map(tier => (
                        <div key={tier} className="flex gap-3 md:gap-6 items-center">
                            <div className="w-6 md:w-24 flex flex-col items-center justify-center gap-1 opacity-60 shrink-0">
                                <div className={`w-1 md:w-1.5 h-8 md:h-12 rounded-full ${tier === 3 ? 'bg-blue-500' : tier === 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                <span className="hidden md:block text-xs font-black uppercase tracking-widest text-slate-400">Lv {tier}</span>
                            </div>
                            <div className="flex gap-3 md:gap-4 flex-1 overflow-x-auto pb-4 px-2 snap-x scrollbar-hide">
                                {gameState.visibleCards[tier as 1|2|3].map(card => (
                                    <div key={card.id} className="snap-center shrink-0">
                                        <div className="scale-90 md:scale-100 origin-top-left">
                                            <Card 
                                                card={card} 
                                                onClick={handleCardClick} 
                                                canBuy={!isGoldMode && isMyTurn && canAfford(player, card)} 
                                                canReserve={isGoldMode && isMyTurn && player.reserved.length < 3}
                                                disabled={!isMyTurn}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="w-24 h-32 md:w-36 md:h-48 shrink-0 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center gap-1 md:gap-2">
                                    <span className="text-xl md:text-3xl font-black text-slate-700">{gameState.decks[tier as 1|2|3].length}</span>
                                    <span className="text-[9px] md:text-[10px] text-slate-600 uppercase tracking-widest">Left</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* PLAYER STATS (BOTTOM BAR) */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 md:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40 fixed bottom-0 w-full md:relative md:w-auto pb-safe">
             <div className="max-w-7xl mx-auto flex items-end justify-between gap-4 md:gap-8 overflow-x-auto">
                <div className="flex items-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900 p-2 md:p-4 rounded-xl border border-slate-700 shadow-xl shrink-0">
                    <div className="bg-emerald-500 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 md:ring-4 ring-emerald-500/20 overflow-hidden">{player.photoURL ? <img src={player.photoURL} alt="Me" className="w-full h-full object-cover" /> : <Trophy className="text-white" size={20} />}</div>
                    <div><div className="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider mb-0.5">내 점수</div><div className="text-2xl md:text-3xl font-black text-white leading-none">{player.points} <span className="text-sm md:text-lg font-bold text-slate-600">/ 15</span></div></div>
                </div>
                <div className="flex-1 flex justify-center gap-3 md:gap-8 bg-slate-900/50 p-2 md:p-3 rounded-xl border border-slate-800/50 min-w-0 overflow-x-auto">
                    {(Object.values(GemColor) as GemColor[]).map(color => {
                        const tokenCount = (player.tokens[color] as number) || 0;
                        const bonusCount = (playerBonuses[color] as number) || 0;
                        return (
                        <div key={color} className="flex flex-col items-center gap-1 group relative cursor-help shrink-0">
                            <div className="relative"><GemIcon color={color} size={28} className="md:w-9 md:h-9 w-7 h-7" />{bonusCount > 0 && (<div className="absolute -top-2 -right-2 bg-emerald-500 text-white font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-sm z-10 text-[9px] md:text-xs">+{bonusCount}</div>)}</div>
                            <span className={`font-mono font-bold text-sm md:text-lg ${tokenCount > 0 ? 'text-white' : 'text-slate-700'}`}>{tokenCount}</span>
                        </div>
                    )})}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 hidden md:flex">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">찜한 업무</span>
                    <div className="flex items-center justify-end p-2 rounded-xl bg-slate-950/80 border border-slate-800 min-w-[80px] min-h-[60px]">{player.reserved.length === 0 && <span className="text-[10px] text-slate-700">비어있음</span>}{player.reserved.map((card, idx) => (<div key={card.id} className="w-10 h-14 md:w-12 md:h-16 hover:-translate-y-4 hover:scale-150 hover:z-50 transition-all cursor-pointer origin-bottom shadow-lg -ml-4 first:ml-0"><Card card={card} onClick={() => handleCardClick(card, true)} canBuy={isMyTurn && canAfford(player, card)} isReserved/></div>))}</div>
                </div>
                 <div className="md:hidden flex flex-col items-center justify-center bg-slate-800 p-2 rounded-lg border border-slate-700 shrink-0" onClick={() => { if(player.reserved.length > 0) handleCardClick(player.reserved[0], true); }}><span className="text-[9px] text-slate-400 font-bold mb-1">찜</span><span className="text-lg font-bold text-yellow-500">{player.reserved.length}</span></div>
             </div>
        </div>
      </div>

      {/* End Game Modal */}
      {gameState.winner !== null && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-500">
            <div className={`border-4 rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden transform scale-100 ${gameState.winner === myPlayerId ? 'border-emerald-500 bg-slate-900' : 'border-red-500 bg-slate-900'}`}>
                {gameState.winner === myPlayerId ? (
                    <>
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500"></div>
                        <div className="bg-emerald-500/20 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/40"><Coffee size={48} className="text-emerald-400 md:w-16 md:h-16" /></div>
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">승리!</h2>
                        <p className="text-emerald-200 text-lg md:text-2xl mb-8 font-light">"휴가 결재가 승인되었습니다."</p>
                        <div className="animate-in zoom-in slide-in-from-bottom-5 duration-700 delay-300 flex items-center justify-center gap-3 bg-white/10 p-3 rounded-xl border border-white/20 w-fit mx-auto mb-8"><Plane className="text-sky-400 animate-bounce" size={24} /><span className="text-xl font-bold text-sky-200">휴가 획득!</span></div>
                    </>
                ) : (
                    <>
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
                        <div className="bg-red-500/20 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/40"><Building size={48} className="text-red-500 md:w-16 md:h-16" /></div>
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">패배...</h2>
                        <p className="text-red-200 text-lg md:text-2xl mb-8 font-light">"주말 출근 확정입니다."</p>
                    </>
                )}
                <button onClick={() => window.location.reload()} className="w-full py-4 md:py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-emerald-50 transition-colors uppercase tracking-widest text-base md:text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transform duration-200">메인으로 이동</button>
            </div>
        </div>
      )}
    </div>
  );
}
