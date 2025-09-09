import React from 'react';
import Dashboard from './components/Dashboard';
import AlertLog from './components/AlertLog';
import SettingsPanel from './components/SettingsPanel';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">台灣股市監控儀表板</h1>
            <p className="text-gray-400">
              設定您的 Line Notify 權杖以啟用後端 24/7 全天候監控服務。
            </p>
          </div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Dashboard />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <SettingsPanel />
            <AlertLog />
          </div>
        </main>

        <footer className="text-center mt-8 text-gray-600 text-sm">
          <p>監控服務在雲端運行，警報將透過 Line Notify 發送。</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
