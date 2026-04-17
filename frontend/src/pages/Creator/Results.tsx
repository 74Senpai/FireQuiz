import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, Search, FileSpreadsheet, Loader2, ChevronDown, ClipboardList, BookOpen, FileCheck, Layers, FileType, Shuffle } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as quizService from "@/services/quizServices";
import { ResultsDashboardPanel } from "@/components/ui/ResultsDashboardPanel";

type ExportKind = "excel" | "pdf";

type ExportStatus = {
  kind: ExportKind;
  stage: "preparing" | "downloading" | "success" | "error";
  progress: number;
  message: string;
  fileName?: string;
};

export function Results() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingContent, setIsExportingContent] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isRandomize, setIsRandomize] = useState(false);
  const [versionCount, setVersionCount] = useState(1);
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const isAnyExporting = isExportingExcel || isExportingPdf || isExportingContent;

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await quizService.getMyQuizzes();
        const items = response.data || [];
        setQuizzes(items);

        if (items.length > 0) {
          setSelectedQuizId(String(items[0].id));
        }
      } catch (error) {
        console.error("Không thể tải danh sách bộ câu hỏi:", error);
      }
    };

    fetchQuizzes();
  }, []);

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const parseFileNameFromDisposition = (contentDisposition?: string) => {
    if (!contentDisposition) return null;

    const utfFileName = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfFileName?.[1]) {
      return decodeURIComponent(utfFileName[1]);
    }

    const quotedFileName = contentDisposition.match(/filename="([^"]+)"/i);
    if (quotedFileName?.[1]) {
      return quotedFileName[1];
    }

    const plainFileName = contentDisposition.match(/filename=([^;]+)/i);
    return plainFileName?.[1]?.trim() || null;
  };

  const buildFallbackFileName = (kind: ExportKind) =>
    `quiz-${selectedQuizId}-results.${kind === "excel" ? "xlsx" : "pdf"}`;

  const getExportLabel = (kind: ExportKind) =>
    kind === "excel" ? "Excel" : "PDF";

  const handleExportReport = async (kind: ExportKind) => {
    if (!selectedQuizId) return;

    const isPdf = kind === "pdf";
    const exportLabel = getExportLabel(kind);
    const request = isPdf
      ? quizService.exportQuizResultsPdf
      : quizService.exportQuizResultsExcel;

    if (isPdf) {
      setIsExportingPdf(true);
    } else {
      setIsExportingExcel(true);
    }

    setExportStatus({
      kind,
      stage: "preparing",
      progress: 12,
      message: `Đang chuẩn bị báo cáo ${exportLabel} trên máy chủ...`,
    });

    try {
      const response = await request(selectedQuizId, {
        onDownloadProgress: (event: import("axios").AxiosProgressEvent) => {
          if (event?.total) {
            const progress = Math.max(
              20,
              Math.min(95, Math.round((event.loaded / event.total) * 100)),
            );

            setExportStatus({
              kind,
              stage: "downloading",
              progress,
              message: `Đang tải báo cáo ${exportLabel}... ${progress}%`,
            });
            return;
          }

          setExportStatus({
            kind,
            stage: "downloading",
            progress: 60,
            message: `Đang tải tệp ${exportLabel}, vui lòng đợi trong giây lát...`,
          });
        },
      });

      const fileName =
        parseFileNameFromDisposition(response.headers["content-disposition"]) ||
        buildFallbackFileName(kind);

      downloadFile(response.data, fileName);
      setExportStatus({
        kind,
        stage: "success",
        progress: 100,
        message: `Đã tải báo cáo ${exportLabel} thành công.`,
        fileName,
      });
    } catch (error: any) {
      console.error(`Không thể xuất báo cáo ${exportLabel}:`, error);
      
      let errorMessage = `Không thể xuất báo cáo ${exportLabel}. Vui lòng thử lại.`;
      if (error.response?.data instanceof Blob && error.response.data.type === "application/json") {
        try {
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) errorMessage = errorJson.message;
        } catch (e) {}
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setExportStatus({
        kind,
        stage: "error",
        progress: 100,
        message: errorMessage,
      });
    } finally {
      if (isPdf) {
        setIsExportingPdf(false);
      } else {
        setIsExportingExcel(false);
      }
    }
  };
  const handleExportContent = async (type: "paper" | "key" | "solutions" | "all", format: "excel" | "pdf") => {
    if (!selectedQuizId) return;

    const label = type === "paper" ? "Đề thi" : type === "key" ? "Đáp án" : type === "solutions" ? "Lời giải" : "Trọn bộ";
    const formatLabel = format.toUpperCase();
    const kind: ExportKind = format === "excel" ? "excel" : "pdf";

    setIsExportingContent(true);
    setExportStatus({
      kind,
      stage: "preparing",
      progress: 10,
      message: `Đang khởi tạo bản ${label} (${formatLabel})...`,
    });

    try {
      const response = await quizService.exportQuizContent(selectedQuizId, { 
        type, 
        format,
        randomize: isRandomize,
        versionCount
      }, {
        onDownloadProgress: (event: any) => {
          if (event?.total) {
            const progress = Math.min(95, Math.round((event.loaded / event.total) * 100));
            setExportStatus({
              kind,
              stage: "downloading",
              progress,
              message: `Đang tải bản ${label}... ${progress}%`,
            });
          }
        }
      });

      const fileName = parseFileNameFromDisposition(response.headers["content-disposition"]) || 
                       `quiz-${selectedQuizId}-${type}.${format}`;

      downloadFile(response.data, fileName);
      setExportStatus({
        kind,
        stage: "success",
        progress: 100,
        message: `Đã tải ${label} (${formatLabel}) thành công.`,
        fileName,
      });
    } catch (error: any) {
      console.error("Lỗi xuất nội dung:", error);
      setExportStatus({
        kind,
        stage: "error",
        progress: 100,
        message: "Không thể xuất nội dung bộ đề. Vui lòng thử lại.",
      });
    } finally {
      setIsExportingContent(false);
    }
  };

  const ExportOption = ({ title, icon: Icon, type, desc }: any) => (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/5 p-3 transition-all hover:bg-white/10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-indigo-400/30 bg-indigo-500/10 px-2 text-[10px] text-indigo-200 hover:bg-indigo-500/20"
          onClick={() => handleExportContent(type, "excel")}
          disabled={isAnyExporting}
        >
          <FileSpreadsheet className="mr-1 h-3 w-3" /> EXCEL
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-rose-400/30 bg-rose-500/10 px-2 text-[10px] text-rose-200 hover:bg-rose-500/20"
          onClick={() => handleExportContent(type, "pdf")}
          disabled={isAnyExporting}
        >
          <Download className="mr-1 h-3 w-3" /> PDF
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="inline-block bg-[length:200%_auto] bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-lg transition-all duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_15px_rgba(167,139,250,0.6)]">
            Kết quả Bộ câu hỏi
          </h2>
          <p className="mt-1 text-slate-400">
            Xem và xuất dữ liệu kết quả học sinh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!selectedQuizId}
            onClick={() =>
              navigate(`/dashboard/question-analytics?quizId=${selectedQuizId}`)
            }
            className="gap-2 border-sky-400/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
          >
            Xem thống kê câu hỏi
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedQuizId}
            onClick={() =>
              navigate(`/dashboard/leaderboard?quizId=${selectedQuizId}`)
            }
            className="gap-2 border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
          >
            Xem bảng xếp hạng
          </Button>

          <div className="relative">
            <Button
              type="button"
              disabled={!selectedQuizId || isAnyExporting}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
            >
              {isExportingContent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Layers className="h-4 w-4" />
              )}
              Xuất bộ đề 3 bản
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
            
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-12 z-20 w-96 rounded-xl border border-white/20 bg-slate-900/95 p-4 backdrop-blur-xl shadow-2xl animate-fade-in">
                  <div className="mb-4">
                    <h4 className="font-bold text-white uppercase tracking-wider text-xs opacity-70">Lựa chọn xuất bộ đề</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Chọn phiên bản nội dung và định dạng bạn muốn tải.</p>
                  </div>

                  <div className="mb-6 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shuffle className="h-4 w-4 text-indigo-300" />
                        <label htmlFor="randomize" className="text-xs font-medium text-indigo-100 cursor-pointer select-none">Xáo trộn câu hỏi & đáp án</label>
                      </div>
                      <input 
                        type="checkbox"
                        id="randomize" 
                        checked={isRandomize} 
                        onChange={(e) => setIsRandomize(e.target.checked)}
                        className="h-4 w-4 rounded border-indigo-400 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                    </div>
                    
                    {isRandomize && (
                      <div className="flex items-center justify-between pt-2 border-t border-indigo-500/10 animate-slide-up">
                        <label className="text-[10px] text-indigo-200">Số lượng mã đề (1-10):</label>
                        <input 
                          type="number" 
                          min={1} 
                          max={10} 
                          value={versionCount}
                          onChange={(e) => setVersionCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                          className="w-12 h-6 bg-slate-800 border border-indigo-500/30 rounded text-center text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <ExportOption 
                      title="Bản Đề thi" 
                      desc="Không có đáp án, có header Họ tên/Lớp"
                      icon={BookOpen} 
                      type="paper" 
                    />
                    <ExportOption 
                      title="Bản Đáp án" 
                      desc="Bảng đối chiếu đáp án đúng nhanh"
                      icon={ClipboardList} 
                      type="key" 
                    />
                    <ExportOption 
                      title="Bản Lời giải" 
                      desc="Đầy đủ nội dung và giải thích chi tiết"
                      icon={FileCheck} 
                      type="solutions" 
                    />
                    <div className="pt-2 border-t border-white/10">
                      <ExportOption 
                        title="Trọn bộ (3 trong 1)" 
                        desc="Gộp cả 3 loại vào cùng 1 tệp tin"
                        icon={Layers} 
                        type="all" 
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <Button
            type="button"
            disabled={!selectedQuizId || isAnyExporting}
            onClick={() => handleExportReport("pdf")}
            className="gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-lg"
          >
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExportingPdf ? "Đang xuất PDF" : "Tải báo cáo PDF"}
          </Button>
          <Button
            type="button"
            disabled={!selectedQuizId || isAnyExporting}
            onClick={() => handleExportReport("excel")}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            {isExportingExcel ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {isExportingExcel ? "Đang xuất Excel" : "Tải báo cáo Excel"}
          </Button>
        </div>
      </div>

      {exportStatus ? (
        <Card
          className={`backdrop-blur-md shadow-2xl ${
            exportStatus.stage === "error"
              ? "border-rose-400/30 bg-rose-500/10"
              : exportStatus.stage === "success"
                ? "border-emerald-400/30 bg-emerald-500/10"
                : "border-indigo-400/30 bg-indigo-500/10"
          }`}
        >
          <CardContent className="space-y-4 p-5">
            <div
              className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              aria-live="polite"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  Tiến trình xuất báo cáo {getExportLabel(exportStatus.kind)}
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {exportStatus.message}
                </p>
                {exportStatus.fileName ? (
                  <p className="mt-1 text-xs text-slate-300">
                    Tệp vừa tải: {exportStatus.fileName}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                {exportStatus.stage === "preparing" ||
                exportStatus.stage === "downloading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                <span>{exportStatus.progress}%</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-950/40">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  exportStatus.stage === "error"
                    ? "bg-rose-400"
                    : exportStatus.stage === "success"
                      ? "bg-emerald-400"
                      : "bg-gradient-to-r from-indigo-400 to-cyan-400"
                }`}
                style={{ width: `${exportStatus.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-amber-200">Bảng xếp hạng Top 10</CardTitle>
          <CardDescription className="text-slate-300">
            Chọn bộ câu hỏi và mở giao diện vinh danh thí sinh có thành tích cao
            nhất.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          <select
            value={selectedQuizId}
            onChange={(event) => setSelectedQuizId(event.target.value)}
            className="flex h-10 w-full rounded-lg border border-amber-400/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 md:max-w-md"
          >
            <option value="">Chọn bộ câu hỏi để xem bảng xếp hạng</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={!selectedQuizId}
            onClick={() =>
              navigate(`/dashboard/leaderboard?quizId=${selectedQuizId}`)
            }
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Mở bảng xếp hạng
          </Button>
        </CardContent>
      </Card>

      <Card className="border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-cyan-500/5 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-sky-200">
            Thống kê chuyên sâu câu hỏi
          </CardTitle>
          <CardDescription className="text-slate-300">
            Xem biểu đồ tỷ lệ đúng sai của từng câu hỏi để đánh giá độ khó.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          <select
            value={selectedQuizId}
            onChange={(event) => setSelectedQuizId(event.target.value)}
            className="flex h-10 w-full rounded-lg border border-sky-400/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 md:max-w-md"
          >
            <option value="">Chọn bộ câu hỏi để xem thống kê</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={!selectedQuizId}
            onClick={() =>
              navigate(`/dashboard/question-analytics?quizId=${selectedQuizId}`)
            }
            className="gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
          >
            Mở thống kê câu hỏi
          </Button>
        </CardContent>
      </Card>

      {/* Bảng kết quả chi tiết đã được thay thế bằng ResultsDashboardPanel bên dưới */}

      {selectedQuizId ? (
        <ResultsDashboardPanel quizId={selectedQuizId} />
      ) : null}
    </div>
  );
}
