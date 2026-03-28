import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileQuestion, Users, Settings, LogOut, BookOpen, Clock, CheckCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const location = useLocation();

  const links = [
    { name: "Phân tích & Thống kê", href: "/dashboard", icon: BookOpen },
    { name: "Quản lý Quiz", href: "/dashboard/manage", icon: LayoutDashboard },
    { name: "Ngân hàng câu hỏi", href: "/dashboard/question-bank", icon: FileQuestion },
    { name: "Thông tin tài khoản", href: "/dashboard/profile", icon: Settings },
    { name: "Lịch sử tham gia", href: "/dashboard/history", icon: Clock },
    { name: "Kết quả thi", href: "/dashboard/results", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white/10 backdrop-blur-md border-r border-white/10 flex flex-col shadow-2xl animate-slide-in">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/50 group-hover:shadow-orange-500/70 transition-all duration-300 group-hover:scale-110">
              <Flame className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Quizz
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ease-out group/link animate-slide-in hover:translate-x-1",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "group-hover/link:rotate-12")} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link
            to="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 ease-out group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            Đăng xuất
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8 shadow-lg">
          <h1 className="text-2xl font-bold text-white capitalize animate-fade-in">
            {(() => {
              const key = location.pathname.split("/").pop()?.replace("-", " ") || "Trang chính";
              const map: Record<string,string> = {
                "dashboard":"Trang chính",
                "manage":"Quản lý Quiz",
                "question bank":"Ngân hàng câu hỏi",
                "results":"Kết quả",
                "history":"Lịch sử",
                "profile": "Thông tin tài khoản của bạn"
              };
              return map[key] || key;
            })()}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hover:text-slate-200 transition-colors duration-300 hidden sm:inline-block">
              Đã đăng nhập với tư cách Người dùng
            </span>
            <Link to="/dashboard/profile" className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 transition-all duration-300 cursor-pointer border border-white/10">
              U
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 relative">
          {/* Animated background elements */}
          <div className="absolute top-20 right-10 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute -bottom-20 left-10 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
          
          <div className="relative z-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
