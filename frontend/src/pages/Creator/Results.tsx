import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BarChart3, Loader2, RefreshCw, XCircle } from "lucide-react";

import { LeaderboardCard } from "@/components/results/LeaderboardCard";
import { QuestionAnalyticsCard } from "@/components/results/QuestionAnalyticsCard";
import { QuizSelectorCard } from "@/components/results/QuizSelectorCard";
import { ResultsTableCard } from "@/components/results/ResultsTableCard";
import { StatsGrid } from "@/components/results/StatsGrid";
import {
  EMPTY_FILTERS,
  type AttemptResult,
  type Filters,
  type LeaderboardEntry,
  type Quiz,
  type QuizStats,
} from "@/components/results/types";
import { Button } from "@/components/ui/button";

const API_URL = process.env.API_URL || "http://localhost:8080/api";

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

  const handleSelectedQuizChange = (quizId: number) => {
    setSelectedQuizId(quizId);
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
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

      <QuizSelectorCard
        quizzes={quizzes}
        selectedQuizId={selectedQuizId}
        onChange={handleSelectedQuizChange}
      />

      <StatsGrid stats={stats} />

      {selectedQuizId && (
        <LeaderboardCard
          quizTitle={selectedQuiz?.title}
          leaderboard={leaderboard}
          leaderboardError={leaderboardError}
          totalParticipants={leaderboardTotalParticipants}
        />
      )}

      {selectedQuizId && (
        <QuestionAnalyticsCard
          quizId={selectedQuizId}
          quizTitle={selectedQuiz?.title}
        />
      )}

      <ResultsTableCard
        quizTitle={selectedQuiz?.title}
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        isLoadingResults={isLoadingResults}
        isExporting={isExporting}
        results={results}
        resultsError={resultsError}
        onFilterChange={handleFilterChange}
        onSearchKeyDown={handleSearchKeyDown}
        onApplyFilters={handleApplyFilters}
        onExport={handleExport}
        onResetFilters={handleResetFilters}
        onRetry={fetchResults}
      />
    </div>
  );
}
