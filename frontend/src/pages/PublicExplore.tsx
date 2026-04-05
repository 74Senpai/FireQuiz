import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicOpenQuizzesPanel } from "@/components/ui/PublicOpenQuizzesPanel";

const btnBase =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 h-10 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";
const btnPrimary = `${btnBase} bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30`;
const btnOutline = `${btnBase} border border-white/25 text-slate-100 hover:bg-white/10`;

export function PublicExplore() {
  const { isAuthenticated } = useAuthStore();

  const getTakeHref = (quizId: number) =>
    isAuthenticated
      ? `/dashboard/quiz/${quizId}/take`
      : `/login?redirect=${encodeURIComponent(`/dashboard/quiz/${quizId}/take`)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl animate-blob pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl animate-blob animation-delay-4000 pointer-events-none" />

      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/50 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Quizz
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className={cn(btnPrimary)}>
                Vào bảng điều khiển
              </Link>
            ) : (
              <>
                <Link to="/login" className={cn(btnOutline)}>
                  Đăng nhập
                </Link>
                <Link to="/register" className={cn(btnPrimary)}>
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
            Quiz đang mở
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Các bộ đề được công khai và đang trong thời gian diễn ra. Đăng nhập để làm bài.
          </p>
        </div>
        <PublicOpenQuizzesPanel getTakeHref={getTakeHref} pageSize={9} />
      </main>
    </div>
  );
}
