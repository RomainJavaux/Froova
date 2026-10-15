import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground flex h-12 w-full min-w-0 rounded-2xl border bg-card/80 px-4 py-2 text-base shadow-[inset_0_1px_2px_rgb(15_23_42/0.04)] transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]",
        "focus-visible:border-ring focus-visible:ring-ring/25 focus-visible:ring-4",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/70 flex min-h-24 w-full rounded-2xl border bg-card/80 px-4 py-3 text-base shadow-[inset_0_1px_2px_rgb(15_23_42/0.04)] transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]",
        "focus-visible:border-ring focus-visible:ring-ring/25 focus-visible:ring-4",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input, Textarea }
