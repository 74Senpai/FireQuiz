import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Calendar,
  ShieldAlert,
  ChevronLeft,
  Loader2,
  Globe,
  Lock,
  Hash,
  Copy,
  Check,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as quizServices from "@/services/quizServices";
import { useDialogStore } from "@/stores/dialogStore";

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PUBLIC: { label: "Công khai", color: "emerald", icon: Globe },
  PRIVATE: { label: "Riêng tư", color: "amber", icon: Lock },
  DRAFT: { label: "Bản nháp", color: "slate", icon: Settings },
} as const;
type QuizStatus = keyof typeof STATUS_CONFIG;

export function QuizEditor() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("settings");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [gradeScale, setGradeScale] = useState("10");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [maxAttemptsPerUser, setMaxAttemptsPerUser] = useState("");
  const [maxTabViolations, setMaxTabViolations] = useState("2");

  // PIN & Status state
  const [quizStatus, setQuizStatus] = useState<QuizStatus>("DRAFT");
  const [quizPin, setQuizPin] = useState<string | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isEditMode || !id) return;
    const fetchQuizDetail = async () => {
      setIsLoadingData(true);
      try {
        const res = await quizServices.getQuizDetails(id);
        const quiz = res.data || res;
        if (quiz) {
          setTitle(quiz.title || "");
          setDescription(quiz.description || "");
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
          setMaxAttemptsPerUser(quiz.max_attempts_per_user?.toString() || "");
          setMaxTabViolations(
            quiz.max_tab_violations !== undefined &&
              quiz.max_tab_violations !== null
              ? quiz.max_tab_violations.toString()
              : "2",
          );
          setQuizStatus((quiz.status as QuizStatus) || "DRAFT");
          setQuizPin(quiz.quiz_code || null);
        }
      } catch {
        console.error("Lỗi lấy chi tiết quiz");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchQuizDetail();
  }, [id, isEditMode]);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!title.trim()) errs.title = "Tiêu đề Quiz là bắt buộc";
    if (timeLimit && Number(timeLimit) < 1)
      errs.timeLimit = "Thời gian phải ít nhất 1 phút";
    if (openTime && closeTime && new Date(openTime) >= new Date(closeTime))
      errs.schedule = "Thời gian mở phải trước thời gian đóng";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveQuiz = async (newStatus: "DRAFT" | "PUBLIC") => {
    if (!validate()) {
      if (errors.title) setActiveTab("settings");
      else if (errors.schedule) setActiveTab("schedule");
      return;
    }
    setIsSubmitting(true);
    try {
      const infoPayload = { title, description };
      const settingsPayload = {
        gradingScale: parseInt(gradeScale),
        timeLimitSeconds: timeLimit ? parseInt(timeLimit) * 60 : null,
        availableFrom: openTime || null,
        availableUntil: closeTime || null,
        maxAttempts: maxParticipants ? parseInt(maxParticipants) : null,
        maxAttemptsPerUser: maxAttemptsPerUser
          ? parseInt(maxAttemptsPerUser)
          : null,
        maxTabViolations: maxTabViolations ? parseInt(maxTabViolations) : 0,
      };

      if (isEditMode) {
        await Promise.all([
          quizServices.updateQuizInfo(id!, infoPayload),
          quizServices.updateQuizSettings(id!, settingsPayload),
          quizServices.updateQuizStatus(id!, newStatus),
        ]);
        setQuizStatus(newStatus);
        useDialogStore.getState().showDialog({
          title: "Thành công",
          description: "Cập nhật bài thi thành công!",
        });
      } else {
        const createPayload = {
          ...infoPayload,
          ...settingsPayload,
          status: newStatus,
        };
        const res = await quizServices.createQuiz(createPayload);
        useDialogStore.getState().showDialog({
          title: "Thành công",
          description: "Tạo bài thi mới thành công!",
        });
        const quizId = res.quizId || res.data?.quizId;
        navigate(`/dashboard/quiz/${quizId}/edit`);
        return;
      }
    } catch (error: any) {
      useDialogStore.getState().showDialog({
        title: "Lỗi",
        description: error.response?.data?.message || "Có lỗi xảy ra.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (newStatus: QuizStatus) => {
    if (!isEditMode || newStatus === quizStatus) return;
    useDialogStore.getState().showDialog({
      type: "confirm",
      title: "Xác nhận",
      description: `Bạn có chắc chắn chuyển sang trạng thái: ${newStatus}?`,
      onConfirm: async () => {
        setIsStatusUpdating(true);
        try {
          await quizServices.updateQuizStatus(id!, newStatus);
          setQuizStatus(newStatus);
        } catch (err: any) {
          useDialogStore.getState().showDialog({
            title: "Lỗi",
            description:
              err.response?.data?.message || "Không thể đổi trạng thái",
          });
        } finally {
          setIsStatusUpdating(false);
        }
      },
    });
  };

  const handleGeneratePin = async () => {
    setIsPinLoading(true);
    try {
      const res = await quizServices.generatePin(id!);
      setQuizPin(
        res.pin || res.quizCode || res.data?.pin || res.data?.quizCode,
      );
    } catch (err: any) {
      useDialogStore.getState().showDialog({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể tạo mã PIN",
      });
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleRemovePin = async () => {
    useDialogStore.getState().showDialog({
      type: "confirm",
      title: "Xóa mã PIN",
      description:
        "Xóa mã PIN? Người dùng đang có mã sẽ không thể dùng mã này nữa.",
      onConfirm: async () => {
        setIsPinLoading(true);
        try {
          await quizServices.removePin(id!);
          setQuizPin(null);
        } catch (err: any) {
          useDialogStore.getState().showDialog({
            title: "Lỗi",
            description: err.response?.data?.message || "Không thể xóa mã PIN",
          });
        } finally {
          setIsPinLoading(false);
        }
      },
    });
  };

  const handleCopyPin = useCallback(() => {
    if (!quizPin) return;
    navigator.clipboard.writeText(quizPin);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [quizPin]);

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-200">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <p className="text-slate-400">Đang tải thông tin Quiz...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-indigo-300">
              {isEditMode ? "Chỉnh sửa Quiz" : "Tạo Quiz Mới"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isEditMode
                ? "Cập nhật cấu hình bài thi."
                : "Cấu hình, thêm câu hỏi và xuất bản."}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => saveQuiz("DRAFT")}
            variant="outline"
            disabled={isSubmitting}
            className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            {isEditMode ? "Lưu bản nháp" : "Lưu nháp"}
          </Button>
          <Button
            onClick={() => saveQuiz("PUBLIC")}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditMode ? "Cập nhật Quiz" : "Xuất bản Quiz"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-1.5">
          {[
            { id: "settings", label: "Cài đặt", icon: Settings },
            { id: "questions", label: "Câu hỏi", icon: ShieldAlert },
            { id: "schedule", label: "Lập lịch", icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent",
              )}
            >
              <tab.icon
                className={cn(
                  "w-5 h-5",
                  activeTab === tab.id ? "text-indigo-400" : "text-slate-500",
                )}
              />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6 animate-slide-up">
          {/* ── Tab: Cài đặt ── */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-100">
                    Cài đặt chung
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Thông tin cơ bản và quy tắc chấm điểm.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Tiêu đề Quiz
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-slate-950/50 border-slate-800 text-slate-200 focus:ring-indigo-500/50"
                      placeholder="Ví dụ: Thi giữa kỳ - Toán 101"
                    />
                    {errors.title && (
                      <p className="text-xs text-rose-400">{errors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Mô tả
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="flex min-h-[100px] w-full rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                      placeholder="Hướng dẫn cho sinh viên..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" /> Thời gian
                        làm (phút)
                      </label>
                      <Input
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                        className="bg-slate-950/50 border-slate-800 text-slate-200"
                        placeholder="60"
                      />
                      {errors.timeLimit && (
                        <p className="text-xs text-rose-400">
                          {errors.timeLimit}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Thang điểm
                      </label>
                      <select
                        value={gradeScale}
                        onChange={(e) => setGradeScale(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="10">Thang 10 điểm</option>
                        <option value="100">Thang 100 điểm</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-slate-500" /> Giới
                      hạn cảnh báo chuyển tab
                    </label>
                    <Input
                      type="number"
                      value={maxTabViolations}
                      onChange={(e) => setMaxTabViolations(e.target.value)}
                      className="bg-slate-950/50 border-slate-800 max-w-[180px] text-slate-200"
                      placeholder="2"
                    />
                    <p className="text-xs text-slate-500 italic">
                      Bài thi tự động nộp nếu vượt quá số lần chuyển tab (0 = vô
                      hiệu).
                    </p>
                  </div>
                </CardContent>
              </Card>

              {isEditMode && (
                <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-100">
                      Trạng thái & Mã PIN
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Kiểm soát khả năng hiển thị và mã truy cập.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-4">
                        Trạng thái Quiz
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(STATUS_CONFIG) as QuizStatus[]).map(
                          (s) => {
                            const cfg = STATUS_CONFIG[s];
                            const isActive = quizStatus === s;
                            return (
                              <button
                                key={s}
                                onClick={() => handleStatusToggle(s)}
                                disabled={isStatusUpdating}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                                  isActive
                                    ? s === "PUBLIC"
                                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                      : s === "PRIVATE"
                                        ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                                        : "bg-slate-700/30 border-slate-600 text-slate-300"
                                    : "border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400 bg-transparent",
                                )}
                              >
                                {isStatusUpdating && isActive ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <cfg.icon className="w-4 h-4" />
                                )}
                                {cfg.label}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-slate-800/50" />

                    <div>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                          <Hash className="w-4 h-4 text-indigo-400" /> Mã PIN
                          truy cập nhanh
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Dùng để tham gia thi nhanh từ trang chủ.
                        </p>
                      </div>

                      {quizPin ? (
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-950/40 border border-indigo-500/20">
                          <div className="flex-1">
                            <p className="text-[10px] text-indigo-400 mb-1 font-bold uppercase tracking-widest">
                              ACCESS CODE
                            </p>
                            <p className="text-3xl font-mono font-bold tracking-[0.2em] text-slate-100">
                              {quizPin}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={handleCopyPin}
                              className={cn(
                                "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border",
                                isCopied
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700",
                              )}
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              {isCopied ? "Đã chép" : "Sao chép"}
                            </button>
                            <button
                              onClick={handleRemovePin}
                              disabled={isPinLoading}
                              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-rose-900/30 text-rose-400 hover:bg-rose-900/20 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa mã
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/20 border border-slate-800 border-dashed">
                          <p className="text-sm text-slate-600 italic">
                            Chưa có mã PIN cho bài thi này
                          </p>
                          <Button
                            onClick={handleGeneratePin}
                            disabled={isPinLoading}
                            variant="outline"
                            className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 bg-transparent"
                          >
                            {isPinLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Tạo mã mới
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Tab: Câu hỏi ── */}
          {activeTab === "questions" && (
            <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-xl min-h-[400px]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-100">
                  Quản lý câu hỏi
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {isEditMode
                    ? "Soạn thảo và sắp xếp các câu hỏi."
                    : "Vui lòng lưu thông tin chung trước."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <QuestionManager quizId={id!} />
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="inline-flex p-4 rounded-full bg-slate-800/50">
                      <Settings className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                      Bạn cần nhấn{" "}
                      <span className="text-indigo-400 font-medium">
                        Lưu nháp
                      </span>{" "}
                      ở bước cài đặt trước khi bắt đầu thêm câu hỏi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Tab: Lập lịch ── */}
          {activeTab === "schedule" && (
            <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-100">
                  Thời gian & Quyền hạn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Thời gian mở bài
                    </label>
                    <Input
                      type="datetime-local"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="bg-slate-950/50 border-slate-800 text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Thời gian kết thúc
                    </label>
                    <Input
                      type="datetime-local"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="bg-slate-950/50 border-slate-800 text-slate-200"
                    />
                    {errors.schedule && (
                      <p className="text-xs text-rose-400 mt-1">
                        {errors.schedule}
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-800/50" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Số lượng thí sinh tối đa
                    </label>
                    <Input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      placeholder="Không giới hạn"
                      className="bg-slate-950/50 border-slate-800 text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Số lượt thi tối đa/người
                    </label>
                    <Input
                      type="number"
                      value={maxAttemptsPerUser}
                      onChange={(e) => setMaxAttemptsPerUser(e.target.value)}
                      placeholder="Không giới hạn"
                      className="bg-slate-950/50 border-slate-800 text-slate-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
