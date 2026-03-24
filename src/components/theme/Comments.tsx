"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ThumbsUp,
  Heart,
  Laugh,
  Zap,
  Frown,
  Angry,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSession, signIn } from "next-auth/react"
import { Badge } from "@/components/ui/badge"

const REACTIONS = [
  { type: "LIKE", icon: ThumbsUp, label: "Like" },
  { type: "LOVE", icon: Heart, label: "Love" },
  { type: "LAUGH", icon: Laugh, label: "Laugh" },
  { type: "WOW", icon: Zap, label: "Wow" },
  { type: "SAD", icon: Frown, label: "Sad" },
  { type: "ANGRY", icon: Angry, label: "Angry" },
]

function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

function getInitials(name?: string, username?: string) {
  if (name) return name.charAt(0).toUpperCase()
  if (username) return username.charAt(0).toUpperCase()
  return "U"
}

interface Author {
  id: string
  name?: string | null
  username?: string | null
  avatar?: string | null
}

interface Reaction {
  id: string
  type: string
  userId: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author?: Author | null
  reactions: Reaction[]
  replies?: Comment[]
  isAuthor: boolean
}

export default function Comments({
  postSlug,
  authorId,
}: {
  postSlug: string
  authorId: string
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [markdownOpen, setMarkdownOpen] = useState(false)
  const [commentsEnabled, setCommentsEnabled] = useState<boolean | null>(null)
  const { data: session } = useSession()
  const user = session?.user

  useEffect(() => {
    fetch(`/api/posts/${postSlug}/comments`)
      .then((res) => res.json())
      .then(setComments)
  }, [postSlug])

  useEffect(() => {
    async function fetchPrefs() {
      if (!authorId || !session?.user) return setCommentsEnabled(null)
      const res = await fetch(`/api/users/${authorId}/preferences`)
      if (!res.ok) return setCommentsEnabled(null)
      const prefs = await res.json()
      setCommentsEnabled(!!prefs.commentsEnabled)
    }
    fetchPrefs()
  }, [authorId, session])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/posts/${postSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId: replyTo }),
    })
    if (res.ok) {
      setContent("")
      setReplyTo(null)
      fetch(`/api/posts/${postSlug}/comments`)
        .then((res) => res.json())
        .then(setComments)
    }
    setSubmitting(false)
  }

  async function handleReact(commentId: string, type: string, reacted: boolean) {
    if (!user?.id) return
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              reactions: reacted
                ? c.reactions.filter(
                    (r) => !(r.type === type && r.userId === user.id)
                  )
                : [...c.reactions, { id: "optimistic", type, userId: user.id }],
            }
          : {
              ...c,
              replies: c.replies?.map((r) =>
                r.id === commentId
                  ? {
                      ...r,
                      reactions: reacted
                        ? r.reactions.filter(
                            (rx) => !(rx.type === type && rx.userId === user.id)
                          )
                        : [
                            ...r.reactions,
                            { id: "optimistic", type, userId: user.id },
                          ],
                    }
                  : r
              ),
            }
      )
    )
    const url = `/api/posts/${postSlug}/comments/${commentId}/reactions`
    if (reacted) {
      await fetch(`${url}?type=${type}`, { method: "DELETE" })
    } else {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
    }
    fetch(`/api/posts/${postSlug}/comments`)
      .then((res) => res.json())
      .then(setComments)
  }

  function renderReactions(comment: Comment) {
    return (
      <div className="flex gap-2 !mt-2 bg-muted/85 rounded-md !p-2">
        {REACTIONS.map((r) => {
          const count = comment.reactions.filter((rx) => rx.type === r.type).length
          const reacted = user
            ? comment.reactions.some(
                (rx) => rx.type === r.type && rx.userId === user.id
              )
            : false
          const Icon = r.icon
          return (
            <Button
              key={r.type}
              size="sm"
              variant="outline"
              className="!p-2"
              onClick={() => handleReact(comment.id, r.type, reacted)}
              title={r.label}
              disabled={!user}
            >
              <Icon className="w-4 h-4" />
              {count > 0 && <span className="!ml-1 text-md">{count}</span>}
            </Button>
          )
        })}
      </div>
    )
  }

  function renderComment(comment: Comment, level = 0, isLast = false) {
    return (
      <div
        key={comment.id}
        className={`flex gap-3 mb-6 ${level > 0 ? "ml-8 !mt-8" : ""}`}
        style={{
          borderBottom: level === 0 && !isLast ? "1px solid #ccc" : undefined,
        }}
      >
        <Avatar>
          {comment.author?.avatar ? (
            <AvatarImage
              src={comment.author.avatar}
              alt={comment.author.name || comment.author.username || "User"}
            />
          ) : (
            <AvatarFallback>
              {getInitials(
                comment.author?.name ?? undefined,
                comment.author?.username ?? undefined
              )}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {comment.author?.name || comment.author?.username || "Anonymous"}
            </span>
            {comment.isAuthor && (
              <Badge variant="default" className="ml-1 !px-2 !py-1">
                Author
              </Badge>
            )}
            <span className="text-md text-black/50">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <div className="mt-1 mb-2 text-base">
            <ReactMarkdown>{comment.content}</ReactMarkdown>
          </div>
          {renderReactions(comment)}
          {level < 2 && (
            <div className="!mt-2">
              <Button
                size="sm"
                className="!px-4 !py-2 border-border border-[1px] !text-md"
                variant="ghost"
                onClick={() => setReplyTo(comment.id)}
              >
                Reply
              </Button>
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div>
              {(comment.replies ?? []).map((reply, idx) =>
                renderComment(
                  reply,
                  level + 1,
                  idx === (comment.replies?.length ?? 0) - 1
                )
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (commentsEnabled === false) {
    return (
      <section className="!mt-16 border-t border-stone-200 pt-10">
        <h3 className="text-xl font-heading font-medium mb-4">Discussion</h3>
        <div className="text-muted-foreground">
          Comments have been disabled by the author.
        </div>
      </section>
    )
  }

  return (
    <section className="!mt-16 border-t border-stone-200 pt-10">
      <h3 className="text-xl font-heading font-medium mb-4">Discussion</h3>
      {session?.user ? (
        <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-2">
          {replyTo && (
            <div className="text-sm mb-1">
              Replying to comment...{" "}
              <Button size="sm" variant="link" onClick={() => setReplyTo(null)}>
                Cancel
              </Button>
            </div>
          )}
          <Textarea
            className="!p-4"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
            rows={3}
            required
          />
          <Dialog open={markdownOpen} onOpenChange={setMarkdownOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-xs text-muted-foreground underline text-left w-fit"
                tabIndex={0}
              >
                Markdown supported
              </button>
            </DialogTrigger>
            <DialogContent className="!px-8 !py-4">
              <DialogTitle>Markdown supported</DialogTitle>
              <ul className="list-disc !pl-4 space-y-2 text-md">
                <li>
                  <b>Headings:</b> <code># H1</code>, <code>## H2</code>,{" "}
                  <code>### H3</code>
                </li>
                <li>
                  <b>Bold:</b> <code>**bold**</code> or <code>__bold__</code>
                </li>
                <li>
                  <b>Italic:</b> <code>*italic*</code> or <code>_italic_</code>
                </li>
                <li>
                  <b>Links:</b> <code>[text](url)</code>
                </li>
                <li>
                  <b>Lists:</b> <code>- item</code> or <code>* item</code>
                </li>
                <li>
                  <b>Code:</b> <code>`inline code`</code> or{" "}
                  <code>```block code```</code>
                </li>
                <li>
                  <b>Blockquotes:</b> <code>&gt; quote</code>
                </li>
                <li>
                  <b>Images:</b> <code>![alt](url)</code>
                </li>
              </ul>
            </DialogContent>
          </Dialog>
          <Button
            type="submit"
            disabled={submitting}
            className="!px-4 !py-6 !mt-0 self-end"
          >
            {submitting ? "Posting..." : replyTo ? "Reply" : "Comment"}
          </Button>
        </form>
      ) : (
        <div className="!mb-8 flex bg-muted/85 rounded-md !p-4 flex-col gap-2 items-center">
          <div className="text-muted-foreground mb-2">
            You must be logged in to comment.
          </div>
          <Button onClick={() => signIn()} className="w-fit !px-4 font-semibold !py-2">
            Log in
          </Button>
        </div>
      )}
      <div className="!mt-8">
        {comments.length === 0 && (
          <div className="text-muted-foreground">
            No comments yet. Be the first to comment.
          </div>
        )}
        {comments.map((comment, idx) =>
          renderComment(comment, 0, idx === comments.length - 1)
        )}
      </div>
    </section>
  )
}
