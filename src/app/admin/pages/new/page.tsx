import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PageForm } from '../_components/page-form'

export default async function NewPagePage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return <PageForm />
} 