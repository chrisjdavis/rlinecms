import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { DataTable } from "@/components/ui/data-table"
import { columns, type Page } from "./columns"

export default async function PagesPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const pages = await prisma.page.findMany({
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      author: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  const tableData: Page[] = pages.map((page) => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    author: page.author.name || page.author.email,
    updatedAt: page.updatedAt,
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">Pages</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage your site&apos;s pages.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pages/new">
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        searchKey="title"
      />
    </div>
  )
} 