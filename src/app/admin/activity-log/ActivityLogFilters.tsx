"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface UserOption {
  id: string;
  name?: string | null;
  email: string;
}

export function ActivityLogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams() || new URLSearchParams();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userId, setUserId] = useState<string>(searchParams?.get("userId") || "");
  const [action, setAction] = useState<string>(searchParams?.get("action") || "");
  const [startDate, setStartDate] = useState<string>(searchParams?.get("startDate") || "");
  const [endDate, setEndDate] = useState<string>(searchParams?.get("endDate") || "");

  useEffect(() => {
    fetch("/api/users?fields=id,name,email")
      .then(res => res.json())
      .then(setUsers);
  }, []);

  function updateFilters(next: Partial<{ userId: string; action: string; startDate: string; endDate: string }>) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (next.userId !== undefined) params.set("userId", next.userId);
    if (next.action !== undefined) params.set("action", next.action);
    if (next.startDate !== undefined) params.set("startDate", next.startDate);
    if (next.endDate !== undefined) params.set("endDate", next.endDate);
    router.replace(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4 items-end mb-4">
      <div>
        <label className="block text-xs font-medium mb-1">User</label>
        <Select value={userId || "all"} onValueChange={val => { setUserId(val === "all" ? "" : val); updateFilters({ userId: val === "all" ? "" : val }); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Action</label>
        <Input
          className="w-48"
          placeholder="Action type..."
          value={action}
          onChange={e => { setAction(e.target.value); updateFilters({ action: e.target.value }); }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Start Date</label>
        <Input
          type="date"
          className="w-36"
          value={startDate}
          onChange={e => { setStartDate(e.target.value); updateFilters({ startDate: e.target.value }); }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">End Date</label>
        <Input
          type="date"
          className="w-36"
          value={endDate}
          onChange={e => { setEndDate(e.target.value); updateFilters({ endDate: e.target.value }); }}
        />
      </div>
    </div>
  );
} 