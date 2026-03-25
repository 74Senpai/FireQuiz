import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart3,
  CheckCircle,
  Clock,
  Crown,
  FileDown,
  Filter,
  Loader2,
  Medal,
  RefreshCw,
  Search,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuestionAnalytics } from "@/components/ui/QuestionAnalytics";

interface Quiz {
  id: number;
  title: string;
  status: string;
  quiz_code: string;
}

interface AttemptUser {
  id: number;
  fullName: string;
  email: string;
}

interface AttemptResult {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  score: number | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  submitStatus: "SUBMITTED" | "IN_PROGRESS";
  user: AttemptUser;
}

interface QuizStats {
  totalAttempts: number;
  submittedCount: number;
  inProgressCount: number;
  avgScore: number | null;
  maxScore: number | null;
  minScore: number | null;
}

interface LeaderboardEntry {
  rank: number;
  attemptId: number;
  quizId: number;
  quizTitle: string;
  score: number | null;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number | null;
  user: AttemptUser;
}

interface Filters {
  search: string;
  minScore: string;
  maxScore: string;
  startDate: string;
  endDate: string;
  status: string;
}

const API_URL = process.env.API_URL || "http://localhost:8080/api";

const EMPTY_FILTERS: Filters = {
  search: "",
  minScore: "",
  maxScore: "",
  startDate: "",
  endDate: "",
  status: "",
};

const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getScoreColor = (score: number | null): string => {
  if (score === null) return "text-slate-400";
  if (score >= 8) return "text-emerald-400 font-bold";
  if (score >= 5) return "text-amber-400 font-bold";
  return "text-rose-400 font-bold";
};

const getLeaderboardAccent = (rank: number) => {
  if (rank === 1) {
    return {
      className: "border-yellow-400/30 bg-yellow-500/10",
      icon: <Crown className="h-4 w-4 text-yellow-300" />,
      label: "Top 1",
    };
  }

  if (rank === 2) {
    return {
      className: "border-slate-300/20 bg-slate-400/10",
      icon: <Medal className="h-4 w-4 text-slate-200" />,
      label: "Top 2",
    };
  }

  if (rank === 3) {
    return {
      className: "border-amber-500/30 bg-amber-500/10",
      icon: <Medal className="h-4 w-4 text-amber-300" />,
      label: "Top 3",
    };
  }

  return {
    className: "border-white/10 bg-white/5",
    icon: <Trophy className="h-4 w-4 text-slate-300" />,
    label: `Top ${rank}`,
  };
};

const buildQueryParams = (filters: Filters) => {
  const queryParams = new URLSearchParams();

  if (filters.search) queryParams.set("search", filters.search.trim());
  if (filters.minScore) queryParams.set("minScore", filters.minScore);
  if (filters.maxScore) queryParams.set("maxScore", filters.maxScore);
  if (filters.startDate) queryParams.set("startDate", filters.startDate);
  if (filters.endDate) queryParams.set("endDate", filters.endDate);
  if (filters.status) queryParams.set("status", filters.status);

  return queryParams;
};

