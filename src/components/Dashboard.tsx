
import React from 'react';
import { StockData } from '../../../shared/types';
import StockCard from './StockCard';
import { ClockIcon } from './icons/ClockIcon';

interface DashboardProps {
  stockData: StockData[];
  lastUpdated: Date | null;
}

const Dashboard: React.FC<DashboardProps> = ({ stockData, lastUpdated }) => {
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