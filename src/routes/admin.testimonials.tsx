import { createFileRoute } from '@tanstack/react-router'
import Testimonials from '@/admin/pages/Testimonials'

export const Route = createFileRoute('/admin/testimonials')({
  component: Testimonials,
})
