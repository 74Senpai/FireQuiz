import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";

export function History() {
  const completedQuizzes = [
    { id: 3, title: "Final Exam - Physics", score: "8.5/10", date: "2026-02-28" },
    { id: 4, title: "Midterm - Chemistry", score: "9.0/10", date: "2026-01-15" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quiz History</h2>
        <p className="text-slate-500">Review your past performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {completedQuizzes.map((quiz) => (
          <Card key={quiz.id} className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold line-clamp-1 text-slate-700">{quiz.title}</CardTitle>
              <CardDescription>Completed on {quiz.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500">Score</span>
                <span className="font-bold text-lg text-emerald-600">{quiz.score}</span>
              </div>
              <Link to={`/dashboard/quiz/${quiz.id}/review`}>
                <Button variant="outline" className="w-full gap-2">
                  Review Answers <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
