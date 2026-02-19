import { LayoutShell } from "@/components/layout-shell";
import { useDashboardStats } from "@/hooks/use-papers";
import { AnalyticsCards } from "@/components/analytics-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  // Transform data for charts
  const difficultyData = Object.entries(stats.questionsByDifficulty).map(([name, value]) => ({
    name,
    value,
    color: name === 'Easy' ? '#22c55e' : name === 'Medium' ? '#f59e0b' : '#ef4444'
  }));

  const subjectData = Object.entries(stats.questionsBySubject).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <LayoutShell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your question bank and paper generation stats.</p>
        </div>
        <Link href="/generate">
          <Button className="shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Generate New Paper
          </Button>
        </Link>
      </div>

      <AnalyticsCards stats={stats} />

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md shadow-black/5 border-border/60">
          <CardHeader>
            <CardTitle>Questions by Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md shadow-black/5 border-border/60">
          <CardHeader>
            <CardTitle>Questions by Subject</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} layout="vertical">
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={100} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Papers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentPapers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No papers generated yet.
              </div>
            ) : (
              stats.recentPapers.map((paper) => (
                <div key={paper.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{paper.title}</span>
                    <span className="text-xs text-muted-foreground">{paper.subject} • {paper.totalMarks} Marks • {new Date(paper.createdAt!).toLocaleDateString()}</span>
                  </div>
                  <Link href={`/papers/${paper.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </LayoutShell>
  );
}
