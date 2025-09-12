
import { useState, useEffect, useRef } from 'react';
import { StockData } from '../../shared/types';
import { fetchInitialStockData, updateStockPrices } from '../services/yahooFinanceService';

export const useStockMonitor = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const initialData = await fetchInitialStockData();
        setStockData(initialData);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Failed to load initial stock data:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Cleanup function to clear timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // A separate effect for polling, which starts after the initial data is loaded
  useEffect(() => {
    // Don't start polling if there's no data or we are in a loading/error state
    if (loading || error || stockData.length === 0) {
      return;
    }

    const update = async () => {
      try {
        const updatedData = await updateStockPrices(stockData);
        setStockData(updatedData);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Failed to update stock prices:", e);
        // Fail silently and try again on the next interval
      }
    };
    
    // Set a timeout for the next update
    timeoutRef.current = window.setTimeout(update, 15000);

  }, [stockData, loading, error]); // Rerun this effect when data changes

  return { stockData, lastUpdated, loading, error };
};