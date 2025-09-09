
import React, { useState, useEffect } from 'react';
import { CogIcon } from './icons/CogIcon';

const SettingsPanel: React.FC = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const storedToken = localStorage.getItem('lineNotifyToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleSave = () => {
    setStatus('saving');
    // In a real app, this would be an API call to a secure backend.
    // For this simulation, we use localStorage.
    try {
      localStorage.setItem('lineNotifyToken', token);
      setTimeout(() => setStatus('saved'), 500);
    } catch (e) {
      console.error("Failed to save token:", e);
      setStatus('error');
    } finally {
      setTimeout(() => setStatus('idle'), 2500); // Reset status after a few seconds
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'saved': return { text: '權杖儲存成功。', color: 'text-green-400' };
      case 'error': return { text: '權杖儲存失敗。', color: 'text-red-400' };
      default: return { text: '變更將儲存於本機。', color: 'text-gray-400' };
    }
  };
  
  const { text, color } = getStatusMessage();

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <CogIcon className="w-6 h-6"/>
        控制面板
      </h2>
      <div className="space-y-3">
        <div>
          <label htmlFor="line-token" className="block text-sm font-medium text-gray-300 mb-1">
            Line Notify 權杖
          </label>
          <input
            type="password"
            id="line-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="在此貼上您的權杖"
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          {status === 'saving' ? '儲存中...' : '儲存權杖'}
        </button>
        <p className={`text-xs text-center h-4 ${color}`}>{text}</p>
      </div>
    </div>
  );
};

export default SettingsPanel;
