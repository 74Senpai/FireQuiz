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
import { Download, Search, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as quizService from "@/services/quizServices";

export function Results() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");

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
              navigate(`/dashboard/leaderboard?quizId=${selectedQuizId}`)
            }
            className="gap-2 border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
          >
            Xem bang xep hang
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
            <FileSpreadsheet className="h-4 w-4" /> Xuat tat ca ra Excel
          </Button>
        </div>
      </div>

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
    </div>
  );
}
