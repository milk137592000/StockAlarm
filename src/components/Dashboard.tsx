
import React from 'react';
import { InfoIcon } from './icons/InfoIcon';

const Dashboard: React.FC = () => {
  return (
    <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg flex flex-col justify-center items-center">
      <InfoIcon className="w-16 h-16 text-green-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2 text-white text-center">監控服務運行中</h2>
      <p className="text-gray-400 max-w-md text-center">
        後端 Cron Job 會每分鐘自動檢查市場狀況。當符合預設條件時，將立即透過 LINE 向您發送警報。
      </p>
      <div className="text-gray-500 max-w-md text-center mt-4 text-xs border border-gray-700 rounded-md p-2 bg-gray-900/50">
        <p className="font-semibold">安全提示</p>
        <p className="mt-1">LINE 通知所需的憑證 (Token) 已透過安全的伺服器環境變數進行配置。此頁面不出於安全考量提供任何設定介面。</p>
      </div>
       <p className="text-gray-500 max-w-md text-center mt-4 text-sm">
        您無需保持此頁面開啟。
      </p>
    </div>
  );
};

export default Dashboard;