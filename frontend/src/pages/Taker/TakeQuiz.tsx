import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";

export function TakeQuiz() {
  const navigate = useNavigate();
  // Chú thích (FE): Lấy id từ URL params (được định nghĩa trong /dashboard/quiz/:id/take) làm quizId
  const { id: quizId } = useParams<{ id: string }>();

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizTitle, setQuizTitle] = useState("Đang tải...");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [timeLeft, setTimeLeft] = useState(3600);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Chú thích (FE): State lưu đáp án đã chọn: key = attempt_questions.id, value = attempt_options.id
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    if (!quizId) return;
    const loadQuizData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.post(`${API_URL}/api/attempts/start/${quizId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        const data = res.data;
        setAttemptId(data.attemptId);
        setQuestions(data.questions);
        setQuizTitle(data.quizTitle);
        if (data.timeLimitSeconds !== undefined && data.timeLimitSeconds !== null) {
          setTimeLeft(data.timeLimitSeconds);
        }

        // Chú thích (FE): Nạp lại các đáp án đã lưu từ API, khôi phục trạng thái bài làm
        const initialAnswers: Record<number, number> = {};
        if (data.questions && data.questions.length > 0) {
          data.questions.forEach((q: any) => {
            if (q.selectedOptionId) {
              initialAnswers[q.id] = q.selectedOptionId;
            }
          });
          setSelectedAnswers(initialAnswers);
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || "Không thể tải đề thi");
      } finally {
        setLoading(false);
      }
    };
    loadQuizData();
  }, [quizId]);

  useEffect(() => {
    if (loading || errorMsg || !questions.length) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, errorMsg, questions.length]);

  const handleSubmit = () => {
    if (!quizId) return;
    navigate(`/dashboard/quiz/${quizId}/review`);
  };

  // Chú thích (FE): Gọi API PATCH /api/attempts/:attemptId/submit để đồng bộ đáp án tạm thời xuống DB
  // Dùng useCallback để tránh recreate function mỗi render
  const syncAnswerToServer = useCallback(async (
    questionId: number,
    optionId: number
  ) => {
    if (!attemptId) return;
    setSyncStatus("saving");
    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        `${API_URL}/api/attempts/${attemptId}/submit`,
        { attemptQuestionId: questionId, attemptOptionId: optionId },
        { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        }
      );
      // Chú thích (FE): Sync thành công – hiển thị icon tick rồi reset sau 1.5s
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus("idle"), 1500);
    } catch (err) {
      // Chú thích (FE): Sync thất bại – hiển thị lỗi nhưng KHÔNG chặn user làm tiếp
      // Đáp án vẫn lưu trong state local, đảm bảo UX mượt
      console.warn("Sync answer thất bại:", err);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 2000);
    }
  }, [attemptId]);

  // Chú thích (FE): Handler khi người dùng chọn đáp án
  const handleAnswerSelect = (questionId: number, optionId: number) => {
    // Cập nhật state local ngay lập tức (optimistic UI)
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    // Đồng bộ xuống DB (không chặn UI)
    syncAnswerToServer(questionId, optionId);
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Đang tải dữ liệu bài thi...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-400">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-xl font-bold">{errorMsg}</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-6 bg-slate-800 hover:bg-slate-700">Quay về Bảng điều khiển</Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-amber-400">
        <p className="text-xl">Quiz này chưa có câu hỏi nào.</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-6 bg-slate-800 hover:bg-slate-700">Quay về</Button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Tiêu đề / Đồng hồ đếm ngược */}
      <div className="sticky top-0 z-10 bg-white/10 backdrop-blur-md border-b border-white/20 pb-4 pt-2 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {quizTitle}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Câu hỏi {currentQuestion + 1} trong {questions.length}
            {" · "}
            <span className="text-indigo-300 font-medium">{answeredCount}/{questions.length} đã trả lời</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Chú thích (FE): Hiển thị trạng thái đồng bộ đáp án */}
          {syncStatus === "saving" && (
            <span className="text-xs text-slate-400 animate-pulse">Đang lưu...</span>
          )}
          {syncStatus === "saved" && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đã lưu
            </span>
          )}
          {syncStatus === "error" && (
            <span className="text-xs text-amber-400">⚠️ Lưu thất bại</span>
          )}

          <div className={`flex items-center gap-3 px-6 py-3 rounded-lg font-mono text-lg font-bold border transition-all duration-300 shadow-lg ${timeLeft < 300
              ? "bg-red-500/30 text-red-200 border-red-400/50 animate-pulse"
              : "bg-emerald-500/30 text-emerald-200 border-emerald-400/50"
            }`}>
            <Clock className="w-5 h-5" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Nội dung câu hỏi */}
      <Card className="border-indigo-400/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl shadow-2xl hover:shadow-indigo-500/30 animate-slide-up">
        <CardContent className="p-8 space-y-8">
          <h3 className="text-2xl font-semibold text-slate-100 leading-relaxed">
            {currentQ.text}
          </h3>
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              // Chú thích (FE): Kiểm tra option này có đang được chọn không
              const isSelected = selectedAnswers[currentQ.id] === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-300 group ${isSelected
                      ? "border-indigo-400 bg-indigo-500/30 shadow-lg shadow-indigo-500/20"
                      : "border-white/20 hover:border-indigo-400/60 bg-white/5 hover:bg-indigo-400/20"
                    }`}
                  // Chú thích (FE): Bỏ onClick ở đây đi để tránh 1 lần click kích hoạt 2 lần request lưu
                >
                  <input
                    type="radio"
                    name={`q${currentQ.id}`}
                    value={opt.id}
                    checked={isSelected}
                    // Chú thích (FE): onChange chỉ chạy 1 lần khi chọn đáp án (nhờ label bọc ngoài bao gồm cả click native)
                    onChange={() => handleAnswerSelect(currentQ.id, opt.id)}
                    className="w-5 h-5 text-indigo-400 border-white/30 focus:ring-indigo-400"
                  />
                  <span className={`font-medium transition-colors duration-300 ${isSelected ? "text-white" : "text-slate-100 group-hover:text-slate-50"
                    }`}>
                    {opt.text}
                  </span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Điều hướng */}
      <div className="flex items-center justify-between pt-4 animate-slide-up animate-delay-100">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(p => p - 1)}
          className="border-slate-400/50 text-slate-100 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Trước
        </Button>
        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 gap-2 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4" /> Nộp bài
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(p => p + 1)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            Câu tiếp theo
          </Button>
        )}
      </div>
    </div>
  );
}
