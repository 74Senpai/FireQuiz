import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  MinusCircle,
  LayoutDashboard,
  History,
  AlertTriangle,
  FileAudio,
  ZoomIn,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAttemptReview } from "@/services/attemptServices";
import { cn } from "@/lib/utils";

function formatDt(value: any) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function scoreLabel(score: any) {
  if (score === null || score === undefined || score === "") return "—";
  return String(score);
}

/** Đánh giá đúng/sai theo logic snapshot hiện tại. */
function evaluateQuestion(question: any) {
  const opts = question.options ?? [];
  const totalCorrect = opts.filter((o: any) => o.is_correct).length;
  const selectedCorrect = opts.filter(
    (o: any) => o.is_correct && o.selected,
  ).length;
  const selectedIncorrect = opts.filter(
    (o: any) => !o.is_correct && o.selected,
  ).length;
  const hasResponse = opts.some((o: any) => o.selected);

  // Một câu được coi là đúng nếu:
  // 1. Có ít nhất một đáp án đúng (tổng quát)
  // 2. Không chọn sai đáp án nào
  // 3. Chọn đủ tất cả các đáp án đúng
  const isCorrect =
    totalCorrect > 0 &&
    selectedIncorrect === 0 &&
    selectedCorrect === totalCorrect;

  return {
    hasResponse,
    isCorrect,
    totalCorrect,
    selectedCorrect,
    selectedIncorrect,
  };
}

