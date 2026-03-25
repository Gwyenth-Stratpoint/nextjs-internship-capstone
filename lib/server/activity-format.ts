export function describeActivity(
  action: string,
  actorName: string | null,
  meta: Record<string, unknown>,
) {
  const actorLabel = actorName ?? "Someone";
  const summary = typeof meta.summary === "string" ? meta.summary : null;

  if (summary) {
    return `${actorLabel} ${summary}`;
  }

  switch (action) {
    case "commented":
      return `${actorLabel} commented on this task`;
    case "moved": {
      const sourceListName = typeof meta.sourceListName === "string" ? meta.sourceListName : null;
      const destinationListName =
        typeof meta.destinationListName === "string" ? meta.destinationListName : null;

      if (sourceListName && destinationListName) {
        return `${actorLabel} moved this task from ${sourceListName} to ${destinationListName}`;
      }

      return `${actorLabel} moved this task`;
    }
    case "updated":
      return `${actorLabel} updated this item`;
    case "assigned":
      return `${actorLabel} assigned this task`;
    case "unassigned":
      return `${actorLabel} unassigned this task`;
    case "labeled":
      return `${actorLabel} updated labels`;
    case "unlabeled":
      return `${actorLabel} removed a label`;
    case "archived":
      return `${actorLabel} archived this item`;
    case "unarchived":
      return `${actorLabel} restored this item`;
    case "created":
      return `${actorLabel} created this item`;
    default:
      return `${actorLabel} changed this item`;
  }
}
