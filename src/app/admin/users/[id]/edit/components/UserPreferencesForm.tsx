"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  // Add more as needed
];

const DEFAULTS = {
  notificationsEnabled: false,
  language: "en",
  profilePublic: false,
  commentsEnabled: false,
};

type PreferencesForm = typeof DEFAULTS;

export function UserPreferencesForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const form = useForm<PreferencesForm>({
    defaultValues: DEFAULTS,
  });

  // Load preferences on mount
  useEffect(() => {
    async function fetchPrefs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}/preferences`);
        if (!res.ok) throw new Error("Failed to load preferences");
        const data = await res.json();
        form.reset(data);
      } catch {
        toast.error("Failed to load preferences");
      } finally {
        setLoading(false);
      }
    }
    fetchPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function onSubmit(values: PreferencesForm) {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch(`/api/users/${userId}/preferences`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reset preferences");
      const data = await res.json();
      form.reset(data);
      toast.success("Preferences reset to defaults");
    } catch {
      toast.error("Failed to reset preferences");
    } finally {
      setResetting(false);
    }
  }

  if (loading) return <div>Loading preferences...</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-fullmax-w-md">
        <FormField
          control={form.control}
          name="notificationsEnabled"
          render={() => (
            <FormItem className="w-full flex flex-row items-center justify-between py-4 gap-2">
              <FormLabel>Notifications</FormLabel>
              <FormControl>
                <Controller
                  name="notificationsEnabled"
                  control={form.control}
                  render={({ field: ctrlField }) => (
                    <Switch
                      checked={!!ctrlField.value}
                      onCheckedChange={ctrlField.onChange}
                      id="notifications"
                    />
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={() => (
            <FormItem className="w-full flex flex-row items-center justify-between py-4 gap-2">
              <FormLabel>Language</FormLabel>
              <FormControl>
                <Controller
                  name="language"
                  control={form.control}
                  render={({ field: ctrlField }) => (
                    <Select
                      value={ctrlField.value}
                      onValueChange={ctrlField.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="profilePublic"
          render={() => (
            <FormItem className="w-full flex flex-row items-center justify-between py-4 gap-2">
              <FormLabel>Profile Public</FormLabel>
              <FormControl>
                <Controller
                  name="profilePublic"
                  control={form.control}
                  render={({ field: ctrlField }) => (
                    <Switch
                      checked={!!ctrlField.value}
                      onCheckedChange={ctrlField.onChange}
                      id="profilePublic"
                    />
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="commentsEnabled"
          render={() => (
            <FormItem className="w-full flex flex-row items-center justify-between py-4 gap-2">
              <FormLabel>Comments Enabled</FormLabel>
              <FormControl>
                <Controller
                  name="commentsEnabled"
                  control={form.control}
                  render={({ field: ctrlField }) => (
                    <Switch
                      checked={!!ctrlField.value}
                      onCheckedChange={ctrlField.onChange}
                      id="commentsEnabled"
                    />
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={resetting}>{resetting ? "Resetting..." : "Reset to Defaults"}</Button>
        </div>
      </form>
    </Form>
  );
} 