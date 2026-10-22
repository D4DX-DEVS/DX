import { cn } from "cn"

/** Shimmering placeholder at the exact size of the content it stands in for. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn("shimmer rounded-md", className)} {...props} />
}

export { Skeleton }
