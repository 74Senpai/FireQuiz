import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Quiz } from "./types";

interface QuizSelectorCardProps {
  quizzes: Quiz[];
  selectedQuizId: number | null;
  onChange: (quizId: number) => void;
}

export function QuizSelectorCard({
  quizzes,
  selectedQuizId,
  onChange,
}: QuizSelectorCardProps) {
  return (
    <Card className="border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
          <BarChart3 className="h-4 w-4 text-indigo-400" />
          Chọn quiz để xem kết quả
        </CardTitle>
      </CardHeader>
      <CardContent>
        <select
          value={selectedQuizId ?? ""}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-10 w-full max-w-md cursor-pointer rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {quizzes.map((quiz) => (
            <option
              key={quiz.id}
              value={quiz.id}
              className="bg-slate-800 text-slate-100"
            >
              {quiz.title}
              {quiz.quiz_code ? ` (#${quiz.quiz_code})` : ""}
            </option>
          ))}
        </select>
      </CardContent>
    </Card>
  );
}
