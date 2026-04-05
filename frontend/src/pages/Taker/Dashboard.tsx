import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { PublicOpenQuizzesPanel } from "@/components/ui/PublicOpenQuizzesPanel";

export function TakerDashboard() {
  const completedQuizzes = [
    { id: 3, title: "Thi cuối kỳ - Vật lý", score: "8.5/10", date: "2026-02-28" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block transform transition-all duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_15px_rgba(167,139,250,0.6)]">
            Bảng điều khiển học sinh
          </h2>
          <p className="text-slate-400 mt-1">Tham gia quiz mới và xem kết quả đã làm.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <Input
            placeholder="Nhập mã quiz (sắp có)"
            className="w-full sm:w-48 border-0 focus-visible:ring-0 bg-white/20 text-white placeholder:text-slate-300"
            disabled
          />
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 shrink-0" disabled>
            Tham gia
          </Button>
        </div>
      </div>

      <div className="animate-fade-in animate-delay-100">
        <PublicOpenQuizzesPanel
          getTakeHref={(id) => `/dashboard/quiz/${id}/take`}
          pageSize={9}
        />
      </div>

      <div className="flex justify-end animate-fade-in animate-delay-75">
        <Link
          to="/explore"
          className="text-sm text-indigo-300 hover:text-indigo-200 underline-offset-4 hover:underline"
        >
          Mở trang quiz công khai toàn màn hình
        </Link>
      </div>

      <div className="animate-fade-in animate-delay-200">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white animate-fade-in">
          <CheckCircle className="w-6 h-6 text-emerald-400 animate-float" /> Đã hoàn thành gần đây
        </h3>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {completedQuizzes.map((quiz, index) => (
            <Card
              key={quiz.id}
              className="bg-gradient-to-br from-emerald-900/30 to-slate-900/50 backdrop-blur-xl border-emerald-400/30 hover:border-emerald-400/60 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold line-clamp-1 text-slate-100 group-hover:text-emerald-300 transition-colors duration-300">
                  {quiz.title}
                </CardTitle>
                <CardDescription className="text-slate-400">Hoàn thành vào {quiz.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-slate-400 font-semibold">Điểm</span>
                  <span className="font-bold text-xl text-emerald-400">{quiz.score}</span>
                </div>
                <Link to={`/dashboard/quiz/${quiz.id}/review`} className="block">
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-emerald-400/50 hover:bg-emerald-500/20 text-slate-100 hover:text-emerald-300 animate-pulse"
                  >
                    Xem lại câu trả lời{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
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
