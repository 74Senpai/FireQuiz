import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import { ForgotPassword } from "./pages/Auth/ForgotPassword";
import { CreatorDashboard } from "./pages/Creator/Dashboard";
import { QuizEditor } from "./pages/Creator/QuizEditor";
import { QuestionBank } from "./pages/Creator/QuestionBank";
import { Results } from "./pages/Creator/Results";
import { TakerDashboard } from "./pages/Taker/Dashboard";
import { TakeQuiz } from "./pages/Taker/TakeQuiz";
import { ReviewQuiz } from "./pages/Taker/ReviewQuiz";
import { History } from "./pages/Taker/History";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<TakerDashboard />} />
          <Route path="manage" element={<CreatorDashboard />} />
          <Route path="quiz/new" element={<QuizEditor />} />
          <Route path="quiz/:id/edit" element={<QuizEditor />} />
          <Route path="question-bank" element={<QuestionBank />} />
          <Route path="results" element={<Results />} />
          <Route path="history" element={<History />} />
          <Route path="quiz/:id/take" element={<TakeQuiz />} />
          <Route path="quiz/:id/review" element={<ReviewQuiz />} />
        </Route>
      </Routes>
    </Router>
  );
}
