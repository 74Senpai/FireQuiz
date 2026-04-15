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
import { Download, Search, FileSpreadsheet, Loader2 } from "lucide-react";
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
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const isAnyExporting = isExportingExcel || isExportingPdf;

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
        console.error("Khong the tai danh sach quiz cho leaderboard:", error);
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
      message: `Dang chuan bi bao cao ${exportLabel} tren may chu...`,
    });

    try {
      const response = await request(selectedQuizId, {
        onDownloadProgress: (event: any) => {
          if (event?.total) {
            const progress = Math.max(
              20,
              Math.min(95, Math.round((event.loaded / event.total) * 100)),
            );

            setExportStatus({
              kind,
              stage: "downloading",
              progress,
              message: `Dang tai bao cao ${exportLabel}... ${progress}%`,
            });
            return;
          }

          setExportStatus({
            kind,
            stage: "downloading",
            progress: 60,
            message: `Dang tai tep ${exportLabel}, vui long doi trong giay lat...`,
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
        message: `Da tai bao cao ${exportLabel} thanh cong.`,
        fileName,
      });
    } catch (error: any) {
      console.error(`Khong the xuat bao cao ${exportLabel}:`, error);
      
      let errorMessage = `Khong the xuat bao cao ${exportLabel}. Vui long thu lai.`;
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="inline-block bg-[length:200%_auto] bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-lg transition-all duration-300 hover:scale-[1.02] hover:drop-shadow-[0_0_15px_rgba(167,139,250,0.6)]">
            Ket qua Quiz
          </h2>
          <p className="mt-1 text-slate-400">
            Xem va xuat du lieu ket qua hoc sinh.
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
            Xem thong ke cau hoi
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
            Xem bang xep hang
          </Button>
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
            {isExportingPdf ? "Dang xuat PDF" : "Tai bao cao PDF"}
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
            {isExportingExcel ? "Dang xuat Excel" : "Tai bao cao Excel"}
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
                  Tien trinh xuat bao cao {getExportLabel(exportStatus.kind)}
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {exportStatus.message}
                </p>
                {exportStatus.fileName ? (
                  <p className="mt-1 text-xs text-slate-300">
                    Tep vua tai: {exportStatus.fileName}
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
          <CardTitle className="text-amber-200">Bang xep hang Top 10</CardTitle>
          <CardDescription className="text-slate-300">
            Chon quiz va mo giao dien vinh danh thi sinh co thanh tich cao
            nhat.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          <select
            value={selectedQuizId}
            onChange={(event) => setSelectedQuizId(event.target.value)}
            className="flex h-10 w-full rounded-lg border border-amber-400/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 md:max-w-md"
          >
            <option value="">Chon quiz de xem leaderboard</option>
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
            Mo bang xep hang
          </Button>
        </CardContent>
      </Card>

      <Card className="border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-cyan-500/5 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-sky-200">
            Thong ke chuyen sau cau hoi
          </CardTitle>
          <CardDescription className="text-slate-300">
            Xem bieu do ty le dung sai cua tung cau hoi de danh gia do kho.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          <select
            value={selectedQuizId}
            onChange={(event) => setSelectedQuizId(event.target.value)}
            className="flex h-10 w-full rounded-lg border border-sky-400/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 md:max-w-md"
          >
            <option value="">Chon quiz de xem thong ke</option>
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
            Mo thong ke cau hoi
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex gap-4">
            <select className="flex h-10 w-64 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <option>Thi giua ky - Toan 101</option>
              <option>Thi cuoi ky - Vat ly</option>
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="bg-white/10 pl-9 text-slate-100 placeholder:text-slate-400"
                placeholder="Tim kiem ten hoac ma hoc sinh..."
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-white/20">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Ten hoc sinh</th>
                  <th className="px-6 py-3 font-medium">Ma hoc sinh</th>
                  <th className="px-6 py-3 font-medium">Diem</th>
                  <th className="px-6 py-3 font-medium">Thoi gian</th>
                  <th className="px-6 py-3 font-medium">Dung/Sai</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  {
                    n: "Alice Smith",
                    id: "STU001",
                    s: "9.5/10",
                    t: "45m 12s",
                    c: "38/2",
                  },
                  {
                    n: "Bob Jones",
                    id: "STU002",
                    s: "7.0/10",
                    t: "59m 30s",
                    c: "28/12",
                  },
                  {
                    n: "Charlie Brown",
                    id: "STU003",
                    s: "8.5/10",
                    t: "50m 00s",
                    c: "34/6",
                  },
                ].map((item, i) => (
                  <tr
                    key={i}
                    className="bg-white/5 transition-colors duration-300 hover:bg-white/10"
                  >
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {item.n}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{item.id}</td>
                    <td className="px-6 py-4 font-bold text-purple-300">
                      {item.s}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{item.t}</td>
                    <td className="px-6 py-4 text-slate-400">{item.c}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="h-4 w-4" /> Excel
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedQuizId ? (
        <ResultsDashboardPanel quizId={selectedQuizId} />
      ) : null}
    </div>
  );
}
