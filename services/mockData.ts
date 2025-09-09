import type { StockData } from '../types';
import { StockSymbol } from '../types';

export const INITIAL_STOCK_DATA: StockData[] = [
  {
    symbol: StockSymbol.TWII,
    name: '台灣加權指數',
    price: 0, // Initialize as 0 to indicate loading state
    open: 0,
    change: 0,
    changePercent: 0,
    history: [],
  },
  {
    symbol: StockSymbol.ETF_0050,
    name: '元大台灣50',
    price: 0, // Initialize as 0 to indicate loading state
    open: 0,
    change: 0,
    changePercent: 0,
    history: [],
  },
  {
    symbol: StockSymbol.ETF_00646,
    name: '元大S&P500',
    price: 0, // Initialize as 0 to indicate loading state
    open: 0,
    change: 0,
    changePercent: 0,
    history: [],
  },
  {
    symbol: StockSymbol.ETF_00878,
    name: '國泰永續高股息',
    price: 0, // Initialize as 0 to indicate loading state
    open: 0,
    change: 0,
    changePercent: 0,
    history: [],
  },
    {
    symbol: StockSymbol.ETF_00933B,
    name: '國泰10Y+金融債',
    price: 0, // Initialize as 0 to indicate loading state
    open: 0,
    change: 0,
    changePercent: 0,
    history: [],
  },
];