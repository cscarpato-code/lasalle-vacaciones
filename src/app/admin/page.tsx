import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import AdminLoginForm from './AdminLoginForm'

export default async function AdminPage() {
  const session = await getAdminSession()
  if (session) redirect('/admin/dashboard')
  return <AdminLoginForm />
}
