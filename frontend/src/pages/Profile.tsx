import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Trash2,
  Save,
  Camera,
  Mail,
  Info,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import * as userServices from "@/services/userServices";
import * as authServices from "@/services/authServices";
import * as uploadService from "@/services/uploadService";
import * as attemptServices from "@/services/attemptServices";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    "info" | "security" | "stats" | "danger"
  >("info");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [historyStats, setHistoryStats] = useState<any[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    role: user?.role || "",
    bio: user?.bio || "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Photo state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || "",
        email: user.email || "",
        role: user.role || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await attemptServices.getMyStats();
        const formattedStats = (statsRes.data || statsRes || []).map(
          (s: any) => ({
            name: `${s.quiz_title} (${new Date(s.finished_at).toLocaleDateString("vi-VN")})`,
            score: Number(s.score),
            date: new Date(s.finished_at).toLocaleDateString("vi-VN"),
          }),
        );
        setHistoryStats(formattedStats);
      } catch (err) {
        console.error("Lỗi lấy thống kê:", err);
      }
    };
    fetchStats();
  }, []);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      await userServices.updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        bio: formData.bio,
      });
      updateUser({
        full_name: formData.fullName,
        email: formData.email,
        bio: formData.bio,
      });
      setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi cập nhật hồ sơ",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp!" });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await authServices.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword,
      );
      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi thay đổi mật khẩu",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    setUploadingAvatar(true);
    setMessage(null);
    try {
      const res = await uploadService.uploadAvatar(file);
      const newUrl = res.url || res.data?.url;

      if (newUrl) {
        await userServices.updateAvatar(newUrl);
        updateUser({ avatar_url: newUrl });
        setMessage({
          type: "success",
          text: "Cập nhật ảnh đại diện thành công!",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Không thể tải ảnh lên" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.",
      )
    ) {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsLoading(false);
      alert("Tài khoản của bạn đã được xóa.");
      // Clear store and redirect
      await logout();
      navigate("/login");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block">
            Tài khoản cá nhân
          </h2>
          <p className="text-slate-400 mt-1">
            Quản lý danh tính và bảo mật của bạn trên FireQuiz.
          </p>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium animate-slide-in ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {message.type === "success" ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-64 flex-shrink-0 space-y-6">
          {/* Avatar Section */}
          <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10 overflow-hidden shadow-2xl group">
            <div className="aspect-square relative flex items-center justify-center p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
              <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-white/20 relative group/avatar shadow-inner">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                    <User className="w-20 h-20 opacity-20" />
                  </div>
                )}

                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                  <Camera className="w-8 h-8 text-white mb-2 transform -translate-y-2 group-hover/avatar:translate-y-0 transition-transform" />
                  <span className="text-xs text-white font-medium">
                    Thay đổi ảnh
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                </label>

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 text-center border-t border-white/5 bg-white/[0.02]">
              <h3 className="font-bold text-white truncate">
                {user?.full_name}
              </h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-semibold">
                {user?.role}
              </p>
            </div>
          </Card>

          <nav className="flex flex-col space-y-1 p-2 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-xl">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === "info"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-semibold">Cài đặt cá nhân</span>
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === "security"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Lock className="w-5 h-5" />
              <span className="text-sm font-semibold">Đổi mật khẩu</span>
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === "stats"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold">Thống kê thi cử</span>
            </button>
            <div className="h-px bg-white/10 my-2"></div>
            <button
              onClick={() => navigate("/dashboard/history")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            >
              <span className="text-sm font-semibold">Lịch sử hoạt động</span>
            </button>
          </nav>
        </div>

        <div className="flex-1 min-w-0 animate-slide-up">
          {activeTab === "info" && (
            <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl overflow-hidden border-t-0">
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <CardHeader className="pt-8 px-8">
                <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <User className="w-5 h-5 text-indigo-400" />
                  </div>
                  Hồ sơ công khai
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Thông tin này sẽ giúp giáo viên và các học sinh khác nhận ra
                  bạn.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleInfoSubmit}>
                <CardContent className="space-y-8 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        Họ và tên <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="bg-slate-900/50 border-white/10 text-white focus:ring-indigo-500 hover:bg-white/5 transition-all h-12 rounded-xl"
                        placeholder="Nhập tên của bạn..."
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Địa chỉ Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="bg-slate-900/50 border-white/10 text-white focus:ring-indigo-500 hover:bg-white/5 transition-all h-12 rounded-xl"
                        placeholder="example@gmail.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm font-bold text-slate-300">
                        Tiểu sử cá nhân (Bio)
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">
                        Tối đa 500 ký tự
                      </span>
                    </div>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-white/5 transition-all min-h-[140px] text-sm leading-relaxed"
                      placeholder="Chia sẻ một chút về trình độ hoặc mục tiêu học tập của bạn..."
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-white/5 p-6 flex justify-end gap-4 border-t border-white/5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="text-slate-400 hover:text-white"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/20 rounded-xl px-8 h-12 font-bold"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Cập nhật hồ sơ
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl overflow-hidden border-t-0">
              <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
              <CardHeader className="pt-8 px-8">
                <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  Cài đặt bảo mật
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Sử dụng mật khẩu mạnh từ 8 ký tự để đảm bảo an toàn tối đa.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordSubmit}>
                <CardContent className="space-y-8 p-8 max-w-2xl">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-300">
                      Mật khẩu hiện tại
                    </label>
                    <Input
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          oldPassword: e.target.value,
                        })
                      }
                      className="bg-slate-900/50 border-white/10 text-white focus:ring-emerald-500 h-12 rounded-xl"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="h-px bg-white/5"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-300">
                        Mật khẩu mới
                      </label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="bg-slate-900/50 border-white/10 text-white focus:ring-emerald-500 h-12 rounded-xl"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-300">
                        Xác nhận mật khẩu
                      </label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="bg-slate-900/50 border-white/10 text-white focus:ring-emerald-500 h-12 rounded-xl"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-white/5 p-6 flex justify-end gap-4 border-t border-white/5">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/20 rounded-xl px-8 h-12 font-bold"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Cập nhật mật khẩu"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {activeTab === "stats" && (
            <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl overflow-hidden border-t-0">
              <div className="h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
              <CardHeader className="pt-8 px-8">
                <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                    <TrendingUp className="w-5 h-5 text-pink-400" />
                  </div>
                  Kết quả thi cử
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Biểu đồ hiển thị điểm số của các bài thi bạn đã tham gia.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 h-[450px]">
                {historyStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={historyStats}
                      layout="vertical"
                      margin={{ left: 40, right: 40 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        stroke="#ffffff05"
                      />
                      <XAxis type="number" domain={[0, "dataMax + 2"]} hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#94a3b8"
                        fontSize={12}
                        width={150}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#ffffff05" }}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderRadius: "12px",
                          border: "1px solid #ffffff10",
                        }}
                        itemStyle={{ color: "#ec4899" }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={30}>
                        {historyStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index % 2 === 0 ? "#ec4899" : "#818cf8"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 border border-dashed border-white/5 rounded-2xl">
                    <p>Bạn chưa thực hiện bài thi nào.</p>
                  </div>
                )}
              </CardContent>
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
                  <h4 className="text-rose-400 font-semibold mb-2">
                    Hành động này không thể hoàn tác
                  </h4>
                  <p className="text-sm text-slate-400">
                    Khi bạn xóa tài khoản, toàn bộ dữ liệu lịch sử bài kiểm tra,
                    điểm số và thông tin cá nhân sẽ bị xóa vĩnh viễn khỏi hệ
                    thống. Vui lòng chắc chắn trước khi thực hiện.
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
                  {isLoading ? (
                    "Đang xóa..."
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Xóa tài khoản vĩnh viễn
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
