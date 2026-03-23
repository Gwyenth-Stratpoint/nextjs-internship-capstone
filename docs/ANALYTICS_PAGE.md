# Analytics Page

## What It Does

The analytics page now supports three behaviors that were previously missing:

- Client polling: the page refreshes its own analytics data every 10 seconds in the browser.
- Project-specific scope: analytics can be limited to one accessible project.
- Selected board scope: a chosen project is reflected in the URL, so the page can reopen on that same board.

## How Scope Works

- Default state: `/analytics`
  - Shows workspace-wide analytics across all accessible projects in the active Clerk organization.
- Project state: `/analytics?projectId=<project-id>`
  - Shows analytics for only that selected project board.

The project dropdown on the page updates the query string, and the page refetches analytics for that scope.

## Data Flow

### Read flow

`Analytics page -> useAnalyticsOverview hook -> /api/analytics -> getAnalyticsOverview -> DB`

### Project selector flow

`Analytics page -> useProjects hook -> /api/projects -> listAccessibleProjects`

## Polling

- The analytics page uses `useAnalyticsOverview`.
- That hook uses `usePolling`.
- Poll interval: `10 seconds`
- Visibility behavior:
  - hidden tabs do not poll aggressively
  - returning to a visible tab triggers a refresh

## Key Files

- `app/(dashboard)/analytics/page.tsx`
  - client UI, project scope selector, live metric cards, chart section
- `hooks/use-analytics-overview.ts`
  - browser fetch + polling for analytics
- `app/api/analytics/route.ts`
  - authenticated read endpoint for analytics data
- `lib/server/analytics-crud.ts`
  - computes workspace-wide or project-specific metrics
- `lib/analytics/types.ts`
  - shared analytics response types

## Metrics Computed

- Total Projects
- Active Projects
- Completed Tasks
- Overdue Tasks
- Completion Rate
- Status Distribution

## Notes

- Project scope is permission-aware. If a user selects a project they no longer have access to, the page falls back away from that invalid selection.
- The chart currently uses the same selected scope as the metric cards.
