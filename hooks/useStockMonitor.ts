import { useState, useEffect, useRef } from 'react';
import type { StockData, Alert, MonitorStatus } from '../types';
import { StockSymbol, AlertCondition } from '../types';
import { INITIAL_STOCK_DATA } from '../services/mockData';
import { calculateRSI, calculateSMA } from '../services/indicatorService';
import { isTradingHours } from '../utils/time';

const fetchRealtimeData = async (symbol: StockSymbol): Promise<Partial<StockData> | null> => {
  const encodedSymbol = encodeURIComponent(symbol);
  // Using a CORS proxy to bypass CORS restrictions in the browser.
  const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?range=1d&interval=1m`)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch error: ${response.statusText}`);
    const data = await response.json();

    if (!data.chart.result || data.chart.result.length === 0 || data.chart.error) {
      throw new Error(data.chart.error?.description || `Invalid data from Yahoo Finance API for ${symbol}`);
    }
    
    const meta = data.chart.result[0].meta;
    const indicators = data.chart.result[0].indicators.quote[0];
    
    if (!indicators || !indicators.open || indicators.open.length === 0 || !meta.regularMarketPrice) {
        console.warn(`No market data available from API for ${symbol}.`);
        return null;
    }
    
    const openPrice = indicators.open[0];
    const currentPrice = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose;

    // Construct history from close prices, ensuring we only take valid numbers.
    const history = indicators.close
        .map((p: number | null) => ({ close: p }))
        .filter((p): p is { close: number } => p.close !== null)
        .slice(-30);

    return {
      price: currentPrice,
      open: openPrice,
      change: currentPrice - prevClose,
      changePercent: ((currentPrice - prevClose) / prevClose) * 100,
      history: history,
    };
  } catch (error) {
    console.error(`Failed to fetch ${symbol} data:`, error);
    return null;
  }
};


const useStockMonitor = () => {
  const [status, setStatus] = useState<MonitorStatus>('initializing');
  const [stocks, setStocks] = useState<StockData[]>(INITIAL_STOCK_DATA);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cumulativeTwiiDrop, setCumulativeTwiiDrop] = useState(0);
  const notifiedToday = useRef<Set<string>>(new Set());
  
  const addAlert = (symbol: StockSymbol, condition: AlertCondition, message: string) => {
    const key = `${symbol}-${condition}`;
    if (notifiedToday.current.has(key)) return;

    setAlerts(prev => [...prev, { id: Date.now().toString(), timestamp: new Date(), symbol, condition, message }]);
    notifiedToday.current.add(key);
  };

  const checkConditions = (currentStocks: StockData[]) => {
    const twii = currentStocks.find(s => s.symbol === StockSymbol.TWII);
    if (twii && twii.price > 0) { // Only check if TWII data is loaded
      // Condition A: Panic Sell
      const singleDayDrop = twii.open - twii.price;
      if (singleDayDrop > 200) {
        addAlert(twii.symbol, AlertCondition.PANIC_SELL, `^TWII 今日跌幅超過 200 點。目前跌點: ${singleDayDrop.toFixed(2)}`);
      }

      // Condition B: Chronic Bleed
      setCumulativeTwiiDrop(prevDrop => {
        let newDrop;
        if (twii.price < twii.open) { // Market is down for the day
          const todayDrop = twii.open - twii.price;
          // In a real backend, this would accumulate across multiple fetches/days.
          // For the frontend simulation, we'll track the current day's total drop.
          newDrop = todayDrop;
        } else { // Market is up
          newDrop = 0;
        }

        if (newDrop > 300) {
          addAlert(twii.symbol, AlertCondition.CHRONIC_BLEED, `^TWII 累積跌幅超過 300 點。目前累計: ${newDrop.toFixed(2)} 點`);
          return 0; // Reset after alert
        }
        return newDrop;
      });
    }

    const etfs = currentStocks.filter(s => s.symbol !== StockSymbol.TWII);
    etfs.forEach(etf => {
      // Condition C: ETF Oversold
      if (etf.rsi !== undefined && etf.rsi < 30) {
        addAlert(etf.symbol, AlertCondition.ETF_OVERSOLD, `${etf.symbol} 進入超賣區。RSI: ${etf.rsi.toFixed(2)}`);
      }
      
      // Condition D: ETF Deviation
      if (etf.bias !== undefined && etf.bias < -5) {
        addAlert(etf.symbol, AlertCondition.ETF_DEVIATION, `${etf.symbol} 股價低於 20 日線超過 5%。乖離率: ${etf.bias.toFixed(2)}%`);
      }
    });
  };

  const updateData = async () => {
      if (!isTradingHours()) {
        setStatus('paused');
        // Reset daily flags outside trading hours
        if (new Date().getHours() >= 14) { 
          notifiedToday.current.clear();
        }
        return;
      }
      
      setStatus('running');
      
      const symbolsToFetch: StockSymbol[] = Object.values(StockSymbol);
      const dataPromises = symbolsToFetch.map(symbol => fetchRealtimeData(symbol));
      const fetchedData = await Promise.all(dataPromises);

      const updates = symbolsToFetch.reduce((acc, symbol, index) => {
        if (fetchedData[index]) {
            acc[symbol] = fetchedData[index]!;
        }
        return acc;
      }, {} as Record<StockSymbol, Partial<StockData>>);


      setStocks(prevStocks => {
        const newStocks = prevStocks.map(stock => {
            let currentStock = { ...stock };

            // Apply real-time updates if available
            if (updates[stock.symbol]) {
                currentStock = { ...currentStock, ...updates[stock.symbol] };
            } 

            // For any ETF that has updated history and price, calculate indicators
            if (currentStock.symbol !== StockSymbol.TWII && currentStock.history.length > 0 && currentStock.price > 0) {
                const historyPrices = currentStock.history.map(h => h.close);
                if (historyPrices.length > 14) {
                    currentStock.rsi = calculateRSI(historyPrices);
                }
                if (historyPrices.length >= 20) {
                    const ma20 = calculateSMA(historyPrices, 20);
                    currentStock.ma20 = ma20;
                    currentStock.bias = ((currentStock.price - ma20) / ma20) * 100;
                }
            }
            
            return currentStock;
        });

        checkConditions(newStocks);
        return newStocks;
      });
  }

  useEffect(() => {
    // Initial fetch to populate data immediately
    updateData();
    // More frequent polling for a responsive UI feel, but respectful of public APIs.
    const interval = setInterval(updateData, 30000); 

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, stocks, alerts, cumulativeTwiiDrop };
};

export default useStockMonitor;