import { Card, GameAction, GameState, GemColor, Noble, PlayerState } from './types';
import { INITIAL_TOKENS, NOBLES, TIER_1_CARDS, TIER_2_CARDS, TIER_3_CARDS, WINNING_SCORE } from './constants';

const shuffle = <T,>(array: T[]) => [...array].sort(() => Math.random() - 0.5);

export const getBonuses = (player: PlayerState): Record<GemColor, number> => {
  const bonuses: Record<GemColor, number> = {
    [GemColor.White]: 0,
    [GemColor.Blue]: 0,
    [GemColor.Green]: 0,
    [GemColor.Red]: 0,
    [GemColor.Black]: 0,
    [GemColor.Gold]: 0,
  };
  player.cards.forEach((c) => {
    bonuses[c.bonus] += 1;
  });
  return bonuses;
};

export const canAfford = (player: PlayerState, card: Card): boolean => {
  let goldNeeded = 0;
  const bonuses = getBonuses(player);
  for (const [color, cost] of Object.entries(card.cost)) {
    const bonus = bonuses[color as GemColor] || 0;
    const owned = player.tokens[color as GemColor] || 0;
    const needed = Math.max(0, (cost as number) - bonus);
    if (owned < needed) goldNeeded += needed - owned;
  }
  return player.tokens[GemColor.Gold] >= goldNeeded;
};

export const initGameState = (players: PlayerState[]): GameState => {
  const deck1 = shuffle(TIER_1_CARDS);
  const deck2 = shuffle(TIER_2_CARDS);
  const deck3 = shuffle(TIER_3_CARDS);
  const visible1 = deck1.splice(0, 4);
  const visible2 = deck2.splice(0, 4);
  const visible3 = deck3.splice(0, 4);
  const nobles = shuffle(NOBLES).splice(0, players.length + 1);

  return {
    maxPlayers: players.length,
    isPublic: false,
    players,
    currentPlayerIndex: 0,
    tokens: INITIAL_TOKENS(),
    decks: { 1: deck1, 2: deck2, 3: deck3 },
    visibleCards: { 1: visible1, 2: visible2, 3: visible3 },
    nobles,
    winner: null,
    logs: ['업무일지: 게임이 시작되었습니다.'],
    turnCount: 0,
  };
};

const drawCardIfNeeded = (state: GameState, tier: 1 | 2 | 3, index: number) => {
  const deck = state.decks[tier];
  const visible = state.visibleCards[tier];
  const next = deck.length > 0 ? deck.pop()! : null;
  if (next) visible[index] = next;
  else visible.splice(index, 1);
};

const checkNoble = (player: PlayerState, nobles: Noble[]) => {
  const bonuses = getBonuses(player);
  return nobles.find((n) =>
    Object.entries(n.requirements).every(
      ([c, r]) => (bonuses[c as GemColor] || 0) >= (r as number)
    )
  );
};

export const applyAction = (state: GameState, action: GameAction): GameState => {
  const next = { ...state };
  const playerIndex = next.currentPlayerIndex;
  const player = { ...next.players[playerIndex] };
  player.tokens = { ...player.tokens };
  player.cards = [...player.cards];
  player.reserved = [...player.reserved];
  player.nobles = [...player.nobles];

  const tokens = { ...next.tokens };
  const logs = [...next.logs];

  const name = player.name || `Player ${player.id + 1}`;

  if (action.type === 'TAKE_3_DIFF' && action.gems) {
    action.gems.forEach((g) => {
      player.tokens[g] += 1;
      tokens[g] -= 1;
    });
    logs.unshift(`${name}: 인감 3개 획득`);
  }

  if (action.type === 'TAKE_2_SAME' && action.gems) {
    action.gems.forEach((g) => {
      player.tokens[g] += 1;
      tokens[g] -= 1;
    });
    logs.unshift(`${name}: 같은 인감 2개 획득`);
  }

  const findAndRemoveCard = (id: string) => {
    const fromReserve = player.reserved.find((c) => c.id === id);
    if (fromReserve) {
      player.reserved = player.reserved.filter((c) => c.id !== id);
      return fromReserve;
    }
    for (const tier of [1, 2, 3] as const) {
      const idx = next.visibleCards[tier].findIndex((c) => c.id === id);
      if (idx !== -1) {
        const card = next.visibleCards[tier][idx];
        drawCardIfNeeded(next, tier, idx);
        return card;
      }
    }
    return null;
  };

  if (action.type === 'RESERVE' && action.cardId) {
    const card = findAndRemoveCard(action.cardId);
    if (card) {
      player.reserved.push(card);
      if (tokens[GemColor.Gold] > 0) {
        player.tokens[GemColor.Gold] += 1;
        tokens[GemColor.Gold] -= 1;
      }
      logs.unshift(`${name}: 카드 예약`);
    }
  }

  if (action.type === 'BUY' && action.cardId) {
    const card = findAndRemoveCard(action.cardId);
    if (card) {
      const bonuses = getBonuses(player);
      for (const [color, cost] of Object.entries(card.cost)) {
        const need = Math.max(0, (cost as number) - (bonuses[color as GemColor] || 0));
        const available = player.tokens[color as GemColor];
        if (available >= need) {
          player.tokens[color as GemColor] -= need;
          tokens[color as GemColor] += need;
        } else {
          player.tokens[color as GemColor] -= available;
          tokens[color as GemColor] += available;
          const diff = need - available;
          player.tokens[GemColor.Gold] -= diff;
          tokens[GemColor.Gold] += diff;
        }
      }
      player.cards.push(card);
      player.points += card.points;
      logs.unshift(`${name}: [${card.name}] 구매 (+${card.points})`);
    }
  }

  const earned = checkNoble(player, next.nobles);
  if (earned) {
    player.nobles.push(earned);
    player.points += earned.points;
    next.nobles = next.nobles.filter((n) => n.id !== earned.id);
    logs.unshift(`추천서 획득: ${earned.name} (+${earned.points})`);
  }

  const players = [...next.players];
  players[playerIndex] = player;
  next.players = players;
  next.tokens = tokens;
  next.logs = logs.slice(0, 5);
  next.turnCount += 1;

  if (player.points >= WINNING_SCORE) {
    next.winner = playerIndex;
    return next;
  }

  next.currentPlayerIndex = (next.currentPlayerIndex + 1) % next.players.length;
  return next;
};
