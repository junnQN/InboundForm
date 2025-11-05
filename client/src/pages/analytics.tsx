import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, CheckCircle, Clock } from "lucide-react";

interface AnalyticsData {
  totalSessions: number;
  totalSubmissions: number;
  completionRate: number;
  averageTimeToComplete: number | null;
  dropOffByStep: {
    step: number;
    viewed: number;
    continued: number;
    dropOffRate: number;
  }[];
}

const formatTime = (seconds: number | null): string => {
  if (seconds === null) return "N/A";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const stepLabels = ["Name", "Email", "Additional Info"];

export default function Analytics() {
  const [timePeriod, setTimePeriod] = useState<string>("all");

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics", timePeriod],
    queryFn: async () => {
      const params = timePeriod !== "all" ? `?timePeriod=${timePeriod}` : "";
      const response = await fetch(`/api/admin/analytics${params}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const chartData = data?.dropOffByStep.map((step) => ({
    name: stepLabels[step.step],
    viewed: step.viewed,
    continued: step.continued,
    dropOffRate: step.dropOffRate.toFixed(1),
  })) || [];

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8">
            <p className="text-destructive" data-testid="error-message">
              Failed to load analytics data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">
            Form Analytics
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="page-description">
            Track user behavior and form completion metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timePeriod === "7days" ? "default" : "outline"}
            onClick={() => setTimePeriod("7days")}
            data-testid="button-7days"
          >
            Last 7 Days
          </Button>
          <Button
            variant={timePeriod === "30days" ? "default" : "outline"}
            onClick={() => setTimePeriod("30days")}
            data-testid="button-30days"
          >
            Last 30 Days
          </Button>
          <Button
            variant={timePeriod === "all" ? "default" : "outline"}
            onClick={() => setTimePeriod("all")}
            data-testid="button-all-time"
          >
            All Time
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-semibold" data-testid="metric-total-sessions">
                {data?.totalSessions || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Users who started the form
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-semibold" data-testid="metric-total-submissions">
                {data?.totalSubmissions || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed forms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-semibold" data-testid="metric-completion-rate">
                {data?.completionRate.toFixed(1) || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {data?.totalSessions ? `${data.totalSubmissions} of ${data.totalSessions} sessions` : "No data yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Complete</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-semibold" data-testid="metric-avg-time">
                {formatTime(data?.averageTimeToComplete || null)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Average completion time
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drop-Off Funnel</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track where users abandon the form
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : chartData.length > 0 ? (
            <div className="h-80" data-testid="chart-dropoff-funnel">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-sm"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    className="text-sm"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'viewed') return [value, 'Viewed'];
                      if (name === 'continued') return [value, 'Continued'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="viewed" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" opacity={0.6} />
                    ))}
                  </Bar>
                  <Bar dataKey="continued" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data available for the selected time period
            </div>
          )}
          
          {!isLoading && data && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Drop-Off Details</h3>
              <div className="space-y-2">
                {data.dropOffByStep.map((step) => (
                  <div 
                    key={step.step} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                    data-testid={`dropoff-step-${step.step}`}
                  >
                    <div>
                      <p className="font-medium">{stepLabels[step.step]}</p>
                      <p className="text-sm text-muted-foreground">
                        {step.viewed} viewed, {step.continued} continued
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-destructive">
                        {step.dropOffRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">drop-off</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
