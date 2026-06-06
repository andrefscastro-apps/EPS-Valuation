export interface EstimateValues {
  est: number;
  low: number;
  high: number;
}

export interface StockProfile {
  id: string; // Symbol/ticker, e.g., "SOFI"
  ticker: string;
  name: string;
  currentPrice: number;
  currency: string;
  lastFetched: number;
  
  // Projections - Earnings Per Share
  eps2027: EstimateValues;
  eps2028: EstimateValues;
  eps2029: EstimateValues;
  
  // Multiples applied for short-to-mid term projection targets
  forwardPE2028_2029: EstimateValues;
  
  // Long term target (2031)
  eps2031: EstimateValues;
  
  // Multiples applied for 2031 target
  forwardPE2031: EstimateValues;

  // Rationale or notes
  notes?: string;
  aiRationale?: string;
  isSimulated?: boolean;
}

// Initial defaults modeling the exact figures shown in the user's attachment spreadsheet (SOFI)
export const SOFI_DEFAULT_PROFILE: StockProfile = {
  id: "SOFI",
  ticker: "SOFI",
  name: "SoFi Technologies, Inc.",
  currentPrice: 16.03,
  currency: "USD",
  lastFetched: 1780742177000,
  
  eps2027: {
    est: 0.82,
    low: 0.75,
    high: 0.87
  },
  eps2028: {
    est: 0.99,
    low: 0.90,
    high: 1.04
  },
  eps2029: {
    est: 1.20,
    low: 1.10,
    high: 1.30
  },
  forwardPE2028_2029: {
    est: 25.0,
    low: 20.0,
    high: 30.0
  },
  eps2031: {
    est: 1.60,
    low: 1.40,
    high: 1.80
  },
  forwardPE2031: {
    est: 22.0,
    low: 15.0,
    high: 25.0
  },
  notes: "Projeções baseadas no modelo original do Excel em anexo para SOFI adaptadas para os anos de 2027, 2028, 2029 e 2031.",
  aiRationale: "Ticker pré-carregado diretamente do modelo financeiro em anexo do Excel enviado pelo investidor."
};
