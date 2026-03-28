import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Thêm useParams
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionManager } from "@/components/ui/QuestionManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  Settings,
  Users,
  Calendar,
  ShieldAlert,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import axios from "axios";

export function QuizEditor() {
  const { id } = useParams(); // Lấy id từ URL: /dashboard/quiz/:id/edit
  const isEditMode = !!id; // Kiểm tra xem có phải đang ở chế độ chỉnh sửa không

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("settings");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false); // Trạng thái load dữ liệu cũ

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [gradeScale, setGradeScale] = useState("10");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const API_URL = process.env.API_URL || "http://localhost:8080/api";

  // 1. useEffect: Lấy dữ liệu Quiz cũ nếu là chế độ Edit
  useEffect(() => {
    if (isEditMode && id) {
      const fetchQuizDetail = async () => {
        setIsLoadingData(true);
        try {
          const token = localStorage.getItem("accessToken");
          const response = await axios.get(`${API_URL}/quiz/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const quiz = response.data; // Object trực tiếp theo JSON bạn gửi

          if (quiz) {
            setTitle(quiz.title || "");
            setDescription(quiz.description || "");

            // Lưu ý: Map từ snake_case của DB sang State
            setGradeScale(quiz.grading_scale?.toString() || "10");
            setTimeLimit(
              quiz.time_limit_seconds
                ? (quiz.time_limit_seconds / 60).toString()
                : "",
            );

            const toInputDate = (d: any) =>
              d ? new Date(d).toISOString().slice(0, 16) : "";
            setOpenTime(toInputDate(quiz.available_from));
            setCloseTime(toInputDate(quiz.available_until));

            setMaxParticipants(quiz.max_attempts?.toString() || "");
          }
        } catch (error) {
          console.error("Lỗi lấy chi tiết:", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchQuizDetail();
    }
  }, [id, isEditMode, API_URL]);

  const validate = () => {
    let errs: { [key: string]: string } = {};
    if (!title.trim()) errs.title = "Tiêu đề Quiz là bắt buộc";
    if (timeLimit && Number(timeLimit) < 1)
      errs.timeLimit = "Thời gian phải ít nhất 1 phút";
    if (openTime && closeTime && new Date(openTime) >= new Date(closeTime)) {
      errs.schedule = "Thời gian mở phải trước thời gian đóng";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 2. Hàm lưu (Create hoặc Update)
  const saveQuiz = async (newStatus: "DRAFT" | "PUBLIC") => {
    if (!validate()) {
      if (errors.title) setActiveTab("settings");
      else if (errors.schedule) setActiveTab("schedule");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Chuyển đổi dữ liệu sang định dạng CamelCase mà Service yêu cầu
      const infoPayload = {
        title: title,
        description: description,
      };

      const settingsPayload = {
        gradingScale: parseInt(gradeScale),
        timeLimitSeconds: timeLimit ? parseInt(timeLimit) * 60 : null,
        availableFrom: openTime || null,
        availableUntil: closeTime || null,
        maxAttempts: maxParticipants ? parseInt(maxParticipants) : null,
      };

      if (isEditMode) {
        // CHẾ ĐỘ CẬP NHẬT (PATCH)
        // Gọi đồng thời 3 API như Router quy định
        await Promise.all([
          axios.patch(`${API_URL}/quiz/${id}/info`, infoPayload, config),
          axios.patch(
            `${API_URL}/quiz/${id}/settings`,
            settingsPayload,
            config,
          ),
          axios.patch(
            `${API_URL}/quiz/${id}/status`,
            { status: newStatus },
            config,
          ),
        ]);
        alert("Cập nhật bài thi thành công!");
      } else {
        // CHẾ ĐỘ TẠO MỚI (POST)
        // Gộp tất cả vào 1 payload (Backend createQuiz nhận gộp)
        const createPayload = {
          ...infoPayload,
          ...settingsPayload,
          status: newStatus,
        };

        await axios.post(`${API_URL}/quiz`, createPayload, config);
        alert("Tạo bài thi mới thành công!");
      }

      navigate("/dashboard/manage");
    } catch (error: any) {
      console.error("Lỗi lưu Quiz:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Đang tải thông tin Quiz...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              {isEditMode ? "Chỉnh sửa Quiz" : "Tạo Quiz Mới"}
            </h2>
            <p className="text-slate-400 mt-1">
              {isEditMode
                ? "Cập nhật lại cấu hình bài thi của bạn."
                : "Cấu hình, thêm câu hỏi và xuất bản."}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => saveQuiz("DRAFT")}
            variant="outline"
            disabled={isSubmitting}
            className="border-slate-400/50 text-slate-100 hover:bg-white/10"
          >
            {isEditMode ? "Lưu bản nháp" : "Lưu nháp"}
          </Button>
          <Button
            onClick={() => saveQuiz("PUBLIC")}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditMode ? "Cập nhật Quiz" : "Xuất bản Quiz"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <div className="col-span-3 space-y-1">
          {[
            { id: "settings", label: "Cài đặt", icon: Settings },
            { id: "questions", label: "Câu hỏi", icon: ShieldAlert },
            { id: "schedule", label: "Lập lịch", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="col-span-9 space-y-6 animate-slide-up">
          {activeTab === "settings" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-100">Cài đặt chung</CardTitle>
                <CardDescription className="text-slate-400">
                  Thông tin cơ bản và quy tắc chấm điểm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tiêu đề Quiz</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-slate-900/50 border-white/10 text-white"
                    placeholder="Ví dụ: Thi giữa kỳ - Toán 101"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-400">{errors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mô tả</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    placeholder="Hướng dẫn cho sinh viên..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" /> Thời gian làm
                      (phút)
                    </label>
                    <Input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      className="bg-slate-900/50 border-white/10"
                      placeholder="60"
                    />
                    {errors.timeLimit && (
                      <p className="text-sm text-red-400">{errors.timeLimit}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thang điểm</label>
                    <select
                      value={gradeScale}
                      onChange={(e) => setGradeScale(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-slate-900 p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="10">Thang 10 điểm</option>
                      <option value="100">Thang 100 điểm</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "questions" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Quản lý câu hỏi
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {isEditMode
                    ? "Tạo và chỉnh sửa các câu hỏi trắc nghiệm."
                    : "Vui lòng lưu thông tin chung trước khi thêm câu hỏi."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  // Truyền id từ useParams vào đây
                  <QuestionManager quizId={id!} />
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-slate-400 text-sm italic">
                      Bạn cần tạo Quiz trước (nhấn Lưu nháp) để bắt đầu thêm câu
                      hỏi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "schedule" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Lịch & Quyền truy cập
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thời gian mở</label>
                    <Input
                      type="datetime-local"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="bg-slate-900/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Thời gian đóng
                    </label>
                    <Input
                      type="datetime-local"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="bg-slate-900/50 border-white/10"
                    />
                    {errors.schedule && (
                      <p className="text-sm text-red-400">{errors.schedule}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <label className="text-sm font-medium">
                    Số người tối đa (lượt thi)
                  </label>
                  <Input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="Để trống nếu không giới hạn"
                    className="max-w-xs bg-slate-900/50 border-white/10"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
