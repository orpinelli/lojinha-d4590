import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * One button for the whole app (store and admin): chunky 3D look — a solid
 * bottom shadow that "presses" on click. Colors follow the admin theme.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 text-center leading-tight font-bold tracking-[0.5px] uppercase select-none",
    "transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-100",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-link/40",
    "active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-shadow)] hover:bg-primary-hover",
        secondary:
          "border-2 border-stroke bg-background text-link shadow-[0_4px_0_var(--stroke)] hover:bg-muted",
        outline:
          "border-2 border-stroke bg-background text-foreground shadow-[0_4px_0_var(--stroke)] hover:bg-muted",
        destructive:
          "bg-destructive text-white shadow-[0_4px_0_var(--destructive-shadow)] hover:bg-destructive/90",
        light: "bg-white text-night shadow-[0_4px_0_#88879f] hover:bg-[#f1f1f6]",
        ghost: "text-primary shadow-none hover:bg-primary/10 active:translate-y-0",
        link: "text-primary underline-offset-4 shadow-none hover:underline active:translate-y-0",
      },
      size: {
        default: "min-h-11 rounded-xl px-5 py-2 text-sm",
        lg: "min-h-12 rounded-xl px-6 py-2 text-[15px]",
        sm: "min-h-9 rounded-[10px] px-4 py-1.5 text-[13px]",
        icon: "size-10 rounded-xl p-0",
      },
      block: { true: "w-full", false: "" },
    },
    compoundVariants: [
      {
        variant: "default",
        size: ["sm", "icon"],
        class: "shadow-[0_3px_0_var(--primary-shadow)] active:translate-y-[3px]",
      },
      {
        variant: ["secondary", "outline"],
        size: ["sm", "icon"],
        class: "shadow-[0_3px_0_var(--stroke)] active:translate-y-[3px]",
      },
      {
        variant: "destructive",
        size: ["sm", "icon"],
        class: "shadow-[0_3px_0_var(--destructive-shadow)] active:translate-y-[3px]",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      block: false,
    },
  }
)

function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
