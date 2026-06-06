import { useState, useEffect } from "react";
import { StockProfile, SOFI_DEFAULT_PROFILE } from "./types";
import StockSelector from "./components/StockSelector";
import StockCard from "./components/StockCard";
import AiAnalyst from "./components/AiAnalyst";
import { TrendingUp, FileSpreadsheet, LayoutGrid, Award, BookOpen, Layers } from "lucide-react";

// Helper to safely migrate or normalize saved profile properties in case of client cached schema mismatches
function migrateProfile(s: any): StockProfile {
  const eps2027 = s.eps2027 || s.eps2026 || { est: (s.currentPrice || 15) / 25, low: (s.currentPrice || 15) / 28, high: (s.currentPrice || 15) / 22 };
  const eps2028 = s.eps2028 || { est: eps2027.est * 1.15, low: eps2027.low * 1.12, high: eps2027.high * 1.18 };
  const eps2029 = s.eps2029 || (s.eps2028 ? { est: s.eps2028.est * 1.15, low: s.eps2028.low * 1.12, high: s.eps2028.high * 1.18 } : null) || { est: eps2028.est * 1.15, low: eps2028.low * 1.12, high: eps2028.high * 1.18 };
  
  const forwardPE2028_2029 = s.forwardPE2028_2029 || s.forwardPE2027_2028 || { est: 22.0, low: 15.0, high: 28.0 };
  const eps2031 = s.eps2031 || s.eps2030 || { est: eps2029.est * 1.30, low: eps2029.low * 1.25, high: eps2029.high * 1.35 };
  const forwardPE2031 = s.forwardPE2031 || s.forwardPE2030 || { est: 18.0, low: 12.0, high: 22.0 };

  return {
    id: s.id || s.ticker || "UNKNOWN",
    ticker: s.ticker || "UNKNOWN",
    name: s.name || `${s.ticker || "Unknown"} Corp`,
    currentPrice: s.currentPrice || 15.0,
    currency: s.currency || "USD",
    lastFetched: s.lastFetched || Date.now(),
    eps2027: {
      est: Number(eps2027.est ?? 0),
      low: Number(eps2027.low ?? 0),
      high: Number(eps2027.high ?? 0)
    },
    eps2028: {
      est: Number(eps2028.est ?? 0),
      low: Number(eps2028.low ?? 0),
      high: Number(eps2028.high ?? 0)
    },
    eps2029: {
      est: Number(eps2029.est ?? 0),
      low: Number(eps2029.low ?? 0),
      high: Number(eps2029.high ?? 0)
    },
    forwardPE2028_2029: {
      est: Number(forwardPE2028_2029.est ?? 0),
      low: Number(forwardPE2028_2029.low ?? 0),
      high: Number(forwardPE2028_2029.high ?? 0)
    },
    eps2031: {
      est: Number(eps2031.est ?? 0),
      low: Number(eps2031.low ?? 0),
      high: Number(eps2031.high ?? 0)
    },
    forwardPE2031: {
      est: Number(forwardPE2031.est ?? 0),
      low: Number(forwardPE2031.low ?? 0),
      high: Number(forwardPE2031.high ?? 0)
    },
    notes: s.notes || "",
    aiRationale: s.aiRationale || "",
    isSimulated: s.isSimulated || false
  };
}

