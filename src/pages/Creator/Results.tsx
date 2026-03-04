import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Results() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quiz Results</h2>
          <p className="text-slate-500">View and export student performance data.</p>
        </div>
        <Button className="gap-2">
          <FileSpreadsheet className="w-4 h-4" /> Export All to Excel
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex gap-4">
            <select className="flex h-10 w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <option>Midterm Exam - Math 101</option>
              <option>Final Exam - Physics</option>
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search student name or ID..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Student Name</th>
                  <th className="px-6 py-3 font-medium">Student ID</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Time Taken</th>
                  <th className="px-6 py-3 font-medium">Correct/Incorrect</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  { n: "Alice Smith", id: "STU001", s: "9.5/10", t: "45m 12s", c: "38/2" },
                  { n: "Bob Jones", id: "STU002", s: "7.0/10", t: "59m 30s", c: "28/12" },
                  { n: "Charlie Brown", id: "STU003", s: "8.5/10", t: "50m 00s", c: "34/6" },
                ].map((item, i) => (
                  <tr key={i} className="bg-white hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.n}</td>
                    <td className="px-6 py-4 text-slate-500">{item.id}</td>
                    <td className="px-6 py-4 font-semibold text-indigo-600">{item.s}</td>
                    <td className="px-6 py-4 text-slate-500">{item.t}</td>
                    <td className="px-6 py-4 text-slate-500">{item.c}</td>
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
