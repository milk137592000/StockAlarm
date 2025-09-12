
import React from 'react';
import { StockData } from '../../shared/types';
import StockCard from './StockCard';
import { ClockIcon } from './icons/ClockIcon';
import { ErrorIcon } from './icons/ErrorIcon';

interface DashboardProps {
  stockData: StockData[];
  lastUpdated: Date | null;
  error: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ stockData, lastUpdated, error }) => {
  if (error) {
    return (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
          <ErrorIcon className="w-12 h-12 mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">資料載入失敗</h2>
          <p className="max-w-md">無法從 Yahoo 股市獲取資料。可能是網路連線問題，或暫時性的服務中斷。</p>
          <p className="text-sm text-red-400/70 mt-4 font-mono">{error}</p>
        </div>
    );
  }

  return (
    <div>
       <div className="flex justify-center items-center gap-2 text-sm text-gray-500 mb-6">
        <ClockIcon className="w-4 h-4" />
        <span>最後更新: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        {stockData.map((stock) => (
          <StockCard key={stock.symbol} data={stock} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;