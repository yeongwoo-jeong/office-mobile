import { GoogleGenAI, Type } from "@google/genai";
import { GameState, PlayerState, GemColor, Card } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";

export const getBestMove = async (gameState: GameState): Promise<any> => {
  const aiPlayer = gameState.players.find(p => p.isAI);
  const humanPlayer = gameState.players.find(p => !p.isAI);

  if (!aiPlayer) return null;

  const prompt = `
    You are playing a board game mechanically identical to Splendor, but themed as a Korean Office Political Battle.
    
    ROLE: You are the "꼰대 상무" (Boomer Senior Executive). 
    OPPONENT: "신입사원" (New Hire).
    GOAL: Reach 15 Performance Points first to win the "Best Executive" award and prevent the New Hire from going on vacation.
    
    RESOURCES (Department Approvals):
    - White = Ha (하)
    - Blue = Park (박)
    - Green = Na (나)
    - Red = Kim (김)
    - Black = Lee (이)
    - Gold = Auth (결재권 - Joker)

    Current Game State:
    Executive Score: ${aiPlayer.points}
    Executive Resources: ${JSON.stringify(aiPlayer.tokens)}
    Executive Bonus (Permanent): ${JSON.stringify(getBonuses(aiPlayer))}
    Executive Reserved Tasks: ${JSON.stringify(aiPlayer.reserved.map(c => ({ id: c.id, cost: c.cost, points: c.points, bonus: c.bonus })))}

    New Hire Score: ${humanPlayer?.points}
    New Hire Bonus: ${JSON.stringify(humanPlayer ? getBonuses(humanPlayer) : {})}

    Board Resources: ${JSON.stringify(gameState.tokens)}

    Visible Tasks (Tier 1): ${JSON.stringify(gameState.visibleCards[1].map(simplifyCard))}
    Visible Tasks (Tier 2): ${JSON.stringify(gameState.visibleCards[2].map(simplifyCard))}
    Visible Tasks (Tier 3): ${JSON.stringify(gameState.visibleCards[3].map(simplifyCard))}

    RULES:
    1. TAKE_3_DIFF: Take 3 different approvals.
    2. TAKE_2_SAME: Take 2 same approvals (only if 4+ available).
    3. BUY: Complete Task (buy card).
    4. RESERVE: Reserve Task & Take 1 Auth (Gold).

    STRATEGY:
    - Block the New Hire if they are winning.
    - Buy high point cards.
    
    Respond with JSON only.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              enum: ["TAKE_3_DIFF", "TAKE_2_SAME", "BUY", "RESERVE"]
            },
            gems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of color strings."
            },
            cardId: {
              type: Type.STRING,
              description: "The ID of the card."
            },
            reasoning: {
              type: Type.STRING,
              description: "A short, sarcastic comment in Korean as a 'kkondae' (boomer boss). E.g., '요즘 애들은 노력이 부족해', '내가 다 해먹어야지'."
            }
          },
          required: ["action", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return { action: "TAKE_3_DIFF", gems: [GemColor.White, GemColor.Blue, GemColor.Black], reasoning: "서버가 불안정하군. 일단 대기." };
  }
};

const getBonuses = (player: PlayerState) => {
  const bonuses: Record<string, number> = {};
  player.cards.forEach(c => {
    bonuses[c.bonus] = (bonuses[c.bonus] || 0) + 1;
  });
  return bonuses;
};

const simplifyCard = (c: Card) => ({
  id: c.id,
  cost: c.cost,
  points: c.points,
  bonus: c.bonus
});