import React from 'react';
import { GemColor } from '../types';

interface GemIconProps {
  color: GemColor;
  size?: number;
  className?: string;
}

export const GemIcon: React.FC<GemIconProps> = ({ color, size = 20, className = "" }) => {
  let text = "";
  let bgClass = "";
  let borderClass = "";
  let textClass = "text-white";

  switch (color) {
    case GemColor.White: // Ha (Purple)
      text = "하";
      bgClass = "bg-purple-500 shadow-purple-900";
      borderClass = "border-purple-300";
      break;
    case GemColor.Blue: // Park
      text = "박";
      bgClass = "bg-blue-600 shadow-blue-900";
      borderClass = "border-blue-400";
      break;
    case GemColor.Green: // Na
      text = "나";
      bgClass = "bg-emerald-600 shadow-emerald-900";
      borderClass = "border-emerald-400";
      break;
    case GemColor.Red: // Kim
      text = "김";
      bgClass = "bg-red-600 shadow-red-900";
      borderClass = "border-red-400";
      break;
    case GemColor.Black: // Lee (Brown)
      text = "이";
      bgClass = "bg-slate-800 shadow-slate-950";
      borderClass = "border-slate-500";
      break;
    case GemColor.Gold: // Auth
      text = "결재";
      bgClass = "bg-yellow-500 shadow-yellow-800";
      borderClass = "border-yellow-200";
      textClass = "text-yellow-50";
      break;
    default:
      return null;
  }

  // Stamp/Seal CSS
  return (
    <div 
        className={`relative rounded-full flex items-center justify-center border-2 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.3)] ${bgClass} ${borderClass} ${className}`}
        style={{ width: size, height: size }}
    >
        {/* Inner Ring */}
        <div className="absolute inset-1 border border-white/30 rounded-full pointer-events-none"></div>
        
        {/* Text */}
        <span 
            className={`font-serif font-bold leading-none select-none drop-shadow-md ${textClass}`}
            style={{ fontSize: size * 0.45 }}
        >
            {text}
        </span>
    </div>
  );
};

export const getGemColorBg = (color: GemColor) => {
    switch (color) {
        case GemColor.White: return 'bg-purple-100 text-purple-900 border-purple-300'; // Ha
        case GemColor.Blue: return 'bg-blue-100 text-blue-900 border-blue-300'; // Park
        case GemColor.Green: return 'bg-emerald-100 text-emerald-900 border-emerald-300'; // Na
        case GemColor.Red: return 'bg-red-100 text-red-900 border-red-300'; // Kim
        case GemColor.Black: return 'bg-slate-200 text-slate-900 border-slate-400'; // Lee
        case GemColor.Gold: return 'bg-yellow-100 text-yellow-900 border-yellow-300'; // Auth
    }
}