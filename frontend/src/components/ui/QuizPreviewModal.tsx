import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  Eye,
  FileQuestion,
  Loader2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

interface PreviewAnswer {
  id: number;
  content: string;
  is_correct: boolean;
}

interface PreviewQuestion {
  id: number;
  content: string;
  type: string;
  answers: PreviewAnswer[];
}

interface PreviewQuiz {
  id: number;
  title: string;
  description: string | null;
  status: string;
  grading_scale: number | null;
  time_limit_seconds: number | null;
  available_from: string | null;
  available_until: string | null;
  max_attempts: number | null;
  quiz_code: string | null;
}

interface PreviewResponse {
  quiz: PreviewQuiz;
  questions: PreviewQuestion[];
}

interface QuizPreviewModalProps {
  quizId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = process.env.API_URL || "http://localhost:8080/api";

const formatDateTime = (value: string | null) => {
  if (!value) return "Khong gioi han";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function QuizPreviewModal({
  quizId,
  isOpen,
  onClose,
}: QuizPreviewModalProps) {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !quizId) return;

    let ignore = false;

    const fetchPreview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_URL}/quiz/${quizId}/preview`, {
          withCredentials: true,
        });

        if (!ignore) {
          setPreview(response.data);
        }
      } catch (err: any) {
        if (!ignore) {
          setPreview(null);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Khong the tai che do xem truoc quiz."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      ignore = true;
    };
  }, [isOpen, quizId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-indigo-300">
              <Eye className="h-4 w-4" />
              Xem truoc de thi
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">
              {preview?.quiz.title || "Dang tai quiz..."}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Dong xem truoc"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-slate-400">
              <Loader2 className="mb-3 h-8 w-8 animate-spin" />
              <p>Dang tai du lieu xem truoc...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
              {error}
            </div>
          ) : preview ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PreviewInfoCard
                  icon={<Clock className="h-4 w-4 text-indigo-300" />}
                  label="Thoi gian lam bai"
                  value={
                    preview.quiz.time_limit_seconds
                      ? `${Math.floor(preview.quiz.time_limit_seconds / 60)} phut`
                      : "Khong gioi han"
                  }
                />
                <PreviewInfoCard
                  icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
                  label="Thang diem"
                  value={
                    preview.quiz.grading_scale
                      ? `${preview.quiz.grading_scale} diem`
                      : "Mac dinh"
                  }
                />
                <PreviewInfoCard
                  icon={<Users className="h-4 w-4 text-purple-300" />}
                  label="So luot thi toi da"
                  value={
                    preview.quiz.max_attempts
                      ? `${preview.quiz.max_attempts} luot`
                      : "Khong gioi han"
                  }
                />
                <PreviewInfoCard
                  icon={<FileQuestion className="h-4 w-4 text-amber-300" />}
                  label="So cau hoi"
                  value={`${preview.questions.length} cau`}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Calendar className="h-4 w-4 text-pink-300" />
                    Lich mo de
                  </div>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>Mo de: {formatDateTime(preview.quiz.available_from)}</p>
                    <p>Dong de: {formatDateTime(preview.quiz.available_until)}</p>
                    <p>Ma quiz: {preview.quiz.quiz_code || "Chua tao"}</p>
                    <p>Trang thai: {preview.quiz.status}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 text-sm font-semibold text-slate-200">
                    Mo ta
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {preview.quiz.description || "Quiz nay chua co mo ta."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {preview.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                          Cau {index + 1}
                        </div>
                        <h4 className="mt-1 text-base font-semibold text-white">
                          {question.content}
                        </h4>
                      </div>
                      <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs text-slate-300">
                        {question.type}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {question.answers?.map((answer) => (
                        <div
                          key={answer.id}
                          className={`rounded-xl border p-3 text-sm ${
                            answer.is_correct
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                              : "border-white/10 bg-slate-950/30 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{answer.content}</span>
                            {answer.is_correct && (
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                                Dap an dung
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PreviewInfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
