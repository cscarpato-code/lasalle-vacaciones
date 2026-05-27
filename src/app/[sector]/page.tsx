import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'

type Props = {
  params: Promise<{ sector: string }>
}

export default async function SectorLoginPage({ params }: Props) {
  const { sector: slug } = await params

  const supabase = await createClient()
  const { data: sector } = await supabase
    .from('sectores')
    .select('nombre, slug')
    .eq('slug', slug)
    .single()

  if (!sector) {
    redirect('/')
  }

  return <LoginForm sector={sector} />
}
