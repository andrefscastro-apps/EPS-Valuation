import { useState } from "react";
import { StockProfile } from "../types";
import { calculateStockMetrics, formatCurrency, formatPercentage } from "../utils";
import { HelpCircle, Edit3, TrendingUp, Sparkles, RefreshCw, Layers } from "lucide-react";

interface StockCardProps {
  stock: StockProfile;
  onUpdateStock: (updated: StockProfile) => void;
}

export default function StockCard({ stock, onUpdateStock }: StockCardProps) {
  const [projectionYears, setProjectionYears] = useState(5);
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; label: string; est: number; low: number; high: number } | null>(null);
  const metrics = calculateStockMetrics(stock, projectionYears);

  // Helper to handle nested value updates safely
  const updateNestedVal = (
    section: "eps2027" | "eps2028" | "eps2029" | "forwardPE2028_2029" | "eps2031" | "forwardPE2031" | "currentPrice",
    tier: "est" | "low" | "high" | null,
    valueStr: string
  ) => {
    const val = parseFloat(valueStr);
    const numVal = isNaN(val) ? 0 : val;
    
    // Create deep copy
    const copy = { ...stock };
    
    if (section === "currentPrice") {
      copy.currentPrice = numVal;
    } else if (tier) {
      copy[section] = {
        ...copy[section],
        [tier]: numVal
      };

      // Bidirectional sync: if updating eps2027.est, let's sync Values Atuais 2027 Earnings
      // If updating eps2028.est, let's sync Values Atuais 2028 Earnings
    }

    onUpdateStock(copy);
  };

  // Helper to update root values directly
  const updateRootVal = (key: keyof StockProfile, value: any) => {
    const copy = { ...stock, [key]: value };
    onUpdateStock(copy);
  };

  // Color coding matching user sheet
  const getGainLossStyle = (val: number) => {
    if (val > 0) return "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20";
    if (val < 0) return "bg-rose-500/15 text-rose-400 font-bold border border-rose-500/20";
    return "bg-slate-800 text-slate-300 border border-slate-700/50";
  };

  // Render a responsive, elegant SVG line chart showing forecasts
  const renderSVGChart = () => {
    const currentPrice = stock.currentPrice;
    
    // Coordinates mapping
    // Years: 2027 (current consens.), 2028 (1y target), 2029 (2y target), 2031 (long term)
    const points = {
      low: [currentPrice, metrics.sharePrice2027.low, metrics.sharePrice2028.low, metrics.sharePrice2031.low],
      est: [currentPrice, metrics.sharePrice2027.est, metrics.sharePrice2028.est, metrics.sharePrice2031.est],
      high: [currentPrice, metrics.sharePrice2027.high, metrics.sharePrice2028.high, metrics.sharePrice2031.high],
    };

    const maxVal = Math.max(
      ...points.low, ...points.est, ...points.high, 20
    ) * 1.15;
    
    const minVal = Math.max(0, Math.min(
      ...points.low, ...points.est, ...points.high
    ) * 0.85);

    const chartHeight = 180;
    const chartWidth = 500;
    const padding = 25;

    // Scale helpers
    const getX = (index: number) => padding + (index * (chartWidth - 2 * padding)) / 3;
    const getY = (val: number) => {
      const scale = (chartHeight - 2 * padding) / (maxVal - minVal || 1);
      return chartHeight - padding - (val - minVal) * scale;
    };

    const lowPath = points.low.map((val, i) => `${getX(i)},${getY(val)}`).join(" ");
    const estPath = points.est.map((val, i) => `${getX(i)},${getY(val)}`).join(" ");
    const highPath = points.high.map((val, i) => `${getX(i)},${getY(val)}`).join(" ");

    return (
      <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 mb-6 text-slate-300">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 border-b border-white/5 pb-2.5">
            <h4 className="text-xs font-black text-white font-mono uppercase tracking-wider">Curva de Tendência de Projeção</h4>
            <p className="text-[11px] text-slate-400 font-medium">Dinâmica de preço de destino baseado nos cenários Estimado, Pessimista (Low) e Otimista (High)</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-500 inline-block rounded-full"></span> Pessimista (Low)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded-full"></span> Esperado (Est.)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded-full"></span> Otimista (High)</span>
          </div>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
            {/* Grid Lines */}
            {[0, 1, 2, 3].map((i) => {
              const yVal = minVal + (i * (maxVal - minVal)) / 3;
              const yPos = getY(yVal);
              return (
                <g key={i} className="opacity-10">
                  <line x1={padding} y1={yPos} x2={chartWidth - padding} y2={yPos} stroke="#ffffff" strokeWidth="1" strokeDasharray="3,3" />
                  <text x={chartWidth - padding + 5} y={yPos + 3} fill="#ffffff" className="text-[9px] font-mono" textAnchor="start">
                    ${yVal.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Vertical Lines & Labels */}
            {["Atual", "Projeção 2028", "Projeção 2029", "Projeção 2031"].map((label, i) => {
              const xPos = getX(i);
              return (
                <g key={i} className="opacity-80">
                  <line x1={xPos} y1={padding} x2={xPos} y2={chartHeight - padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <text x={xPos} y={chartHeight - padding + 15} fill="#94a3b8" className="text-[9px] font-bold font-mono" textAnchor="middle">
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Price Paths */}
            <polyline fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" points={lowPath} />
            <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={estPath} />
            <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2,2" points={highPath} />

            {/* Dot markers */}
            {points.est.map((val, i) => {
              const isHovered = hoveredPoint?.index === i;
              const labels = ["Atual", "Projeção 2028", "Projeção 2029", "Projeção 2031"];
              return (
                <g 
                  key={i} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({ index: i, label: labels[i], est: val, low: points.low[i], high: points.high[i] })}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Larger transparent hit area for easier hover targets */}
                  <circle cx={getX(i)} cy={getY(val)} r="14" fill="transparent" />
                  
                  <circle cx={getX(i)} cy={getY(val)} r={isHovered ? "6" : "4"} fill="#10b981" stroke="#0a0a0b" strokeWidth={isHovered ? 2 : 1.5} className="transition-all duration-150" />
                  <circle cx={getX(i)} cy={getY(points.low[i])} r={isHovered ? "5" : "3"} fill="#ef4444" stroke="#0a0a0b" strokeWidth={isHovered ? 1.5 : 1} className="transition-all duration-150" />
                  <circle cx={getX(i)} cy={getY(points.high[i])} r={isHovered ? "5" : "3"} fill="#3b82f6" stroke="#0a0a0b" strokeWidth={isHovered ? 1.5 : 1} className="transition-all duration-150" />
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip HTML Overlay */}
          {hoveredPoint && (
            <div 
              className="absolute bg-slate-950/95 border border-white/10 rounded-xl p-3 shadow-2xl pointer-events-none z-10 text-[10px] font-mono select-none transition-all duration-150 flex flex-col gap-1 w-36 blur-none backdrop-blur-md"
              style={{
                left: `${(getX(hoveredPoint.index) / chartWidth) * 100}%`,
                top: `${(Math.min(getY(hoveredPoint.est), getY(hoveredPoint.low), getY(hoveredPoint.high)) / chartHeight) * 100}%`,
                transform: "translate(-50%, -115%)"
              }}
            >
              <div className="text-center font-bold text-slate-100 border-b border-white/5 pb-1 mb-1">
                {hoveredPoint.label}
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>Esperado:</span>
                <span>${hoveredPoint.est.toFixed(2)}</span>
              </div>
              {hoveredPoint.index > 0 && (
                <>
                  <div className="flex justify-between items-center text-rose-450 font-bold">
                    <span>Low (Bear):</span>
                    <span>${hoveredPoint.low.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-400 font-bold">
                    <span>High (Bull):</span>
                    <span>${hoveredPoint.high.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SEÇÃO VALORES ATUAIS */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-white/15">
        {/* Dark Premium Bento Header */}
        <div className="bg-[#121214] border-b border-white/10 px-5 py-4 tracking-wide text-xs uppercase font-mono flex justify-between items-center select-none">
          <span className="flex items-center gap-2 font-extrabold text-blue-400">
            <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />
            Valores Atuais (Grelha de Cotação)
          </span>
          <span className="text-[10px] font-medium text-slate-500 normal-case">Clique em qualquer célula para alterar valores</span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                <th className="pb-3 pl-2">Ação</th>
                <th className="pb-3 text-center">2027 Earnings (Est.)</th>
                <th className="pb-3 text-center">2028 Earnings (Est.)</th>
                <th className="pb-3 text-center">Share Price (Preço Atual)</th>
                <th className="pb-3 text-center">P/E Atual (Preço / EPS 27)</th>
                <th className="pb-3 text-center pr-2">Forward P/E (Preço / EPS 28)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-white/[0.02] transition text-sm">
                <td className="py-4 pl-2 font-black text-white tracking-wide font-mono flex flex-col">
                  <span>{stock.ticker}</span>
                  <span className="text-[10px] font-semibold text-slate-500 truncate max-w-40">{stock.name}</span>
                </td>

                {/* 2027 Earnings Current */}
                <td className="py-4 text-center">
                  <div className="inline-flex items-center justify-center font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-white/10 focus-within:border-blue-500 transition">
                    <span className="text-slate-600 mr-0.5">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-14 bg-transparent outline-none text-center text-white focus:outline-none"
                      value={stock.eps2027.est}
                      onChange={(e) => updateNestedVal("eps2027", "est", e.target.value)}
                    />
                  </div>
                </td>

                {/* 2028 Earnings Current */}
                <td className="py-4 text-center">
                  <div className="inline-flex items-center justify-center font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-white/10 focus-within:border-blue-500 transition">
                    <span className="text-slate-600 mr-0.5">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-14 bg-transparent outline-none text-center text-white focus:outline-none"
                      value={stock.eps2028.est}
                      onChange={(e) => updateNestedVal("eps2028", "est", e.target.value)}
                    />
                  </div>
                </td>

                {/* Current Share price */}
                <td className="py-4 text-center">
                  <div className="inline-flex items-center justify-center font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-white/10 focus-within:border-emerald-500 transition ring-2 ring-emerald-500/10">
                    <span className="text-emerald-500 mr-0.5">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 bg-transparent outline-none text-center text-emerald-400 font-bold focus:outline-none"
                      value={stock.currentPrice}
                      onChange={(e) => updateNestedVal("currentPrice", null, e.target.value)}
                    />
                  </div>
                </td>

                {/* Dynamic Ratios */}
                <td className="py-4 text-center font-mono text-white text-xs font-bold">
                  {metrics.peCurrent.toFixed(2)}x
                </td>

                <td className="py-4 text-center pr-2 font-mono text-blue-400 text-xs font-bold">
                  {metrics.forwardPeCurrent.toFixed(2)}x
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

               {/* 2. SEÇÃO PROJEÇÕES: EARNINGS PER SHARE */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-white/15">
        {/* Dark Premium Bento Header */}
        <div className="bg-[#121214] border-b border-white/10 px-5 py-4 tracking-wide text-xs uppercase font-mono flex items-center gap-2 select-none font-bold text-white">
          <Layers className="w-4 h-4 text-blue-450" />
          <span>Projeções - Earnings Per Share (EPS & Múltiplos)</span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                <th className="pb-3 pl-2 w-28">Cenário</th>
                <th className="pb-3 text-center">2027 Earnings (cons.)</th>
                <th className="pb-3 text-center bg-white/[0.01] rounded-t-lg">2028 Earnings (est.)</th>
                <th className="pb-3 text-center bg-white/[0.01]">YoY Growth Rate</th>
                <th className="pb-3 text-center bg-white/[0.01] text-emerald-450 font-semibold rounded-t-lg">Share Price 2027 (Target)</th>
                <th className="pb-3 text-center bg-white/[0.02] rounded-t-lg">2029 Earnings (est.)</th>
                <th className="pb-3 text-center bg-white/[0.02]">YoY Growth Rate</th>
                <th className="pb-3 text-center bg-white/[0.02] text-blue-450 font-semibold rounded-t-lg">Share Price 2028 (Target)</th>
                <th className="pb-3 text-center pr-2 text-blue-400 font-bold">Forward PE Multiple</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: EST. (Expected Scenario) */}
              <tr className="hover:bg-white/[0.01] transition text-xs border-b border-white/5">
                <td className="py-3.5 pl-2 font-bold text-blue-400 bg-blue-500/5 border-l-4 border-blue-550">
                  Est. Consenso
                </td>
                {/* 2027 EPS */}
                <td className="py-3.5 text-center">
                  <input
                    type="number"
                    step="0.01"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-blue-500 focus:outline-none transition-all"
                    value={stock.eps2027.est}
                    onChange={(e) => updateNestedVal("eps2027", "est", e.target.value)}
                  />
                </td>
                {/* 2028 EPS */}
                <td className="py-3.5 text-center bg-white/[0.01]">
                  <input
                    type="number"
                    step="0.01"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-blue-500 focus:outline-none transition-all"
                    value={stock.eps2028.est}
                    onChange={(e) => updateNestedVal("eps2028", "est", e.target.value)}
                  />
                </td>
                <td className="py-3.5 text-center bg-white/[0.01] font-mono text-slate-400 font-bold select-none">
                  {formatPercentage(metrics.growthRate2028.est)}
                </td>
                <td className="py-3.5 text-center bg-white/[0.01] font-mono text-emerald-400 font-extrabold select-none">
                  {formatCurrency(metrics.sharePrice2027.est, stock.currency)}
                </td>
                {/* 2029 EPS */}
                <td className="py-3.5 text-center bg-white/[0.02]">
                  <input
                    type="number"
                    step="0.01"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-blue-500 focus:outline-none transition-all"
                    value={stock.eps2029.est}
                    onChange={(e) => updateNestedVal("eps2029", "est", e.target.value)}
                  />
                </td>
                <td className="py-3.5 text-center bg-white/[0.02] font-mono text-slate-400 font-bold select-none">
                  {formatPercentage(metrics.growthRate2029.est)}
                </td>
                <td className="py-3.5 text-center bg-white/[0.02] font-mono text-blue-400 font-extrabold select-none">
                  {formatCurrency(metrics.sharePrice2028.est, stock.currency)}
                </td>
                {/* Forward PE */}
                <td className="py-3.5 text-center pr-2">
                  <input
                    type="number"
                    step="0.5"
                    className="w-14 bg-[#0a0a0b] text-blue-400 font-mono rounded border border-white/10 p-1 text-center font-black focus:border-blue-550 focus:outline-none transition-all"
                    value={stock.forwardPE2028_2029.est}
                    onChange={(e) => updateNestedVal("forwardPE2028_2029", "est", e.target.value)}
                  />
                </td>
              </tr>

              {/* Row 2: LOW (Bear/Conservative Scenario) */}
              <tr className="hover:bg-white/[0.01] transition text-xs border-b border-white/5">
                <td className="py-3.5 pl-2 font-bold text-rose-455 bg-rose-500/5 border-l-4 border-rose-550">
                  Low (Bear)
                </td>
                {/* 2027 EPS */}
                <td className="py-3.5 text-center">
                  <input
                    type="number"
                    step="0.01"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-rose-500 focus:outline-none transition-all"
                    value={stock.eps2027.low}
                    onChange={(e) => updateNestedVal("eps2027", "low", e.target.value)}
                  />
                </td>
                {/* 2028 EPS */}
                <td className="py-3.5 text-center bg-white/[0.01]">
                  <input
                    type="number"
                    step="0.01"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-rose-500 focus:outline-none transition-all"
                    value={stock.eps2028.low}
                    onChange={(e) => updateNestedVal("eps2028", "low", e.target.value)}
                  />
                </td>
                <td className="py-3.5 text-center bg-white/[0.01] font-mono text-slate-400 font-bold select-none">
                  {formatPercentage(metrics.growthRate2028.low)}
                </td>
                <td className="py-3.5 text-center bg-white/[0.01] font-mono text-emerald-400 font-extrabold select-none">
                  {formatCurrency(metrics.sharePrice2027.low, stock.currency)}
                </td>
                {/* 2029 EPS */}
                <td className="py-3.5 text-center bg-white/[0.02]">
                  <input
                    type="number"
                    step="0.01"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-rose-500 focus:outline-none transition-all"
                    value={stock.eps2029.low}
                    onChange={(e) => updateNestedVal("eps2029", "low", e.target.value)}
                  />
                </td>
                <td className="py-3.5 text-center bg-white/[0.02] font-mono text-slate-400 font-bold select-none">
                  {formatPercentage(metrics.growthRate2029.low)}
                </td>
                <td className="py-3.5 text-center bg-white/[0.02] font-mono text-blue-400 font-extrabold select-none">
                  {formatCurrency(metrics.sharePrice2028.low, stock.currency)}
                </td>
                {/* Forward PE */}
                <td className="py-3.5 text-center pr-2">
                  <input
                    type="number"
                    step="0.5"
                    className="w-14 bg-[#0a0a0b] text-blue-455 font-mono rounded border border-white/10 p-1 text-center font-black focus:border-rose-550 focus:outline-none transition-all"
                    value={stock.forwardPE2028_2029.low}
                    onChange={(e) => updateNestedVal("forwardPE2028_2029", "low", e.target.value)}
                  />
                </td>
              </tr>

              {/* Row 3: HIGH (Bull/Optimistic Scenario) */}
              <tr className="hover:bg-white/[0.01] transition text-xs">
                <td className="py-3.5 pl-2 font-bold text-emerald-400 bg-emerald-500/5 border-l-4 border-emerald-555">
                  High (Bull)
                </td>
                {/* 2027 EPS */}
                <td className="py-3.5 text-center">
                  <input
                    type="number"
                    step="0.01"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-emerald-550 focus:outline-none transition-all"
                    value={stock.eps2027.high}
                    onChange={(e) => updateNestedVal("eps2027", "high", e.target.value)}
                  />
                </td>
                {/* 2028 EPS */}
                <td className="py-3.5 text-center bg-white/[0.01]">
                  <input
                    type="number"
                    step="0.01"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-emerald-550 focus:outline-none transition-all"
                    value={stock.eps2028.high}
                    onChange={(e) => updateNestedVal("eps2028", "high", e.target.value)}
                  />
                </td>
                <td className="py-3.5 text-center bg-white/[0.01] font-mono text-slate-400 font-bold select-none">
                  {formatPercentage(metrics.growthRate2028.high)}
                </td>
                <td className="py-3.5 text-center bg-white/[0.01] font-mono text-emerald-400 font-extrabold select-none">
                  {formatCurrency(metrics.sharePrice2027.high, stock.currency)}
                </td>
                {/* 2029 EPS */}
                <td className="py-3.5 text-center bg-white/[0.02]">
                  <input
                    type="number"
                    step="0.01"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-emerald-555 focus:outline-none transition-all"
                    value={stock.eps2029.high}
                    onChange={(e) => updateNestedVal("eps2029", "high", e.target.value)}
                  />
                </td>
                <td className="py-3.5 text-center bg-white/[0.02] font-mono text-slate-400 font-bold select-none">
                  {formatPercentage(metrics.growthRate2029.high)}
                </td>
                <td className="py-3.5 text-center bg-white/[0.02] font-mono text-blue-400 font-extrabold select-none">
                  {formatCurrency(metrics.sharePrice2028.high, stock.currency)}
                </td>
                {/* Forward PE */}
                <td className="py-3.5 text-center pr-2">
                  <input
                    type="number"
                    step="0.5"
                    className="w-14 bg-[#0a0a0b] text-blue-400 font-mono rounded border border-white/10 p-1 text-center font-black focus:border-emerald-555 focus:outline-none transition-all"
                    value={stock.forwardPE2028_2029.high}
                    onChange={(e) => updateNestedVal("forwardPE2028_2029", "high", e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


      {/* 3. SEÇÕES ESTIMATIVAS 2027 E 2028 (Side-by-Side as in the layout sheet) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ESTIMATIVA 2028 BLOCK */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-white/15">
          <div className="bg-[#121214] border-b border-white/10 text-white font-mono font-bold px-5 py-4 tracking-wide text-xs uppercase flex justify-between items-center select-none">
            <span className="text-blue-400 font-extrabold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Estimativa 2028
            </span>
            <span className="text-[10px] font-medium text-slate-500 normal-case">YoY Ganho/Perda</span>
          </div>

          <div className="p-4 overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse min-w-[360px] md:min-w-0">
              <thead>
                <tr className="border-b border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
                  <th className="pb-3 pl-1 w-[30%]">Cenário</th>
                  <th className="pb-3 text-center w-[23%]">Retorno %</th>
                  <th className="pb-3 text-center w-[23%]">Preço Alvo</th>
                  <th className="pb-3 text-right pr-2 w-[24%]">Ganho/Perda Absoluto</th>
                </tr>
              </thead>
              <tbody>
                {/* Est. Row */}
                <tr className="border-b border-white/5 text-[11px] md:text-xs hover:bg-[#1a1a1f]/30 transition-all">
                  <td className="py-4 pl-1 font-bold text-slate-300">Estimativa Base</td>
                  <td className={`py-4 text-center font-mono font-bold text-[11px] md:text-xs text-blue-400`}>
                    {formatPercentage(metrics.return2028.est, true)}
                  </td>
                  <td className="py-4 text-center font-mono text-white font-bold text-[11px] md:text-xs">
                    {formatCurrency(metrics.sharePrice2027.est, stock.currency)}
                  </td>
                  <td className={`py-4 text-right pr-2 font-mono rounded-lg text-[11px] md:text-xs ${getGainLossStyle(metrics.gains2028.est)}`}>
                    {formatCurrency(metrics.gains2028.est, stock.currency)}
                  </td>
                </tr>

                {/* Low / Downside Row */}
                <tr className="border-b border-white/5 text-[11px] md:text-xs hover:bg-[#1a1a1f]/30 transition-all">
                  <td className="py-4 pl-1 font-bold text-rose-400">Downside 2028</td>
                  <td className={`py-4 text-center font-mono font-bold text-[11px] md:text-xs text-rose-400`}>
                    {formatPercentage(metrics.return2028.low, true)}
                  </td>
                  <td className="py-4 text-center font-mono text-white font-bold text-[11px] md:text-xs">
                    {formatCurrency(metrics.sharePrice2027.low, stock.currency)}
                  </td>
                  <td className={`py-4 text-right pr-2 font-mono rounded-lg text-[11px] md:text-xs ${getGainLossStyle(metrics.gains2028.low)}`}>
                    {formatCurrency(metrics.gains2028.low, stock.currency)}
                  </td>
                </tr>

                {/* High / Upside Row */}
                <tr className="text-[11px] md:text-xs hover:bg-[#1a1a1f]/30 transition-all">
                  <td className="py-4 pl-1 font-bold text-emerald-400">Upside 2028</td>
                  <td className={`py-4 text-center font-mono font-bold text-[11px] md:text-xs text-emerald-400`}>
                    {formatPercentage(metrics.return2028.high, true)}
                  </td>
                  <td className="py-4 text-center font-mono text-white font-bold text-[11px] md:text-xs">
                    {formatCurrency(metrics.sharePrice2027.high, stock.currency)}
                  </td>
                  <td className={`py-4 text-right pr-2 font-mono rounded-lg text-[11px] md:text-xs ${getGainLossStyle(metrics.gains2028.high)}`}>
                    {formatCurrency(metrics.gains2028.high, stock.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ESTIMATIVA 2029 BLOCK */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-white/15">
          <div className="bg-[#121214] border-b border-white/10 text-white font-mono font-bold px-5 py-4 tracking-wide text-xs uppercase flex justify-between items-center select-none">
            <span className="text-blue-400 font-extrabold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Estimativa 2029
            </span>
            <span className="text-[10px] font-medium text-slate-500 normal-case">YoY Ganho/Perda</span>
          </div>

          <div className="p-4 overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse min-w-[360px] md:min-w-0">
              <thead>
                <tr className="border-b border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
                  <th className="pb-3 pl-1 w-[30%]">Cenário</th>
                  <th className="pb-3 text-center w-[23%]">Retorno %</th>
                  <th className="pb-3 text-center w-[23%]">Preço Alvo</th>
                  <th className="pb-3 text-right pr-2 w-[24%]">Ganho/Perda Absoluto</th>
                </tr>
              </thead>
              <tbody>
                {/* Est. Row */}
                <tr className="border-b border-white/5 text-[11px] md:text-xs hover:bg-[#1a1a1f]/30 transition-all">
                  <td className="py-4 pl-1 font-bold text-slate-300">Estimativa Base</td>
                  <td className={`py-4 text-center font-mono font-bold text-[11px] md:text-xs text-blue-400`}>
                    {formatPercentage(metrics.return2029.est, true)}
                  </td>
                  <td className="py-4 text-center font-mono text-white font-bold text-[11px] md:text-xs">
                    {formatCurrency(metrics.sharePrice2028.est, stock.currency)}
                  </td>
                  <td className={`py-4 text-right pr-2 font-mono rounded-lg text-[11px] md:text-xs ${getGainLossStyle(metrics.gains2029.est)}`}>
                    {formatCurrency(metrics.gains2029.est, stock.currency)}
                  </td>
                </tr>

                {/* Low / Downside Row */}
                <tr className="border-b border-white/5 text-[11px] md:text-xs hover:bg-[#1a1a1f]/30 transition-all">
                  <td className="py-4 pl-1 font-bold text-rose-400">Downside 2029</td>
                  <td className={`py-4 text-center font-mono font-bold text-[11px] md:text-xs text-rose-400`}>
                    {formatPercentage(metrics.return2029.low, true)}
                  </td>
                  <td className="py-4 text-center font-mono text-white font-bold text-[11px] md:text-xs">
                    {formatCurrency(metrics.sharePrice2028.low, stock.currency)}
                  </td>
                  <td className={`py-4 text-right pr-2 font-mono rounded-lg text-[11px] md:text-xs ${getGainLossStyle(metrics.gains2029.low)}`}>
                    {formatCurrency(metrics.gains2029.low, stock.currency)}
                  </td>
                </tr>

                {/* High / Upside Row */}
                <tr className="text-[11px] md:text-xs hover:bg-[#1a1a1f]/30 transition-all">
                  <td className="py-4 pl-1 font-bold text-emerald-400">Upside 2029</td>
                  <td className={`py-4 text-center font-mono font-bold text-[11px] md:text-xs text-emerald-400`}>
                    {formatPercentage(metrics.return2029.high, true)}
                  </td>
                  <td className="py-4 text-center font-mono text-white font-bold text-[11px] md:text-xs">
                    {formatCurrency(metrics.sharePrice2028.high, stock.currency)}
                  </td>
                  <td className={`py-4 text-right pr-2 font-mono rounded-lg text-[11px] md:text-xs ${getGainLossStyle(metrics.gains2029.high)}`}>
                    {formatCurrency(metrics.gains2029.high, stock.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>


      {/* Trend Graphics Chart */}
      {renderSVGChart()}


      {/* 4. BASE DE PROJEÇÃO LONGO PRAZO 2031 (Estimativa 2031 + CAGR) */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-white/15">
        <div className="bg-[#121214] border-b border-white/10 px-5 py-4 tracking-wide text-xs uppercase font-mono flex justify-between items-center whitespace-nowrap text-white">
          <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Estimativa & CAGR 2031 (Longo Prazo)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500 normal-case hidden md:inline">Anos de Projeção CAGR:</span>
            <select
              value={projectionYears}
              onChange={(e) => setProjectionYears(parseInt(e.target.value))}
              className="bg-[#0a0a0b] text-white font-mono text-[10px] font-bold border border-white/10 rounded px-2.5 py-1 focus:border-blue-500 outline-none cursor-pointer"
            >
              {[3, 4, 5, 6, 7, 8, 10].map((yr) => (
                <option key={yr} value={yr}>
                  {yr} Anos
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5 text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                <th className="pb-3 pl-2">Cenário</th>
                <th className="pb-3 text-center">Proj. 2031 (EPS)</th>
                <th className="pb-3 text-center">Growth Rate (cf. 2027 Cons.)</th>
                <th className="pb-3 text-center">Forward P/E Multiple</th>
                <th className="pb-3 text-center">Estimativa 2031 (% Ret)</th>
                <th className="pb-3 text-center font-bold text-slate-300">Preço Alvo 2031</th>
                <th className="pb-3 text-center">Ganho/Perda Absoluto</th>
                <th className="pb-3 text-right pr-2 text-cyan-400 font-bold bg-cyan-950/25 rounded-t-lg">CAGR (%)</th>
              </tr>
            </thead>
            <tbody>
              {/* Row Est */}
              <tr className="hover:bg-white/[0.01] transition text-sm border-b border-white/5">
                <td className="py-4 pl-2 font-bold text-blue-455 bg-blue-500/5">Estimado</td>
                <td className="py-4 text-center">
                  <input
                    type="number"
                    step="0.05"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-blue-550 focus:outline-none transition-all"
                    value={stock.eps2031.est}
                    onChange={(e) => updateNestedVal("eps2031", "est", e.target.value)}
                  />
                </td>
                <td className="py-4 text-center font-mono text-slate-500 font-semibold text-xs">
                  {formatPercentage(metrics.growthRate2031.est)}
                </td>
                <td className="py-4 text-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-12 bg-[#0a0a0b] text-blue-400 font-mono rounded border border-white/10 p-1 text-center font-black focus:border-blue-550 focus:outline-none transition-all"
                    value={stock.forwardPE2031.est}
                    onChange={(e) => updateNestedVal("forwardPE2031", "est", e.target.value)}
                  />
                </td>
                <td className="py-4 text-center font-mono font-bold text-slate-300 text-xs">
                  {formatPercentage(metrics.return2031.est, true)}
                </td>
                <td className="py-4 text-center font-mono font-extrabold text-emerald-400">
                  {formatCurrency(metrics.sharePrice2031.est, stock.currency)}
                </td>
                <td className={`py-4 text-center pr-2 font-mono rounded ${getGainLossStyle(metrics.gains2031.est)}`}>
                  {formatCurrency(metrics.gains2031.est, stock.currency)}
                </td>
                {/* CAGR */}
                <td className="py-4 text-right pr-3 font-mono font-black text-xs text-white bg-slate-950 border-r-2 border-cyan-400">
                  {formatPercentage(metrics.cagr2031.est)}
                </td>
              </tr>

              {/* Row Low */}
              <tr className="hover:bg-white/[0.01] transition text-sm border-b border-white/5">
                <td className="py-4 pl-2 font-bold text-rose-450 bg-rose-500/5">Downside 2031</td>
                <td className="py-4 text-center">
                  <input
                    type="number"
                    step="0.05"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-rose-550 focus:outline-none transition-all"
                    value={stock.eps2031.low}
                    onChange={(e) => updateNestedVal("eps2031", "low", e.target.value)}
                  />
                </td>
                <td className="py-4 text-center font-mono text-slate-500 font-semibold text-xs">
                  {formatPercentage(metrics.growthRate2031.low)}
                </td>
                <td className="py-4 text-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-12 bg-[#0a0a0b] text-blue-400 font-mono rounded border border-white/10 p-1 text-center font-black focus:border-rose-550 focus:outline-none transition-all"
                    value={stock.forwardPE2031.low}
                    onChange={(e) => updateNestedVal("forwardPE2031", "low", e.target.value)}
                  />
                </td>
                <td className="py-4 text-center font-mono font-bold text-slate-300 text-xs">
                  {formatPercentage(metrics.return2031.low, true)}
                </td>
                <td className="py-4 text-center font-mono font-extrabold text-emerald-400">
                  {formatCurrency(metrics.sharePrice2031.low, stock.currency)}
                </td>
                <td className={`py-4 text-center pr-2 font-mono rounded ${getGainLossStyle(metrics.gains2031.low)}`}>
                  {formatCurrency(metrics.gains2031.low, stock.currency)}
                </td>
                {/* CAGR */}
                <td className="py-4 text-right pr-3 font-mono font-black text-xs text-white bg-slate-950 border-r-2 border-cyan-400">
                  {formatPercentage(metrics.cagr2031.low)}
                </td>
              </tr>

              {/* Row High */}
              <tr className="hover:bg-white/[0.01] transition text-sm">
                <td className="py-4 pl-2 font-bold text-emerald-455 bg-emerald-500/5">Upside 2031</td>
                <td className="py-4 text-center">
                  <input
                    type="number"
                    step="0.05"
                    className="w-16 bg-[#0a0a0b] text-white font-mono rounded border border-white/10 p-1 text-center font-bold focus:border-emerald-555 focus:outline-none transition-all"
                    value={stock.eps2031.high}
                    onChange={(e) => updateNestedVal("eps2031", "high", e.target.value)}
                  />
                </td>
                <td className="py-4 text-center font-mono text-slate-500 font-semibold text-xs">
                  {formatPercentage(metrics.growthRate2031.high)}
                </td>
                <td className="py-4 text-center">
                  <input
                    type="number"
                    step="0.5"
                    className="w-12 bg-[#0a0a0b] text-blue-400 font-mono rounded border border-white/10 p-1 text-center font-black focus:border-emerald-555 focus:outline-none transition-all"
                    value={stock.forwardPE2031.high}
                    onChange={(e) => updateNestedVal("forwardPE2031", "high", e.target.value)}
                  />
                </td>
                <td className="py-4 text-center font-mono font-bold text-slate-300 text-xs">
                  {formatPercentage(metrics.return2031.high, true)}
                </td>
                <td className="py-4 text-center font-mono font-extrabold text-emerald-400">
                  {formatCurrency(metrics.sharePrice2031.high, stock.currency)}
                </td>
                <td className={`py-4 text-center pr-2 font-mono rounded ${getGainLossStyle(metrics.gains2031.high)}`}>
                  {formatCurrency(metrics.gains2031.high, stock.currency)}
                </td>
                {/* CAGR */}
                <td className="py-4 text-right pr-3 font-mono font-black text-xs text-white bg-slate-950 border-r-2 border-cyan-400">
                  {formatPercentage(metrics.cagr2031.high)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


      {/* User notes text area */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 shadow-xl text-slate-300">
        <label className="block text-xs font-bold font-mono text-slate-400 uppercase tracking-widest mb-3">
          Notas de Análise Pessoais (Opcional)
        </label>
        <textarea
          rows={3}
          value={stock.notes || ""}
          onChange={(e) => updateRootVal("notes", e.target.value)}
          placeholder="Escreva as suas anotações, catalisadores do negócio ou impressões sobre as estimativas desta ação..."
          className="w-full text-xs bg-[#0a0a0b] border border-white/10 focus:border-blue-500 rounded-xl p-3 outline-none text-slate-200 placeholder-slate-600 resize-y transition-all"
        />
        {stock.aiRationale && (
          <div className="mt-4 text-[11px] text-slate-400 border-t border-white/5 pt-3 flex items-start gap-2">
            <span className="font-extrabold font-mono text-blue-400 shrink-0 uppercase tracking-wider text-[9px] mt-0.5 bg-blue-500/5 px-2 py-0.5 rounded border border-white/5">Histórico de IA</span>
            <span className="italic leading-relaxed">{stock.aiRationale}</span>
          </div>
        )}
      </div>

    </div>
  );
}
