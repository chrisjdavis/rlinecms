"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator"
import { ImageUpload } from "@/components/image-upload"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function NewUserPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    bio: "",
    role: "USER",
    sendWelcomeEmail: false,
  })
  const [loading, setLoading] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  function handleAvatarUpload(url: string) {
    setAvatar(url)
    setForm(prev => ({ ...prev, avatar: url }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || data.errors?.[0]?.message || "Failed to create user")
      }
      toast.success("User created successfully")
      router.push("/admin/users")
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

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Create New User</h2>
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
          value={form.name}
          onChange={handleChange}
        />
        <Input
          name="username"
          placeholder="Username (optional)"
          value={form.username}
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
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
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
          value={form.bio}
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="sendWelcomeEmail"
            checked={form.sendWelcomeEmail}
            onChange={handleChange}
          />
          Send welcome email
        </label>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create User"}
        </Button>
      </form>
    </div>
  )
} 