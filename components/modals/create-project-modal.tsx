"use client"

import { useEffect, useState } from "react"
import { CalendarDays, FolderOpen, Shield, Users, X } from "lucide-react"
import { z } from "zod"

import { projectSchema } from "@/lib/validations"

const createProjectFormSchema = projectSchema
  .omit({ workspaceId: true, key: true })
  .extend({
    dueDate: z.string().optional(),
    template: z.enum(["simple", "software"]).default("simple"),
    privacy: z.enum(["workspace", "private"]).default("workspace"),
  })

type CreateProjectDraft = {
  name: string
  description: string
  dueDate: string
  template: "simple" | "software"
  privacy: "workspace" | "private"
}

type CreateProjectModalProps = {
  isOpen: boolean
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (input: {
    name: string
    description?: string | null
    dueDate?: string | null
    template?: "simple" | "software"
  }) => Promise<void>
}

const emptyProject: CreateProjectDraft = {
  name: "",
  description: "",
  dueDate: "",
  template: "simple",
  privacy: "workspace",
}

export function CreateProjectModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CreateProjectModalProps) {
  const [form, setForm] = useState<CreateProjectDraft>(emptyProject)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setForm(emptyProject)
    setError(null)
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = createProjectFormSchema.safeParse(form)

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid project details")
      return
    }

    try {
      setError(null)
      await onSubmit({
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        dueDate: parsed.data.dueDate || null,
        template: parsed.data.template,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[28rem] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_20px_56px_rgba(15,23,42,0.14)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3.5">
          <div>
            <h3 className="mt-2 text-[22px] font-semibold leading-none text-slate-900">Create a new project</h3>
           
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 px-4 py-3.5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Project name*</label>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Blog CMS"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Project template*</label>
            <div className="relative">
              <FolderOpen
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={form.template}
                onChange={(event) =>
                  setForm((current) => ({ ...current, template: event.target.value as "simple" | "software" }))
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="simple">Simple board</option>
                <option value="software">Software workflow</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Due date</label>
              <div className="relative">
                <CalendarDays
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Privacy</label>
              <div className="relative">
                <Shield
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={form.privacy}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, privacy: event.target.value as "workspace" | "private" }))
                  }
                  disabled
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-400 outline-none"
                >
                  <option value="workspace">Workspace members</option>
                  <option value="private">Private project</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Leave any project notes here (optional)..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Team assignment</label>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
              <Users size={18} className="text-slate-400" />
              Team member assignment will be added when project membership UI is ready.
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
            <p className="max-w-[180px] text-xs text-slate-500">Privacy settings will hook into permissions later.</p>
            <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create project"}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
