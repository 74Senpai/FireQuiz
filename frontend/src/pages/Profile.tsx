import React, { useState } from "react";
import { User, Lock, Trash2, Save, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function Profile() {
  const [activeTab, setActiveTab] = useState<"info" | "security" | "danger">("info");
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    role: "Giáo viên",
    bio: "Giáo viên dạy Toán với 10 năm kinh nghiệm."
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert("Cập nhật thông tin thành công!");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Mật khẩu mới không khớp!");
      return;
    }
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert("Đổi mật khẩu thành công!");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.")) {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsLoading(false);
      alert("Tài khoản của bạn đã được xóa.");
      // In a real app, redirect to login page here or clear auth context
      window.location.href = "/login";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block">
          Tài khoản của tôi
        </h2>
        <p className="text-slate-400 mt-1">Quản lý thông tin cá nhân và cài đặt bảo mật.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-2 p-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === "info"
                  ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 font-semibold border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <User className="w-5 h-5" />
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === "security"
                  ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 font-semibold border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Lock className="w-5 h-5" />
              Bảo mật & Mật khẩu
            </button>
            <div className="h-px bg-white/10 my-2"></div>
            <button
              onClick={() => setActiveTab("danger")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === "danger"
                  ? "bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30"
                  : "text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10"
              }`}
            >
              <Trash2 className="w-5 h-5" />
              Xóa tài khoản
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 animate-slide-up">
          {activeTab === "info" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/5">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" /> Cập nhật thông tin
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Thay đổi thông tin hồ sơ hiển thị công khai của bạn.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleInfoSubmit}>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium text-slate-300 ml-1">Họ và tên</label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 hover:bg-white/10 transition-colors rounded-xl h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 hover:bg-white/10 transition-colors rounded-xl h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium text-slate-300 ml-1">Giới thiệu bản thân (Bio)</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 hover:bg-white/10 transition-colors min-h-[100px] text-sm resize-y"
                      placeholder="Một vài dòng về bản thân..."
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-white/5 border-t border-white/5 py-4 px-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl px-6"
                  >
                    {isLoading ? "Đang lưu..." : <><Save className="w-4 h-4" /> Lưu thay đổi</>}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/5">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" /> Đổi mật khẩu
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordSubmit}>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Mật khẩu hiện tại</label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 hover:bg-white/10 transition-colors rounded-xl h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Mật khẩu mới</label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 hover:bg-white/10 transition-colors rounded-xl h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Xác nhận mật khẩu mới</label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 hover:bg-white/10 transition-colors rounded-xl h-11"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-white/5 border-t border-white/5 py-4 px-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl px-6"
                  >
                    {isLoading ? "Đang xử lý..." : <><Save className="w-4 h-4" /> Cập nhật mật khẩu</>}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {activeTab === "danger" && (
            <Card className="bg-rose-500/5 backdrop-blur-md border-rose-500/20 shadow-2xl shadow-rose-500/10 rounded-2xl overflow-hidden">
              <CardHeader className="bg-rose-500/10 border-b border-rose-500/20">
                <CardTitle className="text-xl font-bold text-rose-500 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Khu vực nguy hiểm
                </CardTitle>
                <CardDescription className="text-rose-400/80">
                  Xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-5">
                  <h4 className="text-rose-400 font-semibold mb-2">Hành động này không thể hoàn tác</h4>
                  <p className="text-sm text-slate-400">
                    Khi bạn xóa tài khoản, toàn bộ dữ liệu lịch sử bài kiểm tra, điểm số và thông tin cá nhân sẽ bị xóa vĩnh viễn khỏi hệ thống. Vui lòng chắc chắn trước khi thực hiện.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-rose-500/5 border-t border-rose-500/20 py-4 px-6 flex justify-start">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  variant="destructive"
                  className="gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/25 rounded-xl px-6"
                >
                  {isLoading ? "Đang xóa..." : <><Trash2 className="w-4 h-4" /> Xóa tài khoản vĩnh viễn</>}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