export function Results() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardTotalParticipants, setLeaderboardTotalParticipants] = useState(0);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    setIsLoadingQuizzes(true);
    setQuizzesError(null);

    try {
      const response = await axios.get(`${API_URL}/quiz/myquiz`, {
        withCredentials: true,
      });

      const quizList: Quiz[] = response.data.data || [];
      setQuizzes(quizList);
      setSelectedQuizId((current) => {
        if (current && quizList.some((quiz) => quiz.id === current)) {
          return current;
        }
        return quizList[0]?.id ?? null;
      });
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      } else {
        setQuizzesError(
          error.response?.data?.message ||
            error.message ||
            "Không thể tải danh sách quiz."
        );
      }
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, [navigate]);

  const fetchResults = useCallback(async () => {
    if (!selectedQuizId) return;

    setIsLoadingResults(true);
    setResultsError(null);
    setLeaderboardError(null);

    try {
      const queryParams = buildQueryParams(appliedFilters);
      const queryString = queryParams.toString();
      const resultsUrl = queryString
        ? `${API_URL}/result/quiz/${selectedQuizId}?${queryString}`
        : `${API_URL}/result/quiz/${selectedQuizId}`;

      const [resultsRes, statsRes, leaderboardRes] = await Promise.allSettled([
        axios.get(resultsUrl, { withCredentials: true }),
        axios.get(`${API_URL}/result/quiz/${selectedQuizId}/stats`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/result/quiz/${selectedQuizId}/leaderboard`, {
          withCredentials: true,
        }),
      ]);

      const authError = [resultsRes, statsRes, leaderboardRes].find(
        (response) =>
          response.status === "rejected" &&
          (response.reason?.response?.status === 401 ||
            response.reason?.response?.status === 403)
      );

      if (authError) {
        navigate("/login");
        return;
      }

      if (resultsRes.status === "fulfilled") {
        setResults(resultsRes.value.data.data || []);
      } else {
        throw resultsRes.reason;
      }

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.data || null);
      } else {
        throw statsRes.reason;
      }

      if (leaderboardRes.status === "fulfilled") {
        setLeaderboard(leaderboardRes.value.data.data || []);
        setLeaderboardTotalParticipants(
          Number(leaderboardRes.value.data.totalParticipants) || 0
        );
      } else {
        setLeaderboard([]);
        setLeaderboardTotalParticipants(0);
        setLeaderboardError(
          leaderboardRes.reason?.response?.data?.message ||
            leaderboardRes.reason?.message ||
            "Không thể tải bảng xếp hạng."
        );
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      } else {
        setResultsError(
          error.response?.data?.message ||
            error.message ||
            "Không thể tải kết quả quiz."
        );
      }
      setResults([]);
      setStats(null);
      setLeaderboard([]);
      setLeaderboardTotalParticipants(0);
    } finally {
      setIsLoadingResults(false);
    }
  }, [appliedFilters, navigate, selectedQuizId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleApplyFilters();
    }
  };

  const handleExport = async () => {
    if (!selectedQuizId) return;

    setIsExporting(true);

    try {
      const queryString = buildQueryParams(appliedFilters).toString();
      const exportUrl = queryString
        ? `${API_URL}/result/quiz/${selectedQuizId}/export?${queryString}`
        : `${API_URL}/result/quiz/${selectedQuizId}/export`;

      const response = await axios.get(exportUrl, {
        withCredentials: true,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      let filename = `KetQuaQuiz_${selectedQuizId}.xlsx`;
      const contentDisposition = response.headers["content-disposition"];
      const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/);
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1];
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      } else {
        setResultsError(
          error.response?.data?.message ||
            error.message ||
            "Không thể xuất file Excel."
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId);
  const hasActiveFilters = Object.values(appliedFilters).some((value) => value !== "");

  if (isLoadingQuizzes) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-400">
        <Loader2 className="mb-4 h-10 w-10 animate-spin" />
        <p>Đang tải danh sách quiz...</p>
      </div>
    );
  }

  if (quizzesError) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Kết quả Quiz
          </h2>
          <p className="mt-1 text-slate-400">Xem và phân tích kết quả thí sinh.</p>
        </div>

        <div className="rounded-2xl border border-red-200/20 bg-red-50/10 py-20 text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <p className="text-lg font-medium text-red-400">
            Không thể tải danh sách quiz
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-red-300">
            {quizzesError}
          </p>
          <Button
            onClick={fetchQuizzes}
            className="mt-4 bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Kết quả Quiz
          </h2>
          <p className="mt-1 text-slate-400">Xem và phân tích kết quả thí sinh.</p>
        </div>

        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-20 text-center">
          <BarChart3 className="mx-auto mb-4 h-16 w-16 text-slate-600" />
          <p className="text-lg text-slate-400">Bạn chưa có quiz nào.</p>
          <p className="mt-2 text-sm text-slate-500">
            Hãy tạo quiz trước để xem kết quả thí sinh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="inline-block bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Kết quả Quiz
          </h2>
          <p className="mt-1 text-slate-400">
            Xem và phân tích kết quả thí sinh theo từng bài thi.
          </p>
        </div>

        <Button
          onClick={fetchResults}
          disabled={isLoadingResults}
          variant="ghost"
          className="gap-2 text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoadingResults ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            Chọn quiz để xem kết quả
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedQuizId ?? ""}
            onChange={(event) => {
              setSelectedQuizId(Number(event.target.value));
              setFilters(EMPTY_FILTERS);
              setAppliedFilters(EMPTY_FILTERS);
            }}
            className="h-10 w-full max-w-md cursor-pointer rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {quizzes.map((quiz) => (
              <option
                key={quiz.id}
                value={quiz.id}
                className="bg-slate-800 text-slate-100"
              >
                {quiz.title}
                {quiz.quiz_code ? ` (#${quiz.quiz_code})` : ""}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={<Users className="h-5 w-5 text-indigo-400" />}
            label="Tổng lượt thi"
            value={stats.totalAttempts}
            color="indigo"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
            label="Đã nộp bài"
            value={stats.submittedCount}
            color="emerald"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-amber-400" />}
            label="Đang làm"
            value={stats.inProgressCount}
            color="amber"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
            label="Điểm TB"
            value={stats.avgScore !== null ? stats.avgScore.toFixed(2) : "—"}
            color="purple"
          />
          <StatCard
            icon={<Trophy className="h-5 w-5 text-yellow-400" />}
            label="Cao nhất"
            value={stats.maxScore !== null ? stats.maxScore : "—"}
            color="yellow"
          />
          <StatCard
            icon={<XCircle className="h-5 w-5 text-rose-400" />}
            label="Thấp nhất"
            value={stats.minScore !== null ? stats.minScore : "—"}
            color="rose"
          />
        </div>
      )}

      {selectedQuizId && (
        <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Bảng xếp hạng Top 10
              {selectedQuiz && (
                <span className="ml-1 text-sm font-normal text-slate-400">
                  — {selectedQuiz.title}
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
                    {leaderboardTotalParticipants}
                  </span>
                  .
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {selectedQuizId && (
        <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              Thống kê chuyên sâu câu hỏi
              {selectedQuiz && (
                <span className="ml-1 text-sm font-normal text-slate-400">
                  — {selectedQuiz.title}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionAnalytics quizId={selectedQuizId} />
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
            <Users className="h-4 w-4 text-purple-400" />
            Danh sách thí sinh
            {selectedQuiz && (
              <span className="ml-1 text-sm font-normal text-slate-400">
                — {selectedQuiz.title}
              </span>
            )}
          </CardTitle>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  onKeyDown={handleSearchKeyDown}
                  className="border-white/20 bg-white/10 pl-9 text-slate-100 placeholder:text-slate-400"
                  placeholder="Tìm theo tên hoặc email thí sinh..."
                />
              </div>

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="h-10 min-w-[160px] rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="" className="bg-slate-800">
                  Tất cả trạng thái
                </option>
                <option value="SUBMITTED" className="bg-slate-800">
                  Đã nộp bài
                </option>
                <option value="IN_PROGRESS" className="bg-slate-800">
                  Đang làm bài
                </option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 flex-shrink-0 text-slate-400" />

              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-xs text-slate-400">
                  Điểm từ:
                </label>
                <Input
                  name="minScore"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={filters.minScore}
                  onChange={handleFilterChange}
                  className="w-20 border-white/20 bg-white/10 text-sm text-slate-100"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-xs text-slate-400">
                  đến:
                </label>
                <Input
                  name="maxScore"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={filters.maxScore}
                  onChange={handleFilterChange}
                  className="w-20 border-white/20 bg-white/10 text-sm text-slate-100"
                  placeholder="10"
                />
              </div>

              <div className="hidden h-6 w-px bg-white/20 sm:block" />

              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-xs text-slate-400">
                  Từ ngày:
                </label>
                <Input
                  name="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-36 border-white/20 bg-white/10 text-sm text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-xs text-slate-400">
                  Đến ngày:
                </label>
                <Input
                  name="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-36 border-white/20 bg-white/10 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleApplyFilters}
                disabled={isLoadingResults}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-sm shadow-lg hover:from-indigo-700 hover:to-purple-700"
              >
                {isLoadingResults ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                Áp dụng bộ lọc
              </Button>

              <Button
                onClick={handleExport}
                disabled={isLoadingResults || isExporting || results.length === 0}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-sm shadow-lg hover:from-emerald-700 hover:to-teal-700"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Xuất Excel
              </Button>

              <Button
                onClick={handleResetFilters}
                variant="ghost"
                className="gap-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <XCircle className="h-4 w-4" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingResults ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="mb-3 h-8 w-8 animate-spin" />
              <p className="text-sm">Đang tải kết quả...</p>
            </div>
          ) : resultsError ? (
            <div className="rounded-lg border border-red-200/20 bg-red-50/10 py-16 text-center">
              <XCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
              <p className="text-base font-medium text-red-400">
                Không thể tải kết quả
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-red-300">
                {resultsError}
              </p>
              <Button
                onClick={fetchResults}
                className="mt-4 bg-red-600 hover:bg-red-700"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Thử lại
              </Button>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="text-base">Không có kết quả nào.</p>
              <p className="mt-1 text-sm text-slate-500">
                {hasActiveFilters
                  ? "Thử thay đổi bộ lọc để xem thêm kết quả."
                  : "Chưa có thí sinh nào tham gia quiz này."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden overflow-x-auto rounded-lg border border-white/20">
              <table className="min-w-[700px] w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">#</th>
                    <th className="px-5 py-3 font-medium">Tên thí sinh</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Điểm số</th>
                    <th className="px-5 py-3 font-medium">Thời gian làm</th>
                    <th className="px-5 py-3 font-medium">Thời gian nộp</th>
                    <th className="px-5 py-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {results.map((item, index) => (
                    <tr
                      key={item.attemptId}
                      className="bg-white/5 transition-colors duration-200 hover:bg-white/10"
                    >
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-100">
                        {item.user.fullName}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {item.user.email}
                      </td>
                      <td className={`px-5 py-4 ${getScoreColor(item.score)}`}>
                        {item.score !== null ? item.score : "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {formatDuration(item.durationSeconds)}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {formatDateTime(item.finishedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.submitStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-white/10 bg-white/5 px-5 py-3 text-xs text-slate-400">
                Hiển thị{" "}
                <span className="font-semibold text-slate-200">
                  {results.length}
                </span>{" "}
                kết quả
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "indigo" | "emerald" | "amber" | "purple" | "yellow" | "rose";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorMap: Record<StatCardProps["color"], string> = {
    indigo: "border-indigo-500/30 bg-indigo-500/10",
    emerald: "border-emerald-500/30 bg-emerald-500/10",
    amber: "border-amber-500/30 bg-amber-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    yellow: "border-yellow-500/30 bg-yellow-500/10",
    rose: "border-rose-500/30 bg-rose-500/10",
  };

  return (
    <div className={`rounded-xl border p-4 backdrop-blur-sm ${colorMap[color]}`}>
      <div className="mb-2 flex items-center gap-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

interface StatusBadgeProps {
  status: "SUBMITTED" | "IN_PROGRESS";
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        Đã nộp
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
      <Clock className="h-3 w-3" />
      Đang làm
    </span>
  );
}
