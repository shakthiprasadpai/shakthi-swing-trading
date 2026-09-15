export type Market = 'ALL' | 'NIFTY' | 'US';

export type BenchmarkIndex = 'NIFTY_50' | 'SP_500';

export type VCPStage = 
  | 'FORMING'            // Base is still contracting early
  | 'TIGHTENING'         // Near pivot, cheat/handle area
  | 'PIVOT_ALERT'        // Within 1.5% of pivot price
  | 'CONFIRMED_BREAKOUT' // Broke out today on > 150% volume
  | 'EXTENDED';          // > 5% past pivot (do not chase)

export interface VCPContraction {
  contractionNumber: number; // 1, 2, 3, 4
  depthPercent: number;      // e.g. -22%, -11%, -4.5%
  durationDays: number;      // e.g. 15, 8, 4
  volumeReductionPercent: number; // e.g. -45%
}

export interface MinerviniChecklist {
  priceAbove150and200SMA: boolean;
  sma150Above200: boolean;
  sma200TrendingUp: boolean;
  sma50Above150and200: boolean;
  priceAbove50SMA: boolean;
  price30PctAbove52WLow: boolean;
  priceWithin25Pct52WHigh: boolean;
  rsRatingAbove70: boolean;
  score: number; // 0 to 8
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  sma50?: number;
  sma150?: number;
  sma200?: number;
  rsi?: number;
  rsLine?: number; // Stock close / Benchmark close scaled
  adx?: number;    // Average Directional Index (14)
  plusDI?: number; // +DI Positive Directional Indicator
  minusDI?: number;// -DI Negative Directional Indicator
}

export interface StockData {
  symbol: string;
  name: string;
  market: Market;
  currency: string; // 'INR' or 'USD'
  exchange: string; // 'NSE' or 'NASDAQ' / 'NYSE'
  sector: string;
  industry: string;
  
  // Current Price & Changes
  currentPrice: number;
  changePercent: number;
  volume: number;
  avgVolume50D: number;
  volumeSurgeRatio: number; // e.g. 2.4x
  volumeAbove50SMA: boolean; // Volume exceeds 50-day SMA
  isVolumeBreakout: boolean; // High volume breakout (volume >= 1.5x 50D SMA on pivot test)
  recentVolumeTrend: 'HEAVY_ACCUMULATION' | 'ABOVE_AVERAGE' | 'DRYING_UP' | 'NORMAL';
  volumeAnomaly?: {
    type: 'ACCUMULATION_SPIKE' | 'VOLUME_DRYUP';
    ratio: number;
    label: string;
    description: string;
  } | null;
  smartRankScore?: number; // Composite 0-100 SEPA Alpha Score
  
  // Highs / Lows
  high52W: number;
  low52W: number;
  pctFrom52WHigh: number; // e.g. -2.4%
  pctAbove52WLow: number; // e.g. +145%
  
  // Moving Averages
  sma20: number;
  sma50: number;
  sma150: number;
  sma200: number;
  sma200TrendingUpDays: number;
  
  // Minervini Trend Template
  checklist: MinerviniChecklist;
  
  // Volatility & VCP
  vcpStage: VCPStage;
  contractions: VCPContraction[];
  totalContractions: number;
  pivotPrice: number;
  pctToPivot: number; // Negative = below pivot, positive = above
  atr14: number;
  atrPercent: number; // ATR / Price * 100
  atrTrend: 'COMPRESSING' | 'EXPANDING' | 'STABLE';
  baseDurationWeeks: number;
  baseDepthPercent: number;
  
  // Average Directional Index (ADX) Trend Strength
  adx14: number;
  plusDI: number;
  minusDI: number;
  adxTrendStrength: 'VERY_STRONG_TREND' | 'STRONG_TREND' | 'MODERATE_TREND' | 'WEAK_TREND';
  
