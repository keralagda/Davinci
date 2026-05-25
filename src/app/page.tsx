'use client'
import { AppMain } from '@/components/app-main'
import { AuthGate } from '@/components/auth-gate'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const { isLoggedIn } = useAppStore()

  if (!isLoggedIn) {
    return <AuthGate />
  }

  return <AppMain />
}
