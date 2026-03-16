"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

type ListDraft = {
  name: string
}

type CreateListModalProps = {
  isOpen: boolean
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (input: ListDraft) => Promise<void>
}

const emptyList: ListDraft = {
  name: "",
}

export function CreateListModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CreateListModalProps) {
  const [form, setForm] = useState<ListDraft>(emptyList)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setForm(emptyList)
    setError(null)
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim()) {
      setError("List name is required")
      return
    }

    try {
      setError(null)
      await onSubmit({
        name: form.name.trim(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create list")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Create list</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a new column to organize tasks on this board.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">List name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder="Review"
            />
          </div>

          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            New lists are added as middle workflow stages. The project keeps its premade start and end lists.
          </p>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create list"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
