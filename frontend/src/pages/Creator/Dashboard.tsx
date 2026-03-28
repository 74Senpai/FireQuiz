import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Clock, Users, Calendar, Pencil, Trash2 } from "lucide-react";

export function CreatorDashboard() {
  const [quizzes, setQuizzes] = useState([
    { id: 1, title: "Kiểm tra giữa kỳ - Toán 101", status: "Đã xuất bản", participants: 45, date: "2026-03-15", timeLimit: 60 },
    { id: 2, title: "Quiz ngắn - Lịch sử", status: "Nháp", participants: 0, date: "-", timeLimit: 15 },
    { id: 3, title: "Kỳ thi cuối kỳ - Vật lý", status: "Đã đóng", participants: 120, date: "2026-02-28", timeLimit: 120 },
  ]);

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa quiz này?")) {
      setQuizzes(quizzes.filter((q) => q.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block transform transition-all duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_15px_rgba(167,139,250,0.6)]">Danh sách Quiz</h2>
          <p className="text-slate-400 mt-1">Quản lý quiz, xem kết quả và chỉnh sửa cấu hình.</p>
        </div>
        <Link to="/dashboard/quiz/new">
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-emerald-500/50">
            <Plus className="w-5 h-5 animate-bounce" />
            Tạo Quiz
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz, index) => (
          <Card 
            key={quiz.id} 
            className={`relative overflow-hidden group cursor-pointer animate-slide-up hover:scale-105 transition-transform duration-300`}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-300 group-hover:w-2 ${
              quiz.status === 'Đã xuất bản' ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : 
              quiz.status === 'Nháp' ? 'bg-gradient-to-b from-amber-400 to-amber-600' : 'bg-gradient-to-b from-slate-400 to-slate-600'
            }`} />
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none ${
              quiz.status === 'Đã xuất bản' ? 'from-emerald-500 to-transparent' : 
              quiz.status === 'Nháp' ? 'from-amber-500 to-transparent' : 'from-slate-500 to-transparent'
            }`} />
            <CardHeader className="pb-2 relative z-10">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-bold line-clamp-1 text-slate-950 group-hover:text-slate-800 transition-colors duration-300 pr-2">{quiz.title}</CardTitle>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Link 
                    to={`/dashboard/quiz/${quiz.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors duration-300"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={(e) => handleDelete(e, quiz.id)}
                    className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors duration-300"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-all duration-300 ${
                  quiz.status === 'Đã xuất bản' ? 'bg-emerald-500/30 text-emerald-200 ring-1 ring-inset ring-emerald-400/50 group-hover:bg-emerald-500/50' : 
                  quiz.status === 'Nháp' ? 'bg-amber-500/30 text-amber-200 ring-1 ring-inset ring-amber-400/50 group-hover:bg-amber-500/50' : 
                  'bg-slate-500/30 text-slate-200 ring-1 ring-inset ring-slate-400/50 group-hover:bg-slate-500/50'
                }`}>
                  {quiz.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-900 font-semibold mt-4 p-3 bg-white/5 rounded-lg backdrop-blur-sm group-hover:bg-white/10 transition-colors duration-300">
                <div className="flex items-center gap-3 font-semibold">
                  <Clock className="w-4 h-4 text-indigo-400 group-hover:animate-spin" />
                  <span>{quiz.timeLimit} phút</span>
                </div>
                <div className="flex items-center gap-3 font-semibold">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>{quiz.participants} đã tham gia</span>
                </div>
                <div className="flex items-center gap-3 col-span-2 font-semibold">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  <span>{quiz.date}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
