import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-xl border-2 border-input bg-background px-4 py-1 text-[15px] font-semibold text-foreground transition-colors outline-none",
        "placeholder:font-medium placeholder:text-label selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold",
        "focus-visible:border-link disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
