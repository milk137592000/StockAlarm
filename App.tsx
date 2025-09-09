
import React from 'react';
import Dashboard from './components/Dashboard';
import AlertLog from './components/AlertLog';
import SettingsPanel from './components/SettingsPanel';
import useStockMonitor from './hooks/useStockMonitor';
import { isTradingHours } from './utils/time';

const App: React.FC = () => {
  const { status, stocks, alerts, cumulativeTwiiDrop } = useStockMonitor();
  const tradingHours = isTradingHours();

  const getStatusMessage = () => {
    if (!tradingHours) {
        return "市場休市中。監控已暫停。";
    }
    switch (status) {
      case 'initializing':
        return '正在初始化歷史數據...';
      case 'running':
        return '即時監控中...';
      case 'paused':
        return '非交易時段，監控已暫停。';
      default:
        return '待命中。';
    }
  };

  const getStatusColor = () => {
    if (!tradingHours) return "bg-gray-600";

    switch (status) {
      case 'initializing':
        return 'bg-yellow-500';
      case 'running':
        return 'bg-green-500';
      case 'paused':
        return 'bg-gray-500';
      default:
        return 'bg-gray-700';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">台灣股市監控儀表板</h1>
            <p className="text-gray-400">高效率、低延遲的市場異常偵測。</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0 bg-gray-800 px-4 py-2 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            <span className="text-sm font-medium">{getStatusMessage()}</span>
          </div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Dashboard stocks={stocks} cumulativeTwiiDrop={cumulativeTwiiDrop} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <SettingsPanel />
            <AlertLog alerts={alerts} />
          </div>
        </main>

        <footer className="text-center mt-8 text-gray-600 text-sm">
          <p>為可靠性而生。沒有廢話，只有訊號。</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
