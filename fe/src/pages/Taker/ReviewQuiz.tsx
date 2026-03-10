import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowLeft, Download } from "lucide-react";

export function ReviewQuiz() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 text-slate-300 hover:text-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Quiz Review</h2>
            <p className="text-slate-400 mt-1">Midterm Exam - Math 101</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 border-slate-400/50 text-slate-100 hover:bg-white/10">
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>

      {/* Score Summary */}
      <Card className="bg-gradient-to-br from-indigo-600/90 to-purple-600/90 text-white border-none shadow-2xl hover:shadow-indigo-500/50 animate-slide-up">
        <CardContent className="p-8 flex items-center justify-between">
          <div>
            <h3 className="text-indigo-200 font-semibold mb-2">Total Score</h3>
            <div className="text-6xl font-bold italic">8.5<span className="text-2xl text-indigo-300 ml-2">/10</span></div>
          </div>
          <div className="flex gap-12 text-center">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-emerald-400/50 transition-colors duration-300">
              <div className="text-4xl font-bold text-emerald-300">34</div>
              <div className="text-sm text-indigo-200 mt-2 font-semibold">Correct</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-red-400/50 transition-colors duration-300">
              <div className="text-4xl font-bold text-red-300">6</div>
              <div className="text-sm text-indigo-200 mt-2 font-semibold">Incorrect</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 transition-colors duration-300">
              <div className="text-4xl font-bold text-purple-300">45m</div>
              <div className="text-sm text-indigo-200 mt-2 font-semibold">Time Taken</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Review */}
      <div className="space-y-5">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mt-8 mb-4">Detailed Answers</h3>
        
        {/* Correct Answer Example */}
        <Card className="border-emerald-400/30 bg-gradient-to-br from-emerald-900/30 to-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-emerald-500/30 animate-slide-up animate-delay-100">
          <CardHeader className="pb-2 flex flex-row items-start gap-4 space-y-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-1 animate-float" />
            <div>
              <CardTitle className="text-lg font-semibold text-slate-100 leading-relaxed">
                What is the primary function of a React component?
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16 space-y-2">
            <div className="p-4 rounded-lg bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-semibold flex items-center justify-between hover:bg-emerald-500/40 transition-colors duration-300">
              <span>To return UI elements based on state and props</span>
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">Your Answer</span>
            </div>
          </CardContent>
        </Card>

        {/* Incorrect Answer Example */}
        <Card className="border-red-400/30 bg-gradient-to-br from-red-900/30 to-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-red-500/30 animate-slide-up animate-delay-200">
          <CardHeader className="pb-2 flex flex-row items-start gap-4 space-y-0">
            <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-1 animate-float" />
            <div>
              <CardTitle className="text-lg font-semibold text-slate-100 leading-relaxed">
                Which hook is used to manage side effects in React?
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16 space-y-2">
            <div className="p-4 rounded-lg bg-red-500/30 border border-red-400/50 text-red-200 font-semibold flex items-center justify-between hover:bg-red-500/40 transition-colors duration-300">
              <span>useState</span>
              <span className="text-xs uppercase tracking-wider font-bold text-red-300">Your Answer</span>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-semibold flex items-center justify-between hover:bg-emerald-500/40 transition-colors duration-300">
              <span>useEffect</span>
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">Correct Answer</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
