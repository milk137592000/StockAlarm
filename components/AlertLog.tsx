
import React from 'react';
import type { Alert } from '../types';
import { BellIcon } from './icons/BellIcon';

interface AlertLogProps {
  alerts: Alert[];
}

const AlertLog: React.FC<AlertLogProps> = ({ alerts }) => {
  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <BellIcon className="w-6 h-6"/>
        警報紀錄
      </h2>
      <div className="max-h-96 overflow-y-auto pr-2">
        {alerts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">目前無警報。系統監控中。</p>
        ) : (
          <ul className="space-y-3">
            {[...alerts].reverse().map((alert) => (
              <li key={alert.id} className="bg-gray-700/50 p-3 rounded-md text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-yellow-400">{alert.condition}</span>
                  <span className="text-xs text-gray-400">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300">{alert.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AlertLog;
