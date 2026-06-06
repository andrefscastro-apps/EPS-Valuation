import { useState } from "react";
import { Sparkles, Brain, ArrowDownCircle, ArrowUpCircle, Check, Play, AlertTriangle, Shield, Star } from "lucide-react";
import { StockProfile } from "../types";

interface AiAnalystProps {
  activeStock: StockProfile;
  onApplyAiMetrics: (aiData: any) => void;
}

export default function AiAnalyst({ activeStock, onApplyAiMetrics }: AiAnalystProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [successApply, setSuccessApply] = useState(false);
  const [useLocal, setUseLocal] = useState(false);
  const [isLocalResponse, setIsLocalResponse] = useState(false);

  const fetchAiAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setSuccessApply(false);
    setIsLocalResponse(false);

    try {
      const response = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: activeStock.ticker,
          currentPrice: activeStock.currentPrice,
          useLocal: useLocal
        })
      });

      if (!response.ok) {
        let serverErrorMessage = "Erro na solicitação. A API do servidor falhou.";
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            serverErrorMessage = errJson.error;
          }
        } catch (_) {}
        throw new Error(serverErrorMessage);
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setAnalysisResult(resJson.data);
        setIsLocalResponse(!!resJson.isLocal);
      } else {
        throw new Error(resJson.error || "Formato de resposta inválido.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
        "Não foi possível obter a análise automatizada. Verifique se a sua chave do Gemini está inserida nos painéis de Secrets."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!analysisResult) return;
    
    // Convert API schema keys to UI props structure
    const appliedMetrics = {
      name: analysisResult.name,
      eps2027: {
        est: Number(analysisResult.eps_2027?.est || 0),
        low: Number(analysisResult.eps_2027?.low || 0),
        high: Number(analysisResult.eps_2027?.high || 0)
      },
      eps2028: {
        est: Number(analysisResult.eps_2028?.est || 0),
        low: Number(analysisResult.eps_2028?.low || 0),
        high: Number(analysisResult.eps_2028?.high || 0)
      },
      eps2029: {
        est: Number(analysisResult.eps_2029?.est || 0),
        low: Number(analysisResult.eps_2029?.low || 0),
        high: Number(analysisResult.eps_2029?.high || 0)
      },
      forwardPE2028_2029: {
        est: Number(analysisResult.forward_pe_2028_2029?.est || 0),
        low: Number(analysisResult.forward_pe_2028_2029?.low || 0),
        high: Number(analysisResult.forward_pe_2028_2029?.high || 0)
      },
      eps2031: {
        est: Number(analysisResult.eps_2031?.est || 0),
        low: Number(analysisResult.eps_2031?.low || 0),
        high: Number(analysisResult.eps_2031?.high || 0)
      },
      forwardPE2031: {
        est: Number(analysisResult.forward_pe_2031?.est || 0),
        low: Number(analysisResult.forward_pe_2031?.low || 0),
        high: Number(analysisResult.forward_pe_2031?.high || 0)
      },
      aiRationale: analysisResult.rationale
    };

    onApplyAiMetrics(appliedMetrics);
    setSuccessApply(true);
    setTimeout(() => setSuccessApply(false), 3000);
  };

  return (
    <div className="bg-bento-card border border-white/10 rounded-2xl p-5 mb-6 text-slate-300 shadow-xl transition-all hover:border-white/15">
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-bold font-mono tracking-wider text-blue-400 uppercase">
            Assistente IA & Projeção
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            {useLocal ? "Análise Local Heurística" : "Consenso Gemini"}
          </h3>
        </div>
        
        <button
          onClick={fetchAiAnalysis}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span>{loading ? "A Analisar..." : useLocal ? "Projeção Local" : "Análise Inteligente"}</span>
        </button>
      </div>

      {/* Select Model Engine (Cloud Gemini vs Offline Local Network) */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 bg-[#0a0a0c]/80 p-1 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => {
            setUseLocal(false);
            setAnalysisResult(null);
            setError(null);
          }}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer duration-150 transition-all ${
            !useLocal
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Modelo Gemini (Nuvem)
        </button>
        <button
          onClick={() => {
            setUseLocal(true);
            setAnalysisResult(null);
            setError(null);
          }}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer duration-150 transition-all ${
            useLocal
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/10"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Rede Neuronal Local (Offline)
        </button>
      </div>

      {loading && (
        <div className="py-6 flex flex-col items-center justify-center text-center">
          <Brain className={`w-10 h-10 animate-bounce mb-3 ${useLocal ? "text-indigo-400" : "text-blue-400"}`} />
          <p className={`text-sm font-semibold ${useLocal ? "text-indigo-300" : "text-blue-300"}`}>
            {useLocal ? "Computando predição heurística na Rede Local..." : "Conectando ao modelo de dados do mercado..."}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {useLocal
              ? `O modelo matemático local está a sintetizar tendências históricas e projetando múltiplos para a ação da ${activeStock.ticker} instantaneamente...`
              : `O Gemini está a analisar estimativas institucionais para buscar projeções de lucros e múltiplos históricos de `}
            {!useLocal && <strong className="font-mono text-emerald-400">{activeStock.ticker}</strong>}
            {!useLocal && "..."}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-xl flex items-start gap-2.5 text-xs text-red-300 mt-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5 text-red-250">Falha ao obter análise</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading && !analysisResult && !error && (
        <p className="text-[11px] text-slate-500 leading-relaxed text-center py-2">
          {useLocal
            ? `Estime agora mesmo os resultados operacionais! Clique em Projeção Local para receber as métricas prontas para ${activeStock.ticker} instantaneamente de forma offline.`
            : `Gostaria de estimativas profissionais de mercado? Clique em Análise Inteligente para obter EPS e múltiplos de `}
          {!useLocal && <strong className="font-mono text-emerald-305">{activeStock.ticker}</strong>}
          {!useLocal && " via IA."}
        </p>
      )}

      {analysisResult && (
        <div className="mt-2 space-y-4">
          <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest">
                Valores Propostos para Projeção (EPS):
              </h4>
              {isLocalResponse && (
                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                  <Brain className="w-2.5 h-2.5" /> Rede Neuronal Local Heurística
                </span>
              )}
            </div>
            
            {/* EPS GRID (4 Columns for 2027, 2028, 2029, 2031) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
              <div className="bg-[#121214] p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase">EPS 2027 (Consenso)</span>
                <span className="font-extrabold text-blue-400 font-mono mt-1 block text-sm">
                  ${analysisResult.eps_2027?.est?.toFixed(2)}
                </span>
                <div className="text-[9px] text-slate-500 font-mono mt-1 border-t border-white/5 pt-1 flex justify-between">
                  <span>Min: ${analysisResult.eps_2027?.low?.toFixed(2)}</span>
                  <span>Max: ${analysisResult.eps_2027?.high?.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-[#121214] p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase">EPS 2028 (Est)</span>
                <span className="font-extrabold text-blue-400 font-mono mt-1 block text-sm">
                  ${analysisResult.eps_2028?.est?.toFixed(2)}
                </span>
                <div className="text-[9px] text-slate-500 font-mono mt-1 border-t border-white/5 pt-1 flex justify-between">
                  <span>Min: ${analysisResult.eps_2028?.low?.toFixed(2)}</span>
                  <span>Max: ${analysisResult.eps_2028?.high?.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#121214] p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase">EPS 2029 (Est)</span>
                <span className="font-extrabold text-blue-400 font-mono mt-1 block text-sm">
                  ${analysisResult.eps_2029?.est?.toFixed(2)}
                </span>
                <div className="text-[9px] text-slate-500 font-mono mt-1 border-t border-white/5 pt-1 flex justify-between">
                  <span>Min: ${analysisResult.eps_2029?.low?.toFixed(2)}</span>
                  <span>Max: ${analysisResult.eps_2029?.high?.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-[#121214] p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase">EPS 2031 (Est)</span>
                <span className="font-extrabold text-blue-400 font-mono mt-1 block text-sm">
                  ${analysisResult.eps_2031?.est?.toFixed(2)}
                </span>
                <div className="text-[9px] text-slate-500 font-mono mt-1 border-t border-white/5 pt-1 flex justify-between">
                  <span>Min: ${analysisResult.eps_2031?.low?.toFixed(2)}</span>
                  <span>Max: ${analysisResult.eps_2031?.high?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-3 mt-5">
              Múltiplos Propostos (Forward P/E) & Crescimento:
            </h4>

            {/* PE MULTIPLES AND GROWTH RATE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-4">
              <div className="bg-[#121214] p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase">PE 2028-2029 (Est)</span>
                <span className="font-extrabold text-indigo-400 font-mono mt-1 block text-sm">
                  {analysisResult.forward_pe_2028_2029?.est?.toFixed(1)}x
                </span>
                <div className="text-[9px] text-slate-500 font-mono mt-1 border-t border-white/5 pt-1 flex justify-between">
                  <span>Min: {analysisResult.forward_pe_2028_2029?.low?.toFixed(1)}x</span>
                  <span>Max: {analysisResult.forward_pe_2028_2029?.high?.toFixed(1)}x</span>
                </div>
              </div>

              <div className="bg-[#121214] p-3 rounded-lg border border-white/5 flex flex-col justify-between">
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase">PE 2031 (Est)</span>
                <span className="font-extrabold text-indigo-400 font-mono mt-1 block text-sm">
                  {analysisResult.forward_pe_2031?.est?.toFixed(1)}x
                </span>
                <div className="text-[9px] text-slate-500 font-mono mt-1 border-t border-white/5 pt-1 flex justify-between">
                  <span>Min: {analysisResult.forward_pe_2031?.low?.toFixed(1)}x</span>
                  <span>Max: {analysisResult.forward_pe_2031?.high?.toFixed(1)}x</span>
                </div>
              </div>

              <div className="bg-[#121214] p-3 rounded-lg border border-white/5 flex flex-col justify-between col-span-1">
                <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase">Receita YoY %</span>
                <span className="font-extrabold text-emerald-400 font-mono mt-1 block text-sm" title={analysisResult.revenue_growth_expected}>
                  {analysisResult.revenue_growth_expected || "N/A"}
                </span>
                <div className="text-[9px] text-slate-500 font-mono mt-1 border-t border-white/5 pt-1">
                  <span>Crescimento por ano</span>
                </div>
              </div>
            </div>
  
            {/* DETAILS AND JUSTIFICATION SECTION */}
            <div className="space-y-3 mt-4">
              <div className="text-[11px] bg-[#121214] p-3.5 rounded-lg border border-white/5 leading-relaxed text-slate-300">
                <span className="font-bold flex items-center gap-1.5 text-blue-400 mb-1.5 text-[8px] tracking-widest uppercase font-mono">
                  <Brain className="w-3 h-3 text-blue-400" /> Tese e Raciocínio (Gemini)
                </span>
                <p className="text-slate-300 font-normal">{analysisResult.rationale}</p>
              </div>

              {/* Bento Grid: Força do Moat e Nota de Valuation 1-10 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {/* Força do Moat */}
                <div className="text-[11px] bg-[#121214] p-3.5 rounded-lg border border-white/5 leading-relaxed text-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold flex items-center gap-1 text-indigo-400 text-[8px] tracking-widest uppercase font-mono">
                      <Shield className="w-3 h-3 text-indigo-400" /> Força do Moat
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                      analysisResult.moat_rating?.toLowerCase().includes("wide")
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : analysisResult.moat_rating?.toLowerCase().includes("narrow")
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-slate-500/10 border-white/10 text-slate-400"
                    }`}>
                      {analysisResult.moat_rating?.toLowerCase().includes("wide") ? "Wide Moat" : analysisResult.moat_rating?.toLowerCase().includes("narrow") ? "Narrow Moat" : "Narrow / None"}
                    </span>
                  </div>
                  <p className="text-slate-400 font-normal leading-relaxed">{analysisResult.moat_rating || "Análise indisponível"}</p>
                </div>

                {/* Nota de Valuation */}
                <div className="text-[11px] bg-[#121214] p-3.5 rounded-lg border border-white/5 leading-relaxed text-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold flex items-center gap-1 text-emerald-400 text-[8px] tracking-widest uppercase font-mono">
                      <Star className="w-3 h-3 text-emerald-400 fill-emerald-400/25" /> Avaliação de Valuation
                    </span>
                    <div className="flex items-center gap-1 bg-[#0a0a0b] px-1.5 py-0.5 rounded border border-white/10">
                      <span className="text-[10px] font-black font-mono text-emerald-400">
                        {analysisResult.valuation_score?.score || 0}
                      </span>
                      <span className="text-[8px] font-mono text-slate-550">/ 10</span>
                    </div>
                  </div>
                  <p className="text-slate-400 font-normal leading-relaxed">{analysisResult.valuation_score?.rating_justification || "Justificativa de valuation indisponível"}</p>
                </div>
              </div>

              <div className="text-[11px] bg-[#121214]/60 p-3.5 rounded-lg border border-white/5 leading-relaxed text-slate-300">
                <span className="font-bold flex items-center gap-1.5 text-blue-400 mb-1.5 text-[8px] tracking-widest uppercase font-mono">
                  Justificação & Fonte dos Pontos de EPS
                </span>
                <p className="text-slate-400 font-normal">{analysisResult.eps_justification}</p>
              </div>

              <div className="text-[11px] bg-[#121214]/40 p-3.5 rounded-lg border border-white/5 leading-relaxed text-slate-300">
                <span className="font-bold flex items-center gap-1.5 text-blue-400 mb-1.5 text-[8px] tracking-widest uppercase font-mono">
                  Justificação & Fonte dos Múltiplos Forward P/E
                </span>
                <p className="text-slate-400 font-normal">{analysisResult.pe_justification}</p>
              </div>

              <div className="text-[11px] bg-[#121214]/40 p-3.5 rounded-lg border border-white/5 leading-relaxed text-slate-300">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1.5 text-[8px] tracking-widest uppercase font-mono">
                  Crescimento Estimado de Receita (Revenue Growth Rate)
                </span>
                <p className="text-slate-400 font-normal">{analysisResult.revenue_growth_expected}</p>
              </div>
            </div>
  
            <div className="flex justify-end pt-4">
              <button
                onClick={handleApply}
                disabled={successApply}
                className={`text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                  successApply
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 hover:bg-blue-550 text-white"
                }`}
              >
                {successApply ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Aplicado ao Modelo!</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Aplicar Projeções</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
