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
import React from "react";
import {
  Loader2,
  Mail,
  Lock,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import * as authService from "@/services/authServices";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [resetToken, setResetToken] = React.useState("");
  const [countdown, setCountdown] = React.useState(0);
  const [errors, setErrors] = React.useState<any>({});

  const lastSubmittedOtp = React.useRef("");

  // Tự động gửi OTP khi đã nhập đủ 6 số
  React.useEffect(() => {
    if (
      step === 2 &&
      otp.length === 6 &&
      !isLoading &&
      otp !== lastSubmittedOtp.current
    ) {
      lastSubmittedOtp.current = otp;
      handleVerifyOTP();
    }
  }, [otp, step, isLoading]);

  // Xử lý đếm ngược gửi lại mã
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // STEP 1: Gửi OTP
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return setErrors({ email: "Email là bắt buộc" });

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep(2);
      setCountdown(60);
      setErrors({});
    } catch (err: any) {
      setErrors({
        api:
          err.response?.data?.message || "Email không tồn tại trong hệ thống",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Xác thực OTP
  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp || isLoading) return;

    setIsLoading(true);
    try {
      const res = await authService.verifyOTP({ email, otp });
      setResetToken(res.resetToken);
      setStep(3);
      setErrors({});
    } catch (err: any) {
      setErrors({
        api: err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn",
      });
      lastSubmittedOtp.current = ""; // Reset để user có thể nhập lại mã đó nếu muốn
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Đổi mật khẩu mới
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (newPassword.length < 8) {
      return setErrors({ pass: "Mật khẩu phải có ít nhất 8 ký tự" });
    }

    if (newPassword !== confirmPassword) {
      return setErrors({ confirm: "Mật khẩu xác nhận không khớp" });
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({ resetToken, newPassword });
      navigate("/login", { state: { message: "Đổi mật khẩu thành công!" } });
    } catch (err: any) {
      setErrors({
        api: err.response?.data?.message || "Đổi mật khẩu thất bại",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group max-w-md w-full mx-auto">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

      <Card className="relative bg-white/95 backdrop-blur-xl border shadow-2xl overflow-hidden">
        <CardHeader className="space-y-2 text-center pb-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
            {step === 1
              ? "Quên mật khẩu"
              : step === 2
                ? "Xác thực OTP"
                : "Mật khẩu mới"}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {step === 1 && "Nhập email để nhận mã khôi phục tài khoản"}
            {step === 2 && (
              <span className="flex flex-col gap-1">
                <span>
                  Mã xác thực đã được gửi đến <b>{email}</b>
                </span>
              </span>
            )}
            {step === 3 && "Thiết lập mật khẩu mới để bảo mật tài khoản"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {errors.api && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg animate-shake text-center">
              {errors.api}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-1.5 transition-all duration-300">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="example@gmail.com"
                  className="pl-10 bg-slate-50/50 border-slate-200 focus:border-indigo-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 font-medium ml-1">
                  {errors.email}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 py-2 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center ring-8 ring-indigo-50">
                  <ShieldCheck className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                  Mẹo: Kiểm tra cả hòm thư Rác (Spam) nhé!
                </p>
              </div>

              <div className="relative max-w-[280px] mx-auto">
                <Input
                  placeholder="000000"
                  className="text-center font-mono text-3xl tracking-[0.5em] font-bold h-16 border-2 focus:border-indigo-500 rounded-xl"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={countdown > 0 || isLoading}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  {countdown > 0
                    ? `Không nhận được mã? Gửi lại sau ${countdown}s`
                    : "Không nhận được mã? Gửi lại"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-slate-50/50 border-slate-200"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                {errors.pass && (
                  <p className="text-[11px] text-red-500 font-medium ml-1">
                    {errors.pass}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-slate-50/50 border-slate-200"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {errors.confirm && (
                  <p className="text-[11px] text-red-500 font-medium ml-1">
                    {errors.confirm}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pb-8">
          <Button
            onClick={
              step === 1
                ? handleSendOTP
                : step === 2
                  ? handleVerifyOTP
                  : handleResetPassword
            }
            disabled={isLoading || (step === 2 && otp.length < 6)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 py-6 text-base font-bold shadow-lg shadow-indigo-100 transition-all duration-300"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
            ) : step === 1 ? (
              <>
                Tiếp theo <ArrowRight className="ml-2 w-4 h-4" />
              </>
            ) : step === 2 ? (
              "Xác nhận mã OTP"
            ) : (
              "Cập nhật mật khẩu"
            )}
          </Button>

          <div className="flex items-center justify-center gap-4 w-full">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
            {step > 1 && <div className="h-4 w-px bg-slate-200"></div>}
            <Link
              to="/login"
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-all"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
