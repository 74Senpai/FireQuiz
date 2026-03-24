import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, Circle, Loader2, Pencil, X } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

export function QuestionManager({ quizId }: { quizId: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [content, setContent] = useState("");
  const [answers, setAnswers] = useState([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ]);

  const API_URL = process.env.API_URL || "http://localhost:8080/api";

  const fetchQuestions = async () => {
    try {
      setError(null); // Reset error trước khi fetch
      const res = await axios.get(`${API_URL}/question/${quizId}/list`, {
        withCredentials: true,
      });
      setQuestions(res.data.data || res.data);
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.response?.data?.message ||
        e.message ||
        "Không thể tải danh sách câu hỏi.";
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  // Reset form và trạng thái
  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setContent("");
    setAnswers([
      { content: "", isCorrect: true },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ]);
  };

  // Kích hoạt chế độ sửa
  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setIsAdding(true);
    setContent(q.content);
    // Map dữ liệu từ snake_case của DB sang camelCase của State
    setAnswers(q.answers.map((a: any) => ({
      content: a.content,
      isCorrect: !!a.is_correct
    })));
    // Cuộn lên đầu form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Xử lý Xóa
  const handleDelete = async (questionId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) return;
    try {
      setError(null); // Reset error trước khi delete
      await axios.delete(`${API_URL}/question/${questionId}`, {
        withCredentials: true,
      });
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message ||
        error.message ||
        "Không thể xóa câu hỏi. Vui lòng thử lại.";
      setError(errorMessage);
    }
  };

  const handleSave = async () => {
    if (!content.trim() || answers.some((a) => !a.content.trim())) {
      setError("Vui lòng nhập đầy đủ nội dung và 4 đáp án");
      return;
    }

    setIsLoading(true);
    setError(null); // Reset error trước khi save
    try {
      const payload = {
        content,
        type: "ANANSWER",
        quizId: parseInt(quizId),
        answers: answers,
      };

      if (editingId) {
        // GỌI API UPDATE (Bạn cần đảm bảo backend có endpoint này)
        await axios.patch(`${API_URL}/question/${editingId}`, payload, {
          withCredentials: true,
        });
      } else {
        // GỌI API CREATE
        await axios.post(`${API_URL}/question`, payload, {
          withCredentials: true,
        });
      }

      resetForm();
      fetchQuestions();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message ||
        error.message ||
        "Không thể lưu câu hỏi. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold flex items-center gap-2">
          Danh sách câu hỏi
          <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
            {questions.length} câu
          </span>
        </h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Thêm câu hỏi
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50/10 border border-red-200/20 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <X className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
            <Button
              onClick={() => setError(null)}
              variant="ghost"
              size="sm"
              className="ml-auto text-red-400 hover:text-red-300 h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Form (Dùng cho cả Add và Edit) */}
      {isAdding && (
        <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-indigo-300">
              {editingId ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi mới"}
            </span>
            <button onClick={resetForm} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <Input
            placeholder="Nội dung câu hỏi..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-slate-900 border-white/10 text-white"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {answers.map((ans, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-2 bg-slate-900 p-2 rounded border transition-colors",
                  ans.isCorrect ? "border-emerald-500/50" : "border-white/5"
                )}
              >
                <button
                  onClick={() =>
                    setAnswers(
                      answers.map((a, i) => ({ ...a, isCorrect: i === idx })),
                    )
                  }
                  className={ans.isCorrect ? "text-emerald-500" : "text-slate-600"}
                >
                  {ans.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <Input
                  placeholder={`Đáp án ${idx + 1}`}
                  value={ans.content}
                  onChange={(e) => {
                    const newAns = [...answers];
                    newAns[idx].content = e.target.value;
                    setAnswers(newAns);
                  }}
                  className="bg-transparent border-none text-white focus-visible:ring-0"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={resetForm} className="text-slate-400">
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-indigo-600 min-w-[120px]"
            >
              {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              {editingId ? "Cập nhật" : "Lưu câu hỏi"}
            </Button>
          </div>
        </div>
      )}

      {/* Render Questions List */}
      <div className="space-y-4">
        {questions.length === 0 && !isAdding && (
          <div className="text-center py-10 text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
            Chưa có câu hỏi nào. Hãy nhấn nút Thêm để bắt đầu.
          </div>
        )}

        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="group relative p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="pr-20">
                <span className="text-xs font-mono text-indigo-400 mb-1 block">Câu hỏi {idx + 1}</span>
                <p className="text-white font-medium text-lg leading-relaxed">
                  {q.content}
                </p>
              </div>

              {/* Nút Action (Chỉ hiện khi hover card) */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.answers?.map((ans: any) => (
                <div
                  key={ans.id}
                  className={cn(
                    "flex items-center gap-3 text-sm p-3 rounded-lg border transition-all",
                    ans.is_correct
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/5 bg-white/5 text-slate-400"
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
          </div>
        ))}
      </div>
    </div>
  );
}
