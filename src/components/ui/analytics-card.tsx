import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, CheckCircle, XCircle } from "lucide-react";
import React from "react";

interface AnalyticsData {
  requests: number | null;
  uniqueVisitors: number | null;
  bytes: number | null;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export function AnalyticsCard({ analytics }: { analytics: AnalyticsData | null }) {
  return (
    <Card className="relative overflow-hidden shadow-xl min-h-[220px] flex flex-col justify-between h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-blue-900 dark:text-blue-100">
          <span className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-blue-400" /> Cloudflare Analytics
          </span>
          {analytics ? (
            <CheckCircle className="h-10 w-10 text-green-500" aria-label="Connected to Cloudflare" />
          ) : (
            <XCircle className="h-10 w-10 text-red-500" aria-label="Not connected to Cloudflare" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-4">
          {/* Requests */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <CardContent className="p-0 pt-1 text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analytics ? analytics.requests?.toLocaleString() : '—'}</p>
            </CardContent>
            <CardTitle className="text-sm font-medium text-center text-blue-900 dark:text-blue-100">Requests (24h)</CardTitle>
          </div>
          {/* Unique Visitors */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <CardContent className="p-0 pt-1 text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analytics ? analytics.uniqueVisitors?.toLocaleString() : '—'}</p>
            </CardContent>
            <CardTitle className="text-sm font-medium text-center text-blue-900 dark:text-blue-100">Unique Visitors (24h)</CardTitle>
          </div>
          {/* Bandwidth */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <CardContent className="p-0 pt-1 text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analytics ? formatBytes(analytics.bytes) : '—'}</p>
            </CardContent>
            <CardTitle className="text-sm font-medium text-center text-blue-900 dark:text-blue-100">Bandwidth (24h)</CardTitle>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 