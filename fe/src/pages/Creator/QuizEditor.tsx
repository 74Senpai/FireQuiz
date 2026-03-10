import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Settings, Users, Calendar, Share2, ShieldAlert } from "lucide-react";

export function QuizEditor() {
  const [activeTab, setActiveTab] = useState("settings");

  // controlled form data for settings/schedule
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [gradeScale, setGradeScale] = useState("10");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  // store validation errors per field
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  /**
   * validate settings tab fields
   * comments: title is required, time limit must be positive integer
   */
  const validateSettings = () => {
    const errs: { [key: string]: string } = {};
    if (!title.trim()) {
      errs.title = "Tiêu đề Quiz là bắt buộc";
    }
    if (timeLimit && Number(timeLimit) < 1) {
      errs.timeLimit = "Time limit phải lớn hơn hoặc bằng 1";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * validate schedule tab fields
   * openTime must come before closeTime if both set
   */
  const validateSchedule = () => {
    const errs: { [key: string]: string } = {};
    if (openTime && closeTime) {
      if (new Date(openTime) >= new Date(closeTime)) {
        errs.schedule = "Thời gian mở phải trước thời gian đóng";
      }
    }
    if (maxParticipants && Number(maxParticipants) < 1) {
      errs.maxParticipants = "Số lượng phải lớn hơn 0";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = () => {
    // draft save does not require full validation, but we still check settings
    if (validateSettings()) {
      console.log("Đã lưu nháp");
    }
  };

  const handlePublish = () => {
    // run both validations before publishing
    const okSettings = validateSettings();
    const okSchedule = validateSchedule();
    if (okSettings && okSchedule) {
      console.log("Đang xuất bản quiz...");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Tạo Quiz Mới</h2>
          <p className="text-slate-400 mt-1">Cấu hình, thêm câu hỏi và xuất bản.</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleSaveDraft}
            variant="outline"
            className="border-slate-400/50 text-slate-100 hover:bg-white/10"
          >
            Lưu nháp
          </Button>
          <Button
            onClick={handlePublish}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
          >
            Xuất bản Quiz
          </Button>
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
            <Settings className="w-5 h-5" /> Cài đặt
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ease-out ${
              activeTab === "questions" 
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30" 
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-5 h-5" /> Câu hỏi
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ease-out ${
              activeTab === "schedule" 
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30" 
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Calendar className="w-5 h-5" /> Lập lịch
          </button>
        </div>

        {/* Main Content Area */}
        <div className="col-span-9 space-y-6 animate-slide-up animate-delay-100">
          {activeTab === "settings" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-100">Cài đặt chung</CardTitle>
                <CardDescription className="text-slate-400">Thông tin cơ bản và quy tắc chấm điểm.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tiêu đề Quiz</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.currentTarget.value)}
                    placeholder="Ví dụ: Thi giữa kỳ - Toán 101"
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mô tả</label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    placeholder="Hướng dẫn cho sinh viên..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" /> Thời gian làm (phút)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="60"
                      value={timeLimit}
                      onChange={e => setTimeLimit(e.currentTarget.value)}
                    />
                    {errors.timeLimit && <p className="text-sm text-red-500 mt-1">{errors.timeLimit}</p>}
                    <p className="text-xs text-slate-500">Hệ thống sẽ tự động nộp khi hết giờ.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thang điểm</label>
                    <select
                      value={gradeScale}
                      onChange={e => setGradeScale(e.currentTarget.value)}
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <option value="10">Thang 10 điểm</option>
                      <option value="100">Thang 100 điểm</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "questions" && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-slate-100">Câu hỏi & Phòng chống gian lận</CardTitle>
                <CardDescription className="text-slate-400">Quản lý câu hỏi và ngẫu nhiên hóa để tránh gian lận.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-indigo-900">Chế độ ngân hàng câu hỏi</h4>
                      <p className="text-sm text-indigo-700">Lấy ngẫu nhiên câu hỏi cho mỗi học sinh.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-indigo-100">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Câu hỏi dễ</label>
                      <Input type="number" defaultValue="5" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Câu hỏi trung bình</label>
                      <Input type="number" defaultValue="3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Câu hỏi khó</label>
                      <Input type="number" defaultValue="2" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Câu hỏi đã chọn (10)</h4>
                    <Button variant="outline" size="sm">Thêm từ ngân hàng</Button>
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
                <CardTitle>Lịch & Quyền truy cập</CardTitle>
                <CardDescription>Điều khiển thời gian và người có thể tham gia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" /> Thời gian mở
                    </label>
                    <Input
                      type="datetime-local"
                      value={openTime}
                      onChange={e => setOpenTime(e.currentTarget.value)}
                    />
                    <p className="text-xs text-slate-500">Quiz sẽ tự động xuất bản vào thời điểm này.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" /> Thời gian đóng
                    </label>
                    <Input
                      type="datetime-local"
                      value={closeTime}
                      onChange={e => setCloseTime(e.currentTarget.value)}
                    />
                    {errors.schedule && <p className="text-sm text-red-500 mt-1">{errors.schedule}</p>}
                    <p className="text-xs text-slate-500">Quiz sẽ tự động đóng vào thời điểm này.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" /> Số người tối đa
                  </label>
                  <Input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    className="max-w-xs"
                    value={maxParticipants}
                    onChange={e => setMaxParticipants(e.currentTarget.value)}
                  />
                  {errors.maxParticipants && <p className="text-sm text-red-500 mt-1">{errors.maxParticipants}</p>}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-slate-500" /> Chia sẻ bằng mã
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
