import { CheckCircle, Clock, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardInset } from "@/components/ui/card";

type DashboardStat = {
  name: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: typeof TrendingUp;
};

const fallbackStats: DashboardStat[] = [
  {
    name: "Active Projects",
    value: "--",
    change: "Loading...",
    changeType: "neutral",
    icon: TrendingUp,
  },
  {
    name: "Team Members",
    value: "--",
    change: "Waiting for team data",
    changeType: "neutral",
    icon: Users,
  },
  {
    name: "Completed Tasks",
    value: "--",
    change: "Waiting for task data",
    changeType: "neutral",
    icon: CheckCircle,
  },
  {
    name: "Pending Tasks",
    value: "--",
    change: "Waiting for task data",
    changeType: "neutral",
    icon: Clock,
  },
];

export function DashboardStats({ stats = fallbackStats }: { stats?: DashboardStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name} variant="glass" className="overflow-hidden">
          <CardContent className="p-6">
            <CardInset className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15">
                    <stat.icon className="text-primary" size={20} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-muted-foreground">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === "positive"
                            ? "text-green-600 dark:text-green-400"
                            : stat.changeType === "negative"
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </CardInset>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
