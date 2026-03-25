"use client";

import { cn } from "@/lib/utils";

type ActivityFeedItem = {
  id: string;
  description: string;
  createdAt: string;
};

function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ActivityFeed({
  items,
  emptyLabel = "No activity yet.",
  className,
}: {
  items: ActivityFeedItem[];
  emptyLabel?: string;
  className?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className={cn("space-y-0", className)}>
      {items.map((entry, index) => (
        <div key={entry.id} className="relative pl-6">
          {index < items.length - 1 ? (
            <div className="absolute left-[7px] top-5 h-[calc(100%-0.5rem)] w-px bg-slate-200" />
          ) : null}
          <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-300 shadow-sm" />
          <div className="border-b border-slate-200/80 pb-4 pt-0.5 last:border-b-0 last:pb-0">
            <p className="text-sm leading-6 text-slate-700">{entry.description}</p>
            <span className="mt-1 block text-xs text-slate-500">
              {formatTimelineDate(entry.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