export default function App() {
  const [savedStocks, setSavedStocks] = useState<StockProfile[]>([]);
  const [activeTicker, setActiveTicker] = useState("SOFI");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize and load saved stock profiles from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stock_projection_profiles");
      if (stored) {
        const parsed = JSON.parse(stored) as any[];
        if (parsed && parsed.length > 0) {
          const migrated = parsed.map(s => migrateProfile(s));
          setSavedStocks(migrated);
          // Set first stock as active
          setActiveTicker(migrated[0].ticker);
          return;
        }
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e);
    }
    
    // Fallback to loaded defaults
    setSavedStocks([SOFI_DEFAULT_PROFILE]);
    setActiveTicker(SOFI_DEFAULT_PROFILE.ticker);
  }, []);

  // Save changes to LocalStorage whenever stock configurations change
  useEffect(() => {
    if (savedStocks.length > 0) {
      localStorage.setItem("stock_projection_profiles", JSON.stringify(savedStocks));
    }
  }, [savedStocks]);

  // Find the currently active stock profile
  const activeStock = savedStocks.find((s) => s.ticker === activeTicker) || savedStocks[0] || SOFI_DEFAULT_PROFILE;

  const handleSelectStock = (stock: StockProfile) => {
    setActiveTicker(stock.ticker);
  };

  const handleAddStock = (newStock: StockProfile) => {
    setSavedStocks((prev) => {
      // Avoid duplicate ticker insertions
      const filtrado = prev.filter((s) => s.ticker !== newStock.ticker);
      return [newStock, ...filtrado];
    });
    setActiveTicker(newStock.ticker);
  };

  const handleDeleteStock = (ticker: string) => {
    if (savedStocks.length <= 1) return; // Prevent deleting the last element
    
    setSavedStocks((prev) => {
      const updated = prev.filter((s) => s.ticker !== ticker);
      if (ticker === activeTicker) {
        setActiveTicker(updated[0].ticker);
      }
      return updated;
    });
  };

  const handleUpdateStock = (updatedStock: StockProfile) => {
    setSavedStocks((prev) =>
      prev.map((s) => (s.ticker === updatedStock.ticker ? updatedStock : s))
    );
  };

  const handleApplyAiMetrics = (aiData: any) => {
    setSavedStocks((prev) =>
      prev.map((s) => {
        if (s.ticker === activeStock.ticker) {
          return {
            ...s,
            name: aiData.name || s.name,
            eps2027: aiData.eps2027,
            eps2028: aiData.eps2028,
            eps2029: aiData.eps2029,
            forwardPE2028_2029: aiData.forwardPE2028_2029,
            eps2031: aiData.eps2031,
            forwardPE2031: aiData.forwardPE2031,
            aiRationale: aiData.aiRationale,
            lastFetched: Date.now()
          };
        }
        return s;
      })
    );
  };

  const handleRefreshActivePrice = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/stock/${activeStock.ticker}`);
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      
      if (data.success) {
        setSavedStocks((prev) =>
          prev.map((s) => {
            if (s.ticker === activeStock.ticker) {
              return {
                ...s,
                currentPrice: data.price,
                name: data.name || s.name,
                currency: data.currency || s.currency,
                lastFetched: Date.now(),
                isSimulated: data.simulated || false
              };
            }
            return s;
          })
        );
      }
    } catch (err) {
      console.error("Failed refreshing active price:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper preset to load standard popular stocks for easy testing of calculations
  const loadPresetTicker = async (symbol: string) => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/stock/${symbol}`);
      if (!response.ok) throw new Error("API preset fetch failed");
      const data = await response.json();
      
      if (data.success) {
        const basePrice = data.price;
        const scaleVal = basePrice / 25;
        const initial2027 = Number(scaleVal.toFixed(2));
        
        const presetProfile: StockProfile = {
          id: symbol,
          ticker: symbol,
          name: data.name || symbol,
          currentPrice: basePrice,
          currency: data.currency || "USD",
          lastFetched: Date.now(),
          eps2027: {
            est: initial2027,
            low: Number((initial2027 * 0.88).toFixed(2)),
            high: Number((initial2027 * 1.12).toFixed(2))
          },
          eps2028: {
            est: Number((initial2027 * 1.15).toFixed(2)),
            low: Number((initial2027 * 0.98).toFixed(2)),
            high: Number((initial2027 * 1.25).toFixed(2))
          },
          eps2029: {
            est: Number((initial2027 * 1.32).toFixed(2)),
            low: Number((initial2027 * 1.10).toFixed(2)),
            high: Number((initial2027 * 1.48).toFixed(2))
          },
          forwardPE2028_2029: {
            est: symbol === "NVDA" ? 28.0 : symbol === "AAPL" ? 24.0 : 20.0,
            low: symbol === "NVDA" ? 20.0 : symbol === "AAPL" ? 18.0 : 14.5,
            high: symbol === "NVDA" ? 35.0 : symbol === "AAPL" ? 30.0 : 26.0
          },
          eps2031: {
            est: Number((initial2027 * 1.75).toFixed(2)),
            low: Number((initial2027 * 1.35).toFixed(2)),
            high: Number((initial2027 * 2.10).toFixed(2))
          },
          forwardPE2031: {
            est: symbol === "NVDA" ? 22.0 : symbol === "AAPL" ? 20.0 : 16.0,
            low: symbol === "NVDA" ? 14.0 : symbol === "AAPL" ? 13.0 : 10.0,
            high: symbol === "NVDA" ? 28.0 : symbol === "AAPL" ? 25.0 : 22.0
          },
          notes: `Modelo financeiro padrão criado para ${symbol}. Utilize a IA para refinar estas premissas.`,
          isSimulated: data.simulated || false
        };

        handleAddStock(presetProfile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bento-bg text-slate-300 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-300">
      
      {/* Top Bento Navigation Bar */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-600/10">
            <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-extrabold tracking-tight text-base leading-none">VALUATION<span className="text-blue-500 font-bold">PRO</span></span>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5 tracking-wider uppercase">
              MODELO DE ESTIMATIVAS QUANTITATIVAS
            </p>
          </div>
        </div>

        {/* Real-time market status badge & version */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 bg-slate-900/60 rounded-full px-4 py-1.5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Market Open: Real-time</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">Modelo Ativo</p>
              <p className="text-xs text-white">v3.5 Neural-Arb</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blue-500/15">
              VP
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Pane */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* Side control sidebar: Stock selection and AI recommendations */}
          <div className="xl:col-span-1 space-y-6">
            <StockSelector
              savedStocks={savedStocks}
              activeStock={activeStock}
              onSelectStock={handleSelectStock}
              onAddStock={handleAddStock}
              onDeleteStock={handleDeleteStock}
              onRefreshActivePrice={handleRefreshActivePrice}
              isRefreshing={isRefreshing}
            />

            <AiAnalyst
              activeStock={activeStock}
              onApplyAiMetrics={handleApplyAiMetrics}
            />

            {/* Quick Informational Guide shaped as a sleek Bento grid item */}
            <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 text-xs text-slate-400 space-y-3.5 shadow-xl transition hover:border-white/15">
              <span className="font-extrabold text-white block uppercase font-mono tracking-wider text-[10px] text-blue-450">Manual do Investidor:</span>
              <p className="leading-relaxed">
                Este software roda as fórmulas financeiras do seu modelo original de estimativa 2027, 2028, 2029 e 2031 baseadas nos múltiplos de preço-lucro perspectivos (Forward P/E) aplicados aos ganhos por ação (EPS).
              </p>
              <div className="border-t border-white/5 pt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold font-mono">1.</span>
                  <span><strong className="text-slate-200">P/E e CAGR</strong> atualizam dinamicamente ao mover o controle e preencher dados de EPS.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold font-mono">2.</span>
                  <span>Selecione os <strong className="text-slate-200">Anos de Projeção CAGR</strong> (3 a 10 anos) na última tabela para calcular o retorno anualizado ideal.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Large Tab Pane: Main Spreadsheet Grid Dashboard */}
          <div className="xl:col-span-2">
            {activeStock && (
              <StockCard
                stock={activeStock}
                onUpdateStock={handleUpdateStock}
              />
            )}
          </div>

        </div>

      </main>

      {/* Bottom Micro-Bar / Footer (Bento Style) */}
      <footer className="h-10 bg-black border-t border-white/5 flex items-center justify-between px-6 text-[10px] font-mono text-slate-500 mt-auto shrink-0 select-none">
        <div className="flex gap-6 uppercase tracking-wider hidden sm:flex">
          <span>S&P 500: 5,123.41 <span className="text-emerald-500 font-extrabold ml-1">+0.12%</span></span>
          <span className="opacity-40">|</span>
          <span>NASDAQ: 16,274.95 <span className="text-emerald-500 font-extrabold ml-1">+0.45%</span></span>
        </div>
        <div className="flex justify-between w-full sm:w-auto gap-6">
          <span>LATÊNCIA: 12ms</span>
          <span className="text-emerald-400 font-bold">API STATUS: CONNECTED</span>
        </div>
      </footer>

    </div>
  );
}
