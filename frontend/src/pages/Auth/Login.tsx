import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  // Form state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  
  // Quản lý lỗi (bao gồm lỗi validation và lỗi từ API)
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; api?: string }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) {
      errs.email = "Email là bắt buộc";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = "Email không hợp lệ";
    }
    if (!password) {
      errs.password = "Mật khẩu là bắt buộc";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({}); // Reset lỗi cũ

    try {
      // Lấy URL từ env (Đảm bảo đã có VITE_API_URL trong file .env)
      const API_URL = process.env.API_URL || "http://localhost:8080/api";

      const response = await axios.post(
        `${API_URL}/auth/login`, 
        { email, password },
        { withCredentials: true } // QUAN TRỌNG: Để nhận Refresh Token Cookie
      );

      // Nếu thành công:
      const { accessToken } = response.data;
      
      // Lưu Access Token vào localStorage để dùng cho các request sau
      localStorage.setItem("accessToken", accessToken);

      // Chuyển hướng người dùng
      navigate("/dashboard");
      
    } catch (error: any) {
      // Xử lý lỗi từ Backend (ví dụ: Sai mật khẩu, User không tồn tại)
      const message = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setErrors({ api: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="group">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <Card className="relative bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Chào mừng trở lại</CardTitle>
          <CardDescription className="text-slate-600">Nhập email của bạn để đăng nhập</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          
          {/* Hiển thị lỗi từ API (ví dụ: Sai tài khoản/mật khẩu) */}
          {errors.api && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg animate-shake">
              {errors.api}
            </div>
          )}

          <div className="space-y-2 animate-slide-up animate-delay-100">
            <label className="text-sm font-semibold text-slate-700" htmlFor="email">
              Địa chỉ email
            </label>
            <Input 
              id="email" 
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              placeholder="ten@vi.du" 
              type="email"
              className="bg-slate-50/80 border border-slate-200 focus-visible:ring-indigo-500"
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div className="space-y-2 animate-slide-up animate-delay-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                Mật khẩu
              </label>
              <Link to="/forgot-password" disable className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200">
                Quên mật khẩu?
              </Link>
            </div>
            <Input 
              id="password" 
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              type="password"
              placeholder="••••••••"
              className="bg-slate-50/80 border border-slate-200 focus-visible:ring-indigo-500"
            />
            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            onClick={handleLogin} 
            className="w-full text-base font-semibold py-6 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 animate-slide-up animate-delay-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
          <div className="text-center text-sm text-slate-600 animate-slide-up animate-delay-400">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors duration-200">
              Tạo tài khoản
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
