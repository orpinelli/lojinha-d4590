import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** Tags (square-ish) and pills for the whole app: tinted, bold, uppercase. */
const badgeVariants = cva(
  "inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1 overflow-hidden font-extrabold tracking-[0.5px] whitespace-nowrap uppercase [&>svg]:pointer-events-none [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        info: "bg-link/12 text-link",
        secondary: "bg-muted text-muted-foreground",
        outline: "border-2 border-border text-label",
        destructive: "bg-destructive/12 text-destructive",
        solid: "bg-primary text-primary-foreground",
      },
      shape: {
        tag: "rounded-md px-2 py-[3px] text-[11px]",
        pill: "rounded-full px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "tag",
    },
  }
)

function Badge({
  className,
  variant,
  shape,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, shape }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
