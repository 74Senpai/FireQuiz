import type { ReactNode } from "react";
import { Crown, Medal, Trophy } from "lucide-react";

export const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getScoreColor = (score: number | null): string => {
  if (score === null) return "text-slate-400";
  if (score >= 8) return "text-emerald-400 font-bold";
  if (score >= 5) return "text-amber-400 font-bold";
  return "text-rose-400 font-bold";
};

export interface LeaderboardAccent {
  className: string;
  icon: ReactNode;
  label: string;
}

export const getLeaderboardAccent = (rank: number): LeaderboardAccent => {
  if (rank === 1) {
    return {
      className: "border-yellow-400/30 bg-yellow-500/10",
      icon: <Crown className="h-4 w-4 text-yellow-300" />,
      label: "Top 1",
    };
  }

  if (rank === 2) {
    return {
      className: "border-slate-300/20 bg-slate-400/10",
      icon: <Medal className="h-4 w-4 text-slate-200" />,
      label: "Top 2",
    };
  }

  if (rank === 3) {
    return {
      className: "border-amber-500/30 bg-amber-500/10",
      icon: <Medal className="h-4 w-4 text-amber-300" />,
      label: "Top 3",
    };
  }

  return {
    className: "border-white/10 bg-white/5",
    icon: <Trophy className="h-4 w-4 text-slate-300" />,
    label: `Top ${rank}`,
  };
};
