import { GameAction, GameState, GemColor } from './types';
import { canAfford, getBonuses } from './logic';

const sumCost = (cost: Record<string, number>) =>
  Object.values(cost).reduce((acc, v) => acc + (v || 0), 0);

export const getBestMove = (state: GameState): GameAction => {
  const player = state.players[state.currentPlayerIndex];

  const allCards = [
    ...state.visibleCards[1],
    ...state.visibleCards[2],
    ...state.visibleCards[3],
    ...player.reserved,
  ];

  const buyable = allCards.filter((c) => canAfford(player, c));
  if (buyable.length > 0) {
    buyable.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return sumCost(a.cost) - sumCost(b.cost);
    });
    return { type: 'BUY', cardId: buyable[0].id };
  }

  if (player.reserved.length < 3) {
    const topCard = [...state.visibleCards[3], ...state.visibleCards[2], ...state.visibleCards[1]]
      .sort((a, b) => b.points - a.points)[0];
    if (topCard) return { type: 'RESERVE', cardId: topCard.id };
  }

  const target = [...state.visibleCards[3], ...state.visibleCards[2], ...state.visibleCards[1]]
    .sort((a, b) => b.points - a.points)[0];

  const missing: GemColor[] = [];
  if (target) {
    const bonuses = getBonuses(player);
    Object.entries(target.cost).forEach(([c, cost]) => {
      const need = Math.max(0, (cost as number) - (bonuses[c as GemColor] || 0));
      const owned = player.tokens[c as GemColor];
      if (owned < need && state.tokens[c as GemColor] > 0) missing.push(c as GemColor);
    });
  }

  const unique = Array.from(new Set(missing)).slice(0, 3);
  if (unique.length > 0) return { type: 'TAKE_3_DIFF', gems: unique };

  const fallback = [GemColor.White, GemColor.Blue, GemColor.Green, GemColor.Red, GemColor.Black]
    .filter((g) => state.tokens[g] > 0)
    .slice(0, 3);

  return { type: 'TAKE_3_DIFF', gems: fallback };
};
