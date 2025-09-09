import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { StockSymbol, type StockData, AlertCondition } from '../types';
import { isTradingHours } from '../utils/time';
import { calculateRSI, calculateSMA } from '../services/indicatorService';

// --- Configuration ---
const STOCK_METADATA = {
  [StockSymbol.TWII]: { name: '台灣加權指數' },
  [StockSymbol.ETF_0050]: { name: '元大台灣50' },
  [StockSymbol.ETF_00646]: { name: '元大S&P500' },
  [StockSymbol.ETF_00878]: { name: '國泰永續高股息' },
  [StockSymbol.ETF_00933B]: { name: '國泰10Y+金融債' },
};

// --- Helper Functions ---

const sendLineNotify = async (message: string, token: string): Promise<void> => {
  if (!token) return;
  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: `message=${encodeURIComponent(message)}`,
    });
    if (!response.ok) {
        console.error('Line Notify API error:', await response.json());
    }
  } catch (error) {
    console.error('Failed to send Line Notify:', error);
  }
};

const fetchYahooFinanceData = async (url: string, symbol: StockSymbol) => {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    if (!response.ok) throw new Error(`Yahoo API fetch error for ${symbol}: ${response.statusText}`);
    const data = await response.json();
    if (!data.chart.result || data.chart.result.length === 0 || data.chart.error) {
        throw new Error(data.chart.error?.description || `Invalid data structure for ${symbol}`);
    }
    return data.chart.result[0];
};

