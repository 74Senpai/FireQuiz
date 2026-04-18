import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  Pencil,
  X,
  Upload,
  CheckSquare,
  Square,
  AlignLeft,
  ToggleLeft,
  Image as ImageIcon,
  Music,
  Film,
  FileAudio,
  BookOpen,
} from "lucide-react";
import { uploadFile } from "@/services/uploadService";
import { cn } from "@/lib/utils";
import { ImportExcelModal } from "./ImportExcelModal";
import { ImportFromBankModal } from "./ImportFromBankModal";
import * as questionServices from "@/services/questionServices";

// ─── Hằng số ─────────────────────────────────────────────────────────────────
const MIN_OPTIONS = 3;
const MAX_OPTIONS = 10;

const QUESTION_TYPES = [
  { value: "ANANSWER", label: "Một đáp án", icon: CheckCircle2 },
  { value: "MULTI_ANSWERS", label: "Nhiều đáp án", icon: CheckSquare },
  { value: "TRUE_FALSE", label: "Đúng / Sai", icon: ToggleLeft },
  { value: "TEXT", label: "Câu hỏi mở", icon: AlignLeft },
];

const defaultAnswers = () => [
  { content: "", isCorrect: true },
  { content: "", isCorrect: false },
  { content: "", isCorrect: false },
  { content: "", isCorrect: false },
];

const trueFalseAnswers = () => [
  { content: "TRUE", isCorrect: true },
  { content: "FALSE", isCorrect: false },
];

// ─── Helper: label hiển thị loại ─────────────────────────────────────────────
const typeLabel = (type: string) =>
  QUESTION_TYPES.find((t) => t.value === type)?.label ?? type;

