import React, { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Kiểu dữ liệu ─────────────────────────────────────────────────────────────
interface ParsedQuestion {
  question: string;
  type: string;
  correct_options: string;
  options: string[];
  valid: boolean;
  errors: string[];
}

interface ImportExcelModalProps {
  quizId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_TYPES = ["ANANSWER", "MULTI_ANSWERS", "TRUE_FALSE", "TEXT"];
const TYPE_LABELS: Record<string, string> = {
  ANANSWER: "Một đáp án",
  MULTI_ANSWERS: "Nhiều đáp án",
  TRUE_FALSE: "Đúng/Sai",
  TEXT: "Câu hỏi mở",
};

// ─── Validate 1 dòng ─────────────────────────────────────────────────────────
const validateRow = (
  row: Record<string, any>,
  index: number,
): ParsedQuestion => {
  const question = row["question"]?.toString().trim() ?? "";
  const type = row["type"]?.toString().trim().toUpperCase() ?? "";
  const correct_options = row["correct_options"]?.toString().trim() ?? "";

  // Gom options
  const options: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const opt = row[`option${i}`]?.toString().trim();
    if (opt) options.push(opt);
  }

  const errors: string[] = [];

  if (!question) errors.push("Thiếu nội dung câu hỏi");
  if (!type) errors.push("Thiếu loại câu hỏi");
  else if (!ALLOWED_TYPES.includes(type))
    errors.push(`Loại không hợp lệ: "${type}"`);

  if (type === "TEXT") {
    // Không cần đáp án
  } else if (type === "TRUE_FALSE") {
    if (options.length !== 2) errors.push("TRUE_FALSE cần đúng 2 options");
    const idx = parseInt(correct_options);
    if (isNaN(idx) || idx < 1 || idx > 2)
      errors.push("correct_options phải là 1 hoặc 2");
  } else if (ALLOWED_TYPES.includes(type)) {
    if (options.length < 3 || options.length > 10)
      errors.push(`Cần từ 3–10 options (hiện có ${options.length})`);
    if (!correct_options) errors.push("Thiếu correct_options");
    if (type === "ANANSWER") {
      const indices = correct_options.split(",").map((s) => parseInt(s.trim()));
      if (indices.length !== 1) errors.push("ANANSWER chỉ được 1 đáp án đúng");
    }
  }

  return {
    question,
    type,
    correct_options,
    options,
    valid: errors.length === 0,
    errors,
  };
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ImportExcelModal({
  quizId,
  onClose,
  onSuccess,
}: ImportExcelModalProps) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedQuestion[]>([]);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = API_URL || "http://localhost:8080/api";
  const token = localStorage.getItem("accessToken");

  const validRows = parsedRows.filter((r) => r.valid);
  const invalidRows = parsedRows.filter((r) => !r.valid);

  // ── Parse file Excel với SheetJS ───────────────────────────────────────────
  const parseFile = (file: File) => {
    setFileName(file.name);
    setRawFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
      });

      const rows = json.map((row, i) => validateRow(row, i));
      setParsedRows(rows);
      setStep("preview");
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".xlsx")) parseFile(file);
    else alert("Chỉ chấp nhận file .xlsx");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // ── Download template ───────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/quiz/${quizId}/import-excel/template`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "firequiz_question_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Không thể tải file mẫu");
    }
  };

  // ── Xác nhận import ─────────────────────────────────────────────────────────
  const handleConfirmImport = async () => {
    if (!rawFile || validRows.length === 0) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", rawFile);

      const res = await axios.post(
        `${API_URL}/quiz/${quizId}/import-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      alert(res.data.message);
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Import thất bại");
    } finally {
      setIsImporting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">
                Import câu hỏi từ Excel
              </h2>
              <p className="text-xs text-slate-400">
                {step === "upload"
                  ? "Bước 1 — Chọn file"
                  : `Bước 2 — Xem trước (${parsedRows.length} dòng)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Download mẫu */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Chưa có file mẫu?
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tải về template Excel với hướng dẫn chi tiết
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 shrink-0"
                >
                  <Download className="w-4 h-4 mr-2" /> Tải file mẫu
                </Button>
              </div>

              {/* Vùng drag & drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl py-16 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
                  isDragging
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-white/10 hover:border-indigo-400/40 hover:bg-white/[0.02]",
                )}
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                    isDragging ? "bg-indigo-600/30" : "bg-white/5",
                  )}
                >
                  <Upload
                    className={cn(
                      "w-7 h-7",
                      isDragging ? "text-indigo-400" : "text-slate-400",
                    )}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">
                    {isDragging
                      ? "Thả file vào đây"
                      : "Kéo thả hoặc nhấn để chọn file"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Chỉ chấp nhận file .xlsx, tối đa 5MB
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Cấu trúc Excel */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cấu trúc file Excel
                </p>
                <div className="overflow-x-auto">
                  <table className="text-xs text-slate-400 w-full">
                    <thead>
                      <tr className="text-indigo-400">
                        {[
                          "question",
                          "type",
                          "correct_options",
                          "option1",
                          "option2",
                          "...",
                          "option10",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-2 py-1 text-left font-mono border-b border-white/5"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-2 py-1 text-slate-300">
                          Nội dung câu hỏi
                        </td>
                        <td className="px-2 py-1 font-mono">ANANSWER…</td>
                        <td className="px-2 py-1 font-mono">1 hoặc 1,3</td>
                        <td className="px-2 py-1">Đáp án 1</td>
                        <td className="px-2 py-1">Đáp án 2</td>
                        <td className="px-2 py-1 text-slate-600">…</td>
                        <td className="px-2 py-1 text-slate-600 italic">
                          bỏ trống
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                  <p className="text-2xl font-bold text-white">
                    {parsedRows.length}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Tổng dòng</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {validRows.length}
                  </p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">Hợp lệ</p>
                </div>
                <div
                  className={cn(
                    "rounded-xl p-3 text-center border",
                    invalidRows.length > 0
                      ? "bg-rose-500/10 border-rose-500/20"
                      : "bg-white/5 border-white/10",
                  )}
                >
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      invalidRows.length > 0
                        ? "text-rose-400"
                        : "text-slate-400",
                    )}
                  >
                    {invalidRows.length}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      invalidRows.length > 0
                        ? "text-rose-400/70"
                        : "text-slate-500",
                    )}
                  >
                    Lỗi
                  </p>
                </div>
              </div>

              {/* Bảng preview */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-slate-800 border-b border-white/10">
                      <tr>
                        <th className="px-3 py-2 text-slate-400 font-semibold">
                          #
                        </th>
                        <th className="px-3 py-2 text-slate-400 font-semibold">
                          Nội dung
                        </th>
                        <th className="px-3 py-2 text-slate-400 font-semibold">
                          Loại
                        </th>
                        <th className="px-3 py-2 text-slate-400 font-semibold">
                          Options
                        </th>
                        <th className="px-3 py-2 text-slate-400 font-semibold">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedRows.map((row, i) => (
                        <tr
                          key={i}
                          className={cn(
                            "transition-colors",
                            row.valid
                              ? "hover:bg-white/[0.03]"
                              : "bg-rose-500/5",
                          )}
                        >
                          <td className="px-3 py-2 text-slate-500 font-mono">
                            {i + 2}
                          </td>
                          <td
                            className="px-3 py-2 text-slate-200 max-w-[200px] truncate"
                            title={row.question}
                          >
                            {row.question || (
                              <span className="text-slate-600 italic">
                                trống
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-mono border",
                                ALLOWED_TYPES.includes(row.type)
                                  ? "border-indigo-500/30 text-indigo-300 bg-indigo-500/10"
                                  : "border-rose-500/30 text-rose-400 bg-rose-500/10",
                              )}
                            >
                              {row.type || "?"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-400">
                            {row.type === "TEXT" ? (
                              <span className="italic text-slate-600">—</span>
                            ) : (
                              `${row.options.length} options`
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {row.valid ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> OK
                              </span>
                            ) : (
                              <span
                                className="flex items-center gap-1 text-rose-400 cursor-help"
                                title={row.errors.join(" | ")}
                              >
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                {row.errors[0]}
                                {row.errors.length > 1 &&
                                  ` (+${row.errors.length - 1})`}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-2.5 rounded-lg border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {invalidRows.length} dòng lỗi sẽ bị bỏ qua. Chỉ{" "}
                    <strong>{validRows.length}</strong> câu hợp lệ sẽ được
                    import.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 shrink-0 bg-slate-900/80">
          <div className="flex items-center gap-2">
            {step === "preview" && (
              <button
                onClick={() => setStep("upload")}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              Hủy
            </Button>

            {step === "preview" && (
              <Button
                onClick={handleConfirmImport}
                disabled={isImporting || validRows.length === 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 min-w-[180px]"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang
                    import...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Xác nhận Import (
                    {validRows.length} câu)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
