import * as z from "zod";

export const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.record(z.string(), z.unknown()),
  excerpt: z.string().max(500).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
  scheduledAt: z.string().optional().or(z.literal("")).transform(val => {
    if (!val || val === "") return undefined;
    // Handle both ISO datetime and datetime-local formats
    try {
      return new Date(val).toISOString();
    } catch {
      return undefined;
    }
  }),
  metadata: z.array(z.object({ key: z.string(), value: z.unknown(), type: z.string() })).optional()
}).refine((data) => {
  if (data.status === "SCHEDULED") {
    return data.scheduledAt && data.scheduledAt !== "";
  }
  return true;
}, {
  message: "Scheduled date and time is required when status is SCHEDULED",
  path: ["scheduledAt"]
});

export const postUpdateSchema = postSchema;

export const pageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.record(z.string(), z.any()),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

export const pageUpdateSchema = pageSchema; 