const fetchDailyHistory = async (symbol: StockSymbol): Promise<{ history: { close: number }[], prevClose: number }> => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2mo&interval=1d`;
    const result = await fetchYahooFinanceData(url, symbol);
    const history = (result.indicators.quote[0].close || [])
        .map((p: number | null) => ({ close: p }))
        .filter((p: { close: number | null }): p is { close: number } => p.close !== null);
    return {
        history,
        prevClose: result.meta.chartPreviousClose,
    };
};

const fetchIntradayQuote = async (symbol: StockSymbol): Promise<{ price: number, open: number }> => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
    const result = await fetchYahooFinanceData(url, symbol);
    const openPrices = result.indicators.quote[0].open || [];
    return {
        price: result.meta.regularMarketPrice,
        open: openPrices.length > 0 ? openPrices[0] : result.meta.chartPreviousClose, // Fallback to prev close if open is not available
    };
};

const fetchAllStockData = async (): Promise<StockData[]> => {
    const symbols = Object.values(StockSymbol);
    const promises = symbols.map(async (symbol) => {
        try {
            const [dailyData, intradayData] = await Promise.all([
                fetchDailyHistory(symbol),
                fetchIntradayQuote(symbol),
            ]);

            const change = intradayData.price - dailyData.prevClose;
            const changePercent = (change / dailyData.prevClose) * 100;
            
            return {
                symbol,
                name: STOCK_METADATA[symbol].name,
                price: intradayData.price,
                open: intradayData.open,
                change,
                changePercent,
                history: dailyData.history,
            };
        } catch (error) {
            console.error(`Error processing ${symbol}:`, error);
            return null;
        }
    });

    const results = await Promise.all(promises);
    return results.filter((data): data is StockData => data !== null);
};


// --- Main Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  const todayStr = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })).toISOString().split('T')[0];
  
  if (!isTradingHours()) {
    const lastResetDay = await kv.get<string>('lastResetDay');
    if (lastResetDay !== todayStr) {
      await kv.del('notifiedToday');
      await kv.set('lastResetDay', todayStr);
    }
    return res.status(200).send('Not trading hours. Monitor paused.');
  }

  try {
    const lineToken = await kv.get<string>('lineNotifyToken');
    if (!lineToken) {
        return res.status(400).send('Line Notify Token not set. Aborting.');
    }
    
    let cumulativeTwiiDrop = await kv.get<number>('cumulativeTwiiDrop') || 0;
    const lastProcessedDayForBleed = await kv.get<string>('lastProcessedDayForBleed') || '';
    const notifiedToday = new Set(await kv.get<string[]>('notifiedToday') || []);
    const alertsToSend: string[] = [];

    const addAlert = (symbol: StockSymbol, condition: AlertCondition, message: string) => {
      const key = `${symbol}-${condition}`;
      if (notifiedToday.has(key)) return;
      alertsToSend.push(`[${condition}] ${message}`);
      notifiedToday.add(key);
    };

    const stocks = await fetchAllStockData();
    const twii = stocks.find(s => s.symbol === StockSymbol.TWII);

    if (twii && twii.price > 0 && twii.history.length > 1) {
      // --- Chronic Bleed Logic (Stateful & Corrected) ---
      if (todayStr !== lastProcessedDayForBleed) {
        const history = twii.history;
        const yesterdayClose = history[history.length - 1].close;
        const dayBeforeYesterdayClose = history[history.length - 2].close;
        const yesterdayChange = yesterdayClose - dayBeforeYesterdayClose;
        
        if (yesterdayChange < 0) {
          cumulativeTwiiDrop += Math.abs(yesterdayChange);
        } else {
          cumulativeTwiiDrop = 0; // Reset on a green day
        }
        await kv.set('cumulativeTwiiDrop', cumulativeTwiiDrop);
        await kv.set('lastProcessedDayForBleed', todayStr);
      }

      // Condition A: Panic Sell
      const singleDayDrop = twii.open - twii.price;
      if (singleDayDrop > 200) {
        addAlert(twii.symbol, AlertCondition.PANIC_SELL, `${twii.name} 今日盤中跌幅超過 200 點。目前跌點: ${singleDayDrop.toFixed(2)}`);
      }

      // Condition B: Chronic Bleed (Check)
      const intradayDrop = Math.max(0, singleDayDrop);
      if (cumulativeTwiiDrop + intradayDrop > 300) {
        addAlert(twii.symbol, AlertCondition.CHRONIC_BLEED, `${twii.name} 連續累積跌幅超過 300 點。目前累計: ${(cumulativeTwiiDrop + intradayDrop).toFixed(2)} 點`);
        cumulativeTwiiDrop = 0; // Reset after alert
      }
    }

    // --- ETF Conditions ---
    const etfs = stocks.filter(s => s.symbol !== StockSymbol.TWII);
    etfs.forEach(etf => {
      if (etf.history.length > 14 && etf.price > 0 && etf.open > 0) {
        const dailyClosePrices = etf.history.map(h => h.close);
        
        // Condition C: ETF Oversold (RSI)
        const rsi = calculateRSI([...dailyClosePrices, etf.price]); // Include current price for more reactive RSI
        if (rsi < 30) {
            addAlert(etf.symbol, AlertCondition.ETF_OVERSOLD, `${etf.name} (${etf.symbol}) 進入超賣區。RSI: ${rsi.toFixed(2)}`);
        }
        
        // Condition D: ETF Deviation (Bias)
        if (dailyClosePrices.length >= 20) {
            const ma20 = calculateSMA(dailyClosePrices, 20);
            const bias = ((etf.price - ma20) / ma20) * 100;
            if (bias < -5) {
                addAlert(etf.symbol, AlertCondition.ETF_DEVIATION, `${etf.name} (${etf.symbol}) 股價低於 20 日線超過 5%。乖離率: ${bias.toFixed(2)}%`);
            }
        }
      }
    });
    
    // --- Send Notifications & Update State ---
    if (alertsToSend.length > 0) {
      const fullMessage = `\n===== 股市監控警報 =====\n` + alertsToSend.join('\n');
      await sendLineNotify(fullMessage, lineToken);
    }
    
    await kv.set('cumulativeTwiiDrop', cumulativeTwiiDrop);
    await kv.set('notifiedToday', Array.from(notifiedToday));

    res.status(200).json({ success: true, alertsSent: alertsToSend.length });
  } catch (error) {
    console.error('Monitoring job failed:', error);
    if (error instanceof Error) {
        const lineToken = await kv.get<string>('lineNotifyToken');
        if (lineToken) await sendLineNotify(`監控腳本執行失敗: ${error.message}`, lineToken);
    }
    res.status(500).json({ success: false, message: 'An internal error occurred.' });
  }
}
