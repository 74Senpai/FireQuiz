import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Loader2, Search, Timer, Trophy, Users } from "lucide-react";
import * as quizService from "@/services/quizServices";

type ResultsDashboardPanelProps = {
  quizId: string;
};

type DashboardRow = {
  attempt_id: number;
  user_id: number;
  full_name: string;
  email: string;
  score: number | null;
  started_at: string | null;
  finished_at: string | null;
  duration_seconds: number | null;
  submission_status: "SUBMITTED" | "IN_PROGRESS";
  total_attempts: number;
  correct_count: number;
  incorrect_count: number;
};

type DashboardPayload = {
  quiz: {
    id: number;
    title: string;
    status: string;
    gradingScale: number | null;
  };
  summary: {
    totalParticipants: number;
    submittedCount: number;
    inProgressCount: number;
    overallRatio: {
      correct: number;
      incorrect: number;
      correctRate: number;
      incorrectRate: number;
    };
    scoreHistogram: Array<{
      range: string;
      count: number;
    }>;
  };
  data: DashboardRow[];
};

const formatDuration = (seconds: number | null) => {
  if (seconds === null || seconds === undefined) {
    return "--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes} phút ${String(remainSeconds).padStart(2, "0")} giây`;
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString("vi-VN");
};

export function ResultsDashboardPanel({ quizId }: ResultsDashboardPanelProps) {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!quizId) {
      setPayload(null);
      return;
    }

    const fetchDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await quizService.getQuizResultsDashboard(quizId);
        setPayload(response);
      } catch (err: any) {
        setPayload(null);
        setError(
          err.response?.data?.message || "Không thể tải bảng kết quả.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [quizId]);

  const filteredRows = useMemo(() => {
    const items = payload?.data || [];

    return items.filter((item) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchesKeyword =
        !normalizedKeyword ||
        item.full_name.toLowerCase().includes(normalizedKeyword) ||
        item.email.toLowerCase().includes(normalizedKeyword) ||
        `USER${String(item.user_id).padStart(4, "0")}`
          .toLowerCase()
          .includes(normalizedKeyword);

      const score = Number(item.score ?? 0);
      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "high" && score >= 8) ||
        (scoreFilter === "medium" && score >= 5 && score < 8) ||
        (scoreFilter === "low" && score < 5);

      const duration = item.duration_seconds;
      const matchesTime =
        timeFilter === "all" ||
        (timeFilter === "fast" && duration !== null && duration <= 1800) ||
        (timeFilter === "normal" &&
          duration !== null &&
          duration > 1800 &&
          duration <= 3600) ||
        (timeFilter === "slow" && duration !== null && duration > 3600) ||
        (timeFilter === "na" && duration === null);

      const matchesStatus =
        statusFilter === "all" || item.submission_status === statusFilter;

      return matchesKeyword && matchesScore && matchesTime && matchesStatus;
    });
  }, [keyword, payload, scoreFilter, statusFilter, timeFilter]);

  return (
    <Card className="border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-md shadow-2xl">
      <CardHeader>
        <CardTitle className="text-emerald-200">
          Bảng kết quả thí sinh
        </CardTitle>
        <CardDescription className="text-slate-300">
          Quản lý thí sinh theo điểm, thời gian hoàn thành và trạng thái nộp bài.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-emerald-300">
              <Users className="h-4 w-4" />
              <span className="text-sm font-semibold">Tổng thí sinh</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {payload?.summary.totalParticipants || 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-sky-300">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-semibold">Đã nộp bài</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {payload?.summary.submittedCount || 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-amber-300">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-semibold">Đang làm bài</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {payload?.summary.inProgressCount || 0}
            </p>
          </div>
        </div>

        {/* Analytics Charts */}
        {payload && payload.summary.overallRatio && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-slate-950/20 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-200">
                  Tỷ lệ Đúng / Sai toàn hệ thống
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Tổng hợp theo tất cả thí sinh đã nộp bài
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-emerald-400">Đúng ({payload.summary.overallRatio.correctRate}%)</span>
                    <span className="text-rose-400">Sai ({payload.summary.overallRatio.incorrectRate}%)</span>
                  </div>
                  <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${payload.summary.overallRatio.correctRate}%` }} />
                    <div className="bg-rose-500 transition-all" style={{ width: `${payload.summary.overallRatio.incorrectRate}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{payload.summary.overallRatio.correct} câu</span>
                    <span>{payload.summary.overallRatio.incorrect} câu</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-950/20 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-200">
                  Phổ điểm (Histogram)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Phân bố điểm số của thí sinh hoàn thành
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end h-[80px] gap-1 md:gap-2">
                  {payload.summary.scoreHistogram.map((bin, i) => {
                    const maxCount = Math.max(...payload.summary.scoreHistogram.map(b => b.count), 1);
                    const heightPercent = `${(bin.count / maxCount) * 100}%`;
                    
                    return (
                      <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
                        <div className="w-full rounded-t-sm bg-indigo-500/80 transition-all hover:bg-indigo-400" style={{ height: heightPercent, minHeight: bin.count > 0 ? '4px' : '0px' }}></div>
                        <div className="mt-1 text-[10px] text-slate-400" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{bin.range}</div>
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute -top-8 z-10 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                          {bin.count} hs
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="relative xl:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên, email, mã học sinh"
              className="border-white/10 bg-slate-950/20 pl-9 text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <select
            value={scoreFilter}
            onChange={(event) => setScoreFilter(event.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-slate-950/20 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="all">Lọc theo điểm</option>
            <option value="high">Từ 8 điểm trở lên</option>
            <option value="medium">Từ 5 đến dưới 8</option>
            <option value="low">Dưới 5 điểm</option>
          </select>

          <select
            value={timeFilter}
            onChange={(event) => setTimeFilter(event.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-slate-950/20 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="all">Lọc theo thời gian</option>
            <option value="fast">Nhanh dưới 30 phút</option>
            <option value="normal">Từ 30 đến 60 phút</option>
            <option value="slow">Trên 60 phút</option>
            <option value="na">Chưa có thời gian</option>
          </select>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 flex-1 rounded-lg border border-white/10 bg-slate-950/20 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="all">Lọc theo trạng thái</option>
              <option value="SUBMITTED">Đã nộp bài</option>
              <option value="IN_PROGRESS">Đang làm bài</option>
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setKeyword("");
                setScoreFilter("all");
                setTimeFilter("all");
                setStatusFilter("all");
              }}
              className="gap-2 border-white/10 bg-slate-950/20 text-slate-100 hover:bg-white/10"
            >
              <Filter className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center text-slate-300">
            <Loader2 className="mb-4 h-10 w-10 animate-spin" />
            <p>Đang tải bảng kết quả...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100">
            {error}
          </div>
        ) : filteredRows.length ? (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Thí sinh</th>
                  <th className="px-4 py-3">Mã học sinh</th>
                  <th className="px-4 py-3">Điểm</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Đúng/Sai</th>
                  <th className="px-4 py-3">Số lần thi</th>
                  <th className="px-4 py-3">Hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRows.map((item) => (
                  <tr key={item.attempt_id} className="bg-white/[0.03]">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-white">
                        {item.full_name}
                      </div>
                      <div className="text-xs text-slate-400">{item.email}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {`USER${String(item.user_id).padStart(4, "0")}`}
                    </td>
                    <td className="px-4 py-4 font-semibold text-emerald-300">
                      {item.score !== null ? Number(item.score).toFixed(2) : "--"}
                    </td>
                    <td className="px-4 py-4 text-sky-300">
                      {formatDuration(item.duration_seconds)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          item.submission_status === "SUBMITTED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {item.submission_status === "SUBMITTED" ? "Đã nộp" : "Đang làm"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {item.correct_count}/{item.incorrect_count}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {item.total_attempts}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {formatDateTime(item.finished_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/20 px-6 py-12 text-center text-slate-400">
            Không có thí sinh nào phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
