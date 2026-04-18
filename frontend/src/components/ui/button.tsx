import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5",
          {
            "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95": variant === "default",
            "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-500 hover:to-pink-500 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 active:scale-95": variant === "destructive",
            "border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800 hover:border-slate-600 active:scale-95": variant === "outline",
            "bg-slate-800 text-slate-100 hover:bg-slate-700 hover:shadow-md active:scale-95": variant === "secondary",
            "text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95": variant === "ghost",
            "text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300 active:scale-95": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-lg px-3": size === "sm",
            "h-11 rounded-lg px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">{props.children}</span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
