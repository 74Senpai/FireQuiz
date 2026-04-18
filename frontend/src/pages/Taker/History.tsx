import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getMyAttempts, getMyStats } from "@/services/attemptServices";
import { ActivityHeatmap } from "@/components/ui/ActivityHeatmap";

function formatDt(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function scoreLabel(score) {
  if (score === null || score === undefined || score === "") return "—";
  return String(score);
}

export function History() {
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    totalItems: 0,
    totalPages: 0,
  });
  
  const [statsData, setStatsData] = useState([]);

  useEffect(() => {
    getMyStats().then(res => setStatsData(res.data || res || [])).catch(console.error);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAttempts({ page, pageSize });
      setItems(res.data ?? []);
      setPagination(
        res.pagination ?? { page, pageSize, totalItems: 0, totalPages: 0 },
      );
    } catch (e) {
      const msg =
        e.response?.data?.message ?? "Không tải được lịch sử làm bài.";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] inline-block">
          Lịch sử làm bài
        </h2>
        <p className="text-slate-400 mt-1">
          Các lần thi đã lưu trên hệ thống — xem lại báo cáo chi tiết theo từng lần.
        </p>
      </div>

      <ActivityHeatmap stats={statsData} />

      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <span>Đang tải…</span>
        </div>
      )}

      {!loading && error && (
        <Card className="border-red-400/40 bg-red-950/20 backdrop-blur-xl">
          <CardContent className="py-8 text-center text-red-200">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="py-12 text-center text-slate-400">
            Bạn chưa có lần làm bài nào được ghi nhận.
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((row, index) => (
              <Card
                key={row.id}
                className="bg-gradient-to-br from-purple-900/30 to-slate-900/50 backdrop-blur-xl border-purple-400/30 hover:border-purple-400/60 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 group hover:scale-[1.02] transition-transform duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold line-clamp-2 text-slate-100 group-hover:text-purple-300 transition-colors duration-300">
                    {row.quiz_title}
                  </CardTitle>
                  <CardDescription className="text-slate-400 space-y-0.5 text-xs">
                    <span className="block">
                      Bắt đầu: {formatDt(row.started_at)}
                    </span>
                    <span className="block">
                      {row.finished_at
                        ? `Nộp: ${formatDt(row.finished_at)}`
                        : "Chưa nộp bài"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors duration-300">
                    <span className="text-sm text-slate-400 font-semibold">
                      Điểm
                    </span>
                    <span className="font-bold text-xl text-emerald-400">
                      {scoreLabel(row.score)}
                    </span>
                  </div>
                  <Link
                    to={`/dashboard/attempt/${row.id}/review`}
                    className="block"
                  >
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-purple-400/50 text-slate-100 hover:bg-purple-500/20 hover:text-purple-300"
                    >
                      Xem lại đáp án{" "}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-white/20 text-slate-200 hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </Button>
              <span className="text-sm text-slate-400 tabular-nums">
                Trang {pagination.page} / {pagination.totalPages}
                <span className="text-slate-500 ml-2">
                  ({pagination.totalItems} lần)
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-white/20 text-slate-200 hover:bg-white/10"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
