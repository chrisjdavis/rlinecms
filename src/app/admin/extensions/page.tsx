import { ModulesForm } from "@/app/admin/settings/ModulesForm"
import { section } from "@/components/theme/admin"

export default function ExtensionsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Extensions</h1>
      <div className={section({ spacing: "lg" })}>
        <ModulesForm />
      </div>
    </div>
  )
}
