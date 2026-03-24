"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const analyticsFormSchema = z.object({
  analyticsSnippet: z.string().optional(),
});

type AnalyticsFormData = z.infer<typeof analyticsFormSchema>;

interface AnalyticsSettingsFormProps {
  settings: {
    id: string;
    analyticsSnippet?: string | null;
  };
}

export function AnalyticsSettingsForm({ settings }: AnalyticsSettingsFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<AnalyticsFormData>({
    resolver: zodResolver(analyticsFormSchema),
    defaultValues: {
      analyticsSnippet: settings.analyticsSnippet || "",
    },
  });

  async function onSubmit(data: AnalyticsFormData) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: settings.id,
          analyticsSnippet: data.analyticsSnippet,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update analytics settings");
      }

      toast.success("Analytics settings updated successfully");
    } catch (error) {
      console.error("Error updating analytics settings:", error);
      toast.error("Failed to update analytics settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          control={form.control}
          name="analyticsSnippet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Analytics Snippet</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste your analytics JavaScript snippet here"
                  className="font-mono min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This JavaScript code will be added to the site header. Make sure to include the full script tag.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
} 