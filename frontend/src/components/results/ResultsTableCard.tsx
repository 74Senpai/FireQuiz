import type { ChangeEvent, KeyboardEvent } from "react";
import {
  CheckCircle,
  Clock,
  FileDown,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { formatDateTime, formatDuration, getScoreColor } from "./helpers";
import type { AttemptResult, Filters } from "./types";

interface ResultsTableCardProps {
  quizTitle?: string;
  filters: Filters;
  hasActiveFilters: boolean;
  isLoadingResults: boolean;
  isExporting: boolean;
  results: AttemptResult[];
  resultsError: string | null;
  onFilterChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onApplyFilters: () => void;
  onExport: () => void;
  onResetFilters: () => void;
  onRetry: () => void;
}

interface StatusBadgeProps {
  status: "SUBMITTED" | "IN_PROGRESS";
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        Đã nộp
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
      <Clock className="h-3 w-3" />
      Đang làm
    </span>
  );
}

export function ResultsTableCard({
  quizTitle,
  filters,
  hasActiveFilters,
  isLoadingResults,
  isExporting,
  results,
  resultsError,
  onFilterChange,
  onSearchKeyDown,
  onApplyFilters,
  onExport,
  onResetFilters,
  onRetry,
}: ResultsTableCardProps) {
  return (
    <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-200">
          <Users className="h-4 w-4 text-purple-400" />
          Danh sách thí sinh
          {quizTitle && (
            <span className="ml-1 text-sm font-normal text-slate-400">
              — {quizTitle}
            </span>
          )}
        </CardTitle>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="search"
                value={filters.search}
                onChange={onFilterChange}
                onKeyDown={onSearchKeyDown}
                className="border-white/20 bg-white/10 pl-9 text-slate-100 placeholder:text-slate-400"
                placeholder="Tìm theo tên hoặc email thí sinh..."
              />
            </div>

            <select
              name="status"
              value={filters.status}
              onChange={onFilterChange}
              className="h-10 min-w-[160px] rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="" className="bg-slate-800">
                Tất cả trạng thái
              </option>
              <option value="SUBMITTED" className="bg-slate-800">
                Đã nộp bài
              </option>
              <option value="IN_PROGRESS" className="bg-slate-800">
                Đang làm bài
              </option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 flex-shrink-0 text-slate-400" />

            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-xs text-slate-400">
                Điểm từ:
              </label>
              <Input
                name="minScore"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={filters.minScore}
                onChange={onFilterChange}
                className="w-20 border-white/20 bg-white/10 text-sm text-slate-100"
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-xs text-slate-400">
                đến:
              </label>
              <Input
                name="maxScore"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={filters.maxScore}
                onChange={onFilterChange}
                className="w-20 border-white/20 bg-white/10 text-sm text-slate-100"
                placeholder="10"
              />
            </div>

            <div className="hidden h-6 w-px bg-white/20 sm:block" />

            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-xs text-slate-400">
                Từ ngày:
              </label>
              <Input
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={onFilterChange}
                className="w-36 border-white/20 bg-white/10 text-sm text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-xs text-slate-400">
                Đến ngày:
              </label>
              <Input
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={onFilterChange}
                className="w-36 border-white/20 bg-white/10 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onApplyFilters}
              disabled={isLoadingResults}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-sm shadow-lg hover:from-indigo-700 hover:to-purple-700"
            >
              {isLoadingResults ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
              Áp dụng bộ lọc
            </Button>

            <Button
              onClick={onExport}
              disabled={isLoadingResults || isExporting || results.length === 0}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-sm shadow-lg hover:from-emerald-700 hover:to-teal-700"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Xuất Excel
            </Button>

            <Button
              onClick={onResetFilters}
              variant="ghost"
              className="gap-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <XCircle className="h-4 w-4" />
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoadingResults ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="mb-3 h-8 w-8 animate-spin" />
            <p className="text-sm">Đang tải kết quả...</p>
          </div>
        ) : resultsError ? (
          <div className="rounded-lg border border-red-200/20 bg-red-50/10 py-16 text-center">
            <XCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
            <p className="text-base font-medium text-red-400">
              Không thể tải kết quả
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-red-300">
              {resultsError}
            </p>
            <Button
              onClick={onRetry}
              className="mt-4 bg-red-600 hover:bg-red-700"
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="text-base">Không có kết quả nào.</p>
            <p className="mt-1 text-sm text-slate-500">
              {hasActiveFilters
                ? "Thử thay đổi bộ lọc để xem thêm kết quả."
                : "Chưa có thí sinh nào tham gia quiz này."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden overflow-x-auto rounded-lg border border-white/20">
            <table className="min-w-[700px] w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Tên thí sinh</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Điểm số</th>
                  <th className="px-5 py-3 font-medium">Thời gian làm</th>
                  <th className="px-5 py-3 font-medium">Thời gian nộp</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {results.map((item, index) => (
                  <tr
                    key={item.attemptId}
                    className="bg-white/5 transition-colors duration-200 hover:bg-white/10"
                  >
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-100">
                      {item.user.fullName}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {item.user.email}
                    </td>
                    <td className={`px-5 py-4 ${getScoreColor(item.score)}`}>
                      {item.score !== null ? item.score : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {formatDuration(item.durationSeconds)}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {formatDateTime(item.finishedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.submitStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-white/10 bg-white/5 px-5 py-3 text-xs text-slate-400">
              Hiển thị{" "}
              <span className="font-semibold text-slate-200">
                {results.length}
              </span>{" "}
              kết quả
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
