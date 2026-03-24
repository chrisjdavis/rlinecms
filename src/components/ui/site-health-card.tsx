import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartPulse, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import React from "react";

export interface SiteHealthData {
  siteAge: string | null;
  lastRebuild: string | null;
  settingsOk: boolean;
  aiIntegrationOk: boolean;
}

export function SiteHealthCard({ health }: { health: SiteHealthData | null }) {
  return (
    <Card className="relative overflow-hidden shadow-xl min-h-[220px] flex flex-col justify-between h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-blue-900 dark:text-blue-100">
          <span className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-blue-400" /> Site Health
          </span>
          {health?.settingsOk ? (
            <CheckCircle className="h-10 w-10 text-green-500" aria-label="Settings OK" />
          ) : (
            <XCircle className="h-10 w-10 text-red-500" aria-label="Settings Issue" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-4">
          {/* Site Age */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <CardContent className="p-0 pt-1 text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{health?.siteAge ?? '—'}</p>
            </CardContent>
            <CardTitle className="text-sm font-medium text-center text-blue-900 dark:text-blue-100">Site Age</CardTitle>
          </div>
          {/* AI Integration */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <CardContent className="p-0 pt-1 text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-1">
                {health?.aiIntegrationOk ? (
                  <CheckCircle className="inline h-5 w-5 text-green-500 mr-1" aria-label="AI Integration OK" />
                ) : (
                  <XCircle className="inline h-5 w-5 text-red-500 mr-1" aria-label="AI Integration Issue" />
                )}
                {health?.aiIntegrationOk ? 'Configured' : 'Not Configured'}
              </p>
            </CardContent>
            <CardTitle className="text-sm font-medium text-center text-blue-900 dark:text-blue-100">AI Integration</CardTitle>
          </div>
          {/* Last Rebuild */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <CardContent className="p-0 pt-1 text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-1">
                <RefreshCw className="inline h-5 w-5 text-blue-400 mr-1" />
                {health?.lastRebuild ?? '—'}
              </p>
            </CardContent>
            <CardTitle className="text-sm font-medium text-center text-blue-900 dark:text-blue-100">Last Rebuild</CardTitle>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 