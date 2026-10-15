import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-[color,background-color,box-shadow,transform,opacity] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/40 focus-visible:ring-4 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,oklch(0.66_0.17_245),var(--primary))] text-primary-foreground shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--primary)_70%,transparent)] hover:shadow-[0_14px_34px_-12px_color-mix(in_oklab,var(--primary)_85%,transparent)] hover:brightness-[1.06]",
        warm:
          "bg-[linear-gradient(135deg,oklch(0.78_0.15_60),var(--warm))] text-warm-foreground shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--warm)_80%,transparent)] hover:brightness-[1.05]",
        destructive:
          "bg-destructive text-white shadow-[0_10px_30px_-14px_var(--destructive)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-card/70 backdrop-blur shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        sm: "h-9 rounded-xl px-3.5 has-[>svg]:px-3 text-[13px]",
        lg: "h-13 px-7 text-base has-[>svg]:px-6",
        icon: "size-11",
        "icon-sm": "size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
