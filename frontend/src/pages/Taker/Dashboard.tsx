import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import * as quizServices from "@/services/quizServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, History as HistoryIcon, ArrowRight, TrendingUp } from "lucide-react";
import { PublicOpenQuizzesPanel } from "@/components/ui/PublicOpenQuizzesPanel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import * as attemptServices from "@/services/attemptServices";

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
      const data = await quizServices.joinQuizByCode(quizCode);
      navigate(`/dashboard/quiz/${data.id}/take`);
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
  const [historyStats, setHistoryStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesRes, statsRes] = await Promise.all([
          quizServices.getPublicOpenQuizzes(),
          attemptServices.getMyStats()
        ]);
        setAvailableQuizzes(quizzesRes.data || quizzesRes);
        
        // Format stats for chart
        const formattedStats = (statsRes.data || statsRes || []).map((s: any) => ({
          name: s.quiz_title,
          score: Number(s.score),
          date: new Date(s.finished_at).toLocaleDateString('vi-VN')
        }));
        setHistoryStats(formattedStats);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu dashboard:", err);
      } finally {
        setLoadingQuizzes(false);
      }
    };
    fetchData();
  }, []);


  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block transform transition-all duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_15px_rgba(167,139,250,0.6)]">
            Bảng điều khiển học sinh
          </h2>
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

      {/* Biểu đồ tiến độ */}
      <div className="animate-fade-in animate-delay-75">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <TrendingUp className="w-6 h-6 text-pink-400 animate-float" /> Tiến độ học tập
        </h3>
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10 overflow-hidden group">
          <CardHeader className="pb-0">
            <CardDescription className="text-slate-400">Điểm số qua các lần thi gần đây</CardDescription>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
             {historyStats.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={historyStats}>
                   <defs>
                     <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                   <XAxis 
                     dataKey="date" 
                     stroke="#94a3b8" 
                     fontSize={12} 
                     tickLine={false} 
                     axisLine={false}
                   />
                   <YAxis 
                     stroke="#94a3b8" 
                     fontSize={12} 
                     tickLine={false} 
                     axisLine={false}
                     tickFormatter={(value) => `${value}`}
                   />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #ffffff10', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                     itemStyle={{ color: '#818cf8' }}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="score" 
                     stroke="#818cf8" 
                     strokeWidth={3}
                     fillOpacity={1} 
                     fill="url(#colorScore)" 
                     animationDuration={2000}
                   />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 border border-dashed border-white/5 rounded-xl">
                 <p>Chưa có dữ liệu thống kê.</p>
                 <p className="text-xs">Hãy tham gia ít nhất một bài thi để thấy biểu đồ của bạn.</p>
               </div>
             )}
          </CardContent>
        </Card>
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
            const maxAttempts = quiz.max_attempts;
            const joinedCount = quiz.joinedCount || 0;
            const isFull = maxAttempts && joinedCount >= maxAttempts;
            const slotsRemaining = maxAttempts ? Math.max(0, maxAttempts - joinedCount) : null;

            return (
              <Card key={quiz.id} className="border-indigo-400/30 hover:border-indigo-400/60 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl group" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold line-clamp-1 text-slate-100 group-hover:text-indigo-300 transition-colors duration-300">{quiz.title}</CardTitle>
                  <CardDescription className="text-amber-400 font-semibold mt-1">Hạn: {dueDate}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-slate-400 mb-4 font-medium">
                    <span>⏱️ {timeLimit} {quiz.time_limit_seconds ? "phút" : ""}</span>
                    <span className={isFull ? "text-red-400" : "text-emerald-400"}>
                      {maxAttempts ? (isFull ? "🚫 Hết chỗ" : `👥 Còn ${slotsRemaining} chỗ trống`) : "👥 Không giới hạn"}
                    </span>
                  </div>
                  {isFull ? (
                    <Button
                      className="w-full gap-2 bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      disabled={true}
                    >
                      <Play className="w-4 h-4" /> Hết chỗ
                    </Button>
                  ) : (
                    <Link to={`/dashboard/quiz/${quiz.id}/take`} className="block">
                      <Button className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg group-hover:shadow-indigo-500/50">
                        <Play className="w-4 h-4 group-hover:animate-pulse" /> Vào test
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="animate-fade-in animate-delay-200">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white animate-fade-in">
          <HistoryIcon className="w-6 h-6 text-emerald-400 animate-float" /> Lịch sử &amp; đáp án
        </h3>
        <Card className="bg-gradient-to-br from-emerald-900/20 to-slate-900/50 backdrop-blur-xl border-emerald-400/30 max-w-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-100">Các lần thi đã làm</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              Xem toàn bộ lần làm, điểm và chi tiết từng câu theo dữ liệu trên server.
            </p>
            <Link to="/dashboard/history" className="block">
              <Button
                variant="outline"
                className="w-full sm:w-auto gap-2 border-emerald-400/50 hover:bg-emerald-500/20 text-slate-100 hover:text-emerald-300"
              >
                Mở lịch sử làm bài <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
