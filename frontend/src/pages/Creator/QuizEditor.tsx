import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionManager } from "@/components/ui/QuestionManager";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Clock, Settings, Calendar, ShieldAlert, ChevronLeft, Loader2,
  Globe, Lock, Hash, Copy, Check, RefreshCw, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as quizServices from "@/services/quizServices";

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PUBLIC:  { label: "Công khai",  color: "emerald", icon: Globe },
  PRIVATE: { label: "Riêng tư",  color: "amber",   icon: Lock  },
  DRAFT:   { label: "Bản nháp",  color: "slate",   icon: Settings },
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

  // ── Load dữ liệu Quiz khi edit ─────────────────────────────────────────────
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
          setTimeLimit(quiz.time_limit_seconds ? (quiz.time_limit_seconds / 60).toString() : "");
          const toInputDate = (d: any) => d ? new Date(d).toISOString().slice(0, 16) : "";
          setOpenTime(toInputDate(quiz.available_from));
          setCloseTime(toInputDate(quiz.available_until));
          setMaxParticipants(quiz.max_attempts?.toString() || "");
          setMaxAttemptsPerUser(quiz.max_attempts_per_user?.toString() || "");
          setMaxTabViolations(quiz.max_tab_violations !== undefined && quiz.max_tab_violations !== null ? quiz.max_tab_violations.toString() : "2");
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

  // ── Validate form ──────────────────────────────────────────────────────────
  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!title.trim()) errs.title = "Tiêu đề Quiz là bắt buộc";
    if (timeLimit && Number(timeLimit) < 1) errs.timeLimit = "Thời gian phải ít nhất 1 phút";
    if (openTime && closeTime && new Date(openTime) >= new Date(closeTime))
      errs.schedule = "Thời gian mở phải trước thời gian đóng";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Lưu Quiz ──────────────────────────────────────────────────────────────
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
        maxAttemptsPerUser: maxAttemptsPerUser ? parseInt(maxAttemptsPerUser) : null,
        maxTabViolations: maxTabViolations ? parseInt(maxTabViolations) : 0,
      };

      if (isEditMode) {
        await Promise.all([
          quizServices.updateQuizInfo(id!, infoPayload),
          quizServices.updateQuizSettings(id!, settingsPayload),
          quizServices.updateQuizStatus(id!, newStatus),
        ]);
        setQuizStatus(newStatus);
        alert("Cập nhật bài thi thành công!");
      } else {
        const createPayload = { ...infoPayload, ...settingsPayload, status: newStatus };
        const res = await quizServices.createQuiz(createPayload);
        alert("Tạo bài thi mới thành công!");
        const quizId = res.quizId || res.data?.quizId;
        navigate(`/dashboard/quiz/${quizId}/edit`);
        return;
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Đổi status riêng ──────────────────────────────────────────────────────
  const handleStatusToggle = async (newStatus: QuizStatus) => {
    if (!isEditMode || newStatus === quizStatus) return;
    setIsStatusUpdating(true);
    try {
      await quizServices.updateQuizStatus(id!, newStatus);
      setQuizStatus(newStatus);
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể đổi trạng thái");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // ── Tạo mã PIN ────────────────────────────────────────────────────────────
  const handleGeneratePin = async () => {
    setIsPinLoading(true);
    try {
      const res = await quizServices.generatePin(id!);
      setQuizPin(res.pin || res.quizCode || res.data?.pin || res.data?.quizCode);
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể tạo mã PIN");
    } finally {
      setIsPinLoading(false);
    }
  };

  // ── Xóa mã PIN ───────────────────────────────────────────────────────────
  const handleRemovePin = async () => {
    if (!confirm("Xóa mã PIN? Người dùng đang có mã sẽ không thể dùng mã này nữa.")) return;
    setIsPinLoading(true);
    try {
      await quizServices.removePin(id!);
      setQuizPin(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể xóa mã PIN");
    } finally {
      setIsPinLoading(false);
    }
  };

  // ── Copy PIN ──────────────────────────────────────────────────────────────
  const handleCopyPin = useCallback(() => {
    if (!quizPin) return;
    navigator.clipboard.writeText(quizPin);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [quizPin]);

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-400" />
        <p className="text-slate-400">Đang tải thông tin Quiz...</p>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[quizStatus];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost" size="icon"
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
              {isEditMode ? "Cập nhật lại cấu hình bài thi của bạn." : "Cấu hình, thêm câu hỏi và xuất bản."}
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
        {/* Sidebar */}
        <div className="col-span-3 space-y-1">
          {[
            { id: "settings",  label: "Cài đặt",   icon: Settings  },
            { id: "questions", label: "Câu hỏi",   icon: ShieldAlert },
            { id: "schedule",  label: "Lập lịch",  icon: Calendar  },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="col-span-9 space-y-6 animate-slide-up">

          {/* ── Tab: Cài đặt ── */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              {/* Thông tin cơ bản */}
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
                      onChange={e => setTitle(e.target.value)}
                      className="bg-slate-900/50 border-white/10 text-white"
                      placeholder="Ví dụ: Thi giữa kỳ - Toán 101"
                    />
                    {errors.title && <p className="text-sm text-red-400">{errors.title}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mô tả</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="flex min-h-[90px] w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      placeholder="Hướng dẫn cho sinh viên..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" /> Thời gian làm (phút)
                      </label>
                      <Input
                        type="number"
                        value={timeLimit}
                        onChange={e => setTimeLimit(e.target.value)}
                        className="bg-slate-900/50 border-white/10"
                        placeholder="60"
                      />
                      {errors.timeLimit && <p className="text-sm text-red-400">{errors.timeLimit}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Thang điểm</label>
                      <select
                        value={gradeScale}
                        onChange={e => setGradeScale(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-white/10 bg-slate-900 p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="10">Thang 10 điểm</option>
                        <option value="100">Thang 100 điểm</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-slate-400" /> Giới hạn cảnh báo chuyển tab
                    </label>
                    <Input
                      type="number"
                      value={maxTabViolations}
                      onChange={e => setMaxTabViolations(e.target.value)}
                      className="bg-slate-900/50 border-white/10 max-w-sm"
                      placeholder="Nhập số lần (0 để không giới hạn)"
                    />
                    <p className="text-xs text-slate-500">
                       Số lần thí sinh được phép chuyển tab hoặc ẩn cửa sổ bài thi. Nếu vượt quá, bài sẽ tự động nộp (0 = vô hiệu).
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* ── Trạng thái & PIN (chỉ khi edit mode) ── */}
              {isEditMode && (
                <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-slate-100">Trạng thái & Mã PIN</CardTitle>
                    <CardDescription className="text-slate-400">
                      Kiểm soát khả năng hiển thị và tạo mã truy cập nhanh.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Status toggle */}
                    <div>
                      <p className="text-sm font-medium mb-3">Trạng thái Quiz</p>
                      <div className="flex gap-2">
                        {(Object.keys(STATUS_CONFIG) as QuizStatus[]).map(s => {
                          const cfg = STATUS_CONFIG[s];
                          const isActive = quizStatus === s;
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusToggle(s)}
                              disabled={isStatusUpdating}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                                isActive
                                  ? s === "PUBLIC"
                                    ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                                    : s === "PRIVATE"
                                    ? "bg-amber-600/20 border-amber-500/50 text-amber-300"
                                    : "bg-slate-600/20 border-slate-500/50 text-slate-300"
                                  : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-400"
                              )}
                            >
                              {isStatusUpdating && isActive
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <cfg.icon className="w-4 h-4" />
                              }
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {quizStatus === "PUBLIC"
                           ? "Quiz hiện đang công khai — ai cũng có thể tìm thấy."
                          : quizStatus === "PRIVATE"
                          ? "Quiz đang ở chế độ riêng tư."
                          : "Quiz đang là bản nháp, chưa hiển thị."
                        }
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-5" />

                    {/* PIN Panel */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Hash className="w-4 h-4 text-indigo-400" />
                            Mã PIN truy cập nhanh
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Người dùng có thể nhập mã này để tham gia quiz từ trang chủ.
                          </p>
                        </div>
                      </div>

                      {quizPin ? (
                        /* Đang có PIN */
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                          <div className="flex-1">
                            <p className="text-xs text-indigo-400 mb-1 font-medium uppercase tracking-widest">Mã PIN</p>
                            <p className="text-3xl font-black tracking-[0.35em] text-white font-mono">
                              {quizPin}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={handleCopyPin}
                              title="Copy mã PIN"
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                isCopied
                                  ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300"
                                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                              )}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {isCopied ? "Đã copy!" : "Copy"}
                            </button>
                            <button
                              onClick={handleRemovePin}
                              disabled={isPinLoading}
                              title="Xóa mã PIN"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40"
                            >
                              {isPinLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              Xóa
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Chưa có PIN */
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 border-dashed">
                          <p className="text-sm text-slate-500 italic">Chưa có mã PIN</p>
                          <Button
                            onClick={handleGeneratePin}
                            disabled={isPinLoading}
                            variant="outline"
                            className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10"
                          >
                            {isPinLoading
                              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</>
                              : <><RefreshCw className="w-4 h-4 mr-2" /> Tạo mã PIN</>
                            }
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
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-100">Quản lý câu hỏi</CardTitle>
                <CardDescription className="text-slate-400">
                  {isEditMode
                    ? "Tạo, chỉnh sửa và import câu hỏi."
                    : "Vui lòng lưu thông tin chung trước khi thêm câu hỏi."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <QuestionManager quizId={id!} />
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-slate-400 text-sm italic">
                      Bạn cần tạo Quiz trước (nhấn Lưu nháp) để bắt đầu thêm câu hỏi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Tab: Lập lịch ── */}
          {activeTab === "schedule" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-slate-100">Lịch & Quyền truy cập</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thời gian mở</label>
                    <Input
                      type="datetime-local"
                      value={openTime}
                      onChange={e => setOpenTime(e.target.value)}
                      className="bg-slate-900/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thời gian đóng</label>
                    <Input
                      type="datetime-local"
                      value={closeTime}
                      onChange={e => setCloseTime(e.target.value)}
                      className="bg-slate-900/50 border-white/10"
                    />
                    {errors.schedule && <p className="text-sm text-red-400">{errors.schedule}</p>}
                  </div>
                </div>
                <div className="flex gap-6 pt-4 border-t border-white/10">
                  <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">Tổng số người tối đa (Slots)</label>
                    <Input
                      type="number"
                      value={maxParticipants}
                      onChange={e => setMaxParticipants(e.target.value)}
                      placeholder="Để trống nếu không giới hạn"
                      className="bg-slate-900/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">Số lượt thi tối đa cho 1 người</label>
                    <Input
                      type="number"
                      value={maxAttemptsPerUser}
                      onChange={e => setMaxAttemptsPerUser(e.target.value)}
                      placeholder="Để trống nếu không giới hạn"
                      className="bg-slate-900/50 border-white/10"
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
