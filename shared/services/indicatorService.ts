
export const calculateSMA = (prices: number[], period: number): number => {
  if (prices.length < period) return 0;
  const periodPrices = prices.slice(-period);
  const sum = periodPrices.reduce((acc, val) => acc + val, 0);
  return sum / period;
};

export const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length <= period) return 50; // Return neutral RSI if not enough data

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff; // losses are positive
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) {
    return 100; // Prevent division by zero
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
};