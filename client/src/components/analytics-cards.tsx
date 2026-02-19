import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, FileText, CheckCircle, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@shared/schema";

export function AnalyticsCards({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      title: "Total Questions",
      value: stats.totalQuestions,
      icon: Database,
      desc: "Questions in bank",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Papers Generated",
      value: stats.totalPapers,
      icon: FileText,
      desc: "All time generated",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Active Subjects",
      value: Object.keys(stats.questionsBySubject).length,
      icon: CheckCircle,
      desc: "Distinct subjects",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Difficulty Ratio",
      value: "Balanced", // Placeholder logic
      icon: TrendingUp,
      desc: "Distribution status",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.title} className="card-hover border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{item.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
