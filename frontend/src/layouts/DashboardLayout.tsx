import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileQuestion,
  Users,
  Settings,
  LogOut,
  BookOpen,
  Clock,
  Flame,
  Globe,
  Menu,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const links = [
    { name: "Phân tích & Thống kê", href: "/dashboard", icon: BookOpen },
    { name: "Quiz công khai", href: "/explore", icon: Globe },
    { name: "Quản lý Quiz", href: "/dashboard/manage", icon: LayoutDashboard },
    { name: "Ngân hàng câu hỏi", href: "/dashboard/question-bank", icon: FileQuestion },
    { name: "Thông tin tài khoản", href: "/dashboard/profile", icon: Settings },
    { name: "Lịch sử tham gia", href: "/dashboard/history", icon: Clock },
    { name: "Kết quả thi", href: "/dashboard/results", icon: Users },
  ];

  // Lấy chữ cái đầu của tên để làm Avatar
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "no-print bg-white/10 backdrop-blur-md border-r border-white/10 flex flex-col shadow-2xl transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className={cn("flex items-center gap-2 group cursor-pointer overflow-hidden whitespace-nowrap transition-all duration-300", isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
            <div className="relative flex items-center justify-center min-w-[40px] w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Flame className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Quizz
            </span>
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 min-w-[40px] flex justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                title={isCollapsed ? link.name : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-semibold transition-all duration-300 ease-out group/link",
                  isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-300 flex-shrink-0",
                    isActive && !isCollapsed && "group-hover/link:rotate-12",
                  )}
                />
                {!isCollapsed && <span className="truncate">{link.name}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isCollapsed ? "Đăng xuất" : undefined}
            className={cn(
              "w-full flex items-center rounded-lg text-sm font-semibold transition-all duration-300 ease-out group",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
              isLoggingOut
                ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                : "text-slate-300 hover:bg-red-500/20 hover:text-red-300",
            )}
          >
            {isLoggingOut ? (
              <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
            ) : (
              <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300 flex-shrink-0" />
            )}
            {!isCollapsed && <span className="truncate">{isLoggingOut ? "Đang thoát..." : "Đăng xuất"}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-white/5">
        <header className="no-print h-16 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-2xl font-bold text-white capitalize">
            {(() => {
              const key = location.pathname.split("/").pop()?.replace("-", " ") || "Trang chính";
              const map: Record<string,string> = {
                "dashboard":"Trang chính",
                "explore":"Quiz công khai",
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
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">
                {user ? user.full_name : "Đang tải..."}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {user ? user.role : "Khách"}
              </p>
            </div>
            <div 
              onClick={() => navigate("/dashboard/profile")}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 transition-all duration-300 cursor-pointer border border-white/20 overflow-hidden"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user ? getInitial(user.full_name) : "?"
              )}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative">
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
