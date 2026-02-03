import React from 'react';
import { Card as CardType, GemColor } from '../types';
import { GemIcon } from './GemIcon';

interface CardProps {
  card: CardType;
  onClick?: (card: CardType) => void;
  canBuy?: boolean;
  canReserve?: boolean;
  isReserved?: boolean;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onClick, canBuy, canReserve, isReserved, disabled }) => {
  const getBorderColor = (tier: number) => {
    if (tier === 1) return 'border-emerald-400/40 bg-slate-800'; // Simple
    if (tier === 2) return 'border-amber-400/40 bg-slate-800'; // Project
    return 'border-blue-400/40 bg-slate-800'; // Major
  };

  const getBonusTextColor = (color: GemColor) => {
     switch (color) {
        case GemColor.White: return 'text-purple-400';
        case GemColor.Blue: return 'text-blue-400';
        case GemColor.Green: return 'text-emerald-400';
        case GemColor.Red: return 'text-red-400';
        case GemColor.Black: return 'text-slate-400';
        default: return 'text-white';
    }
  }

  // Determine if any action is possible
  const isActionable = !disabled && (canBuy || (canReserve && !isReserved));

  return (
    <div 
      onClick={() => isActionable && onClick && onClick(card)}
      className={`
        relative flex flex-col justify-between w-36 h-48 p-2.5 rounded-xl border 
        shadow-xl transition-all duration-200 group
        ${getBorderColor(card.tier)}
        ${isActionable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:border-white/50' : 'opacity-90'}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${isReserved ? 'ring-2 ring-yellow-400' : ''}
      `}
    >
        {/* Header: Points and Bonus */}
        <div className="flex justify-between items-start mb-1">
            <div className="font-bold text-2xl text-white drop-shadow-md font-mono">
                {card.points > 0 ? card.points : ''}
            </div>
            <div className={`scale-100 transform transition-transform group-hover:rotate-12`}>
                <GemIcon color={card.bonus} size={24} />
            </div>
        </div>

        {/* Card Name */}
        <div className="mb-2 h-10 flex items-center">
            <h3 className="text-xs font-bold leading-tight text-slate-300 line-clamp-2 break-keep">
                {card.name}
            </h3>
        </div>

        {/* Cost */}
        <div className="space-y-1 mt-auto bg-black/20 p-1.5 rounded-lg">
            {Object.entries(card.cost).map(([color, amount]) => {
                if (!amount) return null;
                return (
                    <div key={color} className="flex items-center justify-between">
                         <div className={`w-4 h-4 rounded-full flex items-center justify-center shadow-sm`}>
                            <GemIcon color={color as GemColor} size={16} />
                         </div>
                         <span className={`text-sm font-bold ml-2 ${getBonusTextColor(color as GemColor)}`}>{amount}</span>
                    </div>
                )
            })}
        </div>

        {/* Action Indicators (Hover) */}
        {isActionable && (
           <div className="absolute inset-0 bg-slate-900/90 opacity-0 hover:opacity-100 flex flex-col items-center justify-center rounded-xl transition-opacity backdrop-blur-sm z-10 text-center p-2">
              {canBuy && (
                  <div className="mb-2">
                      <span className="text-emerald-400 font-bold block text-sm">결재 상신</span>
                      <span className="text-[10px] text-emerald-200/70">(구매)</span>
                  </div>
              )}
              {canReserve && !isReserved && (
                  <div>
                    <span className="text-yellow-400 font-bold block text-sm">업무 찜</span>
                    <span className="text-[10px] text-yellow-200/70">(예약 + 조커)</span>
                  </div>
              )}
           </div>
        )}
    </div>
  );
};