import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X, Search, Loader2, CheckSquare, Square, BookOpen,
  CheckCircle2, AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMediaViewUrl } from "@/services/mediaServices";
import * as bankService from "@/services/bankQuestionServices";
import { FileAudio } from "lucide-react";
import { useDialogStore } from "@/stores/dialogStore";

const DIFFICULTIES = [
  { value: "easy",   label: "Dễ",        cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { value: "medium", label: "Trung bình", cls: "bg-amber-500/20  text-amber-300  border-amber-500/30"  },
  { value: "hard",   label: "Khó",        cls: "bg-rose-500/20   text-rose-300   border-rose-500/30"   },
];

const TYPE_LABELS: Record<string, string> = {
  ANANSWER:      "Một đáp án",
  MULTI_ANSWERS: "Nhiều đáp án",
  TRUE_FALSE:    "Đúng / Sai",
  TEXT:          "Câu hỏi mở",
};

const diffCls   = (d: string) => DIFFICULTIES.find((x) => x.value === d)?.cls   ?? "bg-slate-500/20 text-slate-300 border-slate-500/30";
const diffLabel = (d: string) => DIFFICULTIES.find((x) => x.value === d)?.label ?? d;

interface Props {
  quizId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportFromBankModal({ quizId, onClose, onSuccess }: Props) {
  const [questions, setQuestions]     = useState<any[]>([]);
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading]     = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [visible, setVisible]         = useState(false);

  const [search, setSearch]         = useState("");
  const [filterDiff, setFilterDiff] = useState("");
  const [filterType, setFilterType] = useState("");

  // Trigger slide-in animation after mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search)     params.search     = search;
      if (filterDiff) params.difficulty = filterDiff;
      if (filterType) params.type       = filterType;
      const data = await bankService.getBankQuestions(params);
      setQuestions(data);
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  }, [search, filterDiff, filterType]);

  useEffect(() => {
    const t = setTimeout(fetchQuestions, 300);
    return () => clearTimeout(t);
  }, [fetchQuestions]);

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(selected.size === questions.length ? new Set() : new Set(questions.map((q) => q.id)));

  const { showDialog } = useDialogStore();

  const handleImport = async () => {
    if (!selected.size) {
      return showDialog({ title: "Thông báo", description: "Vui lòng chọn ít nhất 1 câu hỏi" });
    }
    setIsImporting(true);
    try {
      const { createdQuestionIds, skipped } = await bankService.importFromBank(quizId, [...selected]);
      
      if (skipped > 0 && createdQuestionIds.length === 0) {
        showDialog({
          title: "Thông báo kết quả",
          description: `Tất cả ${skipped} câu hỏi đã tồn tại trong quiz, không có gì được thêm.`,
          onConfirm: () => onClose()
        });
        return;
      }

      if (skipped > 0) {
        showDialog({
          title: "Import thành công",
          description: `Đã thêm ${createdQuestionIds.length} câu hỏi. Bỏ qua ${skipped} câu đã tồn tại trong quiz.`
        });
      } else {
        showDialog({
          title: "Thành công",
          description: `Đã thêm thành công ${createdQuestionIds.length} câu hỏi.`
        });
      }
      onSuccess();
    } catch (e: any) {
      showDialog({
        title: "Lỗi Import",
        description: e.response?.data?.message || "Import thất bại!"
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!onClose) return null;
 
  return createPortal(
    <>
      {/* Backdrop mờ nhẹ — không che toàn màn hình */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Import từ ngân hàng</h3>
                <p className="text-xs text-slate-400">Chọn các câu hỏi chất lượng để thêm vào bộ quiz của bạn</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-white/5 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              className="pl-8 bg-white/10 text-slate-100 placeholder:text-slate-400 h-8 text-xs"
              placeholder="Tìm kiếm câu hỏi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterDiff}
              onChange={(e) => setFilterDiff(e.target.value)}
              className="flex-1 bg-slate-800 border border-white/10 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" className="bg-slate-800 text-slate-200">Mọi độ khó</option>
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value} className="bg-slate-800 text-slate-200">{d.label}</option>)}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 bg-slate-800 border border-white/10 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" className="bg-slate-800 text-slate-200">Mọi loại</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v} className="bg-slate-800 text-slate-200">{l}</option>)}
            </select>
          </div>
        </div>

        {/* Select all bar */}
        {!isLoading && questions.length > 0 && (
          <div className="px-5 py-2 border-b border-white/5 flex items-center gap-3 shrink-0">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {selected.size === questions.length
                ? <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                : <Square className="w-3.5 h-3.5" />}
              {selected.size === questions.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            {selected.size > 0 && (
              <span className="text-xs text-indigo-400 font-medium ml-auto">
                {selected.size}/{questions.length} đã chọn
              </span>
            )}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm">Không tìm thấy câu hỏi nào.</p>
            </div>
          ) : (
            questions.map((q) => {
              const isSelected = selected.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelect(q.id)}
                  className={cn(
                    "flex gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    isSelected
                      ? "border-indigo-500/50 bg-indigo-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/[0.08]",
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {isSelected
                      ? <CheckSquare className="w-4 h-4 text-indigo-400" />
                      : <Square className="w-4 h-4 text-slate-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                        {TYPE_LABELS[q.type] ?? q.type}
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold border", diffCls(q.difficulty))}>
                        {diffLabel(q.difficulty)}
                      </span>
                      {q.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {q.category}
                        </span>
                      )}
                    </div>

                    <p className="text-white text-sm font-medium leading-relaxed">{q.content}</p>
 
                    {/* Media Preview */}
                    {q.media_url && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-white/5 bg-black/20 max-w-sm">
                        {q.media_url.match(/\.(jpeg|jpg|gif|png|webp)/i) && (
                          <img src={getMediaViewUrl(q.media_url)} className="w-full h-auto max-h-32 object-cover" alt="" />
                        )}
                        {q.media_url.match(/\.(mp4|webm)/i) && (
<video src={getMediaViewUrl(q.media_url)} controls className="w-full max-h-32" />
                        )}
                        {q.media_url.match(/\.(mp3|wav|ogg)/i) && (
                          <div className="p-2 flex items-center gap-2">
                            <FileAudio className="w-4 h-4 text-indigo-400" />
                            <audio src={getMediaViewUrl(q.media_url)} controls className="h-7 max-w-full" />
                          </div>
                        )}
                      </div>
                    )}

                    {q.type !== "TEXT" && q.answers?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {q.answers.slice(0, 4).map((a: any) => (
                          <span
                            key={a.id}
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full border inline-flex items-center gap-0.5",
                              a.is_correct
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                : "border-white/5 text-slate-500",
                            )}
                          >
                            {a.is_correct && <CheckCircle2 className="w-2 h-2" />}
                            {a.content}
                          </span>
                        ))}
                      </div>
                    )}

                    {q.type === "TEXT" && (
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <AlignLeft className="w-2.5 h-2.5" /> Câu hỏi mở
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            {selected.size > 0 ? `Sẽ thêm ${selected.size} câu hỏi` : "Chưa chọn câu hỏi nào"}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} className="text-slate-400 h-8 text-xs">
              Hủy
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || selected.size === 0}
              className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs min-w-[90px]"
            >
              {isImporting && <Loader2 className="animate-spin w-3.5 h-3.5 mr-1.5" />}
              Import {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </>,
    document.body
  );
}
