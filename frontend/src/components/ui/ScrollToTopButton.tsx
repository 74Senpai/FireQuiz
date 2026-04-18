import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById("main-scroll-area");
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Show button if scrolled down 300px
      if (scrollContainer.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    
    // Check initial position in case of HMR or direct navigation
    handleScroll();

    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.getElementById("main-scroll-area");
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-24 sm:bottom-32 right-6 sm:right-10 z-50 w-12 h-12 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 pointer-events-auto",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}
      aria-label="Cuộn lên đầu trang"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  );
}
