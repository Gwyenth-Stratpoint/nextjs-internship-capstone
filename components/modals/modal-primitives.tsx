"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"

type ModalSurfaceProps = {
  children: ReactNode
  className?: string
}

type ModalHeaderProps = {
  title: string
  description?: string
  eyebrow?: ReactNode
  actions?: ReactNode
  onClose: () => void
  className?: string
}

type ModalFooterProps = {
  hint?: ReactNode
  cancelLabel?: string
  submitLabel: string
  isSubmitting?: boolean
  onClose: () => void
  className?: string
}

type ModalFieldProps = {
  label: string
  children: ReactNode
  className?: string
}

type ModalDetailRowProps = {
  icon: ReactNode
  label: string
  children: ReactNode
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function ModalBackdrop({
  children,
  onClose,
  variant = "center",
}: {
  children: ReactNode
  onClose: () => void
  variant?: "center" | "sheet"
}) {
  if (variant === "sheet") {
    return (
      <div className="fixed inset-0 z-50 bg-black/35">
        <button
          type="button"
          aria-label="Close modal"
          className="absolute inset-0 h-full w-full cursor-default"
          onClick={onClose}
        />
        {children}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {children}
    </div>
  )
}

export function CenteredModalSurface({ children, className }: ModalSurfaceProps) {
  return (
    <div
      className={joinClasses(
        "w-full max-w-[28rem] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_20px_56px_rgba(15,23,42,0.14)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SideSheetSurface({ children, className }: ModalSurfaceProps) {
  return (
    <div
      className={joinClasses(
        "absolute inset-y-0 right-0 w-full max-w-[42rem] overflow-hidden border-l border-slate-200 bg-white shadow-[-24px_0_64px_rgba(15,23,42,0.18)]",
        className,
      )}
    >
      <div className="flex h-full flex-col">{children}</div>
    </div>
  )
}

export function ModalHeader({ title, description, eyebrow, actions, onClose, className }: ModalHeaderProps) {
  return (
    <div className={joinClasses("flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3.5", className)}>
      <div>
        {eyebrow ? eyebrow : null}
        <div className="mt-1.5 flex items-center gap-2">
          <h3 className="text-[22px] font-semibold leading-none text-slate-900">{title}</h3>
        </div>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {actions ? actions : null}
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export function ModalFooter({
  hint,
  cancelLabel = "Cancel",
  submitLabel,
  isSubmitting = false,
  onClose,
  className,
}: ModalFooterProps) {
  return (
    <div className={joinClasses("flex items-center justify-between border-t border-slate-200 pt-2.5", className)}>
      <div className="max-w-[240px] text-xs text-slate-500">{hint}</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

export function ModalField({ label, children, className }: ModalFieldProps) {
  return (
    <div className={joinClasses("space-y-2", className)}>
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  )
}

export function ModalInputShell({
  icon,
  children,
  className,
}: {
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={joinClasses("relative", className)}>
      {icon ? <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div> : null}
      {children}
    </div>
  )
}

export function ModalDetailRow({ icon, label, children }: ModalDetailRowProps) {
  return (
    <>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="text-slate-400">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </>
  )
}
