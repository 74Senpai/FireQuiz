import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Eye, Clock, Calendar, Users, FileText, Loader2 } from "lucide-react";
import * as quizService from "@/services/quizServices";

type PreviewAnswer = {
  id: number;
  content: string;
  is_correct: boolean;
};

type PreviewQuestion = {
  id: number;
  content: string;
  type: string;
  answers?: PreviewAnswer[];
};

type PreviewQuiz = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  grading_scale: number | null;
  time_limit_seconds: number | null;
  available_from: string | null;
  available_until: string | null;
  max_attempts: number | null;
  created_at: string;
};

type PreviewPayload = {
  quiz: PreviewQuiz;
  questions: PreviewQuestion[];
};

type QuizPreviewModalProps = {
  open: boolean;
  quizId: number | null;
  onClose: () => void;
};

export function QuizPreviewModal({ open, quizId, onClose }: QuizPreviewModalProps) {
  const [data, setData] = useState<PreviewPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !quizId) return;

    let isMounted = true;

    const fetchPreview = async () => {
      setIsLoading(true);
      setError("");

      try {
        const preview = await quizService.getQuizPreview(quizId);
        if (isMounted) {
          setData(preview);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || "Không thể tải dữ liệu xem trước.");
          setData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [open, quizId]);

  const timeLimitLabel = useMemo(() => {
    const seconds = data?.quiz.time_limit_seconds;
    if (!seconds) return "Không giới hạn";
    return `${Math.floor(seconds / 60)} phút`;
  }, [data]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Xem trước đề thi</h3>
              <p className="text-sm text-slate-400">Bản xem nhanh dành cho chủ Quiz</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-slate-300">
              <Loader2 className="mb-4 h-10 w-10 animate-spin" />
              <p>Đang tải dữ liệu xem trước...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-6">
              <Card className="border-white/10 bg-white/5 text-white shadow-none hover:translate-y-0 hover:shadow-none">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl text-white">{data.quiz.title}</CardTitle>
                      <CardDescription className="max-w-3xl text-slate-300">
                        {data.quiz.description || "Chưa có mô tả cho đề thi này."}
                      </CardDescription>
                    </div>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                      {data.quiz.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-2 flex items-center gap-2 text-indigo-300">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-semibold">Thời gian</span>
                    </div>
                    <p className="text-sm text-slate-200">{timeLimitLabel}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-2 flex items-center gap-2 text-purple-300">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-semibold">Số lượt thi</span>
                    </div>
                    <p className="text-sm text-slate-200">{data.quiz.max_attempts ?? "Không giới hạn"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-2 flex items-center gap-2 text-pink-300">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-semibold">Mở thi</span>
                    </div>
                    <p className="text-sm text-slate-200">
                      {data.quiz.available_from
                        ? new Date(data.quiz.available_from).toLocaleString("vi-VN")
                        : "Chưa đặt"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-2 flex items-center gap-2 text-emerald-300">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-semibold">Số câu hỏi</span>
                    </div>
                    <p className="text-sm text-slate-200">{data.questions.length} câu</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {data.questions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-slate-400">
                    Quiz này chưa có câu hỏi để xem trước.
                  </div>
                ) : (
                  data.questions.map((question, index) => (
                    <Card
                      key={question.id}
                      className="border-white/10 bg-white/5 text-white shadow-none hover:translate-y-0 hover:shadow-none"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
                            {index + 1}
                          </span>
                          <div className="space-y-1">
                            <CardTitle className="text-lg leading-relaxed text-white">
                              {question.content}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                              Loại câu hỏi: {question.type}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(question.answers || []).map((answer) => (
                          <div
                            key={answer.id}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-slate-200"
                          >
                            <span className="h-4 w-4 rounded-full border border-slate-500"></span>
                            <span>{answer.content}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
