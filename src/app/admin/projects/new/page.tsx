import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ProjectForm } from "../_components/project-form"

export default async function NewProjectPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Project</h3>
        <p className="text-sm text-muted-foreground">
          Add a new project to the homepage carousel.
        </p>
      </div>
      <ProjectForm />
    </div>
  )
}
