import { render, screen, waitFor, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import PostsPage from "./page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe("PostsPage", () => {
  const mockResponse = {
    posts: [
      {
        id: "1",
        title: "First Post",
        slug: "first-post",
        status: "draft" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Second Post",
        slug: "second-post",
        status: "published" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    total: 2,
  }

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        }) as unknown as Promise<Response>
      )
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("removes a post from the table when a delete event occurs", async () => {
    render(<PostsPage />)

    await screen.findByText("First Post")
    await screen.findByText("Second Post")

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("post-deleted", { detail: { postId: "1" } })
      )
    })

    await waitFor(() => {
      expect(screen.queryByText("First Post")).not.toBeInTheDocument()
    })

    expect(screen.getByText(/Showing 1 of 1 posts/i)).toBeInTheDocument()
  })
})
