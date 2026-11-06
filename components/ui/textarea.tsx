import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-[15px] font-semibold text-foreground transition-colors outline-none",
        "placeholder:font-medium placeholder:text-label",
        "focus-visible:border-link disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
