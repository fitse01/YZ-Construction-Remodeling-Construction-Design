import { createFileRoute } from '@tanstack/react-router'
import Journal from '@/admin/pages/Journal'

export const Route = createFileRoute('/admin/journal')({
  component: Journal,
})
