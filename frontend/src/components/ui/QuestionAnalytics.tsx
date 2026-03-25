import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BarChart3, CheckCircle2, Loader2 } from "lucide-react";

interface OptionStat {
  optionId: number;
  optionContent: string;
  isCorrect: boolean;
  selectionCount: number;
  selectionRate: number;
}

type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | "NO_DATA";

interface QuestionAnalytic {
  questionId: number;
  questionContent: string;
  questionType: string;
  totalAttempts: number;
  submittedAttempts: number;
  exposureCount: number;
  totalResponses: number;
  correctResponses: number;
  incorrectResponses: number;
  skippedResponses: number;
  responseRate: number;
  responseRateOnSubmittedAttempts: number;
  correctRate: number;
  incorrectRate: number;
  skippedRate: number;
  difficulty: DifficultyLevel;
  options: OptionStat[];
}

interface QuestionAnalyticsProps {
  quizId: number;
}

const API_URL = process.env.API_URL || "http://localhost:8080/api";

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
  NO_DATA: "Chưa có dữ liệu",
};

const DIFFICULTY_CLASSES: Record<DifficultyLevel, string> = {
  EASY: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  MEDIUM: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  HARD: "border-rose-500/30 bg-rose-500/15 text-rose-300",
  NO_DATA: "border-slate-500/30 bg-slate-500/15 text-slate-300",
};

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

export function QuestionAnalytics({ quizId }: QuestionAnalyticsProps) {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<QuestionAnalytic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;

    let ignore = false;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${API_URL}/result/quiz/${quizId}/question-analytics`,
          { withCredentials: true }
        );

        if (ignore) return;

        const nextData = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];

        setAnalytics(nextData);
      } catch (err: any) {
        if (ignore) return;

        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/login");
          return;
        }

        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Không thể tải dữ liệu thống kê câu hỏi.";
        setError(errorMessage);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      ignore = true;
    };
  }, [quizId, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center text-slate-400">
        <Loader2 className="mb-3 h-8 w-8 animate-spin" />
        <p>Đang tải thống kê chuyên sâu câu hỏi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-400" />
        <p className="font-medium text-red-300">Không thể tải thống kê câu hỏi</p>
        <p className="mt-2 text-sm text-red-200/80">{error}</p>
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
        <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-50" />
        <p>Chưa có dữ liệu đủ để phân tích độ khó câu hỏi.</p>
        <p className="mt-2 text-sm text-slate-500">
          Hệ thống chỉ thống kê các câu hỏi có thể chấm tự động trên lượt thi đã nộp.
        </p>
      </div>
    );
  }

  const overviewData = analytics.map((item, index) => ({
    name: `C${index + 1}`,
    fullName: `Câu ${index + 1}`,
    content: item.questionContent,
    correctPercent: Number((item.correctRate * 100).toFixed(1)),
    incorrectPercent: Number((item.incorrectRate * 100).toFixed(1)),
    skippedPercent: Number((item.skippedRate * 100).toFixed(1)),
    responsePercent: Number((item.responseRate * 100).toFixed(1)),
    submittedAttempts: item.submittedAttempts,
  }));

  const averageCorrectRate =
    analytics.reduce((sum, item) => sum + item.correctRate, 0) / analytics.length;
  const averageResponseRate =
    analytics.reduce((sum, item) => sum + item.responseRate, 0) / analytics.length;
  const hardQuestionCount = analytics.filter(
    (item) => item.difficulty === "HARD"
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Câu hỏi được chấm tự động"
          value={`${analytics.length}`}
          helper="Đã loại các câu tự luận khỏi biểu đồ đúng/sai."
        />
        <SummaryCard
          label="Tỷ lệ đúng trung bình"
          value={percent(averageCorrectRate)}
          helper="Dùng lượt thi đã nộp có chứa câu hỏi làm mẫu số."
        />
        <SummaryCard
          label="% phản hồi trên tổng lượt thi"
          value={percent(averageResponseRate)}
          helper={`${hardQuestionCount} câu hiện có độ khó cao.`}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-100">
            Biểu đồ tỷ lệ đúng / sai / bỏ qua theo từng câu hỏi
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            `Đúng/Sai/Bỏ qua` dùng lượt thi đã nộp làm mẫu số. `% phản hồi` trong tooltip
            dùng tổng lượt thi.
          </p>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer>
            <BarChart
              data={overviewData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              barCategoryGap={16}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.12} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={48}
                tick={{ fill: "#e2e8f0", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: 12,
                  color: "#e2e8f0",
                }}
                formatter={(value: number, label: string) => [`${value}%`, label]}
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload;
                  if (!point) return "";
                  return `${point.fullName}: ${point.content}`;
                }}
              />
              <Bar
                dataKey="correctPercent"
                stackId="performance"
                fill="#22c55e"
                radius={[6, 0, 0, 6]}
                name="Đúng"
              />
              <Bar
                dataKey="incorrectPercent"
                stackId="performance"
                fill="#ef4444"
                name="Sai"
              />
              <Bar
                dataKey="skippedPercent"
                stackId="performance"
                fill="#64748b"
                radius={[0, 6, 6, 0]}
                name="Bỏ qua"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        {analytics.map((item, index) => (
          <div
            key={item.questionId}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                    Câu {index + 1}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${DIFFICULTY_CLASSES[item.difficulty]}`}
                  >
                    {DIFFICULTY_LABELS[item.difficulty]}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-slate-100">
                  {item.questionContent}
                </h4>
              </div>

              <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:min-w-[360px]">
                <MetricLine label="Lượt thi" value={`${item.totalAttempts}`} />
                <MetricLine label="Đã nộp" value={`${item.submittedAttempts}`} />
                <MetricLine
                  label="% phản hồi / tổng lượt thi"
                  value={percent(item.responseRate)}
                />
                <MetricLine label="Tỷ lệ đúng" value={percent(item.correctRate)} />
                <MetricLine
                  label="Tỷ lệ sai"
                  value={percent(item.incorrectRate)}
                />
                <MetricLine
                  label="Tỷ lệ bỏ qua"
                  value={percent(item.skippedRate)}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <RateBox
                label="Đúng"
                value={`${item.correctResponses}/${item.exposureCount}`}
                percentValue={item.correctRate}
                barClass="bg-emerald-500"
              />
              <RateBox
                label="Sai"
                value={`${item.incorrectResponses}/${item.exposureCount}`}
                percentValue={item.incorrectRate}
                barClass="bg-rose-500"
              />
              <RateBox
                label="Bỏ qua"
                value={`${item.skippedResponses}/${item.exposureCount}`}
                percentValue={item.skippedRate}
                barClass="bg-slate-500"
              />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-indigo-300" />
                Phân bố lựa chọn
              </div>

              {item.options.map((option) => (
                <div key={option.optionId} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                          option.isCorrect
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-slate-500/30 bg-slate-500/15 text-slate-300"
                        }`}
                      >
                        {option.isCorrect ? "Đáp án đúng" : "Phương án nhiễu"}
                      </span>
                      <span className="text-slate-200">{option.optionContent}</span>
                    </div>
                    <span className="text-slate-400">
                      {option.selectionCount} lượt chọn ({percent(option.selectionRate)})
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        option.isCorrect ? "bg-emerald-500" : "bg-slate-500"
                      }`}
                      style={{
                        width: `${Math.min(option.selectionRate * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function RateBox({
  label,
  value,
  percentValue,
  barClass,
}: {
  label: string;
  value: string;
  percentValue: number;
  barClass: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-slate-100">{value}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.min(percentValue * 100, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">{percent(percentValue)}</p>
    </div>
  );
}
