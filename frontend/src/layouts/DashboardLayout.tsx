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
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// Khai báo kiểu dữ liệu cho User
interface UserInfo {
  full_name: string;
  email: string;
  role: string;
}

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);

  const API_URL = process.env.API_URL || "http://localhost:8080/api";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        // Nếu không có token, đẩy về trang login ngay
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_URL}/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`, // Gửi token lên để qua cổng middleware
          },
        });

        setUser({
          full_name: response.data.fullName,
          email: response.data.email,
          role: response.data.role,
        });
      } catch (error: any) {
        console.error("Lỗi lấy thông tin user:", error);
        // Nếu token hết hạn hoặc không hợp lệ (401, 403), đẩy về login
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("accessToken");
          navigate("/login");
        }
      }
    };

    fetchUserData();
  }, [navigate, API_URL]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      try {
        const API_URL = process.env.API_URL || "http://localhost:8080/api";
        const token = localStorage.getItem("accessToken");

        // Gọi API Logout
        await axios.post(
          `${API_URL}/auth/logout`,
          {}, // Body trống
          {
            headers: {
              Authorization: `Bearer ${token}`, // Gửi access token nếu cần thiết cho middleware
            },
            withCredentials: true, // RẤT QUAN TRỌNG: Để gửi kèm Refresh Token nằm trong Cookie
          },
        );
      } catch (error) {
        console.error("Lỗi khi gọi API logout:", error);
        // Ngay cả khi API lỗi, chúng ta vẫn nên tiếp tục xóa token ở máy khách
      } finally {
        // 1. Xóa Access Token khỏi localStorage
        localStorage.removeItem("accessToken");

        // 2. Chuyển hướng về trang Login
        navigate("/login");
      }
    } finally {
      setIsLoggingOut(false);
      localStorage.removeItem("accessToken");
      navigate("/login");
    }
  };

  const links = [
    { name: "Phân tích & Thống kê", href: "/dashboard", icon: BookOpen },
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
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    isActive && "group-hover/link:rotate-12",
                  )}
                />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ease-out group",
              isLoggingOut
                ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                : "text-slate-300 hover:bg-red-500/20 hover:text-red-300",
            )}
          >
            {isLoggingOut ? (
              <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            )}
            {isLoggingOut ? "Đang thoát..." : "Đăng xuất"}
          </button>
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
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">
                {user ? user.full_name : "Đang tải..."}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {user ? user.role : "Khách"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 transition-all duration-300 cursor-pointer border border-white/20">
              {user ? getInitial(user.full_name) : "?"}
            </div>
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
