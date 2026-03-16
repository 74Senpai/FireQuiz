import { Outlet } from "react-router-dom";
import { Flame } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-2xl shadow-orange-500/50 mx-auto mb-4 hover:shadow-orange-500/70 transition-all duration-300 hover:scale-105">
            <Flame className="w-8 h-8 text-white" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Quizz Lửa
          </h1>
          <p className="text-slate-400 text-sm">Khám phá, học tập và chinh phục các kỳ thi</p>
        </div>
        
        <div className="relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
