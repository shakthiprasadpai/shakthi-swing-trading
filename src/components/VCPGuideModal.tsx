import React from 'react';
import { X, BookOpen, ShieldCheck, Zap, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';

interface VCPGuideModalProps {
  onClose: () => void;
}

export const VCPGuideModal: React.FC<VCPGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                Mark Minervini SEPA & Volatility Contraction Pattern (VCP) Guide
              </h2>
              <p className="text-xs text-zinc-400">
                The technical rules behind 2x U.S. Investing Champion Mark Minervini's breakout trading strategy.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300 leading-relaxed">
          
          {/* Section 1: The 8-Point Trend Template */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <h3>1. The Minervini Trend Template (Stage 2 Uptrend)</h3>
            </div>
            <p className="text-zinc-400">
              A stock must be in a confirmed Stage 2 structural uptrend before any entry is considered. 99% of monster winning stocks meet these 8 specific criteria:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>1. Current stock price is above both the 150-day and 200-day moving averages.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>2. The 150-day SMA is above the 200-day SMA.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>3. The 200-day SMA line is trending up for at least 1 month (minimum 22 days).</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>4. The 50-day SMA is above both the 150-day and 200-day moving averages.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>5. Current stock price is trading above the 50-day moving average.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>6. Current stock price is at least 30% above its 52-week low.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>7. Current stock price is within at least 25% of its 52-week high.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>8. Relative Strength (RS Rating) is 70 or higher (preferably 80s or 90s).</span>
              </div>
            </div>
          </div>

          {/* Section 2: Volatility Contraction Pattern (VCP) */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <h3>2. The Volatility Contraction Pattern (VCP) Anatomy</h3>
            </div>
            <p className="text-zinc-400">
              The VCP is a footprint of institutional absorption. As a stock consolidates, sellers are gradually washed out, causing each correction wave to become smaller in depth:
            </p>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-300 font-bold">T1 (First Pullback): -18% to -35%</span>
                <span className="text-zinc-500">Wide swings, emotional retail selling</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-sky-300 font-bold">T2 (Second Pullback): -8% to -15%</span>
                <span className="text-zinc-500">Noticeable drop in volume, supply drying</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-300 font-bold">T3 / T4 (Cheat / Pivot): -2% to -5%</span>
                <span className="text-emerald-400 font-bold">Extreme volume dry-up, ATR compressed</span>
              </div>
              <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-800">
                <strong>The Pivot Point:</strong> The exact high of the final tight consolidation. When the stock crosses this level on expanding volume (+50% to +100% over 50-day average), it signals the breakout.
              </div>
            </div>
          </div>

          {/* Section 3: Relative Strength & RSI to Nifty Index */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
              <h3>3. Relative Strength (RS) & RSI to Benchmark (Nifty / S&P 500)</h3>
            </div>
            <p className="text-zinc-400">
              True market leaders lead before the general market recovers.
            </p>
            <ul className="space-y-2 list-disc list-inside text-zinc-300">
              <li>
                <strong className="text-zinc-100">RS Line New High Ahead of Price:</strong> If the Relative Strength line reaches a new 52-week high while the stock price is still forming its handle, it indicates massive institutional accumulation (Blue Sky RS).
              </li>
              <li>
                <strong className="text-zinc-100">RSI to Nifty Spread:</strong> Leading breakout candidates maintain RSI between 60 and 78, and rarely breach below 50 even during market pullbacks. A positive RSI spread to Nifty (+10 pts or more) denotes exceptional alpha.
              </li>
            </ul>
          </div>

          {/* Section 4: Risk Management */}
          <div className="space-y-2 pt-3 border-t border-zinc-800 bg-rose-950/20 border-rose-900/30 p-3.5 rounded-xl">
            <h4 className="font-bold text-rose-300 text-xs uppercase tracking-wide">
              Minervini Golden Rule of Capital Preservation
            </h4>
            <p className="text-zinc-300 text-[11px]">
              "Always predetermine your stop loss before entering the trade. Never risk more than 1% to 1.5% of total account capital on any single trade, and cap stop losses at 5% to 8% maximum. Asymmetrical risk-to-reward (minimum 2:1 or 3:1) is the mathematical bedrock of superperformance."
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
