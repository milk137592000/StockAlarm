import React from 'react';
import { BellIcon } from './icons/BellIcon';

const AlertLog: React.FC = () => {
  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <BellIcon className="w-6 h-6"/>
        警報紀錄
      </h2>
      <div className="text-center py-8">
        <p className="text-gray-400">所有警報將直接發送到您的 Line Notify，此處不再顯示即時紀錄。</p>
      </div>
    </div>
  );
};

export default AlertLog;
