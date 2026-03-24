import { redirect } from 'next/navigation'
import { auth } from '@/auth/auth'
import { isFirstRunSetupRequired } from '@/lib/site-setup'
import { SetupWizardClient } from './SetupWizardClient'

export default async function AdminSetupPage() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/admin')
  }

  const needsSetup = await isFirstRunSetupRequired()
  if (!needsSetup) {
    redirect('/admin')
  }

  return <SetupWizardClient />
}
