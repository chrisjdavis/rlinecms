"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator"
import { ImageUpload } from "@/components/image-upload"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { ProfileLink } from '@/types/profileLink'
import { UserPreferencesForm } from "./components/UserPreferencesForm"

export default function EditUserPage() {
  const params = useParams<{ id?: string }>() || {}
  const id = params.id;
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER", bio: "", username: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [links, setLinks] = useState<ProfileLink[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLink, setEditingLink] = useState<{ title: string; url: string }>({ title: '', url: '' })

  useEffect(() => {
    if (!id) {
      toast.error("Invalid user ID.")
      setLoading(false)
      return
    }
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/${id}`)
        if (!res.ok) throw new Error("Failed to fetch user")
        const data = await res.json()
        setForm({ ...data, password: "" })
        setAvatar(data.avatar || null)
      } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(err.message)
        } else {
          toast.error("An unknown error occurred")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id])

  // Fetch profile links
  useEffect(() => {
    if (!id) return
    setLinksLoading(true)
    fetch(`/api/users/${id}/links`)
      .then(res => res.json())
      .then(setLinks)
      .catch(() => toast.error('Failed to load profile links'))
      .finally(() => setLinksLoading(false))
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) {
      toast.error("Invalid user ID.")
      return
    }
    setSaving(true)
    try {
      // Only send fields that are not empty strings, except for bio: send null if empty
      const payload: Record<string, string | null> = {}
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'bio') {
          if (typeof value === 'string' && value.trim() === "") {
            payload.bio = null
          } else if (typeof value === 'string') {
            payload.bio = value
          }
        } else if (key === 'username') {
          if (typeof value === 'string' && value.trim() === "") {
            payload.username = null
          } else if (typeof value === 'string') {
            payload.username = value
          }
        } else if (typeof value === 'string') {
          if (value.trim() !== "") payload[key] = value
        } else if (value !== undefined && value !== null) {
          payload[key] = value
        }
      })
      if (avatar) payload.avatar = avatar
      const res = await fetch(`/api/users/${id}` , {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to update user")
      }
      toast.success("User updated successfully")
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error("An unknown error occurred")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(url: string) {
    setAvatar(url)
    // Save avatar to user profile
    if (id) {
      await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: url }),
      })
      toast.success("Avatar updated!")
    }
  }

  // Add new link
  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault()
    if (!newLink.title || !newLink.url) return toast.error('Title and URL required')
    const res = await fetch(`/api/users/${id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newLink, order: links.length }),
    })
    if (!res.ok) return toast.error('Failed to add link')
    const link = await res.json()
    setLinks([...links, link])
    setNewLink({ title: '', url: '' })
    toast.success('Link added')
  }

  // Start editing
  function startEdit(link: ProfileLink) {
    setEditingId(link.id)
    setEditingLink({ title: link.title, url: link.url })
  }

  // Save edit
  async function handleEditLink(link: ProfileLink) {
    const res = await fetch(`/api/users/${id}/links`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: link.id, ...editingLink, order: link.order }),
    })
    if (!res.ok) return toast.error('Failed to update link')
    const updated = await res.json()
    setLinks(links.map(l => (l.id === link.id ? updated : l)))
    setEditingId(null)
    toast.success('Link updated')
  }

  // Delete link
  async function handleDeleteLink(link: ProfileLink) {
    if (!confirm('Delete this link?')) return
    const res = await fetch(`/api/users/${id}/links`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: link.id }),
    })
    if (!res.ok) return toast.error('Failed to delete link')
    setLinks(links.filter(l => l.id !== link.id))
    toast.success('Link deleted')
  }

  // Move link up/down
  async function moveLink(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= links.length) return
    const reordered = [...links]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    // Update order in DB
    await Promise.all(
      reordered.map((l, i) =>
        fetch(`/api/users/${id}/links`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: l.id, order: i, title: l.title, url: l.url }),
        })
      )
    )
    setLinks(reordered.map((l, i) => ({ ...l, order: i })))
  }

  if (!id) return <div>Invalid user ID.</div>

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Edit User</h2>
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="mb-4 w-full grid grid-cols-4">
          <TabsTrigger value="main">Main</TabsTrigger>
          <TabsTrigger value="links">Profile Links</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="main">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-2 mb-4">
              <Avatar className="h-20 w-20 mb-2">
                {avatar ? (
                  <AvatarImage src={avatar} alt={form.name || form.email || "User"} />
                ) : (
                  <AvatarFallback>{form.name?.charAt(0) || form.email?.charAt(0) || "U"}</AvatarFallback>
                )}
              </Avatar>
              <ImageUpload onUpload={handleAvatarUpload} />
            </div>
            <Input
              name="name"
              placeholder="Name"
              value={form.name || ""}
              onChange={handleChange}
            />
            <Input
              name="username"
              placeholder="Username (optional)"
              value={form.username || ""}
              onChange={handleChange}
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              name="password"
              type="password"
              placeholder="New Password (leave blank to keep current)"
              value={form.password}
              onChange={handleChange}
            />
            <div className="space-y-1">
              <PasswordStrengthIndicator password={form.password} />
              <p className="text-sm text-muted-foreground">
                Your password must be at least 8 characters long and contain at least one number, one uppercase letter, and one special character
              </p>
            </div>
            <textarea
              name="bio"
              placeholder="Bio (optional)"
              value={form.bio || ""}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 min-h-[80px]"
              maxLength={500}
            />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="COMMENTER">Commenter</option>
            </select>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="links">
          <div>
            <h3 className="font-semibold mb-2">Profile Links</h3>
            {linksLoading ? (
              <div>Loading links...</div>
            ) : (
              <ul className="space-y-2 mb-4">
                {links.sort((a, b) => a.order - b.order).map((link, idx) => (
                  <li key={link.id} className="flex items-center justify-around gap-2">
                    {editingId === link.id ? (
                      <>
                        <Input
                          value={editingLink.title}
                          onChange={e => setEditingLink({ ...editingLink, title: e.target.value })}
                          placeholder="Title"
                          className="!w-48"
                        />
                        <Input
                          value={editingLink.url}
                          onChange={e => setEditingLink({ ...editingLink, url: e.target.value })}
                          placeholder="URL"
                          className="!w-64"
                        />
                        <Button size="sm" onClick={() => handleEditLink(link)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <span className="w-48 truncate" title={link.title}>{link.title}</span>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="w-64 truncate text-primary underline" title={link.url}>{link.url}</a>
                        </div>
                        <div className="flex gap-0">
                          <Button size="icon" variant="ghost" onClick={() => moveLink(idx, -1)} disabled={idx === 0} title="Move up">↑</Button>
                          <Button size="icon" variant="ghost" onClick={() => moveLink(idx, 1)} disabled={idx === links.length - 1} title="Move down">↓</Button>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(link)}>Edit</Button>
                          <Button size="sm" variant="default" onClick={() => handleDeleteLink(link)}>Delete</Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAddLink} className="flex gap-2 items-center">
              <Input
                value={newLink.title}
                onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                placeholder="Title"
                className="w-32"
              />
              <Input
                value={newLink.url}
                onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="URL"
                className="w-48"
              />
              <Button type="submit" size="sm">Add</Button>
            </form>
          </div>
        </TabsContent>
        <TabsContent value="preferences">
          <UserPreferencesForm userId={id || ''} />
        </TabsContent>
        <TabsContent value="security">
          {/* Security settings will be added here */}
        </TabsContent>
      </Tabs>
    </div>
  )
} 