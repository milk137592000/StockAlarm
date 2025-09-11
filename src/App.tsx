
import React from 'react';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col justify-center items-center text-center h-screen">
        <header className="mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white">台灣股市監控服務</h1>
            <p className="text-gray-400 mt-2">
              這是一個在雲端 24/7 運行的自動化監控機器人。
            </p>
          </div>
        </header>
        
        <main className="w-full max-w-2xl">
            <Dashboard />
        </main>

        <footer className="text-center mt-8 text-gray-600 text-sm">
          <p>此頁面僅用於確認服務狀態。所有警報將直接透過 LINE 發送給您。</p>
        </footer>
      </div>
    </div>
  );
};

export default App;