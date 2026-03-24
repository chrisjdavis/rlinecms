import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { projectRepository } from "@/lib/repositories/projectRepository"
import { ProjectForm } from "../_components/project-form"

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const { id } = await params
  const project = await projectRepository.findById(id)

  if (!project) {
    redirect("/admin/projects")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Edit Project</h3>
        <p className="text-sm text-muted-foreground">
          Update this project in the homepage carousel.
        </p>
      </div>
      <ProjectForm project={project} />
    </div>
  )
}
