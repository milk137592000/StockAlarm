export enum StockSymbol {
  ETF_0050 = '0050.TW',
  ETF_0056 = '0056.TW',
  ETF_00878 = '00878.TW',
  ETF_00646 = '00646.TW',
  ETF_00929 = '00929.TW',
}

export interface StockData {
  symbol: StockSymbol;
  name: string;
  price: number;
  open: number;
  change: number;
  changePercent: number;
  history: { close: number }[];
  rsi?: number;
  ma20?: number;
  bias?: number; //乖離率
}

export enum AlertCondition {
  PANIC_SELL = 'A: 恐慌性拋售',
  CHRONIC_BLEED = 'B: 慢性失血',
  ETF_OVERSOLD = 'C: ETF 超賣 (RSI)',
  ETF_DEVIATION = 'D: ETF 乖離過大 (MA20)',
}

export interface Alert {
  id: string;
  timestamp: Date;
  symbol: StockSymbol;
  condition: AlertCondition;
  message: string;
}

export type MonitorStatus = 'initializing' | 'running' | 'paused';