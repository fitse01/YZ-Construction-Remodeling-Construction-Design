import { createFileRoute } from '@tanstack/react-router'
import MediaLibrary from '@/admin/pages/MediaLibrary'

export const Route = createFileRoute('/admin/gallery')({
  component: () => <MediaLibrary initialType="image" />,
})
