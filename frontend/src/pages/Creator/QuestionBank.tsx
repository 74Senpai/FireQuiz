import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Trash2, Pencil, X, Search, CheckCircle2, Circle,
  CheckSquare, Square, AlignLeft, ToggleLeft, Loader2,
  BookOpen, Image as ImageIcon, Music, Film, FileAudio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/services/uploadService";
import { getMediaViewUrl } from "@/services/mediaServices";
import * as bankService from "@/services/bankQuestionServices";

// ─── Hằng số ─────────────────────────────────────────────────────────────────
const QUESTION_TYPES = [
  { value: "ANANSWER",      label: "Một đáp án",    icon: CheckCircle2 },
  { value: "MULTI_ANSWERS", label: "Nhiều đáp án",  icon: CheckSquare },
  { value: "TRUE_FALSE",    label: "Đúng / Sai",    icon: ToggleLeft },
  { value: "TEXT",          label: "Câu hỏi mở",    icon: AlignLeft },
];

const DIFFICULTIES = [
  { value: "easy",   label: "Dễ",        cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { value: "medium", label: "Trung bình", cls: "bg-amber-500/20  text-amber-300  border-amber-500/30"  },
  { value: "hard",   label: "Khó",        cls: "bg-rose-500/20   text-rose-300   border-rose-500/30"   },
];

const difficultyInfo = (d: string) =>
  DIFFICULTIES.find((x) => x.value === d) ?? DIFFICULTIES[1];

const typeLabel = (t: string) =>
  QUESTION_TYPES.find((x) => x.value === t)?.label ?? t;

const defaultAnswers = () => [
  { content: "", isCorrect: true  },
  { content: "", isCorrect: false },
  { content: "", isCorrect: false },
  { content: "", isCorrect: false },
];

const trueFalseAnswers = () => [
  { content: "TRUE",  isCorrect: true  },
  { content: "FALSE", isCorrect: false },
];

// ─── Form thêm / sửa câu hỏi ─────────────────────────────────────────────────
interface FormProps {
  editingQuestion: any | null;
  onSaved: () => void;
  onCancel: () => void;
}

function BankQuestionForm({ editingQuestion, onSaved, onCancel }: FormProps) {
  const [type, setType]         = useState(editingQuestion?.type ?? "ANANSWER");
  const [content, setContent]   = useState(editingQuestion?.content ?? "");
  const [difficulty, setDiff]   = useState(editingQuestion?.difficulty ?? "medium");
  const [category, setCategory] = useState(editingQuestion?.category ?? "");
  const [mediaUrl, setMediaUrl] = useState<string | null>(editingQuestion?.media_url ?? null);
  const [answers, setAnswers]   = useState<any[]>(() => {
    if (editingQuestion) {
      if (editingQuestion.type === "TEXT") return [];
      return editingQuestion.answers?.map((a: any) => ({
        content: a.content,
        isCorrect: !!a.is_correct,
      })) ?? defaultAnswers();
    }
    return defaultAnswers();
  });
  const [isLoading, setIsLoading]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleTypeChange = (t: string) => {
    setType(t);
    if (t === "TRUE_FALSE") setAnswers(trueFalseAnswers());
    else if (t === "TEXT")  setAnswers([]);
    else                    setAnswers(defaultAnswers());
  };

  const toggleCorrect = (idx: number) => {
    if (type === "ANANSWER" || type === "TRUE_FALSE") {
      setAnswers(answers.map((a, i) => ({ ...a, isCorrect: i === idx })));
    } else {
      setAnswers(answers.map((a, i) => i === idx ? { ...a, isCorrect: !a.isCorrect } : a));
    }
  };

  const validate = (): string | null => {
    if (!content.trim()) return "Vui lòng nhập nội dung câu hỏi";
    if (type === "TEXT") return null;
    if (type !== "TRUE_FALSE") {
      if (answers.length < 3) return "Cần ít nhất 3 đáp án";
      if (answers.some((a) => !a.content.trim())) return "Vui lòng điền đầy đủ nội dung đáp án";
    }
    if (!answers.some((a) => a.isCorrect)) return "Phải có ít nhất 1 đáp án đúng";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) return alert(err);
    setIsLoading(true);
    try {
      const payload = { content, type, difficulty, category: category || null, mediaUrl, answers };
      if (editingQuestion) {
        await bankService.updateBankQuestion(editingQuestion.id, payload);
      } else {
        await bankService.createBankQuestion(payload);
      }
      onSaved();
    } catch (e: any) {
      alert(e.response?.data?.message || "Lỗi khi lưu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-5 animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-indigo-300">
          {editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi vào ngân hàng"}
        </span>
        <button onClick={onCancel} className="text-slate-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Loại câu hỏi */}
      <div className="flex gap-2 flex-wrap">
        {QUESTION_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTypeChange(t.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
              type === t.value
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "border-white/10 text-slate-400 hover:border-indigo-400/40 hover:text-indigo-300",
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Nội dung */}
      <Input
        placeholder="Nội dung câu hỏi..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="bg-slate-900 border-white/10 text-white"
      />

      {/* Danh mục + Độ khó */}
      <div className="flex gap-3">
        <Input
          placeholder="Danh mục (vd: Toán, Lý, Hóa...)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-900 border-white/10 text-white flex-1"
        />
        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDiff(d.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                difficulty === d.value ? d.cls : "border-white/10 text-slate-500 hover:border-white/20",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media Upload */}
      <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" /> Thêm Media
          </span>
          {mediaUrl && (
            <button onClick={() => setMediaUrl(null)} className="text-xs text-rose-400 hover:text-rose-300">
              Xóa Media
            </button>
          )}
        </div>
        {!mediaUrl && !isUploading ? (
          <div className="flex gap-4">
            {[
              { type: "image", icon: ImageIcon, label: "Ảnh",      accept: "image/*" },
              { type: "audio", icon: Music,     label: "Âm thanh", accept: "audio/*" },
              { type: "video", icon: Film,      label: "Video",    accept: "video/*" },
            ].map((m) => (
              <label
                key={m.type}
                className="flex-1 flex flex-col items-center gap-2 py-4 rounded-lg border border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-white/5 cursor-pointer transition-all"
              >
                <m.icon className="w-6 h-6 text-slate-500" />
                <span className="text-xs font-medium text-slate-400">{m.label}</span>
                <input
                  type="file" className="hidden" accept={m.accept}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 50 * 1024 * 1024) return alert("File quá lớn! Tối đa 50MB.");
                    setIsUploading(true);
                    try {
                      const res = await uploadFile(file);
                      setMediaUrl(res.url);
                    } catch {
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
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs text-slate-400">Đang tải lên...</p>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden border border-white/10 bg-black/20">
            {mediaUrl?.match(/\.(jpeg|jpg|gif|png|webp)/i) && (
              <img src={getMediaViewUrl(mediaUrl)} className="max-h-48 mx-auto object-contain" alt="Preview" />
            )}
            {mediaUrl?.match(/\.(mp4|webm)/i) && (
              <video src={getMediaViewUrl(mediaUrl)} controls className="max-h-48 mx-auto" />
            )}
            {mediaUrl?.match(/\.(mp3|wav|ogg)/i) && (
              <div className="p-6 flex flex-col items-center gap-3">
                <FileAudio className="w-10 h-10 text-indigo-400" />
                <audio src={getMediaViewUrl(mediaUrl)} controls className="w-full max-w-sm" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Đáp án */}
      {type !== "TEXT" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {answers.map((ans, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2 bg-slate-900 p-2 rounded-lg border transition-colors",
                  ans.isCorrect ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/5",
                )}
              >
                <button onClick={() => toggleCorrect(idx)} className={ans.isCorrect ? "text-emerald-400" : "text-slate-600"}>
                  {type === "MULTI_ANSWERS"
                    ? ans.isCorrect ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />
                    : ans.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <Input
                  placeholder={`Đáp án ${idx + 1}`}
                  value={ans.content}
                  disabled={type === "TRUE_FALSE"}
                  onChange={(e) => {
                    const next = [...answers];
                    next[idx] = { ...next[idx], content: e.target.value };
                    setAnswers(next);
                  }}
                  className="bg-transparent border-none text-white focus-visible:ring-0 p-0 h-auto"
                />
                {(type === "ANANSWER" || type === "MULTI_ANSWERS") && (
                  <button
                    onClick={() => answers.length > 3 && setAnswers(answers.filter((_, i) => i !== idx))}
                    disabled={answers.length <= 3}
                    className="text-slate-400 hover:text-rose-400 disabled:opacity-20 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {(type === "ANANSWER" || type === "MULTI_ANSWERS") && answers.length < 10 && (
            <button
              onClick={() => setAnswers([...answers, { content: "", isCorrect: false }])}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm đáp án ({answers.length}/10)
            </button>
          )}
        </div>
      )}

      {type === "TEXT" && (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5">
          <AlignLeft className="w-4 h-4 text-indigo-400" />
          Câu hỏi mở — người thi sẽ tự điền văn bản.
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} className="text-slate-400">Hủy</Button>
        <Button onClick={handleSave} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
          {isLoading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
          {editingQuestion ? "Cập nhật" : "Lưu câu hỏi"}
        </Button>
      </div>
    </div>
  );
}

// ─── Trang chính ─────────────────────────────────────────────────────────────
export function QuestionBank() {
  const [questions, setQuestions]       = useState<any[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isAdding, setIsAdding]         = useState(false);
  const [editingQuestion, setEditing]   = useState<any | null>(null);

  // Filters
  const [search, setSearch]       = useState("");
  const [filterDiff, setFilterDiff] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCat, setFilterCat]  = useState("");

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search)     params.search     = search;
      if (filterDiff) params.difficulty = filterDiff;
      if (filterType) params.type       = filterType;
      if (filterCat)  params.category   = filterCat;
      const data = await bankService.getBankQuestions(params);
      setQuestions(data);
    } catch {
      // silently fail — empty list shown
    } finally {
      setIsLoading(false);
    }
  }, [search, filterDiff, filterType, filterCat]);

  useEffect(() => {
    const t = setTimeout(fetchQuestions, 300);
    return () => clearTimeout(t);
  }, [fetchQuestions]);

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa câu hỏi này khỏi ngân hàng?")) return;
    try {
      await bankService.deleteBankQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch {
      alert("Xóa thất bại!");
    }
  };

  const handleSaved = () => {
    setIsAdding(false);
    setEditing(null);
    fetchQuestions();
  };

  const categories = [...new Set(questions.map((q) => q.category).filter(Boolean))];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-[length:200%_auto] animate-gradient-shift drop-shadow-lg inline-block">
            Ngân hàng câu hỏi
          </h2>
          <p className="text-slate-400 mt-1">Quản lý câu hỏi tái sử dụng cho nhiều quiz.</p>
        </div>
        {!isAdding && !editingQuestion && (
          <Button
            onClick={() => setIsAdding(true)}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Thêm câu hỏi
          </Button>
        )}
      </div>

      {/* ── Form ── */}
      {(isAdding || editingQuestion) && (
        <BankQuestionForm
          editingQuestion={editingQuestion}
          onSaved={handleSaved}
          onCancel={() => { setIsAdding(false); setEditing(null); }}
        />
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9 bg-white/10 text-slate-100 placeholder:text-slate-400"
            placeholder="Tìm kiếm câu hỏi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value)}
          className="bg-white/10 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Tất cả độ khó</option>
          {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white/10 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Tất cả loại</option>
          {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {categories.length > 0 && (
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="bg-white/10 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* ── Danh sách ── */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-xl space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-medium">Ngân hàng câu hỏi trống</p>
          <p className="text-slate-400 text-sm">Nhấn "Thêm câu hỏi" để bắt đầu xây dựng ngân hàng.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const diff = difficultyInfo(q.difficulty);
            return (
              <div
                key={q.id}
                className="group relative p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] transition-all"
              >
                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => { setEditing(q); setIsAdding(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => handleDelete(q.id)}
                    className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Meta badges */}
                <div className="flex items-center gap-2 mb-2 pr-20 flex-wrap">
                  <span className="text-xs font-mono text-indigo-400">#{idx + 1}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                    {typeLabel(q.type)}
                  </span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold border", diff.cls)}>
                    {diff.label}
                  </span>
                  {q.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {q.category}
                    </span>
                  )}
                </div>

                <p className="text-white font-medium leading-relaxed pr-20">{q.content}</p>

                {/* Media preview */}
                {q.media_url && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-white/5 bg-black/10 max-w-xs">
                    {q.media_url.match(/\.(jpeg|jpg|gif|png|webp)/i) && (
                      <img src={getMediaViewUrl(q.media_url)} className="w-full h-auto max-h-48 object-cover" alt="" />
                    )}
                    {q.media_url.match(/\.(mp4|webm)/i) && (
<video src={getMediaViewUrl(q.media_url)} controls className="w-full max-h-48" preload="metadata" />
                    )}
                    {q.media_url.match(/\.(mp3|wav|ogg)/i) && (
                      <div className="p-3 flex items-center gap-2">
                        <FileAudio className="w-4 h-4 text-indigo-400" />
                        <audio src={getMediaViewUrl(q.media_url)} controls className="h-8 max-w-full" />
                      </div>
                    )}
                  </div>
                )}

                {/* Đáp án */}
                {q.type !== "TEXT" && q.answers?.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.answers.map((ans: any) => (
                      <div
                        key={ans.id}
                        className={cn(
                          "flex items-center gap-3 text-sm p-2.5 rounded-lg border",
                          ans.is_correct
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-white/5 bg-white/3 text-slate-400",
                        )}
                      >
                        {ans.is_correct
                          ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                          : <Circle className="w-4 h-4 shrink-0 opacity-20" />}
                        <span className="truncate">{ans.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "TEXT" && (
                  <p className="text-xs text-slate-500 italic mt-2 flex items-center gap-1">
                    <AlignLeft className="w-3 h-3" /> Câu hỏi mở
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
