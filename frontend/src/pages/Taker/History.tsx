import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";

export function History() {
  const completedQuizzes = [
    { id: 3, title: "Thi cuối kỳ - Vật lý", score: "8.5/10", date: "2026-02-28" },
    { id: 4, title: "Thi giữa kỳ - Hóa học", score: "9.0/10", date: "2026-01-15" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block transform transition-all duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_15px_rgba(167,139,250,0.6)]">Lịch sử làm bài</h2>
        <p className="text-slate-400 mt-1">Xem lại kết quả các bài kiểm tra của bạn.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {completedQuizzes.map((quiz, index) => (
          <Card 
            key={quiz.id} 
            className="bg-gradient-to-br from-purple-900/30 to-slate-900/50 backdrop-blur-xl border-purple-400/30 hover:border-purple-400/60 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 group hover:scale-105 transition-transform duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold line-clamp-1 text-slate-100 group-hover:text-purple-300 transition-colors duration-300">{quiz.title}</CardTitle>
              <CardDescription className="text-slate-400">Hoàn thành vào {quiz.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors duration-300">
                <span className="text-sm text-slate-400 font-semibold">Điểm</span>
                <span className="font-bold text-xl text-emerald-400">{quiz.score}</span>
              </div>
              <Link to={`/dashboard/quiz/${quiz.id}/review`} className="block">
                <Button variant="outline" className="w-full gap-2 border-purple-400/50 text-slate-100 hover:bg-purple-500/20 text-slate-100 hover:text-purple-300">
                  Xem lại đáp án <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
