import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, User } from "lucide-react";
import React from "react";

export interface ActivityCardProps {
  users: number;
  comments: number;
  posts: number;
}

export function ActivityCard({ users, comments, posts }: ActivityCardProps) {
  return (
    <Card className="relative overflow-hidden shadow-xl min-h-[180px] flex flex-col justify-between h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-blue-900 dark:text-blue-100">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" /> Activity (48h)
          </span>
          <User className="h-10 w-10 text-blue-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className="flex flex-row items-center justify-between gap-6 mb-4">
          {/* New Users */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{users}</p>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">New Users</span>
          </div>
          {/* New Comments */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{comments}</p>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">New Comments</span>
          </div>
          {/* New Posts */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{posts}</p>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">New Posts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 