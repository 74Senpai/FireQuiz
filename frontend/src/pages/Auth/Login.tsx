import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  // form field state and error messages
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  // validate inputs before submitting
  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) {
      errs.email = "Email là bắt buộc"; // bắt buộc phải nhập email
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = "Email không hợp lệ"; // kiểm tra định dạng email đơn giản
    }
    if (!password) {
      errs.password = "Mật khẩu là bắt buộc";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return; // nếu validation thất bại thì không tiếp tục
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1000);
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
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200">
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
            className="w-full text-base font-semibold py-6 mb-2 animate-slide-up animate-delay-300"
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
