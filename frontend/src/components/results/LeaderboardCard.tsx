import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  formatDateTime,
  formatDuration,
  getLeaderboardAccent,
  getScoreColor,
} from "./helpers";
import type { LeaderboardEntry } from "./types";

interface LeaderboardCardProps {
  quizTitle?: string;
  leaderboard: LeaderboardEntry[];
  leaderboardError: string | null;
  totalParticipants: number;
}

export function LeaderboardCard({
  quizTitle,
  leaderboard,
  leaderboardError,
  totalParticipants,
}: LeaderboardCardProps) {
  return (
    <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
          <Trophy className="h-4 w-4 text-yellow-400" />
          Bảng xếp hạng Top 10
          {quizTitle && (
            <span className="ml-1 text-sm font-normal text-slate-400">
              — {quizTitle}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {leaderboardError ? (
          <div className="rounded-xl border border-red-200/20 bg-red-50/10 p-4 text-sm text-red-300">
            {leaderboardError}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-slate-400">
            Chưa có đủ bài nộp để tạo bảng xếp hạng.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {leaderboard.slice(0, 3).map((entry) => {
                const accent = getLeaderboardAccent(entry.rank);

                return (
                  <div
                    key={entry.user.id}
                    className={`rounded-2xl border p-4 ${accent.className}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
                        {accent.icon}
                        {accent.label}
                      </span>
                      <span className={`text-lg ${getScoreColor(entry.score)}`}>
                        {entry.score ?? "—"}
                      </span>
                    </div>
                    <p className="mt-4 text-base font-semibold text-white">
                      {entry.user.fullName}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {entry.user.email}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                      <span>Thời gian làm</span>
                      <span>{formatDuration(entry.durationSeconds)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Hạng</th>
                    <th className="px-4 py-3 font-medium">Thí sinh</th>
                    <th className="px-4 py-3 font-medium">Điểm</th>
                    <th className="px-4 py-3 font-medium">Thời gian</th>
                    <th className="px-4 py-3 font-medium">Nộp bài</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.attemptId}
                      className="bg-white/5 transition-colors duration-200 hover:bg-white/10"
                    >
                      <td className="px-4 py-3 text-slate-200">#{entry.rank}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-100">
                          {entry.user.fullName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {entry.user.email}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${getScoreColor(entry.score)}`}>
                        {entry.score ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatDuration(entry.durationSeconds)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDateTime(entry.finishedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-slate-400">
              Xếp hạng theo bài nộp tốt nhất của mỗi thí sinh. Tổng số thí sinh có
              mặt trên leaderboard:{" "}
              <span className="font-semibold text-slate-200">
                {totalParticipants}
              </span>
              .
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
