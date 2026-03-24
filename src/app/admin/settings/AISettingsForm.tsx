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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

const aiFormSchema = z.object({
  aiKey: z.string().min(1, "API key is required"),
});

type AIFormData = z.infer<typeof aiFormSchema>;

interface AISettingsFormProps {
  settings: {
    id: string;
    aiKey?: string | null;
  };
}

export function AISettingsForm({ settings }: AISettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const form = useForm<AIFormData>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: {
      aiKey: settings.aiKey || "",
    },
  });

  async function onSubmit(data: AIFormData) {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aiKey: data.aiKey }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update AI key");
      }
      toast.success("AI integration key updated");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to update AI key");
      } else {
        toast.error("Failed to update AI key");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        <FormField
          control={form.control}
          name="aiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Integration Key</FormLabel>
              <FormControl>
                <div className="relative flex items-center">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="Enter your AI API key"
                    autoComplete="off"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                    onClick={() => setShowKey((v) => !v)}
                    tabIndex={-1}
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </FormControl>
              <FormDescription>
                This key will be used for AI-powered features. It is stored securely in your database.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Key
        </Button>
      </form>
    </Form>
  );
} 