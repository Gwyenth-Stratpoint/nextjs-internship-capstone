"use client"

import type { KeyboardEvent, ReactNode } from "react"

type CardSurfaceProps = {
  children: ReactNode
  isInteractive?: boolean
  onClick?: () => void
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
  className?: string
  role?: string
  tabIndex?: number
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function CardSurface({
  children,
  isInteractive = false,
  onClick,
  onKeyDown,
  className,
  role,
  tabIndex,
}: CardSurfaceProps) {
  return (
    <article
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={joinClasses(
        "rounded-lg border border-border bg-background p-4 shadow-sm",
        isInteractive && "cursor-pointer transition-colors hover:bg-muted/40 hover:shadow-md",
        className,
      )}
    >
      {children}
    </article>
  )
}

export function CardHeader({
  title,
  description,
  badge,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  badge?: ReactNode
  className?: string
}) {
  return (
    <div className={joinClasses("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground">{title}</div>
        {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  )
}

export function CardMetaRow({
  left,
  right,
  className,
}: {
  left?: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={joinClasses("mt-3 flex items-center justify-between gap-3 text-xs", className)}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  )
}

export function CardBadge({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return <span className={joinClasses("rounded-full px-2 py-1 text-xs font-medium", className)}>{children}</span>
}
