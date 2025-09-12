
import { useState, useEffect, useRef } from 'react';
import { StockData } from '../../shared/types';
import { fetchInitialStockData, updateStockPrices } from '../services/financeService';

export const useStockMonitor = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const initialData = await fetchInitialStockData();
        if (isMountedRef.current) {
          setStockData(initialData);
          setLastUpdated(new Date());
        }
      } catch (e) {
        console.error("Failed to load initial stock data:", e);
        if (isMountedRef.current) {
          setError(e instanceof Error ? e.message : "An unknown error occurred.");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (loading || error || stockData.length === 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const scheduleUpdate = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(async () => {
        try {
          const updatedData = await updateStockPrices(stockData);
          if (isMountedRef.current) {
            setStockData(updatedData);
            setLastUpdated(new Date());
          }
        } catch (e) {
          console.error("Failed to update stock prices:", e);
        } finally {
          if(isMountedRef.current) {
            scheduleUpdate();
          }
        }
      }, 15000); // Poll every 15 seconds
    };

    scheduleUpdate();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stockData, loading, error]);

  return { stockData, lastUpdated, loading, error };
};
