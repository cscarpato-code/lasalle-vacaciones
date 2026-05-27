import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

type Props = {
  params: Promise<{ sector: string }>
}

export default async function SectorLoginPage({ params }: Props) {
  const { sector: slug } = await params

  console.log('[sector/page] slug:', slug)
  console.log('[sector/page] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('[sector/page] ANON_KEY present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const supabase = await createClient()
  const { data: sector, error } = await supabase
    .from('sectores')
    .select('nombre, slug')
    .eq('slug', slug)
    .single()

  console.log('[sector/page] query result — data:', sector, '| error:', error)

  if (!sector) {
    console.log('[sector/page] REDIRECT → / (sector not found, error code:', error?.code, ')')
    redirect('/')
  }

  return <LoginForm sector={sector} />
}
