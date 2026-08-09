import { createFileRoute } from '@tanstack/react-router'
import Homepage from '@/admin/pages/Homepage'

export const Route = createFileRoute('/admin/homepage')({
  component: Homepage,
})
