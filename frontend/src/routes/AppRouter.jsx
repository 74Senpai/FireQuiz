import {
  Routes,
  Route,
} from "react-router-dom";

import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Login } from "../pages/Auth/Login";
import { Register } from "../pages/Auth/Register";
import { ForgotPassword } from "../pages/Auth/ForgotPassword";
import { CreatorDashboard } from "../pages/Creator/Dashboard";
import { QuizEditor } from "../pages/Creator/QuizEditor";
import { QuestionBank } from "../pages/Creator/QuestionBank";
import { Results } from "../pages/Creator/Results";
import { Leaderboard } from "../pages/Creator/Leaderboard";
import { QuestionAnalytics } from "../pages/Creator/QuestionAnalytics";
import { TakerDashboard } from "../pages/Taker/Dashboard";
import { TakeQuiz } from "../pages/Taker/TakeQuiz";
import { ReviewQuiz } from "../pages/Taker/ReviewQuiz";
import { History } from "../pages/Taker/History";
import { Profile } from "../pages/Profile";

import ProtectedRoute from "./ProtectedRouter";
import PublicRoute from "./PublicRouter";
import HomeRedirect from "../components/redirects/HomeRedirect";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

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
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="question-analytics" element={<QuestionAnalytics />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile />} />
          <Route path="quiz/:id/take" element={<TakeQuiz />} />
          <Route path="quiz/:id/review" element={<ReviewQuiz />} />
        </Route>
      </Route>
    </Routes>
  );
}
