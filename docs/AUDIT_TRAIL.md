# Audit Trail

## Purpose

The audit trail records important project actions on the server after a successful mutation.

Each activity entry captures:

- who performed the action
- what action happened
- which workspace or project it belongs to
- which task it belongs to when applicable
- extra context in `meta`

## Write Flow

`User action -> server action -> server service -> database change -> audit activity insert`

The audit trail is written in the server layer so it is not dependent on client-side UI state.

## Core Files

- `lib/db/schema.ts`
  - defines the `activity` table and `activityActionEnum`
- `lib/server/activity-crud.ts`
  - shared helpers for inserting activity rows
- `lib/server/comment-crud.ts`
  - task comment audit entries and task activity feed reader
- `lib/server/project-crud.ts`
  - project create, update, archive, unarchive, delete logs
- `lib/server/list-crud.ts`
  - list create, update, reorder, delete logs
- `lib/server/task-crud.ts`
  - task create, move, update, assign, archive, delete logs
- `lib/server/project-members-crud.ts`
  - project member grants and invitation lifecycle logs

## What Is Logged

### Projects

- project created
- project updated
- project archived / restored
- project deleted

### Lists

- list created
- list updated
- list archived / restored
- list reordered
- list deleted
- task moves caused by list deletion

### Tasks

- task created
- task moved between lists
- task reordered
- task updated
- task assigned / unassigned
- task archived / restored
- task deleted

### Collaboration

- comment created
- project invite created
- project invite accepted
- direct project member grant
- project member role update

## UI Reading

The task modal activity panel reads task-scoped audit entries through:

- `app/api/tasks/[id]/comments/route.ts`
- `lib/server/comment-crud.ts`

Entries now support a `meta.summary` field, which gives the task activity feed a readable sentence without hard-coding every case in the UI.

## Notes

- The audit trail currently focuses on project-level operations and task collaboration history.
- Some delete events are stored without the deleted entity foreign key so the delete log itself is not removed immediately by cascading deletes.
