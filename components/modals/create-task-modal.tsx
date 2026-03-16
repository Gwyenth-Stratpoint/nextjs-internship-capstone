"use client"

import type { ChangeEvent, Dispatch, FormEvent, ReactNode, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import { CalendarDays, CircleDashed, Flag, Layers3, MessageSquareText, Paperclip, Tag, UserRound } from "lucide-react"
import { z } from "zod"

import {
  ModalBackdrop,
  CenteredModalSurface,
  ModalDetailRow,
  ModalFooter,
  ModalField,
  ModalHeader,
  ModalInputShell,
  SideSheetSurface,
} from "@/components/modals/modal-primitives"
import { taskSchema } from "@/lib/validations"

type TaskStatus = "open" | "in_progress" | "blocked" | "done"
type TaskPriority = "none" | "low" | "medium" | "high" | "urgent"

type TaskDraft = {
  id?: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
  labels: string[]
}

type TaskAssigneeOption = {
  id: string
  name: string
  subtitle?: string
}

type TaskComment = {
  id: string
  authorName: string
  content: string
  createdAt: string
}

type TaskActivityItem = {
  id: string
  description: string
  createdAt: string
}

type CreateTaskModalProps = {
  isOpen: boolean
  mode: "create" | "edit"
  listName: string
  initialTask?: TaskDraft | null
  canEdit?: boolean
  canDelete?: boolean
  assigneeOptions?: TaskAssigneeOption[]
  comments?: TaskComment[]
  activityItems?: TaskActivityItem[]
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (input: TaskDraft & { attachments: File[] }) => Promise<void>
  onDelete?: () => Promise<void> | void
}

const emptyTask: TaskDraft = {
  title: "",
  description: "",
  status: "open",
  priority: "none",
  assigneeId: null,
  dueDate: "",
  labels: [],
}

const taskModalSchema = taskSchema
  .omit({ projectId: true, listId: true, reporterId: true, startDate: true, position: true, dueDate: true, assigneeId: true })
  .extend({
    dueDate: z.string().optional(),
    assigneeId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional(),
    labels: z.array(z.string().trim().min(1, "Label cannot be empty").max(24, "Label is too long")).max(8, "Add up to 8 labels"),
  })

function formatDate(value?: string | null) {
  if (!value) return "No due date"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function getStatusChipClass(status: TaskStatus) {
  switch (status) {
    case "done":
      return "bg-emerald-100 text-emerald-700"
    case "in_progress":
      return "bg-sky-100 text-sky-700"
    case "blocked":
      return "bg-rose-100 text-rose-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

function getPriorityChipClass(priority: TaskPriority) {
  switch (priority) {
    case "urgent":
      return "bg-rose-100 text-rose-700"
    case "high":
      return "bg-orange-100 text-orange-700"
    case "medium":
      return "bg-amber-100 text-amber-700"
    case "low":
      return "bg-emerald-100 text-emerald-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function TaskChip({ children, tone }: { children: ReactNode; tone: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>{children}</span>
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700">{children}</label>
}

function SummaryCard({
  form,
  setForm,
  assigneeOptions,
  onRemoveLabel,
  isEditing,
}: {
  form: TaskDraft
  setForm: Dispatch<SetStateAction<TaskDraft>>
  assigneeOptions: TaskAssigneeOption[]
  onRemoveLabel: (label: string) => void
  isEditing: boolean
}) {
  const selectedAssignee = assigneeOptions.find((assignee) => assignee.id === form.assigneeId) ?? null

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white">
      <div className="grid grid-cols-[108px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 px-3.5 py-3.5 sm:grid-cols-[120px_minmax(0,1fr)]">
        <ModalDetailRow icon={<CircleDashed size={16} />} label="Status">
          {isEditing ? (
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          ) : null}
          <TaskChip tone={getStatusChipClass(form.status)}>{form.status.replace("_", " ")}</TaskChip>
        </ModalDetailRow>

        <ModalDetailRow icon={<CalendarDays size={16} />} label="Due date">
          {isEditing ? (
            <input
              type="date"
              value={form.dueDate ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          ) : null}
          <span className="text-sm font-medium text-slate-700">{formatDate(form.dueDate)}</span>
        </ModalDetailRow>

        <ModalDetailRow icon={<UserRound size={16} />} label="Assignee">
          {isEditing ? (
            <select
              value={form.assigneeId ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value || null }))}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          ) : null}
          <span className="text-sm font-medium text-slate-700">{selectedAssignee ? selectedAssignee.name : "No assignee yet"}</span>
        </ModalDetailRow>

        

        <ModalDetailRow icon={<MessageSquareText size={16} />} label="Description">
          <div className="w-full space-y-3">
            {isEditing ? (
              <>
                <textarea
                  value={form.description ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Add context, acceptance notes, or implementation details..."
                />
                <p className="text-xs text-slate-500">Using a textarea for now. You can swap this to a rich text editor later.</p>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
                {form.description?.trim() ? form.description : "No description yet."}
              </div>
            )}
          </div>
        </ModalDetailRow>
      </div>
    </div>
  )
}

function CreateTaskForm({
  form,
  setForm,
  labelInput,
  setLabelInput,
  onAddLabel,
  onRemoveLabel,
  assigneeOptions,
  error,
}: {
  form: TaskDraft
  setForm: Dispatch<SetStateAction<TaskDraft>>
  labelInput: string
  setLabelInput: (value: string) => void
  onAddLabel: () => void
  onRemoveLabel: (label: string) => void
  assigneeOptions: TaskAssigneeOption[]
  error: string | null
}) {
  return (
    <div className="space-y-3 px-4 py-3">
      <ModalField label="Task title*">
        <input
          autoFocus
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Design review checklist"
        />
      </ModalField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ModalField label="Status">
          <ModalInputShell icon={<CircleDashed size={18} />}>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </ModalInputShell>
        </ModalField>

        <ModalField label="Due date">
          <ModalInputShell icon={<CalendarDays size={18} />}>
            <input
              type="date"
              value={form.dueDate ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </ModalInputShell>
        </ModalField>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ModalField label="Assignee">
          <ModalInputShell icon={<UserRound size={18} />}>
            <select
              value={form.assigneeId ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value || null }))}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          </ModalInputShell>
        </ModalField>

        <PriorityEditor priority={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} />
      </div>

      <ModalField label="Description">
        <textarea
          value={form.description ?? ""}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Add context or acceptance notes..."
        />
      </ModalField>

      <ModalField label="Labels">
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap gap-2">
            {form.labels.length > 0 ? (
              form.labels.map((label) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  {label}
                  <button type="button" onClick={() => onRemoveLabel(label)} className="text-violet-400 transition-colors hover:text-violet-700">
                    x
                  </button>
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No labels yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={labelInput}
              onChange={(event) => setLabelInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  onAddLabel()
                }
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Design, backend, urgent..."
            />
            <button
              type="button"
              onClick={onAddLabel}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Add
            </button>
          </div>
        </div>
      </ModalField>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {assigneeOptions.length === 0 ? <p className="text-xs text-slate-500">Project member options are not wired yet, so assignment stays optional.</p> : null}
    </div>
  )
}

function PriorityEditor({
  priority,
  onChange,
}: {
  priority: TaskPriority
  onChange: (value: TaskPriority) => void
}) {
  return (
    <div className="space-y-1.5">
      <SectionLabel>Priority</SectionLabel>
      <div className="flex items-center gap-2">
        <Flag size={16} className="text-slate-400" />
        <select
          value={priority}
          onChange={(event) => onChange(event.target.value as TaskPriority)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="none">None</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <TaskChip tone={getPriorityChipClass(priority)}>{priority}</TaskChip>
    </div>
  )
}

function AttachmentsSection({
  attachments,
  onChange,
}: {
  attachments: File[]
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="space-y-2">
      <SectionLabel>Attachments</SectionLabel>
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3.5">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Paperclip size={18} className="text-slate-400" />
          Attach supporting files for this task.
        </div>
        <input
          type="file"
          multiple
          onChange={onChange}
          className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
        />
        {attachments.length > 0 ? (
          <div className="mt-2.5 space-y-2">
            {attachments.map((file) => (
              <div key={`${file.name}-${file.lastModified}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                {file.name}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Upload handling still needs storage integration before files can persist.</p>
        )}
      </div>
    </div>
  )
}

function EditPanels({
  comments,
  activityItems,
  activePanel,
  onChangePanel,
}: {
  comments: TaskComment[]
  activityItems: TaskActivityItem[]
  activePanel: "comments" | "activity"
  onChangePanel: (value: "comments" | "activity") => void
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => onChangePanel("comments")}
          className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activePanel === "comments" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Comments
        </button>
        <button
          type="button"
          onClick={() => onChangePanel("activity")}
          className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activePanel === "activity" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Activities
        </button>
      </div>

      {activePanel === "comments" ? (
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <textarea
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Write a comment..."
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Real-time comments still need the comments API to be connected.</span>
            <button type="button" className="rounded-full bg-violet-500 px-3 py-1.5 font-medium text-white">
              Post
            </button>
          </div>
          <div className="space-y-2.5 border-t border-slate-200 pt-2.5">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{comment.authorName}</p>
                    <span className="text-xs text-slate-500">{formatTimelineDate(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500">No comments yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          {activityItems.length > 0 ? (
            activityItems.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-sm text-slate-700">{entry.description}</p>
                <span className="mt-1 block text-xs text-slate-500">{formatTimelineDate(entry.createdAt)}</span>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500">
              Activity history will appear here once task timeline events are exposed by the backend.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function CreateTaskModal({
  isOpen,
  mode,
  listName,
  initialTask,
  canEdit = false,
  canDelete = false,
  assigneeOptions = [],
  comments = [],
  activityItems = [],
  isSubmitting = false,
  onClose,
  onSubmit,
  onDelete,
}: CreateTaskModalProps) {
  const [form, setForm] = useState<TaskDraft>(emptyTask)
  const [error, setError] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [activePanel, setActivePanel] = useState<"comments" | "activity">("comments")
  const [isEditing, setIsEditing] = useState(mode === "create")

  useEffect(() => {
    if (!isOpen) return

    setForm(
      initialTask
        ? {
            ...initialTask,
            description: initialTask.description ?? "",
            assigneeId: initialTask.assigneeId ?? null,
            dueDate: initialTask.dueDate ? initialTask.dueDate.slice(0, 10) : "",
            labels: initialTask.labels ?? [],
          }
        : emptyTask,
    )
    setError(null)
    setLabelInput("")
    setAttachments([])
    setActivePanel("comments")
    setIsEditing(mode === "create")
  }, [initialTask, isOpen])

  const displayComments = useMemo(() => comments, [comments])
  const displayActivity = useMemo(() => activityItems, [activityItems])

  if (!isOpen) return null

  function addLabel() {
    const nextLabel = labelInput.trim()
    if (!nextLabel) return
    if (form.labels.some((label) => label.toLowerCase() === nextLabel.toLowerCase())) {
      setError("That label is already added")
      return
    }
    if (form.labels.length >= 8) {
      setError("You can add up to 8 labels")
      return
    }
    setForm((current) => ({ ...current, labels: [...current.labels, nextLabel] }))
    setLabelInput("")
    setError(null)
  }

  function removeLabel(targetLabel: string) {
    setForm((current) => ({ ...current, labels: current.labels.filter((label) => label !== targetLabel) }))
  }

  function handleAttachmentSelection(event: ChangeEvent<HTMLInputElement>) {
    setAttachments(Array.from(event.target.files ?? []))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const parsed = taskModalSchema.safeParse({
      title: form.title.trim(),
      description: form.description?.trim() || null,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId ?? null,
      dueDate: form.dueDate || undefined,
      labels: form.labels,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid task details")
      return
    }

    try {
      setError(null)
      await onSubmit({
        title: form.title.trim(),
        description: form.description?.trim() || null,
        status: parsed.data.status ?? "open",
        priority: parsed.data.priority ?? "none",
        assigneeId: parsed.data.assigneeId || null,
        dueDate: parsed.data.dueDate || null,
        labels: parsed.data.labels,
        attachments,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task")
    }
  }

  async function handleDelete() {
    if (!canDelete || !onDelete) return

    const confirmed = window.confirm(`Delete "${form.title || "this task"}"? This cannot be undone.`)
    if (!confirmed) return

    await onDelete()
    onClose()
  }

  if (mode === "create") {
    return (
      <ModalBackdrop onClose={onClose}>
        <CenteredModalSurface className="max-w-[32rem]">
        <ModalHeader
          title="Create task"
          description={`Add a task to ${listName}.`}
            eyebrow={
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <Layers3 size={14} />
                {listName}
              </div>
            }
            onClose={onClose}
          />

          <form onSubmit={handleSubmit}>
            <CreateTaskForm
              form={form}
              setForm={setForm}
              labelInput={labelInput}
              setLabelInput={setLabelInput}
              onAddLabel={addLabel}
              onRemoveLabel={removeLabel}
              assigneeOptions={assigneeOptions}
              error={error}
            />
            <div className="px-4 pb-3.5">
              <ModalFooter
                hint="Create uses the compact modal. Open an existing task to edit it in the side panel."
                submitLabel={isSubmitting ? "Creating..." : "Create task"}
                isSubmitting={isSubmitting}
                onClose={onClose}
              />
            </div>
          </form>
        </CenteredModalSurface>
      </ModalBackdrop>
    )
  }

  return (
    <ModalBackdrop onClose={onClose} variant="sheet">
      <SideSheetSurface>
        <ModalHeader
          title="Update task details"
          eyebrow={
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Layers3 size={14} />
              {listName}
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  Delete
                </button>
              ) : null}
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setIsEditing((current) => !current)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {isEditing ? "Viewing" : "Edit"}
                </button>
              ) : null}
            </div>
          }
          onClose={onClose}
          className="px-5 py-3"
        />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Task title</label>
              <input
                autoFocus
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                disabled={!isEditing}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="Design review checklist"
              />
            </div>

            <SummaryCard
              form={form}
              setForm={setForm}
              assigneeOptions={assigneeOptions}
              onRemoveLabel={removeLabel}
              isEditing={isEditing}
            />

            <div className={`grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_10rem] ${!isEditing ? "pointer-events-none opacity-80" : ""}`}>
              <div className="space-y-1.5">
                <SectionLabel>Add labels</SectionLabel>
                <div className="flex gap-2">
                  <input
                    value={labelInput}
                    onChange={(event) => setLabelInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        addLabel()
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Design, backend, urgent..."
                  />
                  <button
                    type="button"
                    onClick={addLabel}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              <PriorityEditor priority={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} />
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Labels</SectionLabel>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Use labels for tags like `design`, `qa`, or `backend`. They appear in the summary area above.
              </div>
            </div>

            <div className={!isEditing ? "pointer-events-none opacity-80" : ""}>
              <AttachmentsSection attachments={attachments} onChange={handleAttachmentSelection} />
            </div>

            {mode === "edit" ? (
              <EditPanels
                comments={displayComments}
                activityItems={displayActivity}
                activePanel={activePanel}
                onChangePanel={setActivePanel}
              />
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {assigneeOptions.length === 0 ? (
              <p className="text-xs text-slate-500">Project member options are not wired yet, so assignment stays optional.</p>
            ) : null}
          </div>

          <div className="px-5 py-4">
            {isEditing ? (
              <ModalFooter
                hint="Assignee saves today. Labels, attachments, comments, and timeline need backend wiring to persist fully."
                submitLabel={isSubmitting ? "Saving..." : "Save changes"}
                isSubmitting={isSubmitting}
                onClose={onClose}
                className="pt-0"
              />
            ) : (
              <div className="flex items-center justify-between border-t border-slate-200 pt-0">
                <p className="max-w-[240px] text-xs text-slate-500">Click edit to make changes to this task.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </form>
      </SideSheetSurface>
    </ModalBackdrop>
  )
}