export function ReviewQuiz() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!attemptId) {
        setError("Thiếu mã lần thi.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getAttemptReview(attemptId);
        if (!cancelled) setPayload(data);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e.response?.data?.message ?? "Không tải được chi tiết lần thi.",
          );
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const summary = useMemo(() => {
    if (!payload?.questions?.length) {
      return { correct: 0, incorrect: 0, unanswered: 0 };
    }
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    for (const q of payload.questions) {
      const ev = evaluateQuestion(q);
      if (!ev.hasResponse) unanswered += 1;
      else if (ev.isCorrect) correct += 1;
      else incorrect += 1;
    }
    return { correct, incorrect, unanswered };
  }, [payload]);

  const attempt = payload?.attempt;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="text-lg font-medium animate-pulse">
          Đang nạp kết quả bài làm...
        </p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="text-slate-400 hover:bg-white/5 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Button>
        <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-xl">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-200 text-lg font-medium">
              {error ?? "Không có dữ liệu bài làm."}
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="mt-8 bg-slate-800 hover:bg-slate-700"
            >
              Về Bảng điều khiển
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const durationLabel =
    attempt.duration_seconds != null
      ? `${Math.floor(attempt.duration_seconds / 60)} phút ${attempt.duration_seconds % 60} giây`
      : attempt.finished_at
        ? "—"
        : "Đang làm dở";

  return (
    <>
      {/* ══ Giao diện web — ẩn khi in ══ */}
      <div className="no-print max-w-5xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setZoomedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={zoomedImage}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              alt="Zoomed view"
            />
            <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section with Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              to="/dashboard"
              className="hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <LayoutDashboard className="w-3 h-3" /> Dashboard
            </Link>
            <span>/</span>
            <Link
              to="/dashboard/history"
              className="hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <History className="w-3 h-3" /> Lịch sử
            </Link>
            <span>/</span>
            <span className="text-slate-300">Kết quả</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <CheckCircle2 className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                Kết quả bài trắc nghiệm
              </h1>
              <p className="text-slate-400 font-medium text-lg">
                {attempt.quiz_title}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="bg-slate-900 border-white/10 text-slate-300 hover:bg-white/5"
            onClick={() => window.print()}
          >
            In kết quả
          </Button>
          <Link to="/dashboard">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>

      {/* Score Summary Card */}
      <Card className="overflow-hidden border-none shadow-2xl bg-slate-900/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Main Score Area */}
            <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-white/5 bg-white/5">
              <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-xs mb-4">
                Điểm số của bạn
              </p>
              <div className="relative mb-6">
                <span className="text-[120px] font-black leading-none bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
                  {scoreLabel(attempt.score)}
                </span>
                {/* Visual Circle Decor */}
                <div className="absolute -inset-8 border-2 border-indigo-500/20 rounded-full animate-spin-slow pointer-events-none" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">
                  Bắt đầu: {formatDt(attempt.started_at)}
                </p>
                <p className="text-slate-400 text-sm">
                  Hoàn thành: {formatDt(attempt.finished_at)}
                </p>
              </div>
            </div>

            {/* Metrics Area */}
            <div className="lg:col-span-7 p-8 sm:p-10 grid grid-cols-2 gap-6 items-center">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1 items-center justify-center group transition-colors hover:bg-emerald-500/5 hover:border-emerald-500/20">
                <div className="text-3xl font-black text-emerald-400 group-hover:scale-110 transition-transform">
                  {summary.correct}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Câu đúng
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1 items-center justify-center group transition-colors hover:bg-red-500/5 hover:border-red-500/20">
                <div className="text-3xl font-black text-red-400 group-hover:scale-110 transition-transform">
                  {summary.incorrect}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Câu sai
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1 items-center justify-center group transition-colors hover:bg-slate-500/5 hover:border-slate-500/20">
                <div className="text-3xl font-black text-slate-400 group-hover:scale-110 transition-transform">
                  {summary.unanswered}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Chưa làm
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1 items-center justify-center group transition-colors hover:bg-indigo-500/5 hover:border-indigo-500/20">
                <div className="text-3xl font-black text-indigo-400 group-hover:scale-110 transition-transform">
                  {durationLabel.split(" ")[0]}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Số phút
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-8 bg-indigo-500 rounded-full" />
            Chi tiết từng câu hỏi
          </h2>
          <div className="flex gap-2">
            <Badge variant="correct">Đúng: {summary.correct}</Badge>
            <Badge variant="incorrect">Sai: {summary.incorrect}</Badge>
          </div>
        </div>

        <div className="space-y-6">
          {(!payload.questions || payload.questions.length === 0) && (
            <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-white/10">
              <p className="text-slate-500">
                Dữ liệu các câu hỏi không có sẵn cho lần thi này.
              </p>
            </div>
          )}

          {payload.questions?.map((question: any, qi: number) => {
            const ev = evaluateQuestion(question);
            const status = !ev.hasResponse
              ? "unanswered"
              : ev.isCorrect
                ? "correct"
                : "incorrect";

            return (
              <Card
                key={question.id}
                className={cn(
                  "border-white/5 bg-slate-900/40 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300",
                  status === "correct" && "hover:border-emerald-500/30",
                  status === "incorrect" && "hover:border-red-500/30",
                  status === "unanswered" && "hover:border-slate-500/30",
                )}
                style={{ animationDelay: `${qi * 50}ms` }}
              >
                <CardHeader className="p-6 sm:p-8 flex flex-row items-start gap-5 space-y-0 relative">
                  {/* Status Indicator Bar */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      status === "correct"
                        ? "bg-emerald-500"
                        : status === "incorrect"
                          ? "bg-red-500"
                          : "bg-slate-500",
                    )}
                  />

                  <div
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                      status === "correct"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : status === "incorrect"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-slate-500/10 text-slate-500",
                    )}
                  >
                    {status === "correct" ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : status === "incorrect" ? (
                      <XCircle className="w-6 h-6" />
                    ) : (
                      <MinusCircle className="w-6 h-6" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <CardTitle className="text-xl font-semibold text-slate-100 leading-snug">
                      {question.content}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded">
                        Câu {qi + 1}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">
                        Loại:{" "}
                        {(question.type || "")
                          .trim()
                          .toUpperCase()
                          .startsWith("MULTIPLE") ||
                        (question.type || "")
                          .trim()
                          .toUpperCase()
                          .startsWith("MULTI")
                          ? "Chọn nhiều"
                          : (question.type || "").trim().toUpperCase() ===
                              "TRUE_FALSE"
                            ? "Đúng/Sai"
                            : "Chọn một"}
                      </span>
                    </div>

                    {/* Media Display in ReviewQuiz */}
                    {question.media_url && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-black/20 max-w-2xl">
                        {(question.media_url.match(/\.(jpeg|jpg|gif|png|webp)/i) || question.media_url.includes('image')) && (
                          <div 
                            className="relative group/media cursor-zoom-in overflow-hidden rounded-lg"
                            onClick={() => setZoomedImage(question.media_url)}
                          >
                            <img 
                              src={question.media_url} 
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
                        {(question.media_url.match(/\.(mp4|webm)/i) || question.media_url.includes('video')) && (
                          <video src={question.media_url} controls className="w-full h-auto max-h-96" />
                        )}
                        {(question.media_url.match(/\.(mp3|wav|ogg)/i) || question.media_url.includes('audio')) && (
                          <div className="p-6 flex flex-col items-center gap-4">
                            <FileAudio className="w-10 h-10 text-indigo-400" />
                            <audio src={question.media_url} controls className="w-full max-w-md" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-8 sm:px-20 sm:pb-10 pt-0 space-y-3">
                  {question.type === "TEXT" ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Câu trả lời của bạn:
                        </h4>
                        <p className="text-base truncate-2-lines">
                          {question.options[0]?.answer?.text_answer ||
                            "Ông không để lại câu trả lời."}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-100">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">
                          Đáp án mẫu:
                        </h4>
                        <p className="text-base">
                          {question.options[0]?.content ||
                            "Không có đáp án mẫu."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {question.options?.map((opt: any) => {
                        const userPicked = opt.selected;
                        const isOptionCorrect = opt.is_correct;

                        return (
                          <div
                            key={opt.id}
                            className={cn(
                              "p-4 rounded-xl border relative transition-all group overflow-hidden",
                              userPicked &&
                                isOptionCorrect &&
                                "bg-emerald-500/10 border-emerald-500/30 text-emerald-50",
                              userPicked &&
                                !isOptionCorrect &&
                                "bg-red-500/10 border-red-500/30 text-red-50",
                              !userPicked &&
                                isOptionCorrect &&
                                "bg-emerald-500/5 border-emerald-500/10 text-emerald-200/60 border-dashed",
                              !userPicked &&
                                !isOptionCorrect &&
                                "bg-white/5 border-white/5 text-slate-400",
                            )}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-base font-medium relative z-10">
                                {opt.content}
                              </span>

                              <div className="flex shrink-0 items-center gap-2 relative z-10">
                                {userPicked && (
                                  <span
                                    className={cn(
                                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                                      isOptionCorrect
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/20 text-red-400",
                                    )}
                                  >
                                    Bạn chọn
                                  </span>
                                )}
                                {isOptionCorrect && (
                                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-indigo-500/20 text-indigo-300">
                                    Đáp án đúng
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Inner Feedback Background */}
                            {userPicked && isOptionCorrect && (
                              <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation Area if exists */}
                  {question.explanation && (
                    <div className="mt-6 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" /> Giải thích
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      </div>

      {/* ══════════════════════════════════════════════════
           PRINT ONLY SECTION — chỉ hiển thị khi in
      ══════════════════════════════════════════════════ */}
      <div
        className="print-only"
        style={{
          display: 'none',
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#111',
          background: '#fff',
          fontSize: '10.5pt',
          lineHeight: '1.7',
          padding: '30px 40px', /* Thay vì padding: 0 để đảm bảo lề trong an toàn */
          maxWidth: '850px',
          margin: '0 auto',
        }}
      >
        {/* ── TIÊU ĐỀ ── */}
        <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ fontSize: '20pt', fontWeight: 'bold', letterSpacing: '3px' }}>🔥 FIREQUIZ</div>
          <div style={{ fontSize: '13pt', fontWeight: 'bold', marginTop: '4px' }}>KẾT QUẢ BÀI TRẮC NGHIỆM</div>
        </div>

        {/* ── THÔNG TIN BÀI LÀM ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <tbody>
            {[
              { label: 'Tên bài',        value: attempt.quiz_title },
              { label: 'Bắt đầu',        value: formatDt(attempt.started_at) },
              { label: 'Hoàn thành',     value: formatDt(attempt.finished_at) },
              { label: 'Thời gian làm',  value: durationLabel },
              { label: 'Điểm số',        value: scoreLabel(attempt.score) },
            ].map(({ label, value }) => (
              <tr key={label}>
                <td style={{ width: '150px', padding: '3px 12px 3px 0', fontWeight: 'bold', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  {label}:
                </td>
                <td style={{ padding: '3px 0', fontWeight: label === 'Điểm số' ? 'bold' : 'normal', fontSize: label === 'Điểm số' ? '12pt' : '10.5pt' }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── I. TỔNG KẾT ── */}
        <div style={{ marginBottom: '26px' }}>
          <div style={{ fontSize: '11.5pt', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>
            I. TỔNG KẾT
          </div>
          <table style={{ borderCollapse: 'collapse', width: '60%' }}>
            <thead>
              <tr style={{ background: '#ebebeb' }}>
                <th style={{ padding: '5px 16px', border: '1px solid #aaa', textAlign: 'left', fontWeight: 'bold' }}>Chỉ số</th>
                <th style={{ padding: '5px 16px', border: '1px solid #aaa', textAlign: 'center', fontWeight: 'bold' }}>Số lượng</th>
                <th style={{ padding: '5px 16px', border: '1px solid #aaa', textAlign: 'center', fontWeight: 'bold' }}>Tỉ lệ</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: '✓  Câu đúng',     count: summary.correct },
                { label: '✗  Câu sai',      count: summary.incorrect },
                { label: '—  Chưa trả lời', count: summary.unanswered },
              ].map(({ label, count }) => {
                const total = payload.questions?.length ?? 0;
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={label}>
                    <td style={{ padding: '4px 16px', border: '1px solid #ccc' }}>{label}</td>
                    <td style={{ padding: '4px 16px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold' }}>
                      {count} / {total}
                    </td>
                    <td style={{ padding: '4px 16px', border: '1px solid #ccc', textAlign: 'center' }}>
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── II. CHI TIẾT TỪNG CÂU HỎI ── */}
        <div>
          <div style={{ fontSize: '11.5pt', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '3px', marginBottom: '16px' }}>
            II. CHI TIẾT TỪNG CÂU HỎI
          </div>

          {payload.questions?.map((question: any, qi: number) => {
            const ev = evaluateQuestion(question);
            const status = !ev.hasResponse ? 'unanswered' : ev.isCorrect ? 'correct' : 'incorrect';
            const statusLabel =
              status === 'correct' ? '✓ ĐÚNG' : status === 'incorrect' ? '✗ SAI' : '— CHƯA LÀM';
            const leftBorderColor =
              status === 'correct' ? '#16a34a' : status === 'incorrect' ? '#dc2626' : '#9ca3af';
            const statusColor =
              status === 'correct' ? '#166534' : status === 'incorrect' ? '#991b1b' : '#555';
            const qType = (question.type ?? '').trim().toUpperCase();
            const qTypeLabel =
              qType.startsWith('MULTIPLE') || qType.startsWith('MULTI') ? 'Chọn nhiều' :
              qType === 'TRUE_FALSE' ? 'Đúng/Sai' :
              qType === 'TEXT'       ? 'Tự luận'  : 'Chọn một';

            return (
              <div
                key={question.id}
                style={{
                  marginBottom: '18px',
                  paddingLeft: '12px',
                  paddingBottom: '6px',
                  borderLeft: `4px solid ${leftBorderColor}`,
                  pageBreakInside: 'avoid',
                }}
              >
                {/* Số câu + trạng thái */}
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '11pt' }}>Câu {qi + 1}.</span>
                  {' '}
                  <span style={{ fontWeight: 'bold', color: statusColor, fontSize: '9.5pt' }}>
                    [{statusLabel}]
                  </span>
                  {' '}
                  <span style={{ fontSize: '9pt', color: '#666', fontStyle: 'italic' }}>
                    ({qTypeLabel})
                  </span>
                </div>

                {/* Nội dung câu hỏi */}
                <div style={{ fontWeight: 'bold', marginBottom: '6px', paddingLeft: '16px' }}>
                  {question.content}
                </div>

                {/* Câu tự luận */}
                {question.type === 'TEXT' ? (
                  <div style={{ paddingLeft: '16px', fontSize: '10pt' }}>
                    <div style={{ marginBottom: '3px' }}>
                      <strong>Câu trả lời của bạn:</strong>{' '}
                      {question.options?.[0]?.answer?.text_answer || '(Không có câu trả lời)'}
                    </div>
                    <div>
                      <strong>Đáp án mẫu:</strong>{' '}
                      {question.options?.[0]?.content || '(Không có đáp án mẫu)'}
                    </div>
                  </div>
                ) : (
                  /* Câu trắc nghiệm — 2 cột: ký hiệu + nội dung */
                  <table style={{ width: '100%', borderCollapse: 'collapse', paddingLeft: '16px', fontSize: '10pt' }}>
                    <tbody>
                      {question.options?.map((opt: any, oi: number) => {
                        const letter = String.fromCharCode(65 + oi);
                        const userPicked = Boolean(opt.selected);
                        const isCorrect  = Boolean(opt.is_correct);

                        // Ký hiệu trạng thái (rõ ràng, không bị cắt)
                        const icon =
                          userPicked && isCorrect  ? '[✓]' :
                          userPicked && !isCorrect ? '[✗]' :
                          isCorrect                ? '[ ]' : '   ';

                        // Ghi chú cuối (chỉ khi cần thiết)
                        const note =
                          userPicked && isCorrect  ? ' ← bạn chọn, đúng' :
                          userPicked && !isCorrect ? ' ← bạn chọn, sai'  :
                          isCorrect                ? ' ← đáp án đúng'    : '';

                        const textColor =
                          userPicked && isCorrect  ? '#166534' :
                          userPicked && !isCorrect ? '#991b1b' :
                          isCorrect                ? '#166534' : '#333';

                        return (
                          <tr key={opt.id} style={{ color: textColor, fontWeight: (userPicked || isCorrect) ? 'bold' : 'normal' }}>
                            <td style={{ width: '28px', verticalAlign: 'top', padding: '1px 0', fontFamily: 'monospace' }}>
                              {icon}
                            </td>
                            <td style={{ width: '22px', verticalAlign: 'top', padding: '1px 4px' }}>
                              {letter}.
                            </td>
                            <td style={{ verticalAlign: 'top', padding: '1px 0' }}>
                              {opt.content}
                              {note && (
                                <span style={{ fontStyle: 'italic', fontWeight: 'normal', color: textColor, fontSize: '9pt' }}>
                                  {note}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Giải thích (nếu có) */}
                {question.explanation && (
                  <div style={{ marginTop: '6px', marginLeft: '16px', padding: '5px 10px', borderLeft: '3px solid #888', fontSize: '9.5pt', fontStyle: 'italic', color: '#333' }}>
                    <strong style={{ fontStyle: 'normal' }}>Giải thích:</strong>{' '}{question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ marginTop: '32px', borderTop: '1px solid #bbb', paddingTop: '8px', textAlign: 'center', fontSize: '9pt', color: '#666' }}>
          Được tạo bởi <strong>🔥 FireQuiz</strong> — In lúc: {new Date().toLocaleString('vi-VN')}
        </div>
      </div>
    </>
  );
}

// Simple Badge component for local use
function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "correct" | "incorrect";
}) {
  return (
    <div
      className={cn(
        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
        variant === "correct"
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : "bg-red-500/10 border-red-500/20 text-red-400",
      )}
    >
      {children}
    </div>
  );
}
