import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionAnalytics } from "@/components/ui/QuestionAnalytics";

interface QuestionAnalyticsCardProps {
  quizId: number;
  quizTitle?: string;
}

export function QuestionAnalyticsCard({
  quizId,
  quizTitle,
}: QuestionAnalyticsCardProps) {
  return (
    <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
          <BarChart3 className="h-4 w-4 text-indigo-400" />
          Thống kê chuyên sâu câu hỏi
          {quizTitle && (
            <span className="ml-1 text-sm font-normal text-slate-400">
              — {quizTitle}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <QuestionAnalytics quizId={quizId} />
      </CardContent>
    </Card>
  );
}
