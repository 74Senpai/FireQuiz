import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] p-4 text-center">
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 animate-blob rounded-full bg-indigo-500/20 mix-blend-screen blur-3xl filter" />
      <div className="animation-delay-2000 absolute top-1/3 right-1/4 h-64 w-64 animate-blob rounded-full bg-purple-500/20 mix-blend-screen blur-3xl filter" />
      
      <div className="glass relative z-10 flex max-w-lg animate-slide-up flex-col items-center rounded-3xl border border-white/10 p-12 shadow-2xl backdrop-blur-xl">
        <h1 className="mb-2 text-9xl font-black tracking-tighter text-white/10">404</h1>
        
        <div className="absolute top-20 animate-float">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-75 blur" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#0f172a]">
              <Compass className="h-12 w-12 text-indigo-400" />
            </div>
          </div>
        </div>

        <h2 className="gradient-text mb-4 text-3xl font-bold">Lạc đường rồi!</h2>
        <p className="mb-8 text-slate-400">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển đi nơi khác.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          >
            <Home className="h-5 w-5" />
            Về trang chủ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-8 py-3 font-semibold text-white border border-white/10 transition-all hover:bg-white/10"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};
