import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Welcome back</CardTitle>
          <CardDescription className="text-slate-600">Enter your email to sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2 animate-slide-up animate-delay-100">
            <label className="text-sm font-semibold text-slate-700" htmlFor="email">
              Email Address
            </label>
            <Input 
              id="email" 
              placeholder="name@example.com" 
              type="email"
              className="bg-slate-50/80 border border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="space-y-2 animate-slide-up animate-delay-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password"
              placeholder="••••••••"
              className="bg-slate-50/80 border border-slate-200 focus-visible:ring-indigo-500"
            />
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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          <div className="text-center text-sm text-slate-600 animate-slide-up animate-delay-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors duration-200">
              Create one
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
