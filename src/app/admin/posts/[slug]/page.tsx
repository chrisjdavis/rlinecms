"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Block, BlockEditor } from "@/components/block-editor"
import { MetadataEditor, Metadata } from "@/components/ui/metadata-editor"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import { AIDockPanel } from "@/components/ui/AIDockPanel"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface PostState {
  title: string
  slug: string
  content: Record<string, Block>
  excerpt: string
  status: string
  scheduledAt: string
  metadata: Metadata[]
}

export default function PostEditor() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostState>({
    title: "",
    slug: "",
    content: {},
    excerpt: "",
    status: "DRAFT",
    scheduledAt: "",
    metadata: []
  })
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  const fetchPost = useCallback(async () => {
    if (!params?.slug) return;
    
    try {
      const res = await fetch(`/api/posts/${params.slug}`)
      if (!res.ok) throw new Error("Failed to fetch post")
      const data = await res.json()
      
      setPost({
        ...data,
        content: data.content
          ? Object.fromEntries(
              Object.entries(data.content).map(([id, blockRaw]) => {
                const block = blockRaw as { type?: string; content?: unknown };
                if (
                  block &&
                  block.type === 'text' &&
                  typeof block.content === 'object' &&
                  block.content !== null &&
                  'text' in block.content
                ) {
                  return [id, { ...block, content: (block.content as { text: string }).text }];
                }
                return [id, block];
              })
            )
          : {},
        excerpt: data.excerpt || "",
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : "",
        metadata: data.metadata || []
      })
    } catch (error) {
      console.error("Error fetching post:", error)
      toast.error("Failed to load post")
    }
  }, [params?.slug])

  useEffect(() => {
    if (params?.slug !== "new") {
      fetchPost()
    }
  }, [params?.slug, fetchPost])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setPost(prev => ({
      ...prev,
      title: newTitle,
      slug: isSlugManuallyEdited ? prev.slug : generateSlug(newTitle)
    }))
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPost(prev => ({ ...prev, slug: e.target.value }))
    setIsSlugManuallyEdited(true)
  }

  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPost(prev => ({ ...prev, excerpt: e.target.value }))
  }

  const handleStatusChange = (value: string) => {
    setPost(prev => ({ 
      ...prev, 
      status: value,
      scheduledAt: value === "SCHEDULED" ? prev.scheduledAt : ""
    }))
  }

  const handleContentChange = (content: Record<string, Block>) => {
    setPost(prev => {
      if (JSON.stringify(prev.content) === JSON.stringify(content)) {
        return prev;
      }
      return { ...prev, content };
    });
  }

  const handleMetadataChange = (metadata: Metadata[]) => {
    setPost(prev => ({ ...prev, metadata }))
  }

  // Helper to convert block content to plain text for AI
  function getPlainTextFromBlocks(blocks: Record<string, Block>): string {
    return Object.values(blocks)
      .map(block => typeof block.content === 'string' ? block.content : '')
      .join('\n\n');
  }

  // --- AI Button State ---
  const contentText = getPlainTextFromBlocks(post.content);
  const contentLength = contentText.length;
  const AI_CHAR_LIMIT = 1000;
  const aiButtonDisabled = aiLoading || !Object.keys(post.content).length || contentLength > AI_CHAR_LIMIT;
  const aiButtonText = contentLength > AI_CHAR_LIMIT ? 'Disabled' : (aiLoading ? 'Tuning up...' : 'AI Tuneup');

  const handleGetAIRecommendations = async () => {
    if (contentLength > AI_CHAR_LIMIT) {
      toast.error('Post content exceeds the 1,000 character limit for AI feedback.');
      return;
    }
    setAiLoading(true);
    setAiRecommendations(null);
    try {
      const res = await fetch('/api/posts/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentText }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get recommendations');
      }
      const data = await res.json();
      setAiRecommendations(data.recommendations);
      setShowAIModal(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to get AI recommendations');
      } else {
        toast.error('Failed to get AI recommendations');
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Apply AI suggestions to the post content as a single text block
  const handleApplyAISuggestions = async () => {
    if (!aiRecommendations) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      // Send request to rewrite post content based on accepted suggestions
      const contentText = getPlainTextFromBlocks(post.content);
      const res = await fetch('/api/posts/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentText, suggestions: aiRecommendations }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to apply suggestions');
      }
      const data = await res.json();
      const rewrittenContent = data.rewrittenContent;
      const newBlockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setPost(prev => ({
        ...prev,
        content: {
          [newBlockId]: {
            id: newBlockId,
            type: 'text',
            content: rewrittenContent,
            order: 0,
          },
        },
      }));
      setShowAIModal(false);
      toast.success('AI suggestions applied to post content!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApplyError(error.message || 'Failed to apply suggestions');
        toast.error(error.message || 'Failed to apply suggestions');
      } else {
        setApplyError('Failed to apply suggestions');
        toast.error('Failed to apply suggestions');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    // Client-side validation
    if (post.status === "SCHEDULED") {
      if (!post.scheduledAt) {
        toast.error("Please set a scheduled date and time for this post")
        return
      }
      // Validate that the date is in the future
      const scheduledDate = new Date(post.scheduledAt)
      const now = new Date()
      if (scheduledDate <= now) {
        toast.error("Scheduled date must be in the future")
        return
      }
    }

    setIsSubmitting(true)
    try {
      const url = params?.slug === "new" ? "/api/posts" : `/api/posts/${params?.slug}`
      const method = params?.slug === "new" ? "POST" : "PUT"

      // Prepare the post data, only including scheduledAt if status is SCHEDULED
      const postData = {
        ...post,
        scheduledAt: post.status === "SCHEDULED" && post.scheduledAt 
          ? new Date(post.scheduledAt).toISOString() 
          : undefined
      }

      console.log("Sending post data:", postData)

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      })

      if (!res.ok) {
        let errorMessage = "Failed to save post"
        try {
          const contentType = res.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } else {
            errorMessage = await res.text() || errorMessage
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      toast.success("Post saved successfully")
      
      if (params?.slug === "new") {
        router.push("/admin/posts")
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Error saving post:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save post")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {params?.slug === "new" ? "New Post" : "Edit Post"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-8">
        {/* Main content column */}
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="block mb-2">Title</Label>
              <Input
                id="title"
                value={post.title}
                onChange={handleTitleChange}
                placeholder="Enter post title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt" className="block mb-2">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={post.excerpt}
                onChange={handleExcerptChange}
                placeholder="Brief summary of your post"
                className="h-24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="block mb-2">Content</Label>
            <BlockEditor
              initialContent={post.content}
              onChange={handleContentChange}
              contentKey={post.slug}
              renderToolbarExtra={
                <Button
                  type="button"
                  onClick={handleGetAIRecommendations}
                  disabled={aiButtonDisabled}
                  variant="outline"
                  className="gap-2 ml-auto"
                >
                  <span className="flex items-center p-1">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                    <span className="font-semibold text-black">
                      {aiButtonText}
                    </span>
                  </span>
                </Button>
              }
            />
            <AIDockPanel
              open={showAIModal}
              onClose={() => setShowAIModal(false)}
              onApply={handleApplyAISuggestions}
              applyDisabled={!aiRecommendations || isApplying}
              isApplying={isApplying}
              applyError={applyError || undefined}
            >
              <div>{aiRecommendations}</div>
            </AIDockPanel>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-6">
          <div className="sticky top-6 space-y-6 rounded-lg border p-4">
            <div className="space-y-2">
              <Label htmlFor="slug" className="block mb-2">Slug</Label>
              <Input
                id="slug"
                value={post.slug}
                onChange={handleSlugChange}
                placeholder="post-url-slug"
                className="mt-2"
                required
              />
              <p className="text-sm text-muted-foreground">
                The URL-friendly version of the title.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="block mb-2">Status</Label>
              <Select
                value={post.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Set the status of your post.
              </p>
            </div>

            {post.status === "SCHEDULED" && (
              <div className="space-y-2">
                <Label htmlFor="scheduledAt" className="block mb-2">Schedule Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={post.scheduledAt}
                  onChange={(e) => setPost(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Choose when this post should be published.
                </p>
              </div>
            )}

            <div className="space-y-2 border-t pt-6">
              <MetadataEditor
                metadata={post.metadata}
                onChange={handleMetadataChange}
              />
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/admin/posts")}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Saving..." : "Save Post"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
} 