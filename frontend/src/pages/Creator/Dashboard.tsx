import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizPreviewModal } from "@/components/ui/QuizPreviewModal";
import {
  Plus,
  Clock,
  Users,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import axios from "axios";

export function CreatorDashboard() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewQuizId, setPreviewQuizId] = useState<number | null>(null);
  const navigate = useNavigate();

  const API_URL = process.env.API_URL || "http://localhost:8080/api";

  // Hàm lấy danh sách quiz từ backend
  const fetchQuizzes = async () => {
    setIsLoading(true);
    setError(null); // Reset error trước khi fetch
    try {
      const response = await axios.get(`${API_URL}/quiz/myquiz`, {
        withCredentials: true,
      });
      setQuizzes(response.data.data);
    } catch (error: any) {
      console.error("Lỗi lấy danh sách quiz:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        const errorMessage = error.response?.data?.message ||
          error.message ||
          "Không thể tải danh sách quiz. Vui lòng thử lại.";
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Hàm xóa quiz thực tế qua API
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa quiz này?")) {
      try {
        await axios.delete(`${API_URL}/quiz/${id}`, {
          withCredentials: true,
        });
        // Cập nhật lại UI sau khi xóa thành công
        setQuizzes(quizzes.filter((q) => q.id !== id));
      } catch (error) {
        alert("Không thể xóa quiz. Vui lòng thử lại.");
      }
    }
  };

  // Helper: Chuyển đổi status từ Backend sang UI
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PUBLIC":
        return "Đã xuất bản";
      case "DRAFT":
        return "Nháp";
      case "CLOSED":
        return "Đã đóng";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Đang tải danh sách Quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
            Danh sách Quiz
          </h2>
          <p className="text-slate-400 mt-1">Quản lý quiz, xem kết quả và chỉnh sửa cấu hình.</p>
        </div>
        <div className="text-center py-20 bg-red-50/10 rounded-2xl border border-red-200/20">
          <Trash2 className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg font-medium">Không thể tải danh sách Quiz</p>
          <p className="text-red-300 text-sm mt-2 max-w-md mx-auto">{error}</p>
          <Button
            onClick={fetchQuizzes}
            className="mt-4 bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <Loader2 className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block transform transition-all duration-300 hover:scale-[1.02]">
            Danh sách Quiz
          </h2>
          <p className="text-slate-400 mt-1">
            Quản lý quiz, xem kết quả và chỉnh sửa cấu hình.
          </p>
        </div>
        <Link to="/dashboard/quiz/new">
          {" "}
          {/* Chỉnh lại route nếu cần */}
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
            <Plus className="w-5 h-5" />
            Tạo Quiz
          </Button>
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
          <p className="text-slate-400">Bạn chưa có bài thi nào.</p>
          <Link
            to="/dashboard/quiz/new"
            className="text-indigo-400 hover:underline mt-2 inline-block"
          >
            Bắt đầu tạo bài thi đầu tiên
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, index) => {
            const statusLabel = getStatusLabel(quiz.status);
            return (
              <Card
                key={quiz.id}
                className={`relative overflow-hidden group cursor-pointer animate-slide-up hover:scale-[1.02] transition-all duration-300 bg-white/5 border-white/10`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/dashboard/quiz/${quiz.id}/edit`)}
              >
                {/* Status bar dọc */}
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-300 group-hover:w-2 ${quiz.status === "PUBLIC"
                    ? "bg-emerald-500"
                    : quiz.status === "DRAFT"
                      ? "bg-amber-500"
                      : "bg-slate-500"
                    }`}
                />

                <CardHeader className="pb-2 relative z-10">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-bold line-clamp-1 text-white pr-2">
                      {quiz.title}
                    </CardTitle>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewQuizId(quiz.id);
                        }}
                        className="p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 transition-colors"
                        aria-label="Xem truoc quiz"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/dashboard/quiz/${quiz.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={(e) => handleDelete(e, quiz.id)}
                        className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${quiz.status === "PUBLIC"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : quiz.status === "DRAFT"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                        }`}
                    >
                      {statusLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      #{quiz.quiz_code}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        {Math.floor(quiz.time_limit_seconds / 60)} phút
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>{quiz.max_attempts || "∞"} lượt</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="w-3.5 h-3.5 text-pink-400" />
                      <span>
                        {new Date(quiz.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <QuizPreviewModal
        quizId={previewQuizId}
        isOpen={previewQuizId !== null}
        onClose={() => setPreviewQuizId(null)}
      />
    </div>
  );
}
