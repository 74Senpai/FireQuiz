import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileQuestion, Users, Settings, LogOut, BookOpen, Clock, CheckCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const location = useLocation();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: BookOpen },
    { name: "Manage Quizzes", href: "/dashboard/manage", icon: LayoutDashboard },
    { name: "Question Bank", href: "/dashboard/question-bank", icon: FileQuestion },
    { name: "Results", href: "/dashboard/results", icon: Users },
    { name: "History", href: "/dashboard/history", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30">
              <Flame className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-red-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
              Quizz Lửa
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-slate-800 capitalize">
            {location.pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Logged in as User
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              U
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
