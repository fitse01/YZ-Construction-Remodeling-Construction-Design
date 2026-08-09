import { createFileRoute } from '@tanstack/react-router'
import Dashboard from '@/admin/pages/Dashboard'

export const Route = createFileRoute('/admin/dashboard')({
  component: Dashboard,
})
