"use client"

import { useEffect, useState } from "react"
import { CalendarDays, FolderOpen, Shield, Users } from "lucide-react"
import { z } from "zod"

import { projectSchema } from "@/lib/validations"
import {
  CenteredModalSurface,
  ModalBackdrop,
  ModalField,
  ModalFooter,
  ModalHeader,
  ModalInputShell,
} from "@/components/modals/modal-primitives"

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
    <ModalBackdrop onClose={onClose}>
      <CenteredModalSurface>
        <ModalHeader title="Create a new project" onClose={onClose} />

        <form onSubmit={handleSubmit} className="space-y-3.5 px-4 py-3.5">
          <ModalField label="Project name*">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Blog CMS"
            />
          </ModalField>

          <ModalField label="Project template*">
            <ModalInputShell icon={<FolderOpen size={18} />}>
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
            </ModalInputShell>
          </ModalField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModalField label="Due date">
              <ModalInputShell icon={<CalendarDays size={18} />}>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </ModalInputShell>
            </ModalField>

            <ModalField label="Privacy">
              <ModalInputShell icon={<Shield size={18} />}>
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
              </ModalInputShell>
            </ModalField>
          </div>

          <ModalField label="Description">
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Leave any project notes here (optional)..."
            />
          </ModalField>

          <ModalField label="Team assignment">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
              <Users size={18} className="text-slate-400" />
              Team member assignment will be added when project membership UI is ready.
            </div>
          </ModalField>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <ModalFooter
            hint="Privacy settings will hook into permissions later."
            submitLabel={isSubmitting ? "Creating..." : "Create project"}
            isSubmitting={isSubmitting}
            onClose={onClose}
          />
        </form>
      </CenteredModalSurface>
    </ModalBackdrop>
  )
}
