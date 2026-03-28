import type { ReactNode } from "react";
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";

import type { QuizStats } from "./types";

interface StatsGridProps {
  stats: QuizStats | null;
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  color: "indigo" | "emerald" | "amber" | "purple" | "yellow" | "rose";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorMap: Record<StatCardProps["color"], string> = {
    indigo: "border-indigo-500/30 bg-indigo-500/10",
    emerald: "border-emerald-500/30 bg-emerald-500/10",
    amber: "border-amber-500/30 bg-amber-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    yellow: "border-yellow-500/30 bg-yellow-500/10",
    rose: "border-rose-500/30 bg-rose-500/10",
  };

  return (
    <div className={`rounded-xl border p-4 backdrop-blur-sm ${colorMap[color]}`}>
      <div className="mb-2 flex items-center gap-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

export function StatsGrid({ stats }: StatsGridProps) {
  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <StatCard
        icon={<Users className="h-5 w-5 text-indigo-400" />}
        label="Tổng lượt thi"
        value={stats.totalAttempts}
        color="indigo"
      />
      <StatCard
        icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
        label="Đã nộp bài"
        value={stats.submittedCount}
        color="emerald"
      />
      <StatCard
        icon={<Clock className="h-5 w-5 text-amber-400" />}
        label="Đang làm"
        value={stats.inProgressCount}
        color="amber"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
        label="Điểm TB"
        value={stats.avgScore !== null ? stats.avgScore.toFixed(2) : "—"}
        color="purple"
      />
      <StatCard
        icon={<Trophy className="h-5 w-5 text-yellow-400" />}
        label="Cao nhất"
        value={stats.maxScore !== null ? stats.maxScore : "—"}
        color="yellow"
      />
      <StatCard
        icon={<XCircle className="h-5 w-5 text-rose-400" />}
        label="Thấp nhất"
        value={stats.minScore !== null ? stats.minScore : "—"}
        color="rose"
      />
    </div>
  );
}
