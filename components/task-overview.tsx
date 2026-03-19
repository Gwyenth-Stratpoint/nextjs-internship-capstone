import { CheckCircle, Clock, AlertCircle, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardInset,
  CardTitle,
} from "@/components/ui/card";

const taskStats = [
  {
    label: "Completed",
    count: 24,
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  {
    label: "In Progress",
    count: 18,
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-primary/15 dark:bg-primary/25",
  },
  {
    label: "Overdue",
    count: 3,
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
  {
    label: "Assigned to Me",
    count: 12,
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900",
  },
];

export function TaskOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Overview</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {taskStats.map((stat) => (
          <CardInset key={stat.label} className="p-3">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={stat.color} size={20} />
              </div>
              <span className="font-medium text-foreground">{stat.label}</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{stat.count}</span>
          </CardInset>
        ))}
      </CardContent>

      <CardContent className="border-t border-border pt-4">
        <CardDescription>
          <span className="font-medium">Productivity:</span> 89% completion rate this week
        </CardDescription>
      </CardContent>
    </Card>
  );
}
