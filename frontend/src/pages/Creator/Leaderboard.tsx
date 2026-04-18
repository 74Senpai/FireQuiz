import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  Crown,
  Loader2,
  Medal,
  Star,
  Target,
  TimerReset,
  Trophy,
} from "lucide-react";
import * as quizService from "@/services/quizServices";

type QuizOption = {
  id: number;
  title: string;
};

type LeaderboardRow = {
  user_id: number;
  full_name: string;
  email: string;
  score: number;
  duration_seconds: number;
  finished_at: string;
};

type LeaderboardPayload = {
  quiz: {
    id: number;
    title: string;
    status: string;
    gradingScale: number | null;
  };
  data: LeaderboardRow[];
};

const podiumStyles = [
  {
    wrapper:
      "md:order-2 md:-mt-4 border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-orange-500/10",
    icon: <Crown className="h-6 w-6 text-amber-300" />,
    badge: "Top 1",
  },
  {
    wrapper:
      "md:order-1 border-slate-300/30 bg-gradient-to-br from-slate-300/15 to-slate-500/10",
    icon: <Trophy className="h-6 w-6 text-slate-200" />,
    badge: "Top 2",
  },
  {
    wrapper:
      "md:order-3 border-orange-400/30 bg-gradient-to-br from-orange-500/15 to-rose-500/10",
    icon: <Medal className="h-6 w-6 text-orange-300" />,
    badge: "Top 3",
  },
];

export function Leaderboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [payload, setPayload] = useState<LeaderboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedQuizId = searchParams.get("quizId") || "";

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await quizService.getMyQuizzes();
        const items = (response.data || []).map((quiz: any) => ({
          id: quiz.id,
          title: quiz.title,
        }));

        setQuizzes(items);

        if (!selectedQuizId && items.length > 0) {
          setSearchParams({ quizId: String(items[0].id) });
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Không thể tải danh sách bộ câu hỏi.",
        );
      }
    };

    fetchQuizzes();
  }, [selectedQuizId, setSearchParams]);

  useEffect(() => {
    if (!selectedQuizId) {
      setPayload(null);
      setIsLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await quizService.getQuizLeaderboard(selectedQuizId);
        setPayload(response);
      } catch (err: any) {
        setPayload(null);
        setError(
          err.response?.data?.message || "Không thể tải bảng xếp hạng.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedQuizId]);

  const podium = useMemo(() => payload?.data.slice(0, 3) || [], [payload]);

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "--";
    const minutes = Math.floor(seconds / 60);
    const remainSeconds = seconds % 60;
    return `${minutes} phút ${String(remainSeconds).padStart(2, "0")} giây`;
  };

  const formatScore = (score?: number) => {
    if (score === undefined || score === null) return "--";
    const scale = payload?.quiz.gradingScale || 10;
    return `${Number(score).toFixed(2)}/${scale}`;
  };

  const handleQuizChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ quizId: event.currentTarget.value });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              Bảng xếp hạng Top 10
            </h2>
            <p className="mt-1 text-slate-400">
              Vinh danh thí sinh theo điểm cao nhất và tốc độ hoàn thành nhanh
              nhất.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <select
            value={selectedQuizId}
            onChange={handleQuizChange}
            className="h-10 min-w-72 rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Chọn bộ câu hỏi để xem bảng xếp hạng</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center text-slate-300">
          <Loader2 className="mb-4 h-10 w-10 animate-spin" />
          <p>Đang tải bảng xếp hạng...</p>
        </div>
      ) : error ? (
        <Card className="border-rose-500/30 bg-rose-500/10 text-rose-100 shadow-none hover:translate-y-0 hover:shadow-none">
          <CardContent className="p-6">{error}</CardContent>
        </Card>
      ) : !selectedQuizId ? (
        <Card className="border-dashed border-white/10 bg-white/5 text-slate-300 shadow-none hover:translate-y-0 hover:shadow-none">
          <CardContent className="p-10 text-center">
            Chọn một bộ câu hỏi để hiển thị bảng xếp hạng.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-white/10 bg-white/5 text-white shadow-none hover:translate-y-0 hover:shadow-none">
            <CardHeader>
              <CardTitle className="text-white">{payload?.quiz.title}</CardTitle>
              <CardDescription className="text-slate-300">
                Top 10 thí sinh được xếp hạng theo điểm cao nhất, nếu bằng điểm
                sẽ ưu tiên thời gian làm bài nhanh hơn.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-amber-300">
                  <Star className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Tổng số người trong Top
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {payload?.data.length || 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-emerald-300">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-semibold">Điểm đứng đầu</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {payload?.data[0] ? formatScore(payload.data[0].score) : "--"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sky-300">
                  <TimerReset className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Thời gian nhanh nhất
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {payload?.data[0]
                    ? formatDuration(payload.data[0].duration_seconds)
                    : "--"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 md:grid-cols-3">
            {podium.map((item, index) => (
              <Card
                key={item.user_id}
                className={`border text-white shadow-none hover:translate-y-0 hover:shadow-none ${podiumStyles[index].wrapper}`}
              >
                <CardHeader className="items-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                    {podiumStyles[index].icon}
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/90">
                    {podiumStyles[index].badge}
                  </div>
                  <CardTitle className="mt-3 text-xl text-white">
                    {item.full_name}
                  </CardTitle>
                  <CardDescription className="text-slate-200">
                    {item.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-center">
                    <p className="text-xs uppercase tracking-wider text-slate-300">
                      Điểm
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {formatScore(item.score)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-center">
                    <p className="text-xs uppercase tracking-wider text-slate-300">
                      Thời gian
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {formatDuration(item.duration_seconds)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-white/10 bg-white/5 text-white shadow-none hover:translate-y-0 hover:shadow-none">
            <CardHeader>
              <CardTitle className="text-white">Danh sách xếp hạng</CardTitle>
              <CardDescription className="text-slate-300">
                Hiển thị đầy đủ 10 vị trí đầu tiên.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payload?.data.length ? (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Hạng</th>
                        <th className="px-4 py-3">Thí sinh</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Điểm</th>
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3">Hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {payload.data.map((item, index) => (
                        <tr key={item.user_id} className="bg-white/[0.03]">
                          <td className="px-4 py-4 font-bold text-amber-300">
                            #{index + 1}
                          </td>
                          <td className="px-4 py-4 font-semibold text-white">
                            {item.full_name}
                          </td>
                          <td className="px-4 py-4 text-slate-300">
                            {item.email}
                          </td>
                          <td className="px-4 py-4 font-semibold text-emerald-300">
                            {formatScore(item.score)}
                          </td>
                          <td className="px-4 py-4 text-sky-300">
                            {formatDuration(item.duration_seconds)}
                          </td>
                          <td className="px-4 py-4 text-slate-300">
                            {item.finished_at
                              ? new Date(item.finished_at).toLocaleString("vi-VN")
                              : "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/20 px-6 py-12 text-center text-slate-400">
                  Chưa có dữ liệu để hiển thị bảng xếp hạng.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
