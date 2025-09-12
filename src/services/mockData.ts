import { StockSymbol, StockData } from '../../shared/types';
import { calculateRSI, calculateSMA } from '../../shared/services/indicatorService';

// FIX: Updated function signature to return { close: number }[] to match the StockData['history'] type.
const generateRandomHistory = (startPrice: number, days: number): { close: number }[] => {
  const history: number[] = [startPrice];
  for (let i = 1; i < days; i++) {
    const change = (Math.random() - 0.48) * history[i - 1] * 0.03;
    history.push(history[i - 1] + change);
  }
  // FIX: Mapped the array of numbers to an array of objects.
  return history.reverse().map(p => ({ close: p })); // Newest first
};

const initialStocks: Omit<StockData, 'price' | 'change' | 'changePercent' | 'rsi' | 'ma20' | 'bias'>[] = [
  { symbol: StockSymbol.TWII, name: '加權指數', open: 17000, history: generateRandomHistory(17050, 30) },
  { symbol: StockSymbol.ETF_0050, name: '元大台灣50', open: 130, history: generateRandomHistory(130.5, 30) },
  { symbol: StockSymbol.ETF_00878, name: '國泰永續高股息', open: 20, history: generateRandomHistory(20.1, 30) },
  { symbol: StockSymbol.ETF_00646, name: '元大S&P500', open: 35, history: generateRandomHistory(35.2, 30) },
  { symbol: StockSymbol.ETF_00933B, name: '國泰10Y+金融債', open: 16, history: generateRandomHistory(16.5, 30) },
];


const calculateIndicators = (stock: StockData): StockData => {
  const closePrices = stock.history.map(h => h.close);
  const ma20 = calculateSMA(closePrices, 20);
  const rsi = calculateRSI(closePrices, 14);
  const bias = ma20 > 0 ? ((stock.price - ma20) / ma20) * 100 : 0;

  return {
    ...stock,
    ma20,
    rsi,
    bias,
  };
};

export const generateInitialStockData = (): StockData[] => {
  return initialStocks.map(stock => {
    // FIX: Accessed the 'close' property from the history object as it's now an object.
    const price = stock.history[0].close;
    const change = price - stock.open;
    const changePercent = (change / stock.open) * 100;
    
    const fullStock: StockData = {
      ...stock,
      price,
      change,
      changePercent,
      // FIX: stock.history is already in the correct format ({ close: number }[]) and doesn't need to be mapped again.
      history: stock.history,
    };
    return calculateIndicators(fullStock);
  });
};

export const updateStockData = (currentData: StockData[]): StockData[] => {
  return currentData.map(stock => {
    const changeFactor = (Math.random() - 0.495) * 0.005; // smaller, more realistic fluctuations
    const newPrice = stock.price * (1 + changeFactor);
    const newChange = newPrice - stock.open;
    const newChangePercent = (newChange / stock.open) * 100;

    const newHistory = [{ close: newPrice }, ...stock.history.slice(0, 49)];

    const updatedStock: StockData = {
      ...stock,
      price: newPrice,
      change: newChange,
      changePercent: newChangePercent,
      history: newHistory,
    };
    
    return calculateIndicators(updatedStock);
  });
};