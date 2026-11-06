import * as React from "react"

import { cn } from "@/lib/utils"

/** Small uppercase eyebrow followed by a hairline (store sections and admin). */
function SectionLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[11px] font-extrabold tracking-[2px] text-label uppercase after:h-px after:min-w-6 after:flex-1 after:bg-border",
        className
      )}
      {...props}
    />
  )
}

export { SectionLabel }
