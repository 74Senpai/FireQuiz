import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Results() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Quiz Results</h2>
          <p className="text-slate-400 mt-1">View and export student performance data.</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
          <FileSpreadsheet className="w-4 h-4" /> Export All to Excel
        </Button>
      </div>

      <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex gap-4">
            <select className="flex h-10 w-64 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <option>Midterm Exam - Math 101</option>
              <option>Final Exam - Physics</option>
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9 bg-white/10 text-slate-100 placeholder:text-slate-400" placeholder="Search student name or ID..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/20 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 font-medium">Student Name</th>
                  <th className="px-6 py-3 font-medium">Student ID</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Time Taken</th>
                  <th className="px-6 py-3 font-medium">Correct/Incorrect</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  { n: "Alice Smith", id: "STU001", s: "9.5/10", t: "45m 12s", c: "38/2" },
                  { n: "Bob Jones", id: "STU002", s: "7.0/10", t: "59m 30s", c: "28/12" },
                  { n: "Charlie Brown", id: "STU003", s: "8.5/10", t: "50m 00s", c: "34/6" },
                ].map((item, i) => (
                  <tr key={i} className="bg-white/5 hover:bg-white/10 transition-colors duration-300">
                    <td className="px-6 py-4 font-medium text-slate-100">{item.n}</td>
                    <td className="px-6 py-4 text-slate-400">{item.id}</td>
                    <td className="px-6 py-4 font-bold text-purple-300">{item.s}</td>
                    <td className="px-6 py-4 text-slate-400">{item.t}</td>
                    <td className="px-6 py-4 text-slate-400">{item.c}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="w-4 h-4" /> Excel
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
