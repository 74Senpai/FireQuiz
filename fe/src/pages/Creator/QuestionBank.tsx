import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Download, Search, Filter } from "lucide-react";

export function QuestionBank() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Ngân hàng câu hỏi</h2>
          <p className="text-slate-400 mt-1">Quản lý tất cả câu hỏi theo môn học.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-400/50 text-slate-100 hover:bg-white/10">
            <Download className="w-4 h-4" /> Tải mẫu
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
            <Upload className="w-4 h-4" /> Nhập Excel
          </Button>
        </div>
      </div>

      <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9 bg-white/10 text-slate-100 placeholder:text-slate-400" placeholder="Tìm kiếm câu hỏi..." />
            </div>
            <Button variant="outline" className="gap-2 border-slate-400/50 text-slate-100 hover:bg-white/10">
              <Filter className="w-4 h-4" /> Lọc
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/20 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 font-medium">Câu hỏi</th>
                  <th className="px-6 py-3 font-medium">Môn</th>
                  <th className="px-6 py-3 font-medium">Độ khó</th>
                  <th className="px-6 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  { q: "Đạo hàm của x^2 là gì?", s: "Toán", d: "Dễ" },
                  { q: "Giải thích thuyết tương đối.", s: "Vật lý", d: "Khó" },
                  { q: "Ai là tác giả của Romeo và Juliet?", s: "Văn học", d: "Trung bình" },
                ].map((item, i) => (
                  <tr key={i} className="bg-white/5 hover:bg-white/10 transition-colors duration-300">
                    <td className="px-6 py-4 font-medium text-slate-100">{item.q}</td>
                    <td className="px-6 py-4 text-slate-400">{item.s}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                        item.d === 'Easy' ? 'bg-emerald-500/30 text-emerald-200' :
                        item.d === 'Medium' ? 'bg-amber-500/30 text-amber-200' :
                        'bg-red-500/30 text-red-200'
                      }`}>
                        {item.d}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Chỉnh sửa</Button>
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
