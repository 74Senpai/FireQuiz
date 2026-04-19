import React from 'react';
import { Link } from 'react-router-dom';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';

export const ServerError: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] p-4 text-center">
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] animate-blob rounded-full bg-indigo-500/10 mix-blend-screen blur-[100px] filter" />
      
      <div className="glass relative z-10 flex max-w-lg animate-slide-up flex-col items-center rounded-3xl border border-white/10 p-12 shadow-2xl backdrop-blur-xl">
        <h1 className="mb-2 text-9xl font-black tracking-tighter text-white/10">500</h1>
        
        <div className="absolute top-20 animate-float">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-75 blur" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#0f172a]">
              <ServerCrash className="h-12 w-12 text-blue-400" />
            </div>
          </div>
        </div>

        <h2 className="gradient-text mb-4 text-3xl font-bold">Máy chủ đang gặp sự cố</h2>
        <p className="mb-8 text-slate-400">
          Có lỗi xảy ra phía máy chủ của chúng tôi. Kỹ thuật viên đang nỗ lực khắc phục. Vui lòng thử lại sau vài phút.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row w-full">
          <button
            onClick={() => window.location.reload()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          >
            <RefreshCw className="h-5 w-5" />
            Thử lại
          </button>
          <Link
            to="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-8 py-3 font-semibold text-white border border-white/10 transition-all hover:bg-white/10"
          >
            <Home className="h-5 w-5" />
            Về trang chủ
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-600 uppercase tracking-widest animate-fade-in animation-delay-500">
        FireQuiz Internal Server Error
      </p>
    </div>
  );
};
