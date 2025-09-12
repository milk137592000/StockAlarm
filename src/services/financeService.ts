import { StockSymbol, StockData } from '../../shared/types';
import { calculateRSI, calculateSMA } from '../../shared/services/indicatorService';

const SYMBOLS = [
  StockSymbol.ETF_0050,
  StockSymbol.ETF_0056,
  StockSymbol.ETF_00878,
  StockSymbol.ETF_00646,
  StockSymbol.ETF_00929
];

const STOCK_NAMES: Record<StockSymbol, string> = {
  [StockSymbol.ETF_0050]: '元大台灣50',
  [StockSymbol.ETF_0056]: '元大高股息',
  [StockSymbol.ETF_00878]: '國泰永續高股息',
  [StockSymbol.ETF_00646]: '元大S&P500',
  [StockSymbol.ETF_00929]: '復華台灣科技優息',
};

const fetchFromApi = async (params: Record<string, string>) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/api/finance?${queryString}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    // Alpha Vantage free tier has a strict rate limit, which it communicates via the response body.
    if (data.Note) {
      throw new Error("Alpha Vantage API rate limit reached. Please wait a moment.");
    }
    return data;
}

const mapAlphaVantageToStockData = (quoteData: any, historyData: any, symbol: StockSymbol): StockData | null => {
  const globalQuote = quoteData['Global Quote'];
  const timeSeries = historyData['Time Series (Daily)'];

  if (!globalQuote || Object.keys(globalQuote).length === 0) {
    console.warn(`No global quote data for ${symbol}`);
    return null;
  }
  if (!timeSeries) {
    console.warn(`No history data for ${symbol}`);
    return null;
  }

  const price = parseFloat(globalQuote['05. price']);
  const open = parseFloat(globalQuote['02. open']);
  const change = parseFloat(globalQuote['09. change']);
  const changePercentStr = globalQuote['10. change percent'] || '0%';
  const changePercent = parseFloat(changePercentStr.replace('%', ''));

  const historyDates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).slice(0, 50).reverse();
  const history = historyDates.map(date => ({
      close: parseFloat(timeSeries[date]['4. close']) // Use standard close for history
  }));

  const stock: StockData = {
    symbol,
    name: STOCK_NAMES[symbol],
    price,
    open,
    change,
    changePercent,
    history,
  };
  return calculateIndicators(stock);
};

const calculateIndicators = (stock: StockData): StockData => {
  if (stock.history.length === 0) return stock;
  const closePrices = stock.history.map(h => h.close);
  const ma20 = calculateSMA(closePrices, 20);
  const rsi = calculateRSI(closePrices, 14);
  const bias = ma20 > 0 ? ((stock.price - ma20) / ma20) * 100 : 0;
  return { ...stock, ma20, rsi, bias };
};

export const fetchInitialStockData = async (): Promise<StockData[]> => {
  const dataPromises = SYMBOLS.map(async (symbol) => {
    try {
      // Stagger API calls to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000 * SYMBOLS.indexOf(symbol)));
      const [quoteData, historyData] = await Promise.all([
        fetchFromApi({ avFunction: 'GLOBAL_QUOTE', symbol }),
        fetchFromApi({ avFunction: 'TIME_SERIES_DAILY_ADJUSTED', symbol }),
      ]);
      return mapAlphaVantageToStockData(quoteData, historyData, symbol);
    } catch (e) {
      console.error(`Failed to fetch initial data for ${symbol}:`, e);
      // Propagate the error to be displayed in the UI
      throw new Error(`Failed to fetch data for ${symbol}. ${e instanceof Error ? e.message : ''}`);
    }
  });

  const results = await Promise.all(dataPromises);
  return results.filter((d): d is StockData => d !== null);
};


export const updateStockPrices = async (currentData: StockData[]): Promise<StockData[]> => {
  const updatePromises = currentData.map(async (stock) => {
    try {
      const quoteData = await fetchFromApi({ avFunction: 'GLOBAL_QUOTE', symbol: stock.symbol });
      const globalQuote = quoteData['Global Quote'];

      if (!globalQuote || Object.keys(globalQuote).length === 0) {
        console.warn(`No update quote data for ${stock.symbol}`);
        return stock;
      }

      const updatedStock: StockData = {
        ...stock,
        price: parseFloat(globalQuote['05. price']),
        change: parseFloat(globalQuote['09. change']),
        changePercent: parseFloat((globalQuote['10. change percent'] || '0%').replace('%', '')),
      };
      return calculateIndicators(updatedStock);
    } catch (e) {
      console.error(`Failed to update price for ${stock.symbol}:`, e);
      return stock; // Return old data on silent failure during polling
    }
  });

  return Promise.all(updatePromises);
};
