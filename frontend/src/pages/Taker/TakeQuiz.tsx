import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

export function TakeQuiz() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(3600); // 60 phút tính bằng giây
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Định dạng thời gian
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = () => {
    // Logic tự động nộp bài ở đây
    navigate("/dashboard/history");
  };

  const questions = [
    {
      id: 1,
      text: "Chức năng chính của một component React là gì?",
      options: [
        "Để tạo giao diện người dùng",
        "Để quản lý kết nối cơ sở dữ liệu",
        "Để trả về các phần tử giao diện dựa trên state và props",
        "Để xử lý yêu cầu HTTP"
      ]
    },
    {
      id: 2,
      text: "Hook nào dùng để quản lý side effects trong React?",
      options: [
        "useState",
        "useEffect",
        "useContext",
        "useReducer"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Tiêu đề / Đồng hồ đếm ngược */}
      <div className="sticky top-0 z-10 bg-white/10 backdrop-blur-md border-b border-white/20 pb-4 pt-2 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Kiểm tra giữa kỳ - Toán 101</h2>
          <p className="text-sm text-slate-400 mt-1">Câu hỏi {currentQuestion + 1} trong {questions.length}</p>
        </div>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-lg font-mono text-lg font-bold border transition-all duration-300 shadow-lg ${timeLeft < 300
            ? 'bg-red-500/30 text-red-200 border-red-400/50 animate-pulse'
            : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
          }`}>
          <Clock className="w-5 h-5" />
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Nội dung câu hỏi */}
      <Card className="border-indigo-400/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl shadow-2xl hover:shadow-indigo-500/30 animate-slide-up">
        <CardContent className="p-8 space-y-8">
          <h3 className="text-2xl font-semibold text-slate-100 leading-relaxed">
            {questions[currentQuestion].text}
          </h3>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((opt, i) => (
              <label key={i} className="flex items-center gap-4 p-4 rounded-lg border border-white/20 hover:border-indigo-400/60 bg-white/5 hover:bg-indigo-400/20 cursor-pointer transition-all duration-300 has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-500/30 group">
                <input type="radio" name={`q${currentQuestion}`} className="w-5 h-5 text-indigo-400 border-white/30 focus:ring-indigo-400" />
                <span className="text-slate-100 font-medium group-hover:text-slate-50 transition-colors duration-300">{opt}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Điều hướng */}
      <div className="flex items-center justify-between pt-4 animate-slide-up animate-delay-100">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(p => p - 1)}
          className="border-slate-400/50 text-slate-100 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Trước
        </Button>
        {currentQuestion === questions.length - 1 ? (
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 gap-2 shadow-lg">
            <AlertTriangle className="w-4 h-4" /> Nộp bài
          </Button>
        ) : (
          <Button onClick={() => setCurrentQuestion(p => p + 1)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
            Câu tiếp theo
          </Button>
        )}
      </div>
    </div>
  );
}
