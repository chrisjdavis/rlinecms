import { ThemesForm } from "./ThemesForm"
import { section } from "@/components/theme/admin"

export default function ThemesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Minimal theme</h1>
      <div className={section({ spacing: "lg" })}>
        <ThemesForm />
      </div>
    </div>
  )
}
