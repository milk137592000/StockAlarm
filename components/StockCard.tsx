import React from 'react';
import type { StockData } from '../types';
import { StockSymbol } from '../types';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface StockCardProps {
  stock: StockData;
}

const StockCard: React.FC<StockCardProps> = ({ stock }) => {
  // Use open price of 0 as a generic loading indicator
  if (stock.open === 0) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-4 flex flex-col justify-center items-center min-h-[160px]">
        <div className="flex justify-between items-center w-full mb-2">
          <span className="font-bold text-white">{stock.name}</span>
          <span className="text-xs text-gray-400 font-mono">{stock.symbol}</span>
        </div>
        <div className="flex-grow flex items-center justify-center">
            <span className="text-gray-400">正在載入即時資料...</span>
        </div>
      </div>
    );
  }

  const isIndex = stock.symbol === StockSymbol.TWII;
  const isDown = stock.change < 0;

  const getRsiColor = (rsi?: number) => {
    if (rsi === undefined) return 'text-gray-400';
    if (rsi < 30) return 'text-green-400';
    if (rsi > 70) return 'text-red-400';
    return 'text-gray-300';
  };
  
  const getBiasColor = (bias?: number) => {
    if (bias === undefined) return 'text-gray-400';
    if (bias < -5) return 'text-green-400'; // Potential opportunity
    return 'text-gray-300';
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-4 flex flex-col justify-between transition-all duration-300 hover:bg-gray-700/80 min-h-[160px]">
      <div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-white">{stock.name}</span>
          <span className="text-xs text-gray-400 font-mono">{stock.symbol}</span>
        </div>
        <div className="flex justify-between items-baseline my-2">
          <span className="text-3xl font-mono font-bold text-white">{stock.price.toFixed(2)}</span>
          <div className={`flex items-center text-lg font-semibold ${isDown ? 'text-green-400' : 'text-red-400'}`}>
            <ChevronDownIcon className={`w-5 h-5 ${!isDown ? 'rotate-180' : ''}`} />
            <span>{stock.change.toFixed(2)}</span>
            <span className="text-sm ml-2">({stock.changePercent.toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      {!isIndex && (
        <div className="border-t border-gray-600 pt-2 mt-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">14日 RSI</span>
            <span className={`font-mono font-semibold ${getRsiColor(stock.rsi)}`}>
              {stock.rsi !== undefined ? stock.rsi.toFixed(2) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-400">20日線乖離</span>
            <span className={`font-mono font-semibold ${getBiasColor(stock.bias)}`}>
              {stock.bias !== undefined ? `${stock.bias.toFixed(2)}%` : 'N/A'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockCard;