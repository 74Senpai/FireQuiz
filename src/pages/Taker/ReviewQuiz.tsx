import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowLeft, Download } from "lucide-react";

export function ReviewQuiz() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Quiz Review</h2>
            <p className="text-slate-500">Midterm Exam - Math 101</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>

      {/* Score Summary */}
      <Card className="bg-indigo-600 text-white border-none">
        <CardContent className="p-8 flex items-center justify-between">
          <div>
            <h3 className="text-indigo-100 font-medium mb-1">Total Score</h3>
            <div className="text-5xl font-bold">8.5<span className="text-2xl text-indigo-200">/10</span></div>
          </div>
          <div className="flex gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-300">34</div>
              <div className="text-sm text-indigo-200 mt-1">Correct</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-300">6</div>
              <div className="text-sm text-indigo-200 mt-1">Incorrect</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-200">45m</div>
              <div className="text-sm text-indigo-200 mt-1">Time Taken</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mt-8 mb-4">Detailed Answers</h3>
        
        {/* Correct Answer Example */}
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-2 flex flex-row items-start gap-4 space-y-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
            <div>
              <CardTitle className="text-lg font-medium text-slate-900 leading-relaxed">
                What is the primary function of a React component?
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16 space-y-2">
            <div className="p-3 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium flex items-center justify-between">
              <span>To return UI elements based on state and props</span>
              <span className="text-xs uppercase tracking-wider font-bold">Your Answer</span>
            </div>
          </CardContent>
        </Card>

        {/* Incorrect Answer Example */}
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-2 flex flex-row items-start gap-4 space-y-0">
            <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
            <div>
              <CardTitle className="text-lg font-medium text-slate-900 leading-relaxed">
                Which hook is used to manage side effects in React?
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-16 space-y-2">
            <div className="p-3 rounded-md bg-red-100 border border-red-200 text-red-800 font-medium flex items-center justify-between">
              <span>useState</span>
              <span className="text-xs uppercase tracking-wider font-bold">Your Answer</span>
            </div>
            <div className="p-3 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium flex items-center justify-between">
              <span>useEffect</span>
              <span className="text-xs uppercase tracking-wider font-bold">Correct Answer</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