// ─── Component chính ──────────────────────────────────────────────────────────
export function QuestionManager({ quizId }: { quizId: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Form state
  const [questionType, setQuestionType] = useState<string>("ANANSWER");
  const [content, setContent] = useState("");
  const [explanation, setExplanation] = useState("");
  const [answers, setAnswers] = useState(defaultAnswers());
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Fetch danh sách câu hỏi ────────────────────────────────────────────────
  const fetchQuestions = async () => {
    try {
      const res = await questionServices.getQuestionsByQuizId(quizId);
      setQuestions(res.data || res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  // ── Đổi loại câu hỏi → reset answers ────────────────────────────────────────
  const handleTypeChange = (type: string) => {
    setQuestionType(type);
    if (type === "TRUE_FALSE") {
      setAnswers(trueFalseAnswers());
    } else if (type === "TEXT") {
      setAnswers([]);
    } else {
      setAnswers(defaultAnswers());
    }
  };

  // ── Reset form ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setContent("");
    setExplanation("");
    setQuestionType("ANANSWER");
    setAnswers(defaultAnswers());
    setMediaUrl(null);
    setIsUploading(false);
  };

  // ── Kích hoạt chế độ sửa ─────────────────────────────────────────────────
  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setIsAdding(true);
    setContent(q.content);
    setExplanation(q.explanation || "");
    setQuestionType(q.type);
    setAnswers(
      q.type === "TEXT"
        ? []
        : q.answers.map((a: any) => ({
            content: a.content,
            isCorrect: !!a.is_correct,
          })),
    );
    setMediaUrl(q.media_url || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Xóa câu hỏi ─────────────────────────────────────────────────────────
  const handleDelete = async (questionId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) return;
    try {
      await questionServices.deleteQuestion(questionId);
      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch {
      alert("Xóa thất bại!");
    }
  };

  // ── Thêm / xóa đáp án ────────────────────────────────────────────────────
  const addAnswer = () => {
    if (answers.length < MAX_OPTIONS) {
      setAnswers([...answers, { content: "", isCorrect: false }]);
    }
  };

  const removeAnswer = (idx: number) => {
    if (answers.length > MIN_OPTIONS) {
      const next = answers.filter((_, i) => i !== idx);
      // Đảm bảo luôn có 1 đáp án đúng với ANANSWER
      if (questionType === "ANANSWER" && !next.some((a) => a.isCorrect)) {
        next[0].isCorrect = true;
      }
      setAnswers(next);
    }
  };

  // ── Toggle đáp án đúng ────────────────────────────────────────────────────
  const toggleCorrect = (idx: number) => {
    if (questionType === "ANANSWER" || questionType === "TRUE_FALSE") {
      // Radio: chỉ 1 đáp án đúng
      setAnswers(answers.map((a, i) => ({ ...a, isCorrect: i === idx })));
    } else {
      // Checkbox: toggle
      setAnswers(
        answers.map((a, i) =>
          i === idx ? { ...a, isCorrect: !a.isCorrect } : a,
        ),
      );
    }
  };

  // ── Validate phía FE ────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!content.trim()) return "Vui lòng nhập nội dung câu hỏi";
    if (questionType === "TEXT") return null;
    if (questionType !== "TRUE_FALSE") {
      if (answers.length < MIN_OPTIONS)
        return `Cần ít nhất ${MIN_OPTIONS} đáp án`;
      if (answers.some((a) => !a.content.trim()))
        return "Vui lòng điền đầy đủ nội dung các đáp án";
    }
    if (!answers.some((a) => a.isCorrect))
      return "Phải có ít nhất 1 đáp án đúng";
    return null;
  };

  // ── Lưu câu hỏi ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) return alert(err);

    setIsLoading(true);
    try {
      const payload = {
        content,
        type: questionType,
        quizId: parseInt(quizId),
        answers: questionType === "TEXT" ? [] : answers,
        mediaUrl: mediaUrl,
        explanation: explanation.trim() || undefined,
      };

      if (editingId) {
        await questionServices.updateQuestion(editingId, payload);
      } else {
        await questionServices.createQuestion(payload);
      }

      resetForm();
      fetchQuestions();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi lưu");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold flex items-center gap-2">
          Danh sách câu hỏi
          <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
            {questions.length} câu
          </span>
        </h3>
        <div className="flex gap-2">
          {!isAdding && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowBankModal(true)}
                className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:text-white text-sm"
              >
                <BookOpen className="w-4 h-4 mr-2" /> Từ ngân hàng
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImportModal(true)}
                className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 hover:text-white text-sm"
              >
                <Upload className="w-4 h-4 mr-2" /> Import Excel
              </Button>
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" /> Thêm câu hỏi
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Form thêm / sửa */}
      {isAdding && (
        <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-5 animate-in fade-in slide-in-from-top-2">
          {/* Tiêu đề form + nút đóng */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-indigo-300">
              {editingId ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi mới"}
            </span>
            <button
              onClick={resetForm}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  questionType === t.value
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                    : "border-white/10 text-slate-400 hover:border-indigo-400/40 hover:text-indigo-300",
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Nội dung câu hỏi */}
          <Input
            placeholder="Nội dung câu hỏi..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-slate-900 border-white/10 text-white"
          />

          {/* Media Upload Section */}
          <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" /> Thêm Media (Ảnh/Âm
                thanh/Video)
              </span>
              {mediaUrl && (
                <button
                  onClick={() => setMediaUrl(null)}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  Xóa Media
                </button>
              )}
            </div>

            {!mediaUrl && !isUploading ? (
              <div className="flex gap-4">
                {[
                  {
                    type: "image",
                    icon: ImageIcon,
                    label: "Ảnh",
                    accept: "image/*",
                  },
                  {
                    type: "audio",
                    icon: Music,
                    label: "Âm thanh",
                    accept: "audio/*",
                  },
                  {
                    type: "video",
                    icon: Film,
                    label: "Video",
                    accept: "video/*",
                  },
                ].map((m) => (
                  <label
                    key={m.type}
                    className="flex-1 flex flex-col items-center gap-2 py-4 rounded-lg border border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-white/5 cursor-pointer transition-all"
                  >
                    <m.icon className="w-6 h-6 text-slate-500" />
                    <span className="text-xs font-medium text-slate-400">
                      {m.label}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept={m.accept}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Check size (50MB)
                        if (file.size > 50 * 1024 * 1024) {
                          return alert(
                            "File quá lớn! Dung lượng tối đa là 50MB.",
                          );
                        }

                        setIsUploading(true);
                        try {
                          const res = await uploadFile(file);
                          setMediaUrl(res.url);
                        } catch (err) {
                          alert("Upload thất bại!");
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
            ) : isUploading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <p className="text-xs text-slate-400">
                  Đang tải media lên Supabase...
                </p>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/20">
                {/* Image Preview */}
                {mediaUrl &&
                  (mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ||
                    mediaUrl.includes("image")) && (
                    <img
                      src={mediaUrl}
                      className="max-h-64 mx-auto object-contain"
                      alt="Preview"
                    />
                  )}

                {/* Video Preview */}
                {mediaUrl &&
                  (mediaUrl.match(/\.(mp4|webm)/i) ||
                    mediaUrl.includes("video")) && (
                    <video
                      src={mediaUrl}
                      controls
                      className="max-h-64 mx-auto"
                    />
                  )}

                {/* Audio Preview */}
                {mediaUrl &&
                  (mediaUrl.match(/\.(mp3|wav|ogg)/i) ||
                    mediaUrl.includes("audio")) && (
                    <div className="p-6 flex flex-col items-center gap-4">
                      <FileAudio className="w-12 h-12 text-indigo-400" />
                      <audio
                        src={mediaUrl}
                        controls
                        className="w-full max-w-sm"
                      />
                    </div>
                  )}
              </div>
            )}
            <p className="text-[10px] text-slate-500">
              * Chấp nhận: Ảnh (JPG, PNG, WEBP), Video (MP4), Âm thanh (MP3,
              WAV). Tối đa 50MB.
            </p>
          </div>

          {/* Đáp án */}
          {questionType !== "TEXT" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {answers.map((ans, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 bg-slate-900 p-2 rounded-lg border transition-colors",
                      ans.isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-white/5",
                    )}
                  >
                    {/* Toggle đúng */}
                    <button
                      onClick={() => toggleCorrect(idx)}
                      className={
                        ans.isCorrect ? "text-emerald-400" : "text-slate-600"
                      }
                      title={
                        ans.isCorrect ? "Đáp án đúng" : "Nhấn để đánh dấu đúng"
                      }
                    >
                      {questionType === "MULTI_ANSWERS" ? (
                        ans.isCorrect ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )
                      ) : ans.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <Input
                      placeholder={`Đáp án ${idx + 1}`}
                      value={ans.content}
                      onChange={(e) => {
                        const next = [...answers];
                        next[idx] = { ...next[idx], content: e.target.value };
                        setAnswers(next);
                      }}
                      disabled={questionType === "TRUE_FALSE"}
                      className="bg-transparent border-none text-white focus-visible:ring-0 p-0 h-auto"
                    />

                    {/* Nút xóa đáp án — chỉ với ANANSWER/MULTI_ANSWERS */}
                    {(questionType === "ANANSWER" ||
                      questionType === "MULTI_ANSWERS") && (
                      <button
                        onClick={() => removeAnswer(idx)}
                        disabled={answers.length <= MIN_OPTIONS}
                        className="text-slate-600 hover:text-rose-400 disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
                        title="Xóa đáp án"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Nút thêm đáp án */}
              {(questionType === "ANANSWER" ||
                questionType === "MULTI_ANSWERS") &&
                answers.length < MAX_OPTIONS && (
                  <button
                    onClick={addAnswer}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm đáp án ({answers.length}/{MAX_OPTIONS})
                  </button>
                )}
            </div>
          )}

          {/* Ghi chú câu hỏi mở */}
          {questionType === "TEXT" && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5">
              <AlignLeft className="w-4 h-4 shrink-0 text-indigo-400" />
              Câu hỏi mở — người thi sẽ tự điền văn bản, không có đáp án cố
              định.
            </div>
          )}

          {/* Lời giải thích */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 ml-1">
              Lời giải / Giải thích (Tuỳ chọn)
            </label>
            <textarea
              placeholder="Nhập lời giải thích hoặc trích dẫn tài liệu..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="flex min-h-[60px] w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={resetForm}
              className="text-slate-400"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
            >
              {isLoading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              {editingId ? "Cập nhật" : "Lưu câu hỏi"}
            </Button>
          </div>
        </div>
      )}

      {/* Danh sách câu hỏi */}
      <div className="space-y-3">
        {questions.length === 0 && !isAdding && (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
            <p className="text-sm">Chưa có câu hỏi nào.</p>
            <p className="text-xs mt-1 text-slate-600">
              Nhấn "Thêm câu hỏi" hoặc "Import Excel" để bắt đầu.
            </p>
          </div>
        )}

        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="group relative p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="pr-20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-indigo-400">
                    Câu {idx + 1}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                    {typeLabel(q.type)}
                  </span>
                </div>
                <p className="text-white font-medium leading-relaxed">
                  {q.content}
                </p>

                {/* Media Preview in List */}
                {q.media_url && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-white/5 bg-black/10 max-w-xs">
                    {(q.media_url.match(/\.(jpeg|jpg|gif|png|webp)/i) ||
                      q.media_url.includes("image")) && (
                      <img
                        src={q.media_url}
                        className="w-full h-auto max-h-48 object-cover"
                        alt="Question media"
                      />
                    )}
                    {(q.media_url.match(/\.(mp4|webm)/i) ||
                      q.media_url.includes("video")) && (
                      <video
                        src={q.media_url}
                        className="w-full h-auto max-h-48"
                        preload="metadata"
                      />
                    )}
                    {(q.media_url.match(/\.(mp3|wav|ogg)/i) ||
                      q.media_url.includes("audio")) && (
                      <div className="p-3 flex items-center gap-2">
                        <FileAudio className="w-4 h-4 text-indigo-400" />
                        <audio
                          src={q.media_url}
                          controls
                          className="h-8 max-w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(q)}
                  className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(q.id)}
                  className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Hiển thị đáp án */}
            {q.type !== "TEXT" && q.answers?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.answers.map((ans: any) => (
                  <div
                    key={ans.id}
                    className={cn(
                      "flex items-center gap-3 text-sm p-2.5 rounded-lg border transition-all",
                      ans.is_correct
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-white/5 bg-white/3 text-slate-400",
                    )}
                  >
                    {ans.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 shrink-0 opacity-20" />
                    )}
                    <span className="truncate">{ans.content}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Câu hỏi mở */}
            {q.type === "TEXT" && (
              <div className="text-xs text-slate-500 italic mt-1 flex items-center gap-1">
                <AlignLeft className="w-3 h-3" /> Câu hỏi mở — người thi tự điền
              </div>
            )}

            {/* Giải thích nếu có */}
            {q.explanation && (
              <div className="text-xs text-indigo-300 bg-indigo-500/10 p-2 mt-2 rounded border border-indigo-500/20 italic line-clamp-3">
                <span className="font-semibold not-italic text-indigo-400">
                  Giải thích:{" "}
                </span>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Import Excel Modal */}
      {showImportModal && (
        <ImportExcelModal
          quizId={quizId}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchQuestions();
          }}
        />
      )}

      {/* Import từ Ngân hàng Modal */}
      {showBankModal && (
        <ImportFromBankModal
          quizId={quizId}
          onClose={() => setShowBankModal(false)}
          onSuccess={() => {
            setShowBankModal(false);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
}
