import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Settings, Users, Calendar, Share2, ShieldAlert } from "lucide-react";

export function QuizEditor() {
  const [activeTab, setActiveTab] = useState("settings");

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Create New Quiz</h2>
          <p className="text-slate-400 mt-1">Configure settings, add questions, and publish.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-400/50 text-slate-100 hover:bg-white/10">Save Draft</Button>
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">Publish Quiz</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <div className="col-span-3 space-y-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ease-out ${
              activeTab === "settings" 
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30" 
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Settings className="w-5 h-5" /> Settings
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ease-out ${
              activeTab === "questions" 
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30" 
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-5 h-5" /> Questions
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ease-out ${
              activeTab === "schedule" 
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30" 
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Calendar className="w-5 h-5" /> Schedule
          </button>
        </div>

        {/* Main Content Area */}
        <div className="col-span-9 space-y-6 animate-slide-up animate-delay-100">
          {activeTab === "settings" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-100">General Settings</CardTitle>
                <CardDescription className="text-slate-400">Basic information and grading rules.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quiz Title</label>
                  <Input placeholder="e.g., Midterm Exam - Math 101" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    placeholder="Instructions for the students..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" /> Time Limit (minutes)
                    </label>
                    <Input type="number" min="1" placeholder="60" />
                    <p className="text-xs text-slate-500">System will auto-submit when time is up.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Grading Scale</label>
                    <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                      <option value="10">10 Point Scale</option>
                      <option value="100">100 Point Scale</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "questions" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-100">Questions & Anti-Cheat</CardTitle>
                <CardDescription className="text-slate-400">Manage questions and randomize to prevent cheating.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-indigo-900">Question Bank Mode</h4>
                      <p className="text-sm text-indigo-700">Pull random questions from the bank for each student.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-indigo-100">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Easy Questions</label>
                      <Input type="number" defaultValue="5" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Medium Questions</label>
                      <Input type="number" defaultValue="3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hard Questions</label>
                      <Input type="number" defaultValue="2" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Selected Questions (10)</h4>
                    <Button variant="outline" size="sm">Add from Bank</Button>
                  </div>
                  {/* Mock question list */}
                  <div className="border border-slate-200 rounded-md divide-y divide-slate-200">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 text-sm flex justify-between items-center">
                        <span className="truncate">What is the capital of France?</span>
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600">Easy</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "schedule" && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule & Access</CardTitle>
                <CardDescription>Control when and who can access this quiz.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" /> Open Time
                    </label>
                    <Input type="datetime-local" />
                    <p className="text-xs text-slate-500">Quiz will auto-publish at this time.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" /> Close Time
                    </label>
                    <Input type="datetime-local" />
                    <p className="text-xs text-slate-500">Quiz will auto-close at this time.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" /> Max Participants
                  </label>
                  <Input type="number" placeholder="Leave empty for unlimited" className="max-w-xs" />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-slate-500" /> Share via Code
                      </h4>
                      <p className="text-sm text-slate-500">Allow students to join using a unique code.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <Input value="MATH101-2026" readOnly className="font-mono bg-slate-50" />
                    <Button variant="secondary">Copy</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
