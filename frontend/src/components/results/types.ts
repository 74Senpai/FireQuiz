export interface Quiz {
  id: number;
  title: string;
  status: string;
  quiz_code: string;
  grading_scale: number | null;
}

export interface AttemptUser {
  id: number;
  fullName: string;
  email: string;
}

export interface AttemptResult {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  score: number | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  submitStatus: "SUBMITTED" | "IN_PROGRESS";
  user: AttemptUser;
}

export interface QuizStats {
  totalAttempts: number;
  submittedCount: number;
  inProgressCount: number;
  avgScore: number | null;
  maxScore: number | null;
  minScore: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  attemptId: number;
  quizId: number;
  quizTitle: string;
  score: number | null;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number | null;
  user: AttemptUser;
}

export interface Filters {
  search: string;
  minScore: string;
  maxScore: string;
  minDurationSeconds: string;
  maxDurationSeconds: string;
  startDate: string;
  endDate: string;
  status: string;
}

export const EMPTY_FILTERS: Filters = {
  search: "",
  minScore: "",
  maxScore: "",
  minDurationSeconds: "",
  maxDurationSeconds: "",
  startDate: "",
  endDate: "",
  status: "",
};
