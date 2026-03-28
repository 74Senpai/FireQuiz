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
            "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95": variant === "default",
            "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/30 hover:shadow-red-500/50": variant === "destructive",
            "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md active:scale-95": variant === "outline",
            "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 hover:from-slate-400 hover:to-slate-500 hover:shadow-md active:scale-95": variant === "secondary",
            "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95": variant === "ghost",
            "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700 active:scale-95": variant === "link",
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
        {variant === "default" && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform translate-x-full group-hover:translate-x-0 transition-all duration-500"></span>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
