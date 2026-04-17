import React, { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  FileImage, 
  FileVideo, 
  FileAudio, 
  Download, 
  ArrowLeft,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMediaViewUrl } from "@/services/mediaServices";

export function MediaViewer() {
  const [searchParams] = useSearchParams();
  const path = searchParams.get("path");
  const bucket = searchParams.get("bucket");

  const mediaSrc = getMediaViewUrl(path, bucket);

  const mediaType = useMemo(() => {
    if (!path) return null;
    const lower = path.toLowerCase();
    if (lower.match(/\.(jpeg|jpg|gif|png|webp|svg)/i)) return 'image';
    if (lower.match(/\.(mp4|webm|ogg|mov)/i)) return 'video';
    if (lower.match(/\.(mp3|wav|ogg|m4a)/i)) return 'audio';
    return 'unknown';
  }, [path]);

  if (!path) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-500/20 bg-red-500/5 backdrop-blur-xl">
          <CardContent className="pt-10 pb-8 text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Lỗi truy cập</h2>
            <p className="text-slate-400">Không tìm thấy đường dẫn tệp tin. Vui lòng quét lại mã QR chính xác.</p>
            <Button asChild className="mt-4 bg-slate-800 hover:bg-slate-700">
              <Link to="/explore">Về trang khám phá</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xl leading-none">F</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FireQuiz</span>
          </Link>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <span className="text-sm font-medium text-slate-500 hidden sm:block">Media Viewer</span>
        </div>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" asChild>
             <a href={mediaSrc} target="_blank" rel="noopener noreferrer" className="gap-2">
               <ExternalLink className="w-4 h-4" /> Mở tab mới
             </a>
           </Button>
           <Button className="bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20" size="sm" asChild>
             <a href={mediaSrc} download className="gap-2">
                <Download className="w-4 h-4" /> Tải xuống
             </a>
           </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-5xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                {mediaType === 'image' && <FileImage className="text-indigo-400" />}
                {mediaType === 'video' && <FileVideo className="text-red-400" />}
                {mediaType === 'audio' && <FileAudio className="text-emerald-400" />}
                Chi tiết nội dung Media
              </h1>
              <p className="text-sm text-slate-500 font-mono break-all opacity-60">
                UUID: {path.split('/').pop()}
              </p>
            </div>
          </div>

          <div className="relative group transition-all duration-500">
            {/* Glossy Backdrop */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-[#1E293B]/50 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center min-h-[300px] sm:min-h-[500px]">
              {mediaType === 'image' && (
                <img 
                  src={mediaSrc} 
                  alt="Media content"
                  className="max-w-full max-h-[80vh] object-contain animate-fade-in"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/600x400/1e293b/white?text=Không+thể+tải+ảnh';
                  }}
                />
              )}

              {mediaType === 'video' && (
                <video 
                  src={mediaSrc} 
                  controls 
                  autoPlay
                  className="w-full max-h-[80vh] bg-black"
                />
              )}

              {mediaType === 'audio' && (
                <div className="flex flex-col items-center gap-10 p-12 w-full">
                   <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 animate-ping rounded-full opacity-20" />
                      <div className="relative bg-indigo-600 p-8 rounded-full shadow-2xl">
                        <FileAudio className="w-16 h-16 text-white" />
                      </div>
                   </div>
                   <div className="w-full max-w-md">
                      <audio src={mediaSrc} controls className="w-full" />
                   </div>
                </div>
              )}

              {mediaType === 'unknown' && (
                <div className="p-20 text-center space-y-6">
                  <div className="bg-slate-800/50 p-6 rounded-full inline-block">
                    <AlertCircle className="w-12 h-12 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-white">Định dạng không xác định</p>
                    <p className="text-slate-400 max-w-xs mx-auto">Trình xem không thể nhận diện loại tệp này. Bạn có thể thử tải xuống để xem trên thiết bị.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
             <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500">
               © 2026 FireQuiz Platform • Secure Media Delivery
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}
