
import React from 'react';
import Dashboard from './components/Dashboard';
import { useStockMonitor } from './hooks/useStockMonitor';

const App: React.FC = () => {
  const { stockData, lastUpdated, loading, error } = useStockMonitor();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 text-center">
          <div>
            <h1 className="text-4xl font-bold text-white">台灣股市即時監控面板</h1>
          </div>
        </header>
        
        <main className="w-full">
          {loading ? (
            <div className="text-center text-gray-400">正在從 Alpha Vantage 載入即時資料...</div>
          ) : (
            <Dashboard stockData={stockData} lastUpdated={lastUpdated} error={error} />
          )}
        </main>

        <footer className="text-center mt-8 text-gray-600 text-sm">
          <p>資料來源：Alpha Vantage。實際投資請參考真實報價。</p>
        </footer>
      </div>
    </div>
  );
};

export default App;