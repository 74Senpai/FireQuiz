import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Clock, CheckCircle, ArrowRight } from "lucide-react";

export function TakerDashboard() {
  const navigate = useNavigate();
  const [quizCode, setQuizCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleJoinQuiz = async () => {
    // Chú thích (FE): Bắt đầu quá trình gọi API bằng mã PIN (code) bạn vừa nhập
    if (!quizCode.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";
      const configUrl = typeof process !== 'undefined' && process.env.API_URL ? process.env.API_URL : apiUrl;
      const res = await axios.get(`${configUrl}/api/quiz/join/${quizCode}`, { withCredentials: true });
      navigate(`/dashboard/quiz/${res.data.id}/take`);
    } catch (err: any) {
      // Chú thích (FE): Xử lý hiển thị thông báo lỗi trả về từ Backend
      // Sẽ nhận được trực tiếp các lỗi: "Sai PIN", "Quiz đã đóng", "Quiz không công khai" ở đây
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";
        const configUrl = typeof process !== 'undefined' && process.env.API_URL ? process.env.API_URL : apiUrl;
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${configUrl}/api/quiz/public`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setAvailableQuizzes(res.data.data);
      } catch (err) {
        console.error("Lỗi lấy danh sách quiz công khai:", err);
      } finally {
        setLoadingQuizzes(false);
      }
    };
    fetchQuizzes();
  }, []);

  const completedQuizzes = [
    { id: 3, title: "Thi cuối kỳ - Vật lý", score: "8.5/10", date: "2026-02-28" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block transform transition-all duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_15px_rgba(167,139,250,0.6)]">Bảng điều khiển học sinh</h2>
          <p className="text-slate-400 mt-1">Tham gia quiz mới và xem kết quả đã làm.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-3 items-center bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Input 
              placeholder="Nhập mã quiz" 
              className="w-48 border-0 focus-visible:ring-0 bg-white/20 text-white placeholder:text-slate-300"
              value={quizCode}
              onChange={(e) => setQuizCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinQuiz()}
            />
            <Button 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
              onClick={handleJoinQuiz}
              disabled={loading || !quizCode.trim()}
            >
              {loading ? "Đang xử lý..." : "Tham gia"}
            </Button>
          </div>
          {errorMsg && (
            <p className="text-red-400 text-sm font-medium animate-fade-in bg-red-900/30 px-3 py-1 rounded-md border border-red-500/30">
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      <div className="animate-fade-in animate-delay-100">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white animate-fade-in">
          <Clock className="w-6 h-6 text-indigo-400 animate-float" /> Quiz đang có
        </h3>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {loadingQuizzes ? (
            <div className="text-slate-400 col-span-3 py-4 text-center animate-pulse">Đang tải danh sách Quiz...</div>
          ) : availableQuizzes.length === 0 ? (
            <div className="text-slate-400 col-span-3 py-4 text-center bg-white/5 rounded-xl border border-dashed border-white/10">Hiện chưa có bài thi nào đang mở.</div>
          ) : availableQuizzes.map((quiz, index) => {
            const timeLimit = quiz.time_limit_seconds ? Math.floor(quiz.time_limit_seconds / 60) : "Không giới hạn";
            const dueDate = quiz.available_until ? new Date(quiz.available_until).toLocaleString('vi-VN') : "Không giới hạn";
            
            return (
            <Card key={quiz.id} className="border-indigo-400/30 hover:border-indigo-400/60 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl group" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold line-clamp-1 text-slate-100 group-hover:text-indigo-300 transition-colors duration-300">{quiz.title}</CardTitle>
                <CardDescription className="text-amber-400 font-semibold mt-1">Hạn: {dueDate}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-slate-400 mb-4 font-medium">
                  <span>⏱️ {timeLimit} {quiz.time_limit_seconds ? "phút" : ""}</span>
                  <span className="opacity-0">❓ 0 câu</span>
                </div>
                <Link to={`/dashboard/quiz/${quiz.id}/take`} className="block">
                  <Button className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg group-hover:shadow-indigo-500/50">
                    <Play className="w-4 h-4 group-hover:animate-pulse" /> Vào test
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )})}
        </div>
      </div>

      <div className="animate-fade-in animate-delay-200">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white animate-fade-in">
          <CheckCircle className="w-6 h-6 text-emerald-400 animate-float" /> Đã hoàn thành gần đây
        </h3>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {completedQuizzes.map((quiz, index) => (
            <Card key={quiz.id} className="bg-gradient-to-br from-emerald-900/30 to-slate-900/50 backdrop-blur-xl border-emerald-400/30 hover:border-emerald-400/60 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 group" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold line-clamp-1 text-slate-100 group-hover:text-emerald-300 transition-colors duration-300">{quiz.title}</CardTitle>
                <CardDescription className="text-slate-400">Hoàn thành vào {quiz.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-slate-400 font-semibold">Điểm</span>
                  <span className="font-bold text-xl text-emerald-400">{quiz.score}</span>
                </div>
                <Link to={`/dashboard/quiz/${quiz.id}/review`} className="block">
                  <Button variant="outline" className="w-full gap-2 border-emerald-400/50 hover:bg-emerald-500/20 text-slate-100 hover:text-emerald-300 animate-pulse">
                    Xem lại câu trả lời <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
