/**
 * Results.tsx
 * -------------------------------------------------------
 * Trang "Dashboard kết quả Quiz" dành cho Chủ Quiz (Creator).
 *
 * Chức năng chính:
 *  1. Hiển thị danh sách quiz của chủ quiz để chọn xem kết quả
 *  2. Hiển thị thống kê tổng quan (tổng lượt thi, điểm TB, ...)
 *  3. Bảng danh sách thí sinh với đầy đủ thông tin kết quả
 *  4. Lọc theo: điểm số, thời gian nộp bài, trạng thái nộp bài
 *  5. Tìm kiếm theo tên hoặc email thí sinh
 * -------------------------------------------------------
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Users,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

/** Thông tin một quiz trong danh sách dropdown */
interface Quiz {
  id: number;
  title: string;
  status: string;
  quiz_code: string;
}

/** Thông tin thí sinh trong một lượt thi */
interface AttemptUser {
  id: number;
  fullName: string;
  email: string;
}

/** Một bản ghi kết quả thi (trả về từ API) */
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

/** Thống kê tổng quan của một quiz */
interface QuizStats {
  totalAttempts: number;
  submittedCount: number;
  inProgressCount: number;
  avgScore: number | null;
  maxScore: number | null;
  minScore: number | null;
}

/** Các tham số lọc */
interface Filters {
  search: string;
  minScore: string;
  maxScore: string;
  startDate: string;
  endDate: string;
  status: string; // '' | 'SUBMITTED' | 'IN_PROGRESS'
}

/**
 * Chuyển đổi số giây thành chuỗi "Xm Ys" dễ đọc.
 * Ví dụ: 3672 → "61m 12s"
 */
const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

/**
 * Chuyển đổi chuỗi datetime thành định dạng ngày giờ Việt Nam.
 * Ví dụ: "2024-03-15T10:30:00Z" → "15/03/2024 17:30"
 */
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

/**
 * Trả về màu sắc badge tương ứng với điểm số.
 * Xanh lá: >= 8, Vàng: >= 5, Đỏ: < 5
 */
const getScoreColor = (score: number | null): string => {
  if (score === null) return "text-slate-400";
  if (score >= 8) return "text-emerald-400 font-bold";
  if (score >= 5) return "text-amber-400 font-bold";
  return "text-rose-400 font-bold";
};

// -------------------------------------------------------
// Component chính
// -------------------------------------------------------

