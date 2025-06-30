import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-xl border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105",
        destructive:
          "border-transparent bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105",
        outline: "text-foreground border-border hover:bg-accent hover:scale-105",
        success:
          "border-transparent bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25 hover:shadow-lg hover:shadow-green-500/30 hover:scale-105",
        warning:
          "border-transparent bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-yellow-500/25 hover:shadow-lg hover:shadow-yellow-500/30 hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
