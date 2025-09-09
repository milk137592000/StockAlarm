import React from 'react';
import type { StockData } from '../types';
import { StockSymbol } from '../types';
import StockCard from './StockCard';
import { InfoIcon } from './icons/InfoIcon';

interface DashboardProps {
  stocks: StockData[];
  cumulativeTwiiDrop: number;
}

const Dashboard: React.FC<DashboardProps> = ({ stocks, cumulativeTwiiDrop }) => {
  const twii = stocks.find(s => s.symbol === StockSymbol.TWII);
  const etfs = stocks.filter(s => s.symbol !== StockSymbol.TWII);

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">市場狀態</h2>
      
      {twii && (
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-300">大盤指數</h3>
            <StockCard stock={twii} />
            <div className="mt-4 bg-gray-700/50 p-3 rounded-md flex items-center gap-3">
              <InfoIcon className="w-5 h-5 text-blue-400 shrink-0"/>
              {twii.price === 0 ? (
                <div>
                  <h4 className="font-semibold text-sm">慢性失血計數器</h4>
                  <p className="text-sm text-gray-400">等待大盤資料載入...</p>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold text-sm">慢性失血計數器</h4>
                  <p className={`text-lg font-mono ${cumulativeTwiiDrop > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {cumulativeTwiiDrop.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    若大盤收紅則重置。累計跌點超過 300 點將觸發警報。
                  </p>
                </div>
              )}
            </div>
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-300">監控中的 ETF</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {etfs.map(stock => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;