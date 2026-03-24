import React from "react";
import { Link, useNavigate } from "react-router-dom";
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
import axios from "axios";

export function Register() {
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  // State quản lý form
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // State quản lý lỗi (bao gồm lỗi validation và lỗi từ Server)
  const [errors, setErrors] = React.useState<{
    name?: string;
    email?: string;
    password?: string;
    api?: string;
  }>({});

  const validate = () => {
    const errs: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) errs.name = "Họ và tên là bắt buộc";
    if (!email) errs.email = "Email là bắt buộc";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Email không hợp lệ";
    if (!password) errs.password = "Mật khẩu là bắt buộc";
    else if (password.length < 6)
      errs.password = "Mật khẩu phải có ít nhất 6 ký tự";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setErrors({}); // Reset lỗi trước khi gọi API
    
    try {
      const API_URL = process.env.API_URL || "http://localhost:8080/api";
      // Gọi API Register
      // Lưu ý: Đổi URL tương ứng với backend của bạn (ví dụ: http://localhost:5000/api/register)
      await axios.post(`${API_URL}/auth/register`, {
        fullName: name, // Backend yêu cầu fullName
        email: email,
        password: password,
      });

      // Nếu thành công (Status 204 từ backend)
      // Bạn có thể chuyển hướng sang trang login hoặc tự động login luôn
      alert("Đăng ký thành công!");
      navigate("/login");
    } catch (error: any) {
      // Xử lý lỗi trả về từ backend (AppError)
      const message =
        error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      setErrors({ api: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="group">
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <Card className="relative bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Tạo tài khoản
          </CardTitle>
          <CardDescription className="text-slate-600">
            Tham gia để bắt đầu làm bài kiểm tra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Hiển thị lỗi chung từ API nếu có */}
          {errors.api && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
              {errors.api}
            </div>
          )}

          <div className="space-y-2 animate-slide-up animate-delay-100">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="name"
            >
              Họ và tên
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="John Doe"
              type="text"
              className="bg-slate-50/80 border border-slate-200 focus-visible:ring-pink-500"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2 animate-slide-up animate-delay-200">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="email"
            >
              Địa chỉ email
            </label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="ten@vi.du"
              type="email"
              className="bg-slate-50/80 border border-slate-200 focus-visible:ring-pink-500"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2 animate-slide-up animate-delay-300">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              type="password"
              placeholder="••••••••"
              className="bg-slate-50/80 border border-slate-200 focus-visible:ring-pink-500"
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleRegister}
            className="w-full text-base font-semibold py-6 mb-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 animate-slide-up animate-delay-400"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Đang tạo tài khoản...
              </>
            ) : (
              "Bắt đầu"
            )}
          </Button>
          <div className="text-center text-sm text-slate-600 animate-slide-up animate-delay-500">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors duration-200"
            >
              Đăng nhập tại đây
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
