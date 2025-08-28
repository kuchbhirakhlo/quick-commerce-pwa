import * as React from "react"

import { cn } from "@/lib/utils"

const VisuallyHidden = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden clip-rect-0 border-0 whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

export { VisuallyHidden } 