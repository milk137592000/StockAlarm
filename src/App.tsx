
import React from 'react';
import Dashboard from './components/Dashboard';
import { useStockMonitor } from './hooks/useStockMonitor';

const App: React.FC = () => {
  const { stockData, lastUpdated, loading } = useStockMonitor();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 text-center">
          <div>
            <h1 className="text-4xl font-bold text-white">台灣股市即時監控面板</h1>
            <p className="text-gray-400 mt-2">
              這是一個模擬的即時儀表板，展示您關注的市場指數與 ETF。
            </p>
          </div>
        </header>
        
        <main className="w-full">
          {loading ? (
            <div className="text-center text-gray-400">正在載入市場資料...</div>
          ) : (
            <Dashboard stockData={stockData} lastUpdated={lastUpdated} />
          )}
        </main>

        <footer className="text-center mt-8 text-gray-600 text-sm">
          <p>此頁面資料為模擬性質，僅供展示用途。實際投資請參考真實報價。</p>
        </footer>
      </div>
    </div>
  );
};

export default App;