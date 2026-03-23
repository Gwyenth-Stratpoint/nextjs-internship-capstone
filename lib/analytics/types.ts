export type AnalyticsStatusDatum = {
  name: string;
  value: number;
};

export type AnalyticsScope =
  | {
      type: "workspace";
      projectId: null;
      projectName: null;
    }
  | {
      type: "project";
      projectId: string;
      projectName: string;
    };

export type AnalyticsOverview = {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  statusDistribution: AnalyticsStatusDatum[];
  scope: AnalyticsScope;
};
