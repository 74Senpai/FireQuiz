import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle2, Loader2, ChevronLeft, ChevronRight, ListChecks, FileAudio, ZoomIn, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as attemptServices from "@/services/attemptServices";
import * as draftService from "@/services/draftService";
import { cn } from "@/lib/utils";

const QUESTIONS_PER_PAGE = 10;

export function TakeQuiz() {
  const navigate = useNavigate();
  const { id: quizId } = useParams<{ id: string }>();

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizTitle, setQuizTitle] = useState("Đang tải...");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  // State lưu đáp án: key = attempt_questions.id, value = mảng các attempt_options.id
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  // State lưu đáp án text: key = attempt_questions.id, value = string
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Vi phạm chuyển tab
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);        // khóa bài sau vi phạm lần 2
  const [maxViolationsCount, setMaxViolationsCount] = useState(2);
  const violationCountRef = useRef(0);                    // dùng ref để tránh stale closure trong event

  // userId lấy từ localStorage auth (hoặc bất kỳ store nào bạn đang dùng)
  const userIdRef = useRef<string | number>("");
  // Ref giữ answers mới nhất để dùng trong debounce
  const latestAnswersRef = useRef<Record<number, number[]>>({});
  const latestTextAnswersRef = useRef<Record<number, string>>({});
  // Ref cho debounce câu TEXT
  const textDebounceRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : null;
  const seconds = timeLeft !== null ? timeLeft % 60 : null;

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

  useEffect(() => {
    if (!quizId) return;
    const loadQuizData = async () => {
      try {
        const data = await attemptServices.startAttempt(quizId!);
        setAttemptId(data.attemptId);
        setQuestions(data.questions);
        setQuizTitle(data.quizTitle);
        if (data.timeLimitSeconds !== undefined && data.timeLimitSeconds !== null) {
          const deadline = Date.now() + data.timeLimitSeconds * 1000;
          deadlineRef.current = deadline;
          setTimeLeft(data.timeLimitSeconds);
        }
        if (data.maxTabViolations !== undefined) {
          setMaxViolationsCount(data.maxTabViolations);
        }

        // --- Lấy userId để tạo key draft ---
        // Thử đọc từ localStorage auth token (parse JWT đơn giản)
        let uid: string | number = "";
        try {
          const token = document.cookie
            .split("; ")
            .find((c) => c.startsWith("token="))
            ?.split("=")[1];
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            uid = payload.id || payload.sub || "";
          }
        } catch {
          uid = "";
        }
        userIdRef.current = uid;

        // --- Khôi phục draft theo thứ tự ưu tiên ---
        // 1. Server snapshot (selectedOptionIds từ BE)
        const serverAnswers: Record<number, number[]> = {};
        const serverTextAnswers: Record<number, string> = {};
        if (data.questions?.length > 0) {
          data.questions.forEach((q: any) => {
            if (q.selectedOptionIds?.length > 0) serverAnswers[q.id] = q.selectedOptionIds;
            if (q.textAnswer) serverTextAnswers[q.id] = q.textAnswer;
          });
        }

        // 2. localStorage (ưu tiên hơn nếu timestamp mới hơn)
        const local = draftService.loadLocal(quizId!, uid);
        let finalAnswers = serverAnswers;
        let finalTextAnswers = serverTextAnswers;

        if (local && local.timestamp) {
          // Local draft tồn tại → dùng local
          finalAnswers = { ...serverAnswers, ...local.answers };
          finalTextAnswers = { ...serverTextAnswers, ...local.textAnswers };
          setSyncStatus("saved");
          setTimeout(() => setSyncStatus("idle"), 1500);
        } else {
          // 3. Fallback từ BE cache nếu local không có
          const beDraft = await draftService.loadFromBE(quizId!);
          if (beDraft) {
            finalAnswers = { ...serverAnswers, ...beDraft.answers };
            finalTextAnswers = { ...serverTextAnswers, ...beDraft.textAnswers };
          }
        }

        setSelectedAnswers(finalAnswers);
        setTextAnswers(finalTextAnswers);
        latestAnswersRef.current = finalAnswers;
        latestTextAnswersRef.current = finalTextAnswers;
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || "Không thể tải đề thi");
      } finally {
        setLoading(false);
      }
    };
    loadQuizData();
  }, [quizId]);

  const getRemainingSeconds = useCallback(() => {
    if (!deadlineRef.current) return null;
    return Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
  }, []);

  useEffect(() => {
    if (loading || errorMsg || !questions.length || isSubmitting) return;
    // Nếu quiz không có giới hạn thời gian thì không cần đếm ngược
    if (deadlineRef.current === null) return;

    const tick = () => {
      const remaining = getRemainingSeconds()!;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmit(true);
      }
    };

    const timer = setInterval(tick, 1000);
    tick(); // chạy ngay để hiển thị đúng khi vừa resume (tránh chờ 1 giây)
    return () => clearInterval(timer);
  }, [loading, errorMsg, questions.length, isSubmitting, handleSubmit, getRemainingSeconds]);

  // Khi tab/máy wake up, cập nhật lại timeLeft ngay từ deadline (tránh timer bị lệch do sleep)
  useEffect(() => {
    if (loading || !attemptId || isSubmitting || !deadlineRef.current) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        const remaining = getRemainingSeconds();
        if (remaining === null) return;
        setTimeLeft(remaining);
        if (remaining <= 0) handleSubmit(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loading, attemptId, isSubmitting, handleSubmit, getRemainingSeconds]);

  // ─── Vi phạm chuyển tab ──────────────────────────────────────────────────
  useEffect(() => {
    if (loading || errorMsg || !attemptId || isSubmitting || isLocked) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "hidden") return;
      if (maxViolationsCount <= 0) return; // 0 = Không giới hạn

      // Tăng đếm vi phạm (dùng ref để luôn lấy giá trị mới nhất)
      violationCountRef.current += 1;
      const count = violationCountRef.current;

      // Báo cáo lên BE (bất đồng bộ, không chặn flow)
      attemptServices.reportAttemptViolation(attemptId).catch(() => {});

      if (count >= maxViolationsCount) {
        // Vi phạm chạm/vượt ngưỡng → khóa bài và nộp tự động
        setIsLocked(true);
        setShowViolationModal(false);
        // Dùng keepalive fetch để đảm bảo request gửi được kể cả khi tab bị đóng
        attemptServices.submitAttemptKeepAlive(
          attemptId,
          latestAnswersRef.current,
          latestTextAnswersRef.current
        ).catch(() => {});
      } else {
        // Vi phạm lần đầu → hiện cảnh báo khi user quay lại
        const onVisible = () => {
          if (document.visibilityState === "visible") {
            setShowViolationModal(true);
            document.removeEventListener("visibilitychange", onVisible);
          }
        };
        document.addEventListener("visibilitychange", onVisible);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loading, errorMsg, attemptId, isSubmitting, isLocked]);

  const handleSubmit = useCallback(async (force = false) => {
    if (!quizId || !attemptId || isSubmitting) return;

    if (!force) {
      const unansweredCount = questions.length
        - Object.keys(latestAnswersRef.current).length
        - Object.keys(latestTextAnswersRef.current).filter(
            (k) => latestTextAnswersRef.current[Number(k)]?.trim()
          ).length;
      const msg =
        unansweredCount > 0
          ? `Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài không?`
          : "Bạn có chắc chắn muốn nộp bài thi không?";
      if (!window.confirm(msg)) return;
    }

    setIsSubmitting(true);
    try {
      // Gửi toàn bộ đáp án lên BE để ghi DB
      await attemptServices.submitAttempt(
        attemptId,
        latestAnswersRef.current,
        latestTextAnswersRef.current
      );
      // Xóa draft local sau khi submit thành công
      draftService.clearLocal(quizId!, userIdRef.current);
      navigate(`/dashboard/attempt/${attemptId}/review`);
    } catch (err) {
      console.error("Lỗi khi nộp bài:", err);
      navigate(`/dashboard/attempt/${attemptId}/review`);
    }
  }, [quizId, attemptId, isSubmitting, questions.length, navigate]);

  const handleAnswerSelect = (questionId: number, optionId: number, type: string) => {
    if (isSubmitting || isLocked) return;

    setSelectedAnswers((prev) => {
      let newAnswers: number[] = [];
      const current = prev[questionId] || [];
      const normalizedType = (type || "").trim().toUpperCase();

      if (normalizedType.startsWith("MULTIPLE") || normalizedType.startsWith("MULTI")) {
        newAnswers = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
      } else {
        newAnswers = [optionId];
      }

      const updated = { ...prev, [questionId]: newAnswers };

      // Cập nhật ref mới nhất
      latestAnswersRef.current = updated;

      // 1. Ghi localStorage ngay lập tức (offline-safe)
      draftService.saveLocal(
        quizId!,
        userIdRef.current,
        updated,
        latestTextAnswersRef.current
      );

      // 2. Gửi lên BE cache theo debounce 800ms
      draftService.debouncedSaveToBE(
        quizId!,
        updated,
        latestTextAnswersRef.current
      );

      setSyncStatus("saving");
      setTimeout(() => setSyncStatus("saved"), 850);
      setTimeout(() => setSyncStatus("idle"), 2350);

      return updated;
    });
  };

  const handleTextChange = (questionId: number, value: string, _placeholderOptionId: number) => {
    if (isSubmitting || isLocked) return;

    setTextAnswers((prev) => {
      const updated = { ...prev, [questionId]: value };
      latestTextAnswersRef.current = updated;

      // 1. Ghi localStorage ngay lập tức
      draftService.saveLocal(
        quizId!,
        userIdRef.current,
        latestAnswersRef.current,
        updated
      );

      // 2. Debounce gửi lên BE (riêng cho từng câu TEXT)
      if (textDebounceRef.current[questionId]) {
        clearTimeout(textDebounceRef.current[questionId]);
      }
      textDebounceRef.current[questionId] = setTimeout(() => {
        draftService.saveToBE(quizId!, latestAnswersRef.current, updated).catch(() => {});
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus("idle"), 1500);
      }, 1000);

      setSyncStatus("saving");
      return updated;
    });
  };

  const currentQuestions = useMemo(() => {
    const start = currentPage * QUESTIONS_PER_PAGE;
    return questions.slice(start, start + QUESTIONS_PER_PAGE);
  }, [questions, currentPage]);

  const isQuestionAnswered = (q: any) => {
    if (q.type === 'TEXT') {
        return !!textAnswers[q.id]?.trim();
    }
    return (selectedAnswers[q.id]?.length || 0) > 0;
  };

  const answeredCount = questions.filter(isQuestionAnswered).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Đang tải dữ liệu bài thi...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-400">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-xl font-bold">{errorMsg}</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-6 bg-slate-800 hover:bg-slate-700">Quay về</Button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 py-8">
      {/* Main Content */}
      <div className="flex-1 space-y-8 min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-indigo-500/10">
          <div className="flex items-center gap-4">
             <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xl font-bold border transition-all duration-500",
              timeLeft !== null && timeLeft < 300
                ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
            )}>
              <Clock className="w-5 h-5" />
              {minutes !== null && seconds !== null
                ? `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
                : "∞"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white truncate max-w-[200px] sm:max-w-md">{quizTitle}</h2>
              <p className="text-xs text-slate-400">Trang {currentPage + 1}/{totalPages} · {answeredCount}/{questions.length} đã làm</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:block">
              {syncStatus === "saving" && <span className="text-[10px] uppercase tracking-widest text-slate-500 animate-pulse">Syncing...</span>}
              {syncStatus === "saved" && <span className="text-[10px] uppercase tracking-widest text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Saved</span>}
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                className="lg:hidden bg-slate-900 border-white/10 text-slate-300"
                onClick={() => setShowChecklist(!showChecklist)}
            >
              <ListChecks className="w-4 h-4 mr-2" /> 
              Danh sách
            </Button>
          </div>
        </div>

        {/* Locked banner */}
        {isLocked && (
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-semibold animate-pulse">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            Bài đã bị khóa do vi phạm chuyển tab. Đáp án đã được lưu tự động.
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {currentQuestions.map((q, idx) => {
            const questionIdx = currentPage * QUESTIONS_PER_PAGE + idx;
            const userAnswers = selectedAnswers[q.id] || [];
            
            return (
              <Card key={q.id} id={`q-${questionIdx}`} className="border-white/5 bg-slate-900/40 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300 shadow-xl group">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
                      {questionIdx + 1}
                    </span>
                    <h3 className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed">
                      {q.text}
                      {((q.type || "").trim().toUpperCase().startsWith("MULTIPLE") || (q.type || "").trim().toUpperCase().startsWith("MULTI")) && <span className="ml-2 text-xs font-normal text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20">Chọn nhiều đáp án</span>}
                    </h3>
                  </div>

                  {/* Media Display in TakeQuiz */}
                  {q.media_url && (
                    <div className="pl-0 sm:pl-12">
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 max-w-2xl">
                        {(q.media_url.match(/\.(jpeg|jpg|gif|png|webp)/i) || q.media_url.includes('image')) && (
                          <div 
                            className="relative group/media cursor-zoom-in overflow-hidden rounded-lg"
                            onClick={() => setZoomedImage(q.media_url)}
                          >
                            <img 
                              src={q.media_url} 
                              className="w-full h-auto max-h-96 object-contain transition-transform duration-300 group-hover/media:scale-[1.02]" 
                              alt="Question media" 
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30">
                                    <ZoomIn className="w-6 h-6 text-white" />
                                </div>
                            </div>
                          </div>
                        )}
                        {(q.media_url.match(/\.(mp4|webm)/i) || q.media_url.includes('video')) && (
                          <video src={q.media_url} controls className="w-full h-auto max-h-96" />
                        )}
                        {(q.media_url.match(/\.(mp3|wav|ogg)/i) || q.media_url.includes('audio')) && (
                          <div className="p-6 flex flex-col items-center gap-4">
                            <FileAudio className="w-10 h-10 text-indigo-400" />
                            <audio src={q.media_url} controls className="w-full max-w-md" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {q.type === "TEXT" ? (
                    <div className="pl-0 sm:pl-12">
                      <textarea
                        className="w-full min-h-[150px] bg-white/5 border border-white/10 rounded-xl p-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 resize-none"
                        placeholder="Nhập câu trả lời của bạn tại đây..."
                        value={textAnswers[q.id] || ""}
                        disabled={isSubmitting || isLocked}
                        onChange={(e) => handleTextChange(q.id, e.target.value, q.options[0]?.id)}
                      />
                      <p className="mt-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Hệ thống sẽ tự động lưu khi bạn nhập xong</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 pl-0 sm:pl-12">
                      {q.options.map((opt: any) => {
                        const isSelected = userAnswers.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                              isSelected 
                                ? "bg-indigo-500/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/5" 
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                            )}
                          >
                            <input
                              type={((q.type || "").trim().toUpperCase().startsWith("MULTIPLE") || (q.type || "").trim().toUpperCase().startsWith("MULTI")) ? "checkbox" : "radio"}
                              name={`q-${q.id}`}
                              checked={isSelected}
                              disabled={isSubmitting || isLocked}
                              onChange={() => handleAnswerSelect(q.id, opt.id, q.type)}
                              className={cn(
                                  "w-5 h-5 border-white/20 transition-all",
                                  ((q.type || "").trim().toUpperCase().startsWith("MULTIPLE") || (q.type || "").trim().toUpperCase().startsWith("MULTI")) ? "rounded-md" : "rounded-full",
                                  "text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-800"
                              )}
                            />
                            <span className="text-base font-medium">{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-white/5">
          <Button
            variant="ghost"
            disabled={currentPage === 0}
            onClick={() => {
                setCurrentPage(p => p - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-slate-300 hover:bg-white/5 gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Trước
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                    setCurrentPage(i);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  currentPage === i ? "bg-indigo-500 w-8" : "bg-slate-700 hover:bg-slate-600"
                )}
                aria-label={`Trang ${i + 1}`}
              />
            ))}
          </div>

          {currentPage < totalPages - 1 ? (
            <Button
                onClick={() => {
                    setCurrentPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
                Tiếp <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-500/20"
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Nộp bài
            </Button>
          )}
        </div>
      </div>

      {/* Checklist Sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0 transition-all duration-300",
        showChecklist ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
      )}>
        {/* Mobile Backdrop */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setShowChecklist(false)} />
        
        <div className={cn(
            "absolute right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-white/10 p-6 flex flex-col gap-6 lg:sticky lg:top-8 lg:rounded-2xl lg:border lg:shadow-2xl transition-transform duration-300",
            showChecklist ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-indigo-400" />
              Tổng quan
            </h3>
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-400" onClick={() => setShowChecklist(false)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-5 gap-2 content-start">
            {questions.map((q, i) => {
              const answered = isQuestionAnswered(q);
              const isCurrent = Math.floor(i / QUESTIONS_PER_PAGE) === currentPage;
              
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentPage(Math.floor(i / QUESTIONS_PER_PAGE));
                    setShowChecklist(false);
                    // Jump to question anchor
                    setTimeout(() => {
                        const el = document.getElementById(`q-${i}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                  className={cn(
                    "aspect-square rounded-lg text-xs font-bold transition-all duration-200 border flex items-center justify-center relative overflow-hidden group",
                    answered 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                      : "bg-slate-800/50 border-white/10 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400",
                    isCurrent && "border-indigo-500 ring-2 ring-indigo-500/20"
                  )}
                >
                  {i + 1}
                  {isCurrent && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Đã làm</span>
              <span className="font-bold text-emerald-400">{answeredCount}/{questions.length}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
            </div>
            <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
            >
                Nộp bài ngay
            </Button>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
            onClick={() => setZoomedImage(null)}
          >
             <button 
                className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-[110]"
                onClick={() => setZoomedImage(null)}
             >
                <X className="w-6 h-6" />
             </button>
             
             <motion.img 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={zoomedImage} 
                className="max-w-full max-h-full rounded-lg shadow-2xl object-contain cursor-default"
                onClick={(e) => e.stopPropagation()}
             />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Violation Warning Modal – lần 1 */}
      <AnimatePresence>
        {showViolationModal && !isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-8 shadow-2xl shadow-amber-500/10 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">⚠️ Cảnh báo vi phạm</h2>
                  <p className="text-slate-300 leading-relaxed">
                    Bạn vừa rời khỏi trang thi. Đây là <span className="text-amber-400 font-bold">vi phạm lần {violationCountRef.current}</span>.
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Giới hạn tối đa là {maxViolationsCount} lần. Nếu tiếp tục chuyển tab vi phạm quá giới hạn, bài thi sẽ được <span className="text-red-400 font-semibold">nộp tự động và khóa lại</span> ngay lập tức.
                  </p>
                </div>
              </div>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                onClick={() => setShowViolationModal(false)}
              >
                Tôi hiểu, tiếp tục làm bài
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Locked Overlay – sau vi phạm lần 2 đang nộp bài */}
      <AnimatePresence>
        {isLocked && isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Đang khóa bài thi</h2>
              <p className="text-slate-400 text-sm">Bài thi của bạn đang được nộp tự động do vi phạm chuyển tab quá giới hạn.</p>
              <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
