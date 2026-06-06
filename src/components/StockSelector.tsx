import React, { useState } from "react";
import { Search, RotateCw, Plus, Trash2, TrendingUp, AlertCircle, FileSpreadsheet, ChevronDown } from "lucide-react";
import { StockProfile } from "../types";

interface StockSelectorProps {
  savedStocks: StockProfile[];
  activeStock: StockProfile;
  onSelectStock: (stock: StockProfile) => void;
  onAddStock: (stock: StockProfile) => void;
  onDeleteStock: (ticker: string) => void;
  onRefreshActivePrice: () => Promise<void>;
  isRefreshing: boolean;
}

export default function StockSelector({
  savedStocks,
  activeStock,
  onSelectStock,
  onAddStock,
  onDeleteStock,
  onRefreshActivePrice,
  isRefreshing
}: StockSelectorProps) {
  const [tickerQuery, setTickerQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearchAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = tickerQuery.trim().toUpperCase();
    if (!query) return;

    // Check if already exists in saved list
    const existing = savedStocks.find((s) => s.ticker === query);
    if (existing) {
      onSelectStock(existing);
      setTickerQuery("");
      setErrorMsg(null);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/stock/${query}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar dados na API.");
      }
      const stockData = await response.json();
      
      if (stockData.success) {
        // Create a new stock profile based on returned current price and defaults
        const basePrice = stockData.price;
        
        // Generate sensible initial baseline EPS forecasts based on stock price
        // (so that the user doesn't get completely blank estimates)
        const approxEPS2027 = Number((basePrice / 25).toFixed(2)); // P/E ~ 25
        const approxEPS2028 = Number((approxEPS2027 * 1.15).toFixed(2)); // +15% growth
        const approxEPS2029 = Number((approxEPS2028 * 1.15).toFixed(2)); // +15% growth
        const approxEPS2031 = Number((approxEPS2029 * 1.30).toFixed(2)); // long term growth
        
        const newProfile: StockProfile = {
          id: query,
          ticker: query,
          name: stockData.name || `${query} Corp`,
          currentPrice: basePrice,
          currency: stockData.currency || "USD",
          lastFetched: Date.now(),
          eps2027: {
            est: approxEPS2027,
            low: Number((approxEPS2027 * 0.9).toFixed(2)),
            high: Number((approxEPS2027 * 1.1).toFixed(2))
          },
          eps2028: {
            est: approxEPS2028,
            low: Number((approxEPS2028 * 0.9).toFixed(2)),
            high: Number((approxEPS2028 * 1.1).toFixed(2))
          },
          eps2029: {
            est: approxEPS2029,
            low: Number((approxEPS2029 * 0.9).toFixed(2)),
            high: Number((approxEPS2029 * 1.1).toFixed(2))
          },
          forwardPE2028_2029: {
            est: 22.0,
            low: 15.0,
            high: 28.0
          },
          eps2031: {
            est: approxEPS2031,
            low: Number((approxEPS2031 * 0.85).toFixed(2)),
            high: Number((approxEPS2031 * 1.15).toFixed(2))
          },
          forwardPE2031: {
            est: 18.0,
            low: 12.0,
            high: 22.0
          },
          notes: `Estimativas geradas automaticamente para início do modelo de projeção da ação ${query}.`,
          aiRationale: "Use o Assistente de Inteligência Artificial para gerar previsões de mercado realistas para este ativo.",
          isSimulated: stockData.simulated || false
        };

        onAddStock(newProfile);
        setTickerQuery("");
      } else {
        setErrorMsg("Não foi possível encontrar este ticker.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Falha ao comunicar com os serviços de cotação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const formattedTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className="bg-bento-card border border-white/10 rounded-2xl p-5 mb-6 text-white shadow-xl transition-all hover:border-white/15">
      
      {/* Search and Add section */}
      <div className="mb-6 border-b border-white/5 pb-5">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2 font-mono">
          <Plus className="w-3.5 h-3.5 text-blue-500" />
          Nova Projeção Financeira
        </h2>
        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
          Introduza o ticker de qualquer ação do mercado para criar um modelo matemático de valuation:
        </p>
        
        <form onSubmit={handleSearchAndAdd} className="w-full">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Pesquisar ticker (ex: SOFI, AAPL)..."
                value={tickerQuery}
                onChange={(e) => setTickerQuery(e.target.value)}
                className="w-full bg-[#0a0a0b] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs font-mono tracking-wide focus:outline-none placeholder-slate-600 pr-10"
                disabled={isLoading}
              />
              <div className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-600">
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !tickerQuery.trim()}
              className="bg-blue-600 hover:bg-blue-550 disabled:bg-[#121214] disabled:text-slate-600 text-white font-bold text-xs px-4 rounded-xl flex items-center gap-1.5 transition duration-150 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Criar</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-red-400 bg-red-400/5 border border-red-550/10 p-2.5 rounded-xl font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>
      </div>

      {/* Title block of Saved Projections list */}
      <div className="flex items-center justify-between gap-4 mb-4 select-none">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-2 font-mono">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Suas Projeções ({savedStocks.length})
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
            Clique na esquerda para selecionar, ou remova se necessário.
          </p>
        </div>

        {/* Real-Time Price Update Trigger */}
        <button
          onClick={onRefreshActivePrice}
          disabled={isRefreshing}
          title="Sincronizar cotação do ativo ativo em tempo real"
          className="p-2 bg-[#0a0a0b] border border-white/10 hover:bg-white/5 active:bg-white/10 disabled:opacity-50 text-blue-400 hover:text-blue-300 rounded-lg transition duration-200 flex items-center justify-center cursor-pointer shadow-sm"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Mobile/Tablet Compact View: Show dropdown selector + delete button for active stock */}
      <div className="block lg:hidden space-y-2 mb-2">
        <div className="flex gap-2.5">
          <div className="relative flex-grow">
            <select
              value={activeStock.ticker}
              onChange={(e) => {
                const selected = savedStocks.find((s) => s.ticker === e.target.value);
                if (selected) onSelectStock(selected);
              }}
              className="w-full bg-[#0c0c0d] text-white font-mono text-xs font-bold border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 outline-none cursor-pointer appearance-none pr-10"
            >
              {savedStocks.map((stock) => (
                <option key={stock.ticker} value={stock.ticker}>
                  {stock.ticker} — {stock.name.length > 25 ? `${stock.name.substring(0, 22)}...` : stock.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
          {savedStocks.length > 1 && (
            <button
              onClick={() => onDeleteStock(activeStock.ticker)}
              className="px-3.5 bg-rose-500/10 border border-rose-500/20 active:bg-rose-500/20 hover:bg-rose-500/15 text-rose-400 rounded-xl transition duration-150 flex items-center justify-center cursor-pointer"
              title={`Eliminar projeção de ${activeStock.ticker}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="bg-[#050506]/35 rounded-xl border border-white/5 p-3 flex justify-between items-center text-xs text-slate-400 font-mono">
          <span className="text-[10px] text-slate-500">Cotação Atual ({activeStock.currency}):</span>
          <span className="font-extrabold text-slate-200">
            {activeStock.currency} {activeStock.currentPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Styled vertical stacked list of custom projections - Desktop Only */}
      <div className="hidden lg:block space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {savedStocks.map((stock) => {
          const isActive = stock.ticker === activeStock.ticker;
          return (
            <div
              key={stock.ticker}
              onClick={() => onSelectStock(stock)}
              className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left focus:outline-none ${
                isActive
                  ? "bg-blue-600/[0.07] border-blue-500/50 text-blue-400 shadow-md ring-1 ring-blue-500/20"
                  : "bg-[#0c0c0d]/40 border-white/5 hover:border-white/15 text-slate-300 hover:bg-[#121214]/60"
              }`}
            >
              {/* Ticker Symbol & Short Name Info block */}
              <div className="flex flex-col flex-grow min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black font-mono tracking-wide ${isActive ? "text-blue-400" : "text-white"}`}>
                    {stock.ticker}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium truncate leading-tight mt-0.5">
                  {stock.name}
                </span>
              </div>

              {/* Price & Delete operations block */}
              <div className="flex items-center gap-3 shrink-0 ml-1">
                <div className="text-right font-mono">
                  <span className={`block text-[11px] font-bold ${isActive ? "text-emerald-400" : "text-slate-300"}`}>
                    {stock.currency || "USD"} {stock.currentPrice.toFixed(2)}
                  </span>
                  {stock.isSimulated && (
                    <span className="text-[8px] text-slate-500 block uppercase font-mono tracking-wider font-semibold">
                      Offline
                    </span>
                  )}
                </div>
                
                {savedStocks.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Stop clicking card select events
                      onDeleteStock(stock.ticker);
                    }}
                    title={`Eliminar projeção de ${stock.ticker}`}
                    className="p-1 text-slate-500 hover:text-rose-450 transition hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
