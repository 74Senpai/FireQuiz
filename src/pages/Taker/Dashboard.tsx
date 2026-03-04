import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Clock, CheckCircle, ArrowRight } from "lucide-react";

export function TakerDashboard() {
  const availableQuizzes = [
    { id: 1, title: "Midterm Exam - Math 101", timeLimit: 60, questions: 40, dueDate: "Today, 11:59 PM" },
    { id: 2, title: "Pop Quiz - History", timeLimit: 15, questions: 10, dueDate: "Tomorrow, 5:00 PM" },
  ];

  const completedQuizzes = [
    { id: 3, title: "Final Exam - Physics", score: "8.5/10", date: "2026-02-28" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Dashboard</h2>
          <p className="text-slate-500">Join new quizzes and view your past results.</p>
        </div>
        <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <Input placeholder="Enter Quiz Code" className="w-48 border-0 focus-visible:ring-0 bg-slate-50" />
          <Button>Join Quiz</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" /> Available Quizzes
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableQuizzes.map((quiz) => (
            <Card key={quiz.id} className="border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold line-clamp-1">{quiz.title}</CardTitle>
                <CardDescription className="text-amber-600 font-medium">Due: {quiz.dueDate}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-slate-500 mb-4">
                  <span>{quiz.timeLimit} mins</span>
                  <span>{quiz.questions} questions</span>
                </div>
                <Link to={`/dashboard/quiz/${quiz.id}/take`}>
                  <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Play className="w-4 h-4" /> Start Quiz
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" /> Recently Completed
        </h3>
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
    </div>
  );
}
