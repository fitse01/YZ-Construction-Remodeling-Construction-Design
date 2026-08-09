import { createFileRoute } from '@tanstack/react-router'
import Projects from '@/admin/pages/Projects'

export const Route = createFileRoute('/admin/projects')({
  component: Projects,
})
