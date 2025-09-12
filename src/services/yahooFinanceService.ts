import { StockSymbol, StockData } from '../../shared/types';
import { calculateRSI, calculateSMA } from '../../shared/services/indicatorService';

// Fix: Replaced non-existent stock symbols with valid ones from the StockSymbol enum.
const SYMBOLS = [
  StockSymbol.ETF_0050,
  StockSymbol.ETF_0056,
  StockSymbol.ETF_00878,
  StockSymbol.ETF_00646,
  StockSymbol.ETF_00929
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

  // Use historical daily closes for long-term indicators
  const closePrices = stock.history.map(h => h.close);
  const ma20 = calculateSMA(closePrices, 20);
  const rsi = calculateRSI(closePrices, 14);

  // BIAS uses the latest price against the historical moving average
  const bias = ma20 > 0 ? ((stock.price - ma20) / ma20) * 100 : 0;

  return { ...stock, ma20, rsi, bias };
};

// Generic fetcher for our internal Vercel API
const fetchFromApi = async (endpoint: 'quote' | 'chart', params: Record<string, string>) => {
    const queryString = new URLSearchParams({ endpoint, ...params }).toString();
    const response = await fetch(`/api/yahoo?${queryString}`);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error(`API Error for ${endpoint}:`, errorData);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return response.json();
}

// Fetches both quote and historical chart data
export const fetchInitialStockData = async (): Promise<StockData[]> => {
    const symbolsString = SYMBOLS.join(',');
    const quoteData = await fetchFromApi('quote', { symbols: symbolsString });

    if (!quoteData.quoteResponse || !quoteData.quoteResponse.result) {
        throw new Error('Invalid data structure received from Yahoo Finance quote API.');
    }
    const quotes = quoteData.quoteResponse.result;

    const detailedDataPromises = quotes.map(async (quote: any) => {
        const baseData = mapYahooResponseToStockData(quote);
        
        try {
            const chartData = await fetchFromApi('chart', { symbol: quote.symbol });
            const closes = chartData?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;

            if (!closes) {
                 console.warn(`Could not parse history for ${quote.symbol}`);
                 return { ...baseData, history: [] };
            }
            
            const validCloses = closes.filter((p: number | null) => p !== null);
            const history = validCloses.map((c: number) => ({ close: c }));

            let stockWithHistory: StockData = { ...baseData, history };
            return calculateIndicators(stockWithHistory);
        } catch (e) {
            console.error(`Error fetching chart for ${quote.symbol}:`, e);
            return calculateIndicators({ ...baseData, history: [] }); // Fallback with no history
        }
    });

    return Promise.all(detailedDataPromises);
};

// Fetches only the latest quote for faster updates
export const updateStockPrices = async (currentData: StockData[]): Promise<StockData[]> => {
    const symbolsString = SYMBOLS.join(',');
    
    try {
        const data = await fetchFromApi('quote', { symbols: symbolsString });
        if (!data.quoteResponse || !data.quoteResponse.result) {
            console.error('Invalid data structure received on update.');
            return currentData; // Return old data on failure
        }
        const quotes = data.quoteResponse.result;

        return currentData.map(stock => {
            const updatedQuote = quotes.find((q: any) => q.symbol === stock.symbol);
            if (!updatedQuote) return stock;

            const updatedStock: StockData = {
                ...stock,
                price: updatedQuote.regularMarketPrice || stock.price,
                change: updatedQuote.regularMarketChange || 0,
                changePercent: updatedQuote.regularMarketChangePercent || 0,
            };

            return calculateIndicators(updatedStock);
        });
    } catch (error) {
        console.error("Failed to update stock prices via API:", error);
        return currentData; // On update failure, return existing data to avoid UI crash
    }
};