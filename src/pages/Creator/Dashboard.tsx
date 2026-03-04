import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MoreVertical, Clock, Users, Calendar } from "lucide-react";

export function CreatorDashboard() {
  const quizzes = [
    { id: 1, title: "Midterm Exam - Math 101", status: "Published", participants: 45, date: "2026-03-15", timeLimit: 60 },
    { id: 2, title: "Pop Quiz - History", status: "Draft", participants: 0, date: "-", timeLimit: 15 },
    { id: 3, title: "Final Exam - Physics", status: "Closed", participants: 120, date: "2026-02-28", timeLimit: 120 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quizzes</h2>
          <p className="text-slate-500">Manage your quizzes, view results, and edit settings.</p>
        </div>
        <Link to="/dashboard/quiz/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${
              quiz.status === 'Published' ? 'bg-emerald-500' : 
              quiz.status === 'Draft' ? 'bg-amber-500' : 'bg-slate-300'
            }`} />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold line-clamp-1">{quiz.title}</CardTitle>
                <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  quiz.status === 'Published' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                  quiz.status === 'Draft' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' : 
                  'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/10'
                }`}>
                  {quiz.status}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 mt-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{quiz.timeLimit} mins</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{quiz.participants} taken</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Calendar className="w-4 h-4" />
                  <span>{quiz.date}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
