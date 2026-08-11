import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function Sparkline({ 
  data, 
  color = '#10b981', // default emerald
  width = 100, 
  height = 30,
  className = ''
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Prevent division by zero
  
  const padding = 2;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Catmull-Rom to Cubic Bezier conversion for smooth curves
  const getCurvePath = (points: [number, number][]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;
    
    let path = `M ${points[0][0]},${points[0][1]}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
      
      // Tension factor (0.0 to 1.0)
      const tension = 0.2;
      
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return path;
  };

  const pointCoords: [number, number][] = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * graphWidth;
    const y = height - padding - ((val - min) / range) * graphHeight;
    return [x, y];
  });

  const curvePath = getCurvePath(pointCoords);
  const fillPoints = `${curvePath} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <div className={`relative group ${className}`}>
      <svg width={width} height={height} className="overflow-visible" style={{ minWidth: width }}>
        <defs>
          <linearGradient id={`spark-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          {/* Neon Glow Filter */}
          <filter id={`neon-glow-${color}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path 
          d={fillPoints} 
          fill={`url(#spark-gradient-${color})`} 
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
        />
        <path
          d={curvePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-[drawSparkline_1.5s_ease-out_forwards]"
          style={{
            strokeDasharray: '500',
            strokeDashoffset: '500',
          }}
          filter={`url(#neon-glow-${color})`}
        />
      </svg>
      {/* Tooltip on hover */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform scale-95 group-hover:scale-100 z-10">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-white text-[10px] font-black tabular-nums py-1 px-2.5 rounded shadow-xl whitespace-nowrap">
          {new Intl.NumberFormat('vi-VN').format(data[data.length - 1])} (Hiện tại)
        </div>
      </div>
    </div>
  );
}
