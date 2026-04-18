import { PublicOpenQuizzesPanel } from "@/components/ui/PublicOpenQuizzesPanel";

export function PublicExplore() {
  return (
    <PublicOpenQuizzesPanel
      getTakeHref={(quizId) => `/dashboard/quiz/${quizId}/take`}
      pageSize={9}
    />
  );
}