  // Relative Strength (RS) vs Benchmark (Nifty 50 or S&P 500)
  rsRating: number; // 1 to 99 percentile
  rsNewHighAheadOfPrice: boolean;
  rsPerformanceVsNifty: {
    perf1M: number;
    perf3M: number;
    perf6M: number;
    perf1Y: number;
    nifty1M: number;
    nifty3M: number;
    nifty6M: number;
    nifty1Y: number;
    alpha3M: number; // Stock 3M% - Nifty 3M%
  };
  rsPerformanceVsSP500: {
    perf1M: number;
    perf3M: number;
    perf6M: number;
    perf1Y: number;
    sp1M: number;
    sp3M: number;
    sp6M: number;
    sp1Y: number;
    alpha3M: number;
  };

  // RSI Momentum
  rsi14: number;
  rsiZone: 'SUPER_MOMENTUM' | 'HEALTHY_BULLISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'WEAK';
  rsiToNiftySpread: number; // Stock RSI - Nifty RSI (e.g. +18.4)
  rsiToSP500Spread: number; // Stock RSI - S&P 500 RSI
  
  // Trade Setup Risk Management
  recommendedStopLoss: number;
  riskPercent: number;
  targetPrice2R: number;
  targetPrice3R: number;
  
  // Historical chart data
  historicalData: PricePoint[];
}

export interface BenchmarkDataPoint {
  date: string;
  close: number;
  rsi: number;
}

export interface BenchmarkMetrics {
  name: string;
  symbol: string;
  currentPrice: number;
  changePercent: number;
  rsi14: number;
  perf1M: number;
  perf3M: number;
  perf6M: number;
  perf1Y: number;
  history: BenchmarkDataPoint[];
}

export interface ScannerFilterState {
  market: Market;
  benchmark?: BenchmarkIndex;
  minScore: number; // 6, 7, or 8
  stages: VCPStage[];
  minRSRating: number; // 0, 70, 80, 90
  minADX: number; // 0 for any, or 20, 25 (Minervini strong trend threshold), 30
  onlyVolumeBreakout: boolean; // Flag stocks experiencing breakout accompanied by volume > 50-day average
  onlyVolumeAnomaly?: boolean; // Flag stocks with extreme institutional accumulation (>2x) or supply dry-up (<0.6x at pivot)
  minVolumeSurge: number; // 0 for any, 1.0, 1.5, 2.0
  maxATRPercent: number; // 0 for any, or 3, 4, 5
  rsiZone: string; // 'ALL' | 'BULLISH' | 'SUPER_MOMENTUM' | 'SPREAD_POSITIVE'
  minRsiValue?: number; // e.g. 0, 55, 60, 65, 70
  minRsiSpread: number; // e.g. 0, +10
  searchQuery: string;
  sortBy: 'SMART_RANK' | 'RS_RATING' | 'RSI' | 'ADX' | 'VOLUME_SURGE' | 'PCT_TO_PIVOT' | 'CHANGE_PCT' | 'SCORE';
  sortOrder?: 'asc' | 'desc';
  onlyWatchlist?: boolean; // Filter to user's saved watchlist
  selectedSector?: string; // Optional sector filter
}

export interface SectorPerformance {
  sector: string;
  stockCount: number;
  breakoutCount: number;
  avgRSRating: number;
  avgChangePercent: number;
  avgAlpha3M: number;
  avgRsi: number;
  topStockSymbol: string;
  topStockGain: number;
  momentumRank: 'LEADING' | 'IMPROVING' | 'NEUTRAL' | 'LAGGING';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Pro Trader' | 'Institutional' | 'Individual';
  joinedDate: string;
  lastLogin: string;
  savedWatchlist: string[]; // array of stock symbols bookmarked by user
  alertPreferences: {
    emailAlerts: boolean;
    minScoreAlert: number;
    minAdxAlert: number;
    frequency: 'realtime' | 'daily_digest';
  };
}

