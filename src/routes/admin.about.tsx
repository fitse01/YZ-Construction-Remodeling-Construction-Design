import { createFileRoute } from '@tanstack/react-router'
import About from '@/admin/pages/About'

export const Route = createFileRoute('/admin/about')({
  component: About,
})
