
import { useState, useEffect } from 'react';
import { StockData } from '../../../shared/types';
import { generateInitialStockData, updateStockData } from '../services/mockData';

export const useStockMonitor = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const initialData = generateInitialStockData();
    setStockData(initialData);
    setLastUpdated(new Date());
    setLoading(false);

    const intervalId = setInterval(() => {
      setStockData(prevData => updateStockData(prevData));
      setLastUpdated(new Date());
    }, 3000); // Update every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return { stockData, lastUpdated, loading };
};