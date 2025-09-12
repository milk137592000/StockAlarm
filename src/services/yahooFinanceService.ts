import { StockSymbol, StockData } from '../../shared/types';
import { calculateRSI, calculateSMA } from '../../shared/services/indicatorService';

const CORS_PROXY = 'https://corsproxy.io/?';
const SYMBOLS = [
  StockSymbol.TWII,
  StockSymbol.ETF_0050,
  StockSymbol.ETF_00878,
  StockSymbol.ETF_00646,
  StockSymbol.ETF_00933B
];

// Helper to map Yahoo's response to our StockData type
const mapYahooResponseToStockData = (quote: any): Omit<StockData, 'history' | 'rsi' | 'ma20' | 'bias'> => ({
  symbol: quote.symbol as StockSymbol,
  name: quote.longName || quote.shortName || 'N/A',
  price: quote.regularMarketPrice || 0,
  open: quote.regularMarketOpen || 0,
  change: quote.regularMarketChange || 0,
  changePercent: quote.regularMarketChangePercent || 0,
});

// Calculate indicators based on historical and current price
const calculateIndicators = (stock: StockData): StockData => {
  if (stock.history.length === 0) return stock;

  const closePrices = stock.history.map(h => h.close);
  const ma20 = calculateSMA(closePrices, 20);
  const rsi = calculateRSI(closePrices, 14);
  const bias = ma20 > 0 ? ((stock.price - ma20) / ma20) * 100 : 0;

  return { ...stock, ma20, rsi, bias };
};

// Fetches both quote and historical chart data
export const fetchInitialStockData = async (): Promise<StockData[]> => {
    const symbolsString = SYMBOLS.join(',');
    const quoteUrl = `${CORS_PROXY}https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsString}`;

    const quoteResponse = await fetch(quoteUrl);
    if (!quoteResponse.ok) {
        throw new Error(`Yahoo API (Quote) Error: ${quoteResponse.statusText}`);
    }
    const quoteData = await quoteResponse.json();
    const quotes = quoteData.quoteResponse.result;

    const detailedDataPromises = quotes.map(async (quote: any) => {
        const baseData = mapYahooResponseToStockData(quote);
        
        // Fetch historical data for indicators
        const chartUrl = `${CORS_PROXY}https://query1.finance.yahoo.com/v8/finance/chart/${quote.symbol}?range=3mo&interval=1d`;
        try {
            const chartResponse = await fetch(chartUrl);
            if (!chartResponse.ok) {
                console.warn(`Could not fetch history for ${quote.symbol}`);
                return { ...baseData, history: [] }; // Return with empty history on failure
            }
            const chartData = await chartResponse.json();
            const closes = chartData.chart.result[0].indicators.quote[0].close;
            // Yahoo sometimes includes nulls for non-trading days, filter them out
            const validCloses = closes.filter((p: number | null) => p !== null);

            const history = validCloses.map((c: number) => ({ close: c }));

            let stockWithHistory: StockData = { ...baseData, history };
            return calculateIndicators(stockWithHistory);
        } catch (e) {
            console.error(`Error fetching chart for ${quote.symbol}:`, e);
            return { ...baseData, history: [] }; // Fallback
        }
    });

    return Promise.all(detailedDataPromises);
};

// Fetches only the latest quote for faster updates
export const updateStockPrices = async (currentData: StockData[]): Promise<StockData[]> => {
    const symbolsString = SYMBOLS.join(',');
    const quoteUrl = `${CORS_PROXY}https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsString}`;
    
    const response = await fetch(quoteUrl);
    if (!response.ok) {
        throw new Error(`Yahoo API (Update) Error: ${response.statusText}`);
    }
    const data = await response.json();
    const quotes = data.quoteResponse.result;

    return currentData.map(stock => {
        const updatedQuote = quotes.find((q: any) => q.symbol === stock.symbol);
        if (!updatedQuote) return stock;

        const newPrice = updatedQuote.regularMarketPrice || stock.price;
        
        // Prepend new price to history for indicator calculation, keep history length manageable
        const newHistory = [{ close: newPrice }, ...stock.history].slice(0, 50);

        const updatedStock: StockData = {
            ...stock,
            price: newPrice,
            change: updatedQuote.regularMarketChange || 0,
            changePercent: updatedQuote.regularMarketChangePercent || 0,
            history: newHistory,
        };

        return calculateIndicators(updatedStock);
    });
};
