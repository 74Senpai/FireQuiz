import { useDialogStore } from "@/stores/dialogStore";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalDialog() {
  const { isOpen, options, closeDialog } = useDialogStore();

  if (!isOpen || !options) return null;

  const handleConfirm = () => {
    options.onConfirm?.();
    closeDialog();
  };

  const handleCancel = () => {
    options.onCancel?.();
    closeDialog();
  };

  const isConfirm = options.type === 'confirm';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={handleCancel} 
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-2xl flex-shrink-0 border", 
              isConfirm ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            )}>
              {isConfirm ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-white mb-2 pr-6">{options.title}</h3>
              {options.description && (
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  {options.description}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions Footer */}
        <div className="p-4 bg-white/5 flex justify-end gap-3 border-t border-white/10">
          {isConfirm && (
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              className="border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-bold"
            >
              {options.cancelText}
            </Button>
          )}
          <Button 
            onClick={handleConfirm} 
            className={cn(
              "font-bold text-white shadow-lg",
              isConfirm 
                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20" 
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/20"
            )}
          >
            {options.confirmText}
          </Button>
        </div>
        
        {/* Close Button Cross */}
        <button 
          onClick={handleCancel} 
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
