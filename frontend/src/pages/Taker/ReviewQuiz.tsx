import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowLeft, Loader2, MinusCircle } from "lucide-react";
import { getAttemptReview } from "@/services/attemptServices";

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

/** Đánh giá đúng/sai theo logic snapshot (giống backend aggregation). */
function evaluateQuestion(question) {
  const opts = question.options ?? [];
  const totalCorrect = opts.filter((o) => o.is_correct).length;
  const selectedCorrect = opts.filter((o) => o.is_correct && o.selected).length;
  const selectedIncorrect = opts.filter((o) => !o.is_correct && o.selected).length;
  const hasResponse = opts.some((o) => o.selected);
  const isCorrect =
    totalCorrect > 0 &&
    selectedIncorrect === 0 &&
    selectedCorrect === totalCorrect;
  return { hasResponse, isCorrect, totalCorrect, selectedCorrect, selectedIncorrect };
}

export function ReviewQuiz() {
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!attemptId) {
        setError("Thiếu mã lần thi.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getAttemptReview(attemptId);
        if (!cancelled) setPayload(data);
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message ?? "Không tải được chi tiết lần thi.");
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const summary = useMemo(() => {
    if (!payload?.questions?.length) {
      return { correct: 0, incorrect: 0, unanswered: 0 };
    }
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    for (const q of payload.questions) {
      const ev = evaluateQuestion(q);
      if (!ev.hasResponse) unanswered += 1;
      else if (ev.isCorrect) correct += 1;
      else incorrect += 1;
    }
    return { correct, incorrect, unanswered };
  }, [payload]);

  const attempt = payload?.attempt;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        <p>Đang tải bài làm…</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <Link to="/dashboard/history">
          <Button variant="ghost" className="text-slate-300 hover:bg-white/10 gap-2">
            <ArrowLeft className="w-4 h-4" /> Về lịch sử
          </Button>
        </Link>
        <Card className="border-red-400/40 bg-red-950/20 backdrop-blur-xl">
          <CardContent className="py-10 text-center text-red-200">{error ?? "Không có dữ liệu."}</CardContent>
        </Card>
      </div>
    );
  }

  const durationLabel =
    attempt.duration_seconds != null
      ? `${Math.round(attempt.duration_seconds / 60)} phút`
      : attempt.finished_at
        ? "—"
        : "Đang làm dở";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link to="/dashboard/history">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 text-slate-300 hover:text-slate-100 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Xem lại bài làm
            </h2>
            <p className="text-slate-400 mt-1">{attempt.quiz_title}</p>
            <p className="text-xs text-slate-500 mt-2">
              Lần thi #{attempt.id} · Quiz #{attempt.quiz_id}
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-indigo-600/90 to-purple-600/90 text-white border-none shadow-2xl hover:shadow-indigo-500/50 animate-slide-up">
        <CardContent className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h3 className="text-indigo-200 font-semibold mb-2">Điểm</h3>
            <div className="text-5xl sm:text-6xl font-bold italic">
              {scoreLabel(attempt.score)}
            </div>
            <p className="text-sm text-indigo-200/90 mt-2">
              Bắt đầu {formatDt(attempt.started_at)}
              {attempt.finished_at ? ` · Nộp ${formatDt(attempt.finished_at)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-8 justify-center lg:justify-end text-center">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 min-w-[5.5rem]">
              <div className="text-3xl font-bold text-emerald-300">{summary.correct}</div>
              <div className="text-xs text-indigo-200 mt-2 font-semibold">Đúng</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 min-w-[5.5rem]">
              <div className="text-3xl font-bold text-red-300">{summary.incorrect}</div>
              <div className="text-xs text-indigo-200 mt-2 font-semibold">Sai</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 min-w-[5.5rem]">
              <div className="text-3xl font-bold text-slate-300">{summary.unanswered}</div>
              <div className="text-xs text-indigo-200 mt-2 font-semibold">Chưa trả lời</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 min-w-[5.5rem]">
              <div className="text-3xl font-bold text-purple-300">{durationLabel}</div>
              <div className="text-xs text-indigo-200 mt-2 font-semibold">Thời gian</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mt-4 mb-2">
          Chi tiết từng câu
        </h3>

        {(!payload.questions || payload.questions.length === 0) && (
          <p className="text-slate-400">Không có snapshot câu hỏi cho lần thi này.</p>
        )}

        {payload.questions?.map((question, qi) => {
          const ev = evaluateQuestion(question);
          const Icon = !ev.hasResponse ? MinusCircle : ev.isCorrect ? CheckCircle2 : XCircle;
          const iconClass = !ev.hasResponse
            ? "text-slate-400"
            : ev.isCorrect
              ? "text-emerald-400"
              : "text-red-400";
          const borderClass = !ev.hasResponse
            ? "border-slate-500/30"
            : ev.isCorrect
              ? "border-emerald-400/30"
              : "border-red-400/30";

          return (
            <Card
              key={question.id}
              className={`${borderClass} bg-gradient-to-br from-slate-800/40 to-slate-900/50 backdrop-blur-xl shadow-xl animate-slide-up`}
              style={{ animationDelay: `${Math.min(qi, 8) * 50}ms` }}
            >
              <CardHeader className="pb-2 flex flex-row items-start gap-4 space-y-0">
                <Icon className={`w-6 h-6 shrink-0 mt-1 ${iconClass}`} />
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-100 leading-relaxed">
                    {question.content}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Loại: {question.type}</p>
                </div>
              </CardHeader>
              <CardContent className="pl-4 sm:pl-16 space-y-2">
                {question.options?.map((opt) => {
                  const userPicked = opt.selected;
                  const showAsCorrect = opt.is_correct;
                  let box =
                    "p-3 rounded-lg border font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ";
                  if (userPicked && showAsCorrect) {
                    box +=
                      "bg-emerald-500/25 border-emerald-400/50 text-emerald-100";
                  } else if (userPicked && !showAsCorrect) {
                    box += "bg-red-500/25 border-red-400/50 text-red-100";
                  } else if (!userPicked && showAsCorrect) {
                    box +=
                      "bg-emerald-500/15 border-emerald-400/40 text-emerald-200/90";
                  } else {
                    box += "bg-white/5 border-white/10 text-slate-400";
                  }

                  return (
                    <div key={opt.id} className={box}>
                      <span>{opt.content}</span>
                      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-bold shrink-0">
                        {userPicked && (
                          <span className={showAsCorrect ? "text-emerald-300" : "text-red-300"}>
                            Bạn chọn
                          </span>
                        )}
                        {showAsCorrect && <span className="text-emerald-400">Đáp án đúng</span>}
                      </div>
                      {opt.answer?.text_answer && (
                        <p className="text-sm text-slate-300 w-full mt-1 font-normal normal-case tracking-normal">
                          Nội dung: {opt.answer.text_answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
