import { StockSymbol, StockData } from '../../shared/types';
import { calculateRSI, calculateSMA } from '../../shared/services/indicatorService';

const CORS_PROXY_BASE = 'https://api.allorigins.win/raw?url=';
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

  // Use historical daily closes for long-term indicators
  const closePrices = stock.history.map(h => h.close);
  const ma20 = calculateSMA(closePrices, 20);
  const rsi = calculateRSI(closePrices, 14);

  // BIAS uses the latest price against the historical moving average
  const bias = ma20 > 0 ? ((stock.price - ma20) / ma20) * 100 : 0;

  return { ...stock, ma20, rsi, bias };
};

const fetchDataWithProxy = async (targetUrl: string) => {
    const proxyUrl = `${CORS_PROXY_BASE}${encodeURIComponent(targetUrl)}`;
    try {
        const response = await fetch(proxyUrl, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Proxy API Error ${response.status}: ${response.statusText}. Details: ${errorBody.slice(0, 200)}`);
        }
        
        const textContent = await response.text();
        if (!textContent) {
            throw new Error('Empty response from proxy');
        }

        // The response from the proxy is the raw text from the target URL, which should be JSON.
        return JSON.parse(textContent);

    } catch (e) {
        if (e instanceof SyntaxError) {
            throw new Error(`Failed to parse JSON response from proxy. This might be an API error page.`);
        }
        if (e instanceof Error) {
           throw new Error(`Network request failed via proxy. Proxy or target API may be down. Original error: ${e.message}`);
        }
        throw new Error('An unknown network error occurred.');
    }
};

// Fetches both quote and historical chart data
export const fetchInitialStockData = async (): Promise<StockData[]> => {
    const symbolsString = SYMBOLS.join(',');
    const quoteTargetUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsString}`;

    const quoteData = await fetchDataWithProxy(quoteTargetUrl);
    if (!quoteData.quoteResponse || !quoteData.quoteResponse.result) {
        throw new Error('Invalid data structure received from Yahoo Finance quote API.');
    }
    const quotes = quoteData.quoteResponse.result;

    const detailedDataPromises = quotes.map(async (quote: any) => {
        const baseData = mapYahooResponseToStockData(quote);
        
        // Fetch historical data for indicators
        const chartTargetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${quote.symbol}?range=3mo&interval=1d`;
        try {
            const chartData = await fetchDataWithProxy(chartTargetUrl);
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
            return { ...baseData, history: [] }; // Fallback with no history
        }
    });

    return Promise.all(detailedDataPromises);
};

// Fetches only the latest quote for faster updates
export const updateStockPrices = async (currentData: StockData[]): Promise<StockData[]> => {
    const symbolsString = SYMBOLS.join(',');
    const quoteTargetUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsString}`;
    
    const data = await fetchDataWithProxy(quoteTargetUrl);
    if (!data.quoteResponse || !data.quoteResponse.result) {
        console.error('Invalid data structure received on update.');
        return currentData; // Return old data on failure
    }
    const quotes = data.quoteResponse.result;

    return currentData.map(stock => {
        const updatedQuote = quotes.find((q: any) => q.symbol === stock.symbol);
        if (!updatedQuote) return stock;

        // Create a new stock object with updated price data, but preserve the original history.
        const updatedStock: StockData = {
            ...stock,
            price: updatedQuote.regularMarketPrice || stock.price,
            change: updatedQuote.regularMarketChange || 0,
            changePercent: updatedQuote.regularMarketChangePercent || 0,
            // The crucial fix: Do NOT modify the original daily 'history' array with intra-day prices.
        };

        // Recalculate indicators using the new price and the UNCHANGED historical data.
        return calculateIndicators(updatedStock);
    });
};