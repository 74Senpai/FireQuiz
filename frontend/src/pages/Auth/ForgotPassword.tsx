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
import { Loader2, Mail, Lock, ShieldCheck, ChevronLeft } from "lucide-react";
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
  const [errors, setErrors] = React.useState<any>({});


  // STEP 1: Gửi OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return setErrors({ email: "Email là bắt buộc" });

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);

      setStep(2);
      setErrors({});
    } catch (err) {
      setErrors({
        api:
          err.response?.data?.message ||
          "Email không tồn tại trong hệ thống",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Xác thực OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    try {
      const res = await authService.verifyOTP({ email, otp });

      setResetToken(res.data.resetToken);
      setStep(3);
      setErrors({});
    } catch (err) {
      setErrors({
        api:
          err.response?.data?.message ||
          "Mã OTP không đúng hoặc đã hết hạn",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Đổi mật khẩu mới
  const handleResetPassword = async (e) => {
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
      await authService.resetPassword({
        resetToken,
        newPassword,
      });

      navigate("/login");
    } catch (err) {
      setErrors({
        api:
          err.response?.data?.message ||
          "Đổi mật khẩu thất bại",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25"></div>

      <Card className="relative bg-white/95 backdrop-blur-xl border shadow-2xl w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {step === 1
              ? "Quên mật khẩu"
              : step === 2
                ? "Xác thực OTP"
                : "Mật khẩu mới"}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {step === 1 && "Nhập email để nhận mã xác thực"}
            {step === 2 && `Mã OTP đã được gửi đến email của bạn`}
            {step === 3 && "Thiết lập mật khẩu mới (tối thiểu 8 ký tự)"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="ten@vi.du"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="000000"
                // Chỉnh font mono, tracking rộng và in đậm cho OTP
                className="pl-10 text-center font-mono text-2xl tracking-[0.5em] font-bold placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Mật khẩu mới"
                  className="pl-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              {errors.pass && (
                <p className="text-xs text-red-500">{errors.pass}</p>
              )}
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {errors.confirm && (
                <p className="text-xs text-red-500">{errors.confirm}</p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={
              step === 1
                ? handleSendOTP
                : step === 2
                  ? handleVerifyOTP
                  : handleResetPassword
            }
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-base font-semibold"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
            ) : null}
            {step === 1
              ? "Gửi mã xác nhận"
              : step === 2
                ? "Xác thực mã OTP"
                : "Cập nhật mật khẩu"}
          </Button>

          <div className="text-sm text-center mt-2">
            <Link
              to="/login"
              className="text-slate-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại đăng nhập
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
