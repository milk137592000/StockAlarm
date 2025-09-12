
import React from 'react';
import { StockData } from '../../../shared/types';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

interface StockCardProps {
  data: StockData;
}

const StockCard: React.FC<StockCardProps> = ({ data }) => {
  const isUp = data.change > 0;
  const isDown = data.change < 0;
  
  const changeColor = isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-400';
  const borderColor = isUp ? 'border-green-500/50' : isDown ? 'border-red-500/50' : 'border-gray-700';

  const formatNumber = (num: number, digits: number = 2) => num.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col justify-between border-l-4 ${borderColor} transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-white">{data.name}</h3>
          <span className="text-xs text-gray-500 font-mono">{data.symbol}</span>
        </div>
        <div className="flex items-baseline gap-3 mb-3">
          <p className={`text-3xl font-bold ${changeColor}`}>{formatNumber(data.price)}</p>
          <div className={`flex items-center text-sm font-semibold ${changeColor}`}>
            {isUp && <ArrowUpIcon className="w-4 h-4" />}
            {isDown && <ArrowDownIcon className="w-4 h-4" />}
            <span>{formatNumber(data.change)} ({data.changePercent.toFixed(2)}%)</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-3 mt-2 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">RSI (14)</span>
          <span className="font-mono text-white">{data.rsi?.toFixed(2) ?? 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">MA (20)</span>
          <span className="font-mono text-white">{data.ma20?.toFixed(2) ?? 'N/A'}</span>
        </div>
         <div className="flex justify-between">
          <span className="text-gray-400">BIAS (20)</span>
          <span className="font-mono text-white">{data.bias?.toFixed(2) ?? 'N/A'}%</span>
        </div>
      </div>
    </div>
  );
};

export default StockCard;