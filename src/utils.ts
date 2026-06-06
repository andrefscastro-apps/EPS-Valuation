import { StockProfile } from "./types";

export interface ProjectionMetrics {
  // YoY Growth Rate for 2028 YoY EPS (2028 vs 2027)
  growthRate2028: { est: number; low: number; high: number };
  // Target share price 1-year forward (using 2028 EPS estimate * Forward PE multiple)
  sharePrice2027: { est: number; low: number; high: number };
  
  // YoY Growth Rate for 2029 YoY EPS (2029 vs 2028)
  growthRate2029: { est: number; low: number; high: number };
  // Target share price 2-year forward (using 2029 EPS estimate * Forward PE multiple)
  sharePrice2028: { est: number; low: number; high: number };

  // Current ratios
  peCurrent: number;
  forwardPeCurrent: number;

  // Estimativa 2028 (Outputs vs Current price)
  return2028: { est: number; low: number; high: number };
  gains2028: { est: number; low: number; high: number };

  // Estimativa 2029 (Outputs vs Current price)
  return2029: { est: number; low: number; high: number };
  gains2029: { est: number; low: number; high: number };

  // Long-term (2031)
  growthRate2031: { est: number; low: number; high: number };
  sharePrice2031: { est: number; low: number; high: number };
  return2031: { est: number; low: number; high: number };
  gains2031: { est: number; low: number; high: number };
  cagr2031: { est: number; low: number; high: number };
}

/**
 * Perform spreadsheet-aligned calculations on a stock profile
 */
export function calculateStockMetrics(profile: StockProfile, projectionYearsN: number = 5): ProjectionMetrics {
  const currentPrice = profile.currentPrice || 0.01;
  const eps2027 = profile.eps2027 || { est: 0, low: 0, high: 0 };
  const eps2028 = profile.eps2028 || { est: 0, low: 0, high: 0 };
  const eps2029 = profile.eps2029 || { est: 0, low: 0, high: 0 };
  const eps2031 = profile.eps2031 || { est: 0, low: 0, high: 0 };
  const forwardPE2028_2029 = profile.forwardPE2028_2029 || { est: 0, low: 0, high: 0 };
  const forwardPE2031 = profile.forwardPE2031 || { est: 0, low: 0, high: 0 };
  
  // 1. Current Valuation Multiples
  // PE Current = Share Price / 2027 Earnings Estimate (Est)
  const peCurrent = eps2027.est !== 0 
    ? currentPrice / eps2027.est 
    : 0;
  
  // Forward PE Current = Share Price / 2028 Earnings Estimate (Est)
  const forwardPeCurrent = eps2028.est !== 0 
    ? currentPrice / eps2028.est 
    : 0;

  // YoY Growth Rate helper
  const getGrowthRate = (now: number, prev: number) => {
    return prev !== 0 ? (now - prev) / prev : 0;
  };

  // 2. Projeções 2028 (YoY Growth Rate of 2028 vs 2027)
  const growthRate2028 = {
    est: getGrowthRate(eps2028.est, eps2027.est),
    low: getGrowthRate(eps2028.low, eps2027.low),
    high: getGrowthRate(eps2028.high, eps2027.high),
  };

  // 3. Share Price 2027 (derived using 2028 Earnings * Forward PE multiples)
  const sharePrice2027 = {
    est: eps2028.est * forwardPE2028_2029.est,
    low: eps2028.low * forwardPE2028_2029.low,
    high: eps2028.high * forwardPE2028_2029.high,
  };

  // 4. Projeções 2029 (YoY Growth Rate of 2029 vs 2028)
  const growthRate2029 = {
    est: getGrowthRate(eps2029.est, eps2028.est),
    low: getGrowthRate(eps2029.low, eps2028.low),
    high: getGrowthRate(eps2029.high, eps2028.high),
  };

  // 5. Share Price 2028 (derived using 2029 Earnings * Forward PE multiples)
  const sharePrice2028 = {
    est: eps2029.est * forwardPE2028_2029.est,
    low: eps2029.low * forwardPE2028_2029.low,
    high: eps2029.high * forwardPE2028_2029.high,
  };

  // Return helper vs Current share price
  const getReturnPct = (target: number, current: number) => {
    return current !== 0 ? (target - current) / current : 0;
  };

  // 6. Return and Gain thresholds for Estimativa 2028 (Share Price 2027 vs Current share price)
  const return2028 = {
    est: getReturnPct(sharePrice2027.est, currentPrice),
    low: getReturnPct(sharePrice2027.low, currentPrice),
    high: getReturnPct(sharePrice2027.high, currentPrice),
  };

  const gains2028 = {
    est: sharePrice2027.est - currentPrice,
    low: sharePrice2027.low - currentPrice,
    high: sharePrice2027.high - currentPrice,
  };

  // 7. Return and Gain thresholds for Estimativa 2029 (Share Price 2028 vs Current share price)
  const return2029 = {
    est: getReturnPct(sharePrice2028.est, currentPrice),
    low: getReturnPct(sharePrice2028.low, currentPrice),
    high: getReturnPct(sharePrice2028.high, currentPrice),
  };

  const gains2029 = {
    est: sharePrice2028.est - currentPrice,
    low: sharePrice2028.low - currentPrice,
    high: sharePrice2028.high - currentPrice,
  };

  // 8. Long-Term 2031 (Denominator is fixed at EPS 2027 Est. to calculate cumulative growth as shown in user spreadsheet)
  const eps2027EstBase = eps2027.est || 0.01;
  const growthRate2031 = {
    est: getGrowthRate(eps2031.est, eps2027EstBase),
    low: getGrowthRate(eps2031.low, eps2027EstBase),
    high: getGrowthRate(eps2031.high, eps2027EstBase),
  };

  const sharePrice2031 = {
    est: eps2031.est * forwardPE2031.est,
    low: eps2031.low * forwardPE2031.low,
    high: eps2031.high * forwardPE2031.high,
  };

  const return2031 = {
    est: getReturnPct(sharePrice2031.est, currentPrice),
    low: getReturnPct(sharePrice2031.low, currentPrice),
    high: getReturnPct(sharePrice2031.high, currentPrice),
  };

  const gains2031 = {
    est: sharePrice2031.est - currentPrice,
    low: sharePrice2031.low - currentPrice,
    high: sharePrice2031.high - currentPrice,
  };

  // CAGR = (Target Price / Current Price) ^ (1 / N) - 1
  const getCAGR = (target: number, current: number, years: number) => {
    if (current <= 0 || target <= 0) return 0;
    try {
      return Math.pow(target / current, 1 / years) - 1;
    } catch {
      return 0;
    }
  };

  const cagr2031 = {
    est: getCAGR(sharePrice2031.est, currentPrice, projectionYearsN),
    low: getCAGR(sharePrice2031.low, currentPrice, projectionYearsN),
    high: getCAGR(sharePrice2031.high, currentPrice, projectionYearsN),
  };

  return {
    growthRate2028,
    sharePrice2027,
    growthRate2029,
    sharePrice2028,
    peCurrent,
    forwardPeCurrent,
    return2028,
    gains2028,
    return2029,
    gains2029,
    growthRate2031,
    sharePrice2031,
    return2031,
    gains2031,
    cagr2031
  };
}

/**
 * Format currency nicely
 */
export function formatCurrency(value: number, currency: string = "USD"): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
}

/**
 * Format percentage nicely
 */
export function formatPercentage(value: number, includePlus: boolean = false): string {
  const pct = value * 100;
  const rounded = pct.toFixed(2);
  if (includePlus && pct > 0) {
    return `+${rounded}%`;
  }
  return `${rounded}%`;
}