export function Results() {
  const navigate = useNavigate();

  // URL gốc của API backend
  const API_URL = process.env.API_URL || "http://localhost:8080/api";

  // --- State quản lý danh sách quiz ---
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);

  // --- State quản lý dữ liệu kết quả ---
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);

  // --- State quản lý trạng thái loading ---
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // --- State quản lý các bộ lọc ---
  const [filters, setFilters] = useState<Filters>({
    search: "",
    minScore: "",
    maxScore: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  // --- State lưu giá trị filter đang được áp dụng (để tránh gọi API liên tục) ---
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    search: "",
    minScore: "",
    maxScore: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  // -------------------------------------------------------
  // Lấy danh sách quiz của chủ quiz khi component mount
  // -------------------------------------------------------
  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoadingQuizzes(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }
        const response = await axios.get(`${API_URL}/quiz/myquiz`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const quizList: Quiz[] = response.data.data || [];
        setQuizzes(quizList);

        // Tự động chọn quiz đầu tiên nếu có
        if (quizList.length > 0) {
          setSelectedQuizId(quizList[0].id);
        }
      } catch (error: any) {
        console.error("Lỗi lấy danh sách quiz:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/login");
        }
      } finally {
        setIsLoadingQuizzes(false);
      }
    };

    fetchQuizzes();
  }, [navigate, API_URL]);

  // -------------------------------------------------------
  // Lấy kết quả và thống kê khi quiz được chọn hoặc filter thay đổi
  // -------------------------------------------------------
  const fetchResults = useCallback(async () => {
    if (!selectedQuizId) return;

    setIsLoadingResults(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // Xây dựng query params từ các filter đang được áp dụng
      const queryParams = new URLSearchParams();
      if (appliedFilters.search) queryParams.set("search", appliedFilters.search);
      if (appliedFilters.minScore) queryParams.set("minScore", appliedFilters.minScore);
      if (appliedFilters.maxScore) queryParams.set("maxScore", appliedFilters.maxScore);
      if (appliedFilters.startDate) queryParams.set("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) queryParams.set("endDate", appliedFilters.endDate);
      if (appliedFilters.status) queryParams.set("status", appliedFilters.status);

      const headers = { Authorization: `Bearer ${token}` };

      // Gọi song song 2 API: danh sách kết quả + thống kê tổng quan
      const [resultsRes, statsRes] = await Promise.all([
        axios.get(
          `${API_URL}/result/quiz/${selectedQuizId}?${queryParams.toString()}`,
          { headers }
        ),
        axios.get(`${API_URL}/result/quiz/${selectedQuizId}/stats`, { headers }),
      ]);

      setResults(resultsRes.data.data || []);
      setStats(statsRes.data);
    } catch (error: any) {
      console.error("Lỗi lấy kết quả quiz:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
      // Reset dữ liệu nếu có lỗi
      setResults([]);
      setStats(null);
    } finally {
      setIsLoadingResults(false);
    }
  }, [selectedQuizId, appliedFilters, navigate, API_URL]);

  // Gọi fetchResults mỗi khi quiz được chọn hoặc filter thay đổi
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // -------------------------------------------------------
  // Xử lý sự kiện
  // -------------------------------------------------------

  /** Cập nhật giá trị filter khi người dùng thay đổi input */
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  /** Áp dụng filter - gọi API với filter mới */
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  /** Xóa tất cả filter và reset về trạng thái ban đầu */
  const handleResetFilters = () => {
    const emptyFilters: Filters = {
      search: "",
      minScore: "",
      maxScore: "",
      startDate: "",
      endDate: "",
      status: "",
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  /** Xử lý khi người dùng nhấn Enter trong ô tìm kiếm */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyFilters();
    }
  };

  // -------------------------------------------------------
  // Render: Loading state khi đang tải danh sách quiz
  // -------------------------------------------------------
  if (isLoadingQuizzes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Đang tải danh sách Quiz...</p>
      </div>
    );
  }

  // -------------------------------------------------------
  // Render: Trường hợp chưa có quiz nào
  // -------------------------------------------------------
  if (quizzes.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
            Kết quả Quiz
          </h2>
          <p className="text-slate-400 mt-1">Xem và phân tích kết quả thí sinh.</p>
        </div>
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Bạn chưa có quiz nào.</p>
          <p className="text-slate-500 text-sm mt-2">
            Hãy tạo quiz trước để xem kết quả thí sinh.
          </p>
        </div>
      </div>
    );
  }

  // Lấy tên quiz đang được chọn để hiển thị
  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  // -------------------------------------------------------
  // Render chính
  // -------------------------------------------------------
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===== TIÊU ĐỀ TRANG ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block transform transition-all duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_15px_rgba(167,139,250,0.6)]">
            Kết quả Quiz
          </h2>
          <p className="text-slate-400 mt-1">
            Xem và phân tích kết quả thí sinh theo từng bài thi.
          </p>
        </div>
        {/* Nút làm mới dữ liệu */}
        <Button
          onClick={fetchResults}
          disabled={isLoadingResults}
          variant="ghost"
          className="gap-2 text-slate-300 hover:text-white hover:bg-white/10"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoadingResults ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* ===== CHỌN QUIZ ===== */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-200 text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Chọn Quiz để xem kết quả
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/*
           * Dropdown chọn quiz
           * Khi thay đổi → cập nhật selectedQuizId → trigger fetchResults
           */}
          <select
            value={selectedQuizId ?? ""}
            onChange={(e) => {
              setSelectedQuizId(Number(e.target.value));
              // Reset filter khi đổi quiz
              handleResetFilters();
            }}
            className="w-full max-w-md h-10 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
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

      {/* ===== THỐNG KÊ TỔNG QUAN ===== */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Tổng lượt thi */}
          <StatCard
            icon={<Users className="w-5 h-5 text-indigo-400" />}
            label="Tổng lượt thi"
            value={stats.totalAttempts}
            color="indigo"
          />
          {/* Đã nộp bài */}
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
            label="Đã nộp bài"
            value={stats.submittedCount}
            color="emerald"
          />
          {/* Đang làm */}
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-400" />}
            label="Đang làm"
            value={stats.inProgressCount}
            color="amber"
          />
          {/* Điểm trung bình */}
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
            label="Điểm TB"
            value={stats.avgScore !== null ? stats.avgScore.toFixed(2) : "—"}
            color="purple"
          />
          {/* Điểm cao nhất */}
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-400" />}
            label="Cao nhất"
            value={stats.maxScore !== null ? stats.maxScore : "—"}
            color="yellow"
          />
          {/* Điểm thấp nhất */}
          <StatCard
            icon={<XCircle className="w-5 h-5 text-rose-400" />}
            label="Thấp nhất"
            value={stats.minScore !== null ? stats.minScore : "—"}
            color="rose"
          />
        </div>
      )}

      {/* ===== BẢNG KẾT QUẢ THÍ SINH ===== */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-200 text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Danh sách thí sinh
            {selectedQuiz && (
              <span className="text-slate-400 font-normal text-sm ml-1">
                — {selectedQuiz.title}
              </span>
            )}
          </CardTitle>

          {/* ===== KHU VỰC BỘ LỌC ===== */}
          <div className="mt-4 space-y-3">
            {/* Hàng 1: Tìm kiếm + Trạng thái */}
            <div className="flex flex-wrap gap-3">
              {/* Ô tìm kiếm theo tên/email */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9 bg-white/10 text-slate-100 placeholder:text-slate-400 border-white/20"
                  placeholder="Tìm theo tên hoặc email thí sinh..."
                />
              </div>

              {/* Lọc theo trạng thái nộp bài */}
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="h-10 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-w-[160px]"
              >
                <option value="" className="bg-slate-800">
                  Tất cả trạng thái
                </option>
                <option value="SUBMITTED" className="bg-slate-800">
                  ✅ Đã nộp bài
                </option>
                <option value="IN_PROGRESS" className="bg-slate-800">
                  ⏳ Đang làm bài
                </option>
              </select>
            </div>

            {/* Hàng 2: Lọc điểm + Lọc thời gian */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Icon filter */}
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />

              {/* Lọc điểm tối thiểu */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">
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
                  className="w-20 bg-white/10 text-slate-100 border-white/20 text-sm"
                  placeholder="0"
                />
              </div>

              {/* Lọc điểm tối đa */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">
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
                  className="w-20 bg-white/10 text-slate-100 border-white/20 text-sm"
                  placeholder="10"
                />
              </div>

              {/* Dấu phân cách */}
              <div className="w-px h-6 bg-white/20 hidden sm:block" />

              {/* Lọc ngày bắt đầu */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">
                  Từ ngày:
                </label>
                <Input
                  name="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="bg-white/10 text-slate-100 border-white/20 text-sm w-36"
                />
              </div>

              {/* Lọc ngày kết thúc */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">
                  Đến ngày:
                </label>
                <Input
                  name="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="bg-white/10 text-slate-100 border-white/20 text-sm w-36"
                />
              </div>
            </div>

            {/* Hàng 3: Nút áp dụng và xóa filter */}
            <div className="flex gap-2">
              {/* Nút áp dụng filter */}
              <Button
                onClick={handleApplyFilters}
                disabled={isLoadingResults}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg text-sm"
              >
                {isLoadingResults ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
                Áp dụng bộ lọc
              </Button>

              {/* Nút xóa tất cả filter */}
              <Button
                onClick={handleResetFilters}
                variant="ghost"
                className="gap-2 text-slate-400 hover:text-white hover:bg-white/10 text-sm"
              >
                <XCircle className="w-4 h-4" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading state khi đang tải kết quả */}
          {isLoadingResults ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">Đang tải kết quả...</p>
            </div>
          ) : results.length === 0 ? (
            /* Trường hợp không có kết quả */
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base">Không có kết quả nào.</p>
              <p className="text-sm mt-1 text-slate-500">
                {Object.values(appliedFilters).some((v) => v !== "")
                  ? "Thử thay đổi bộ lọc để xem thêm kết quả."
                  : "Chưa có thí sinh nào tham gia quiz này."}
              </p>
            </div>
          ) : (
            /* Bảng danh sách kết quả */
            <div className="rounded-lg border border-white/20 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[700px]">
                {/* Header bảng */}
                <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
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

                {/* Body bảng - danh sách thí sinh */}
                <tbody className="divide-y divide-white/10">
                  {results.map((item, index) => (
                    <tr
                      key={item.attemptId}
                      className="bg-white/5 hover:bg-white/10 transition-colors duration-200"
                    >
                      {/* STT */}
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {index + 1}
                      </td>

                      {/* Tên thí sinh */}
                      <td className="px-5 py-4 font-medium text-slate-100">
                        {item.user.fullName}
                      </td>

                      {/* Email thí sinh */}
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {item.user.email}
                      </td>

                      {/* Điểm số - màu sắc theo mức điểm */}
                      <td className={`px-5 py-4 ${getScoreColor(item.score)}`}>
                        {item.score !== null ? item.score : "—"}
                      </td>

                      {/* Thời gian làm bài */}
                      <td className="px-5 py-4 text-slate-400">
                        {formatDuration(item.durationSeconds)}
                      </td>

                      {/* Thời gian nộp bài */}
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {formatDateTime(item.finishedAt)}
                      </td>

                      {/* Badge trạng thái nộp bài */}
                      <td className="px-5 py-4">
                        <StatusBadge status={item.submitStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer bảng: hiển thị tổng số bản ghi */}
              <div className="px-5 py-3 bg-white/5 border-t border-white/10 text-xs text-slate-400">
                Hiển thị{" "}
                <span className="text-slate-200 font-semibold">
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

// -------------------------------------------------------
// Sub-components
// -------------------------------------------------------

/**
 * StatCard - Card hiển thị một chỉ số thống kê.
 * Dùng trong phần "Thống kê tổng quan".
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "indigo" | "emerald" | "amber" | "purple" | "yellow" | "rose";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  // Map màu sắc cho border và background
  const colorMap: Record<string, string> = {
    indigo: "border-indigo-500/30 bg-indigo-500/10",
    emerald: "border-emerald-500/30 bg-emerald-500/10",
    amber: "border-amber-500/30 bg-amber-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    yellow: "border-yellow-500/30 bg-yellow-500/10",
    rose: "border-rose-500/30 bg-rose-500/10",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colorMap[color]} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

/**
 * StatusBadge - Badge hiển thị trạng thái nộp bài.
 * SUBMITTED → Xanh lá (Đã nộp)
 * IN_PROGRESS → Vàng (Đang làm)
 */
interface StatusBadgeProps {
  status: "SUBMITTED" | "IN_PROGRESS";
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <CheckCircle className="w-3 h-3" />
        Đã nộp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
      <Clock className="w-3 h-3" />
      Đang làm
    </span>
  );
}
