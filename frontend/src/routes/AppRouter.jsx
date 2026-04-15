import {
  Routes,
  Route,
} from "react-router-dom";

import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";

const Login = lazy(() => import("../pages/Auth/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("../pages/Auth/Register").then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import("../pages/Auth/ForgotPassword").then(m => ({ default: m.ForgotPassword })));

const CreatorDashboard = lazy(() => import("../pages/Creator/Dashboard").then(m => ({ default: m.CreatorDashboard })));
const QuizEditor = lazy(() => import("../pages/Creator/QuizEditor").then(m => ({ default: m.QuizEditor })));
const QuestionBank = lazy(() => import("../pages/Creator/QuestionBank").then(m => ({ default: m.QuestionBank })));
const Results = lazy(() => import("../pages/Creator/Results").then(m => ({ default: m.Results })));
const Leaderboard = lazy(() => import("../pages/Creator/Leaderboard").then(m => ({ default: m.Leaderboard })));
const QuestionAnalytics = lazy(() => import("../pages/Creator/QuestionAnalytics").then(m => ({ default: m.QuestionAnalytics })));

const TakerDashboard = lazy(() => import("../pages/Taker/Dashboard").then(m => ({ default: m.TakerDashboard })));
const TakeQuiz = lazy(() => import("../pages/Taker/TakeQuiz").then(m => ({ default: m.TakeQuiz })));
const ReviewQuiz = lazy(() => import("../pages/Taker/ReviewQuiz").then(m => ({ default: m.ReviewQuiz })));
const History = lazy(() => import("../pages/Taker/History").then(m => ({ default: m.History })));

const Profile = lazy(() => import("../pages/Profile").then(m => ({ default: m.Profile })));
const PublicExplore = lazy(() => import("../pages/PublicExplore").then(m => ({ default: m.PublicExplore })));

// Loading Component để tránh nháy giật trắng màn hình khi Lazy Load các chunk file
const GlobalLoader = () => (
  <div className="flex h-[100vh] w-full items-center justify-center bg-transparent">
    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
  </div>
);

import ProtectedRoute from "./ProtectedRouter";
import PublicRoute from "./PublicRouter";
import HomeRedirect from "@/components/redirects/HomeRedirect";
export default function AppRouter() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/explore" element={<PublicExplore />} />

        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<TakerDashboard />} />
            <Route path="manage" element={<CreatorDashboard />} />
            <Route path="quiz/new" element={<QuizEditor />} />
            <Route path="quiz/:id/edit" element={<QuizEditor />} />
            <Route path="question-bank" element={<QuestionBank />} />
            <Route path="results" element={<Results />} />
            <Route path="profile" element={<Profile />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="question-analytics" element={<QuestionAnalytics />} />
            <Route path="history" element={<History />} />
            <Route path="quiz/:id/take" element={<TakeQuiz />} />
            <Route path="attempt/:attemptId/review" element={<ReviewQuiz />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
