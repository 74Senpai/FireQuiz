import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Lock } from 'lucide-react';

export const Forbidden: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] p-4 text-center">
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 right-1/4 h-64 w-64 animate-blob rounded-full bg-red-500/10 mix-blend-screen blur-3xl filter" />
      <div className="animation-delay-4000 absolute bottom-1/4 left-1/4 h-64 w-64 animate-blob rounded-full bg-orange-500/10 mix-blend-screen blur-3xl filter" />
      
      <div className="glass relative z-10 flex max-w-lg animate-slide-up flex-col items-center rounded-3xl border border-white/10 p-12 shadow-2xl backdrop-blur-xl">
        <h1 className="mb-2 text-9xl font-black tracking-tighter text-white/10">403</h1>
        
        <div className="absolute top-20 animate-float">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 opacity-75 blur" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#0f172a]">
              <Lock className="h-12 w-12 text-red-400" />
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Dừng lại!</h2>
        <p className="mb-8 text-slate-400">
          Bạn không có quyền truy cập vào nội dung này. Vui lòng liên hệ quản trị viên hoặc quay lại trang chủ.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row w-full">
          <Link
            to="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-8 py-3 font-semibold text-white transition-all hover:bg-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            <Home className="h-5 w-5" />
            Về trang chủ
          </Link>
          <Link
            to="/login"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-8 py-3 font-semibold text-white border border-white/10 transition-all hover:bg-white/10"
          >
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </div>
  );
};
