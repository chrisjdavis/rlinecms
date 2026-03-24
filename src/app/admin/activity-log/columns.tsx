"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export type UserActivityLog = {
  id: string;
  user: { id: string; name?: string | null; email: string };
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

function formatMetadata(action: string, metadata?: Record<string, unknown> | null): string {
  if (!metadata) return "—";
  // Custom summaries for common actions
  if (action === "login") return "User logged in";
  if (action === "logout") return "User logged out";
  if (action === "profile_update" && metadata.updatedFields)
    return `Updated fields: ${Array.isArray(metadata.updatedFields) ? metadata.updatedFields.join(", ") : metadata.updatedFields}`;
  if (action === "account_deleted") return "Account deleted";
  if (action === "register") return "User registered";
  if (action === "password_reset") return "Password reset";
  // Add more custom cases as needed

  // Fallback: show key-value pairs
  return Object.entries(metadata)
    .map(([key, value]: [string, unknown]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(", ");
}

export const columns: ColumnDef<UserActivityLog>[] = [
  {
    id: "user",
    accessorFn: (row) => row.user?.name || row.user?.email,
    header: "User",
    cell: ({ row }) => (
      <span>{row.original.user?.name || row.original.user?.email}</span>
    ),
  },
  {
    id: "action",
    accessorFn: (row) => row.action,
    header: "Action",
    cell: ({ row }) => <span>{row.original.action}</span>,
  },
  {
    id: "ip",
    accessorFn: (row) => row.ip,
    header: "IP",
    cell: ({ row }) => <span>{row.original.ip || "—"}</span>,
  },
  {
    id: "userAgent",
    accessorFn: (row) => row.userAgent,
    header: "User Agent",
    cell: ({ row }) => <span className="truncate max-w-[200px] inline-block align-top">{row.original.userAgent || "—"}</span>,
  },
  {
    id: "metadata",
    accessorFn: (row) => row.metadata,
    header: "Metadata",
    cell: ({ row }) => (
      <span className="truncate max-w-[200px] inline-block align-top">
        {formatMetadata(row.original.action, row.original.metadata)}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorFn: (row) => row.createdAt,
    header: ({ column }) => (
      <button
        type="button"
        className="font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
      </button>
    ),
    cell: ({ row }) => <span>{format(new Date(row.original.createdAt), "PPP p")}</span>,
  },
]; 