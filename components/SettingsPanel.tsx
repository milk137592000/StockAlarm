import React, { useState } from 'react';
import { CogIcon } from './icons/CogIcon';

const SettingsPanel: React.FC = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('請輸入您的 Line Notify 權杖以啟用通知。');

  const handleSave = async () => {
    setStatus('saving');
    try {
      const response = await fetch('/api/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '儲存失敗');
      }
      
      setStatus('saved');
      setMessage('權杖已更新！後端監控服務將使用此權杖發送通知。');
      setToken(''); // Clear input after successful save for security

    } catch (e) {
      console.error("Failed to save token:", e);
      setStatus('error');
      setMessage(e instanceof Error ? e.message : '發生未知錯誤。');
    } finally {
      setTimeout(() => {
        if (status !== 'error') { // Don't clear error message immediately
            setStatus('idle');
            setMessage('請輸入您的 Line Notify 權杖以啟用通知。');
        }
      }, 3000);
    }
  };

  const getMessageColor = () => {
    switch (status) {
      case 'saved': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

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
          disabled={status === 'saving' || !token}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          {status === 'saving' ? '儲存中...' : '儲存權杖'}
        </button>
        <p className={`text-xs text-center h-4 transition-colors duration-300 ${getMessageColor()}`}>{message}</p>
      </div>
    </div>
  );
};

export default SettingsPanel;
