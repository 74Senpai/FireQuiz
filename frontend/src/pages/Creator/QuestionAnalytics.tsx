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
  BarChart3,
  ChevronLeft,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import * as quizService from "@/services/quizServices";

type QuizOption = {
  id: number;
  title: string;
};

type AnalyticsRow = {
  id: number;
  content: string;
  type: string;
  total_attempts: number;
  total_responses: number;
  correct_responses: number;
  incorrect_responses: number;
  correct_rate: number;
  incorrect_rate: number;
  response_rate: number;
};

type AnalyticsPayload = {
  quiz: {
    id: number;
    title: string;
    status: string;
    gradingScale: number | null;
  };
  summary: {
    totalAttempts: number;
    totalQuestions: number;
  };
  data: AnalyticsRow[];
};

export function QuestionAnalytics() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
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
        setError(err.response?.data?.message || "Khong the tai danh sach quiz.");
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

    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await quizService.getQuizQuestionAnalytics(selectedQuizId);
        setPayload(response);
      } catch (err: any) {
        setPayload(null);
        setError(err.response?.data?.message || "Khong the tai thong ke cau hoi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedQuizId]);

  const hardestQuestion = useMemo(() => {
    const rows = payload?.data.filter((item) => item.total_attempts > 0) || [];
    if (!rows.length) return null;
    return [...rows].sort((a, b) => a.correct_rate - b.correct_rate)[0];
  }, [payload]);

  const easiestQuestion = useMemo(() => {
    const rows = payload?.data.filter((item) => item.total_attempts > 0) || [];
    if (!rows.length) return null;
    return [...rows].sort((a, b) => b.correct_rate - a.correct_rate)[0];
  }, [payload]);

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
            <h2 className="bg-gradient-to-r from-cyan-200 via-sky-300 to-indigo-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              Thong ke chuyen sau cau hoi
            </h2>
            <p className="mt-1 text-slate-400">
              Phan tich ty le dung sai cua tung cau hoi de danh gia do kho.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <select
            value={selectedQuizId}
            onChange={(event) => setSearchParams({ quizId: event.target.value })}
            className="h-10 min-w-72 rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="">Chon quiz de xem thong ke</option>
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
          <p>Dang tai thong ke cau hoi...</p>
        </div>
      ) : error ? (
        <Card className="border-rose-500/30 bg-rose-500/10 text-rose-100 shadow-none hover:translate-y-0 hover:shadow-none">
          <CardContent className="p-6">{error}</CardContent>
        </Card>
      ) : !selectedQuizId ? (
        <Card className="border-dashed border-white/10 bg-white/5 text-slate-300 shadow-none hover:translate-y-0 hover:shadow-none">
          <CardContent className="p-10 text-center">
            Chon mot quiz de hien thi thong ke.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-white/10 bg-white/5 text-white shadow-none hover:translate-y-0 hover:shadow-none">
            <CardHeader>
              <CardTitle className="text-white">{payload?.quiz.title}</CardTitle>
              <CardDescription className="text-slate-300">
                Ty le duoc tinh tren tong so luot thi da hoan thanh cua quiz.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sky-300">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">Tong luot thi</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {payload?.summary.totalAttempts || 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-indigo-300">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-semibold">Tong cau hoi</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {payload?.summary.totalQuestions || 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-emerald-300">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-semibold">Muc tieu</span>
                </div>
                <p className="text-sm text-slate-300">
                  So sanh dung, sai va khong phan hoi cho moi cau hoi.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-gradient-to-br from-rose-500/15 to-orange-500/10 text-white shadow-none hover:translate-y-0 hover:shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2 text-rose-300">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-semibold">Cau hoi kho nhat</span>
                </div>
                <CardTitle className="text-white">
                  {hardestQuestion?.content || "Chua co du lieu"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-200">
                Ty le dung: {hardestQuestion ? `${hardestQuestion.correct_rate}%` : "--"}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 text-white shadow-none hover:translate-y-0 hover:shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2 text-emerald-300">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-semibold">Cau hoi de nhat</span>
                </div>
                <CardTitle className="text-white">
                  {easiestQuestion?.content || "Chua co du lieu"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-200">
                Ty le dung: {easiestQuestion ? `${easiestQuestion.correct_rate}%` : "--"}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/5 text-white shadow-none hover:translate-y-0 hover:shadow-none">
            <CardHeader>
              <CardTitle className="text-white">Bieu do theo tung cau hoi</CardTitle>
              <CardDescription className="text-slate-300">
                Xanh la ty le dung, hong la ty le sai, xam la phan khong co phan hoi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {payload?.data.length ? (
                payload.data.map((item, index) => {
                  const noResponseRate = Math.max(
                    0,
                    100 - Number(item.correct_rate) - Number(item.incorrect_rate),
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/20 p-5"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-sky-300">
                            Cau hoi {index + 1}
                          </p>
                          <h3 className="text-base font-semibold text-white">
                            {item.content}
                          </h3>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          {item.type}
                        </div>
                      </div>

                      <div className="h-4 overflow-hidden rounded-full bg-slate-800">
                        <div className="flex h-full w-full">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${item.correct_rate}%` }}
                          ></div>
                          <div
                            className="h-full bg-rose-500"
                            style={{ width: `${item.incorrect_rate}%` }}
                          ></div>
                          <div
                            className="h-full bg-slate-600"
                            style={{ width: `${noResponseRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                          <p className="text-xs uppercase tracking-wider text-emerald-300">
                            Dung
                          </p>
                          <p className="mt-1 text-lg font-bold text-white">
                            {item.correct_rate}% ({item.correct_responses})
                          </p>
                        </div>
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                          <p className="text-xs uppercase tracking-wider text-rose-300">
                            Sai
                          </p>
                          <p className="mt-1 text-lg font-bold text-white">
                            {item.incorrect_rate}% ({item.incorrect_responses})
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-500/20 bg-slate-700/20 p-3">
                          <p className="text-xs uppercase tracking-wider text-slate-300">
                            Phan hoi
                          </p>
                          <p className="mt-1 text-lg font-bold text-white">
                            {item.response_rate}% ({item.total_responses}/{item.total_attempts})
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/20 px-6 py-12 text-center text-slate-400">
                  Chua co du lieu thong ke cho quiz nay.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
