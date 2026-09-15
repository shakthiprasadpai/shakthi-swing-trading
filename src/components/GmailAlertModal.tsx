import React, { useState } from 'react';
import { StockData, BenchmarkIndex } from '../types';
import { generateBreakoutEmailBody } from '../utils/technicalCalculations';
import { getGoogleAccessToken, sendGmailMessage, signInWithGooglePopup } from '../utils/googleAuth';
import { Mail, Copy, Check, ExternalLink, X, Send, Sparkles, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface GmailAlertModalProps {
  stock: StockData;
  benchmarkType: BenchmarkIndex;
  userEmail?: string;
  onClose: () => void;
}

export const GmailAlertModal: React.FC<GmailAlertModalProps> = ({
  stock,
  benchmarkType,
  userEmail = 'shakthiprasadp070@gmail.com',
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [recipient, setRecipient] = useState(userEmail);
  const [customNote, setCustomNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const { subject, body: baseBody } = generateBreakoutEmailBody(stock, benchmarkType);

  const finalBody = customNote
    ? `USER TRADER NOTES:\n${customNote}\n\n${baseBody}`
    : baseBody;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${finalBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectGmailSend = async () => {
    setSendError(null);
    setSendSuccess(null);
    setIsSending(true);

    try {
      let token = getGoogleAccessToken();
      if (!token) {
        // Trigger Google popup to get fresh token with gmail.send permission
        const result = await signInWithGooglePopup();
        token = result.accessToken;
      }

      if (!token) {
        throw new Error('Please sign in with Google to send via Gmail API.');
      }

      const res = await sendGmailMessage(token, recipient, subject, finalBody);
      if (res.success) {
        setSendSuccess(`Alert sent directly to ${recipient} via your connected Gmail!`);
      } else {
        setSendError(res.error || 'Failed to dispatch email via Gmail API.');
      }
    } catch (err: any) {
      setSendError(err.message || 'Error connecting to Gmail service.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenGmail = () => {
    // Official Gmail compose link with pre-filled fields
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
    window.open(url, '_blank');
  };

  const handleMailto = () => {
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Send Minervini Breakout Alert to Gmail</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  {stock.symbol}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Dispatches high-momentum breakout, VCP volatility parameters, and RS/RSI to Nifty report.
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

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Recipient Email Field */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Recipient Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="your-email@gmail.com"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 outline-none transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Default Gmail</span>
              </span>
            </div>
          </div>

          {/* Optional custom trader note */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Add Personal Trade Note (Optional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Look to buy on 30-min opening range breakout above pivot..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 outline-none transition placeholder-zinc-600"
            />
          </div>

          {/* Feedback banners */}
          {sendSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{sendSuccess}</span>
            </div>
          )}

          {sendError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}

          {/* Email Preview Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-400">
                Generated Trade Alert Brief
              </label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to clipboard' : 'Copy text'}</span>
              </button>
            </div>
            <pre className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-300 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
              {finalBody}
            </pre>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Brief' : 'Copy All'}</span>
            </button>
            <button
              onClick={handleOpenGmail}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
              title="Open draft composer in Gmail"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Web Compose</span>
            </button>
          </div>

          <button
            onClick={handleDirectGmailSend}
            disabled={isSending}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isSending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending via Gmail API...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch with Connected Gmail</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
