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
import { Loader2, User, Mail, Lock, ShieldCheck, ChevronLeft, ArrowRight } from "lucide-react";
import * as authService from "@/services/authServices";

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);

  // State quản lý form
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");

  // State quản lý lỗi
  const [errors, setErrors] = React.useState<any>({});

  // Tự động gửi registration khi đã nhập đủ 6 số OTP
  React.useEffect(() => {
    if (step === 2 && otp.length === 6 && !isLoading) {
      handleRegister();
    }
  }, [otp, step, isLoading]);

  const validateStep1 = () => {
    const errs: any = {};
    if (!name.trim()) errs.name = "Họ và tên là bắt buộc";
    if (!email) errs.email = "Email là bắt buộc";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Email không hợp lệ";
    
    if (!password) errs.password = "Mật khẩu là bắt buộc";
    else if (password.length < 8)
      errs.password = "Mật khẩu phải có ít nhất 8 ký tự";
    
    if (password !== confirmPassword) {
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // STEP 1: Gửi yêu cầu nhận OTP
  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep1()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await authService.sendSignUpOTP(email);
      setStep(2);
    } catch (error: any) {
      const message = error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      setErrors({ api: message });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Gửi thông tin đăng ký kèm OTP
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp || isLoading) return;

    setIsLoading(true);
    setErrors({});

    try {
      await authService.register({
        fullName: name,
        email,
        password,
        otp,
      });

      // Đăng ký thành công
      navigate("/login", { state: { message: "Đăng ký thành công! Vui lòng đăng nhập." } });
    } catch (error: any) {
      const message = error.response?.data?.message || "Xác thực OTP thất bại. Vui lòng thử lại.";
      setErrors({ api: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group max-w-md w-full mx-auto">
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
      
      <Card className="relative bg-white/95 backdrop-blur-xl border shadow-2xl overflow-hidden">
        <CardHeader className="space-y-2 text-center pb-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">
            {step === 1 ? "Tạo tài khoản" : "Xác thực Email"}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {step === 1 
              ? "Bắt đầu hành trình chinh phục tri thức cùng FireQuiz" 
              : (
                <span className="flex flex-col gap-1">
                  <span>Mã xác thực đã được gửi đến <b>{email}</b></span>
                  <span className="text-xs text-slate-400 font-medium italic">
                    * Vui lòng kiểm tra hòm thư <b>Rác (Spam)</b> nếu không thấy mã.
                  </span>
                </span>
              )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {errors.api && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg animate-shake">
              {errors.api}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4 transition-all duration-300">
              <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Nguyễn Văn A"
                    className="pl-10 bg-slate-50/50 border-slate-200 focus:border-pink-500 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-red-500 font-medium ml-1">{errors.name}</p>}
              </div>

              <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="example@gmail.com"
                    className="pl-10 bg-slate-50/50 border-slate-200 focus:border-pink-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 font-medium ml-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-slate-50/50 border-slate-200 focus:border-pink-500 transition-all text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {errors.password && <p className="text-[11px] text-red-500 font-medium ml-1">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Xác nhận</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-slate-50/50 border-slate-200 focus:border-pink-500 transition-all text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-red-500 font-medium ml-1 -mt-2">{errors.confirmPassword}</p>}
            </div>
          ) : (
            <div className="space-y-6 py-4 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-pink-600" />
                </div>
                <p className="text-sm text-center text-slate-600 px-4">
                  Vui lòng nhập mã 6 số chúng tôi vừa gửi đến hòm thư của bạn để hoàn tất đăng ký.
                </p>
                <p className="text-[11px] text-pink-600 font-semibold bg-pink-50 px-3 py-1 rounded-full animate-pulse">
                  Mẹo: Kiểm tra cả hộp thư Spam nhé!
                </p>
              </div>
              
              <div className="relative">
                <Input
                  placeholder="000000"
                  className="text-center font-mono text-3xl tracking-[0.5em] font-bold h-16 border-2 focus:border-pink-500"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-center">
                <button 
                  type="button"
                  onClick={handleRequestOTP}
                  className="text-xs text-slate-500 hover:text-pink-600 font-medium transition-colors"
                >
                  Không nhận được mã? Gửi lại
                </button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pb-8">
          <Button
            onClick={step === 1 ? handleRequestOTP : handleRegister}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:opacity-90 py-6 text-base font-bold shadow-lg shadow-pink-200 transition-all duration-300"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
            ) : step === 1 ? (
              <>Nhận mã xác thực <ArrowRight className="ml-2 w-4 h-4" /></>
            ) : (
              "Xác nhận & Hoàn tất"
            )}
          </Button>

          <div className="flex items-center justify-center gap-4 w-full">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
            <div className="h-4 w-px bg-slate-200"></div>
            <Link
              to="/login"
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-all"
            >
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
