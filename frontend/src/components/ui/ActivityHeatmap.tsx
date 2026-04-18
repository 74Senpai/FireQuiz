import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ActivityStats {
  finished_at: string;
}

interface ActivityHeatmapProps {
  stats: ActivityStats[];
}

export function ActivityHeatmap({ stats }: ActivityHeatmapProps) {
  // Config
  const numDays = 365;

  // Calculate the dates
  const { dateCells, monthLabels, maxCount } = useMemo(() => {
    const today = new Date();
    // Normalize today to start of day
    today.setHours(0, 0, 0, 0);

    const heatmapData = new Map<string, number>();
    
    // Count activities per day
    stats.forEach((s) => {
      if (!s.finished_at) return;
      const d = new Date(s.finished_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      heatmapData.set(key, (heatmapData.get(key) || 0) + 1);
    });

    const maxActivity = Math.max(...Array.from(heatmapData.values()), 1);

    // Generate last 365 days aligned to weeks
    const dates = [];
    const labels = [];
    let currentMonth = -1;

    for (let i = numDays; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      
      const count = heatmapData.get(key) || 0;
      let level = 0;
      if (count > 0) {
        if (count === 1) level = 1;
        else if (count === 2) level = 2;
        else if (count <= 4) level = 3;
        else level = 4;
      }

      dates.push({
        date: d,
        dateString: key,
        count,
        level,
      });

      // Handle month labels
      // If it's a Sunday (0) or first of month, we can check. 
      // Actually, we want to label columns, so we check if a new month starts in this week's column
      if (d.getDate() === 1 || (d.getDate() <= 7 && currentMonth !== d.getMonth() && d.getDay() === 0)) {
        if (currentMonth !== d.getMonth()) {
          labels.push({ 
            month: d.toLocaleString('vi-VN', { month: 'short' }), 
            colIndex: Math.floor((numDays - i) / 7) 
          });
          currentMonth = d.getMonth();
        }
      }
    }

    // Align to Sunday
    const startDay = dates[0].date.getDay(); 
    // Add empty cells if the 365th day ago wasn't a Sunday
    const blanks = [];
    for (let i = 0; i < startDay; i++) {
        blanks.push(null);
    }

    return { dateCells: [...blanks, ...dates], monthLabels: labels, maxCount: maxActivity };
  }, [stats]);

  const getColorClass = (level: number) => {
    switch (level) {
      case 1: return "bg-emerald-900/60 border-emerald-800/50";
      case 2: return "bg-emerald-700/80 border-emerald-600/50";
      case 3: return "bg-emerald-500 border-emerald-400";
      case 4: return "bg-emerald-400 border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)]";
      default: return "bg-white/5 border-white/5 hover:bg-white/10";
    }
  };

  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string; subText?: string }>({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });

  const handleMouseEnter = (e: React.MouseEvent, count: number, dateString: string) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const formattedDate = new Date(dateString).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      text: `${count} bài thi`,
      subText: formattedDate
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-x-auto overflow-y-hidden hide-scrollbar">
      <div className="min-w-max">
        {/* Header / Month Labels */}
        <div className="flex text-xs font-semibold text-slate-400 mb-2 pl-[30px] relative h-5">
           {monthLabels.map((lbl, i) => (
             <div 
               key={i} 
               className="absolute"
               style={{ left: `${lbl.colIndex * 15}px`, transform: 'translateX(30px)' }}
             >
               {lbl.month}
             </div>
           ))}
        </div>

        <div className="flex">
          {/* Day Labels - Left Side */}
          <div className="flex flex-col gap-[3px] text-[10px] font-medium text-slate-400 pr-2 pt-[2px]">
            <div className="h-3 leading-3"></div>
            <div className="h-3 leading-3">T2</div>
            <div className="h-3 leading-3"></div>
            <div className="h-3 leading-3">T4</div>
            <div className="h-3 leading-3"></div>
            <div className="h-3 leading-3">T6</div>
            <div className="h-3 leading-3"></div>
          </div>

          {/* Grid */}
          <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
            {dateCells.map((cell, index) => {
              if (cell === null) {
                return <div key={`blank-${index}`} className="w-3 h-3 rounded-sm transparent" />;
              }
              
              return (
                <div
                  key={cell.dateString}
                  onMouseEnter={(e) => handleMouseEnter(e, cell.count, cell.dateString)}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    "w-3 h-3 rounded-sm border cursor-crosshair transition-all duration-300",
                    getColorClass(cell.level)
                  )}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 text-xs font-medium text-slate-400">
           <span>Ít</span>
           <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/5"></div>
           <div className="w-3 h-3 rounded-sm bg-emerald-900/60 border border-emerald-800/50"></div>
           <div className="w-3 h-3 rounded-sm bg-emerald-700/80 border border-emerald-600/50"></div>
           <div className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400"></div>
           <div className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)]"></div>
           <span>Nhiều</span>
        </div>
      </div>

      {/* Custom Global Tooltip using Portal to avoid backdrop-filter trapping */}
      {tooltip.visible && document.body && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+8px)] flex flex-col items-center bg-slate-800/95 backdrop-blur-md border border-white/10 shadow-2xl rounded-lg px-3 py-2 text-center"
          style={{ left: tooltip.x, top: tooltip.y + 8 }}
        >
           <span className="text-white font-bold text-sm block leading-tight">{tooltip.text}</span>
           {tooltip.subText && <span className="text-slate-400 text-xs block mt-0.5">{tooltip.subText}</span>}
           <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800/95"></div>
        </div>,
        document.body
      )}
    </div>
  );
}
