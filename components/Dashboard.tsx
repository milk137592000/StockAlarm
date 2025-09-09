import React from 'react';
import { InfoIcon } from './icons/InfoIcon';

const Dashboard: React.FC = () => {
  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex flex-col justify-center items-center">
      <InfoIcon className="w-16 h-16 text-blue-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2 text-white text-center">監控服務在後端運行</h2>
      <p className="text-gray-400 max-w-md text-center">
        我們的 Cron Job 會每分鐘自動檢查市場狀況。當符合您設定的條件時，將會立即透過 Line Notify 向您發送警報。
      </p>
       <p className="text-gray-400 max-w-md text-center mt-2">
        此頁面僅用於設定您的通知權杖。
      </p>
    </div>
  );
};

export default Dashboard;
