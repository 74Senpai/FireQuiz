import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

export function TakeQuiz() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(3600); // 60 mins in seconds
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Format time
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
    // Auto-submit logic here
    navigate("/dashboard/quiz/1/review");
  };

  const questions = [
    {
      id: 1,
      text: "What is the primary function of a React component?",
      options: [
        "To style the application",
        "To manage database connections",
        "To return UI elements based on state and props",
        "To handle HTTP requests"
      ]
    },
    {
      id: 2,
      text: "Which hook is used to manage side effects in React?",
      options: [
        "useState",
        "useEffect",
        "useContext",
        "useReducer"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header / Timer */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 pb-4 pt-2 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Midterm Exam - Math 101</h2>
          <p className="text-sm text-slate-500">Question {currentQuestion + 1} of {questions.length}</p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full font-mono text-lg font-bold border ${
          timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'
        }`}>
          <Clock className="w-5 h-5" />
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Question Content */}
      <Card className="border-indigo-100 shadow-md">
        <CardContent className="p-8 space-y-8">
          <h3 className="text-xl font-medium text-slate-900 leading-relaxed">
            {questions[currentQuestion].text}
          </h3>
          
          <div className="space-y-3">
            {questions[currentQuestion].options.map((opt, i) => (
              <label key={i} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                <input type="radio" name={`q${currentQuestion}`} className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-600" />
                <span className="text-slate-700 font-medium">{opt}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button 
          variant="outline" 
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(p => p - 1)}
        >
          Previous
        </Button>
        
        {currentQuestion === questions.length - 1 ? (
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <AlertTriangle className="w-4 h-4" /> Submit Quiz
          </Button>
        ) : (
          <Button onClick={() => setCurrentQuestion(p => p + 1)}>
            Next Question
          </Button>
        )}
      </div>
    </div>
  );
}
