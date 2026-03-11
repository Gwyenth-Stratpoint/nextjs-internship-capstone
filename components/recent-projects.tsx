import Link from "next/link"
import { Calendar, MoreHorizontal } from "lucide-react"

type RecentProject = {
  id: string
  name: string
  description: string | null
  dueDate?: string | null
  updatedAt?: string
  archived?: boolean
}

function formatProjectDate(value?: string | null) {
  if (!value) return "No due date"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function RecentProjects({
  projects,
  isLoading = false,
}: {
  projects: RecentProject[]
  isLoading?: boolean
}) {
  return (
    <div className="bg-background rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Projects</h3>
        <Link href="/projects" className="text-primary hover:text-primary text-sm font-medium">
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-4 w-1/4 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No projects yet.
        </div>
      ) : null}

      {!isLoading ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block border border-border rounded-lg p-4 hover:bg-muted/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{project.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.description ?? "No description"}
                  </p>

                  <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {formatProjectDate(project.dueDate)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {project.updatedAt ? `Updated ${formatProjectDate(project.updatedAt)}` : "Recently created"}
                    </span>
                    <span className="text-foreground">
                      {project.archived ? "Archived" : "Active"}
                    </span>
                  </div>
                </div>

                <span className="p-1 hover:bg-muted rounded">
                  <MoreHorizontal size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

