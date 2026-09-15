import { StockData, BenchmarkIndex } from '../types';
import { calculateSmartRankScore, detectVolumeAnomaly } from './technicalCalculations';

/**
 * Cleanly escapes CSV fields containing commas, quotes, or newlines
 */
function escapeCsvField(val: string | number | boolean | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports an array of StockData items to a CSV file and triggers automatic browser download
 */
export function exportStocksToCsv(
  stocks: StockData[],
  benchmark: BenchmarkIndex,
  filenamePrefix: string = 'minervini_scanner_watchlist'
): { success: boolean; count: number; filename: string } {
  if (!stocks || stocks.length === 0) {
    return { success: false, count: 0, filename: '' };
  }

  const isNifty = benchmark === 'NIFTY_50';
  const benchName = isNifty ? 'NIFTY 50' : 'S&P 500';

  const headers = [
    'Symbol',
    'Company Name',
    'Exchange',
    'Market',
    'Sector',
    'Industry',
    'Current Price',
    'Currency',
    'Change %',
    'Pivot Price',
    '% Distance to Pivot',
    'VCP Stage',
    'Trend Template Score (/8)',
    'RS Rating (0-99)',
    `3M Alpha vs ${benchName} (%)`,
    'RSI (14)',
    `RSI Spread vs ${benchName}`,
    'ADX (14)',
    'ADX Trend Strength',
    'Volume Today',
    '50-Day Avg Volume',
    'Volume Surge Ratio',
    'Volume Anomaly Status',
    'ATR (14)',
    'ATR % Volatility',
    'Smart Rank Score (0-100)',
    'Recommended Stop Loss',
    'Max Risk %',
    'Target 1 (2R)',
    'Target 2 (3R)',
    'Export Date'
  ];

  const today = new Date().toISOString().split('T')[0];
  const rows = stocks.map((s) => {
    const smartRank = s.smartRankScore ?? calculateSmartRankScore(s);
    const volAnomaly = s.volumeAnomaly ?? detectVolumeAnomaly(s);
    const alpha3M = isNifty ? s.rsPerformanceVsNifty.alpha3M : s.rsPerformanceVsSP500.alpha3M;
    const rsiSpread = isNifty ? s.rsiToNiftySpread : s.rsiToSP500Spread;

    return [
      escapeCsvField(s.symbol),
      escapeCsvField(s.name),
      escapeCsvField(s.exchange),
      escapeCsvField(s.market),
      escapeCsvField(s.sector),
      escapeCsvField(s.industry),
      escapeCsvField(s.currentPrice),
      escapeCsvField(s.currency),
      escapeCsvField(s.changePercent),
      escapeCsvField(s.pivotPrice),
      escapeCsvField(s.pctToPivot),
      escapeCsvField(s.vcpStage),
      escapeCsvField(s.checklist.score),
      escapeCsvField(s.rsRating),
      escapeCsvField(alpha3M),
      escapeCsvField(s.rsi14),
      escapeCsvField(rsiSpread),
      escapeCsvField(s.adx14),
      escapeCsvField(s.adxTrendStrength),
      escapeCsvField(s.volume),
      escapeCsvField(s.avgVolume50D),
      escapeCsvField(s.volumeSurgeRatio),
      escapeCsvField(volAnomaly ? volAnomaly.label : 'Normal'),
      escapeCsvField(s.atr14),
      escapeCsvField(s.atrPercent),
      escapeCsvField(smartRank),
      escapeCsvField(s.recommendedStopLoss),
      escapeCsvField(s.riskPercent),
      escapeCsvField(s.targetPrice2R),
      escapeCsvField(s.targetPrice3R),
      escapeCsvField(today)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${filenamePrefix}_${today}.csv`;

  // Standard safe browser trigger
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: stocks.length, filename };
}
