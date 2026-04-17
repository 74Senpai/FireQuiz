import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getPublicOpenQuizzes } from "@/services/quizServices";

export type PublicQuizRow = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  time_limit_seconds: number | null;
  available_from: string | null;
  available_until: string | null;
  grading_scale: number | null;
  max_attempts: number | null;
  joinedCount?: number;
  creator_id: number;
  created_at?: string;
  updated_at?: string;
};

function formatSchedule(from: string | null, until: string | null): string {
  const fmt = (s: string) =>
    new Date(s).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  if (from && until) return `${fmt(from)} → ${fmt(until)}`;
  if (from) return `Từ ${fmt(from)}`;
  if (until) return `Đến ${fmt(until)}`;
  return "Không giới hạn thời gian";
}

function timeLimitLabel(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "Không giới hạn thời gian làm";
  const m = Math.ceil(seconds / 60);
  return `${m} phút / lượt`;
}

type PanelProps = {
  /** URL làm bài (đã login) hoặc URL đăng nhập kèm redirect */
  getTakeHref: (quizId: number) => string;
  pageSize?: number;
  className?: string;
};

export function PublicOpenQuizzesPanel({
  getTakeHref,
  pageSize = 9,
  className = "",
}: PanelProps) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PublicQuizRow[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    totalItems: 0,
    totalPages: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicOpenQuizzes({ page, pageSize });
      setItems(res.data ?? []);
      setPagination(res.pagination ?? { page, pageSize, totalItems: 0, totalPages: 0 });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Không tải được danh sách quiz.";
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
    <div className={className}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white animate-fade-in">
        <Clock className="w-6 h-6 text-indigo-400 animate-float" /> Quiz đang mở công khai
      </h3>
      <p className="text-slate-400 text-sm mb-4 -mt-2">
        Danh sách cập nhật theo lịch <span className="text-slate-500">available from / until</span> trên máy chủ.
      </p>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <span>Đang tải quiz…</span>
        </div>
      )}

      {!loading && error && (
        <Card className="border-red-400/40 bg-red-950/20 backdrop-blur-xl">
          <CardContent className="py-8 text-center text-red-200">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="py-12 text-center text-slate-400">
            Hiện không có quiz công khai nào trong khung giờ mở.
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((quiz, index) => (
              <Card
                key={quiz.id}
                className="border-indigo-400/30 hover:border-indigo-400/60 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl group"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold line-clamp-2 text-slate-100 group-hover:text-indigo-300 transition-colors duration-300">
                    {quiz.title}
                  </CardTitle>
                  <CardDescription className="text-amber-400/90 font-medium mt-1 text-xs leading-relaxed">
                    {formatSchedule(quiz.available_from, quiz.available_until)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {quiz.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">{quiz.description}</p>
                  )}
                  <div className="flex justify-between items-center text-sm mb-4">
                     <span className="text-slate-400 font-medium">⏱️ {timeLimitLabel(quiz.time_limit_seconds)}</span>
                     {quiz.max_attempts != null && (
                        <div className="flex flex-col items-end">
                           <span className={cn(
                             "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                             (quiz.max_attempts - (quiz.joinedCount || 0)) <= 0 
                               ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                               : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                           )}>
                             {(quiz.max_attempts - (quiz.joinedCount || 0)) <= 0 
                               ? "🚫 Hết chỗ" 
                               : `🔥 Còn ${quiz.max_attempts - (quiz.joinedCount || 0)} slot`}
                           </span>
                        </div>
                     )}
                  </div>
                  <Link 
                    to={getTakeHref(quiz.id)} 
                    className={cn(
                      "block",
                      quiz.max_attempts != null && (quiz.max_attempts - (quiz.joinedCount || 0)) <= 0 && "pointer-events-none opacity-50"
                    )}
                  >
                    <Button 
                      disabled={quiz.max_attempts != null && (quiz.max_attempts - (quiz.joinedCount || 0)) <= 0}
                      className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg group-hover:shadow-indigo-500/50"
                    >
                      <Play className="w-4 h-4 group-hover:animate-pulse" /> Bắt đầu Quiz
                    </Button>
                  </Link>

                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
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
                <span className="text-slate-500 ml-2">({pagination.totalItems} quiz)</span>
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
