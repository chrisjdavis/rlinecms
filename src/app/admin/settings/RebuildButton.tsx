"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RebuildButton() {
  const [loading, setLoading] = useState(false);

  async function handleRebuild() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rebuild", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to trigger rebuild");
      }
      toast.success("Rebuild triggered!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to trigger rebuild");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleRebuild} disabled={loading} type="button">
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Trigger Site Rebuild
    </Button>
  );
} 