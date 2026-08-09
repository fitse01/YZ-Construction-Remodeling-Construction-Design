import { createFileRoute } from '@tanstack/react-router'
import Messages from '@/admin/pages/Messages'

export const Route = createFileRoute('/admin/messages')({
  component: Messages,
})
