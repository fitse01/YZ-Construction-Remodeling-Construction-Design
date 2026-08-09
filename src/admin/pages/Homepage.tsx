import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Save, Image as ImageIcon } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface HomePage {
  id: string
  heroTitle: string
  heroSubtitle: string
  heroCtaText: string
  heroCtaLink: string
  heroImageId?: string
  heroImage?: {
    id: string
    url: string
  }
  statsTitle?: string
  statsSubtitle?: string
  servicesTitle: string
  servicesSubtitle: string
  projectsTitle: string
  projectsSubtitle: string
  testimonialsTitle: string
  testimonialsSubtitle: string
  ctaTitle: string
  ctaSubtitle: string
  ctaButtonText: string
  ctaButtonLink: string
  updatedAt: string
}

const Homepage = () => {
  const [homePage, setHomePage] = useState<HomePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    heroTitle: '',
    heroSubtitle: '',
    heroCtaText: '',
    heroCtaLink: '',
    heroImageId: '',
    statsTitle: '',
    statsSubtitle: '',
    servicesTitle: '',
    servicesSubtitle: '',
    projectsTitle: '',
    projectsSubtitle: '',
    testimonialsTitle: '',
    testimonialsSubtitle: '',
    ctaTitle: '',
    ctaSubtitle: '',
    ctaButtonText: '',
    ctaButtonLink: '',
  })

  useEffect(() => {
    fetchHomePage()
  }, [])

  const fetchHomePage = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/settings/homepage`)
      setHomePage(response.data)
      setFormData({
        heroTitle: response.data.heroTitle,
        heroSubtitle: response.data.heroSubtitle,
        heroCtaText: response.data.heroCtaText,
        heroCtaLink: response.data.heroCtaLink,
        heroImageId: response.data.heroImageId || '',
        statsTitle: response.data.statsTitle || '',
        statsSubtitle: response.data.statsSubtitle || '',
        servicesTitle: response.data.servicesTitle,
        servicesSubtitle: response.data.servicesSubtitle,
        projectsTitle: response.data.projectsTitle,
        projectsSubtitle: response.data.projectsSubtitle,
        testimonialsTitle: response.data.testimonialsTitle,
        testimonialsSubtitle: response.data.testimonialsSubtitle,
        ctaTitle: response.data.ctaTitle,
        ctaSubtitle: response.data.ctaSubtitle,
        ctaButtonText: response.data.ctaButtonText,
        ctaButtonLink: response.data.ctaButtonLink,
      })
    } catch (error) {
      console.error('Failed to fetch homepage content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await axios.put(`${API_BASE}/api/settings/homepage`, formData, {
        withCredentials: true,
      })
      alert('Homepage content saved successfully!')
      fetchHomePage()
    } catch (error) {
      console.error('Failed to save homepage content:', error)
      alert('Failed to save homepage content')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-gray-600">Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Homepage Content</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Hero Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon size={20} />
              Hero Section
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Hero Title</label>
                <input
                  type="text"
                  value={formData.heroTitle}
                  onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hero Subtitle</label>
                <textarea
                  value={formData.heroSubtitle}
                  onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.heroCtaText}
                    onChange={(e) => setFormData({ ...formData, heroCtaText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Button Link</label>
                  <input
                    type="text"
                    value={formData.heroCtaLink}
                    onChange={(e) => setFormData({ ...formData, heroCtaLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="/contact"
                  />
                </div>
              </div>
              {homePage?.heroImage && (
                <div>
                  <label className="block text-sm font-medium mb-2">Current Hero Image</label>
                  <img
                    src={homePage.heroImage.url}
                    alt="Hero"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Stats Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stats Title</label>
                <input
                  type="text"
                  value={formData.statsTitle}
                  onChange={(e) => setFormData({ ...formData, statsTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stats Subtitle</label>
                <textarea
                  value={formData.statsSubtitle}
                  onChange={(e) => setFormData({ ...formData, statsSubtitle: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Services Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Services Title</label>
                <input
                  type="text"
                  value={formData.servicesTitle}
                  onChange={(e) => setFormData({ ...formData, servicesTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Services Subtitle</label>
                <textarea
                  value={formData.servicesSubtitle}
                  onChange={(e) => setFormData({ ...formData, servicesSubtitle: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Projects Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Projects Title</label>
                <input
                  type="text"
                  value={formData.projectsTitle}
                  onChange={(e) => setFormData({ ...formData, projectsTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Projects Subtitle</label>
                <textarea
                  value={formData.projectsSubtitle}
                  onChange={(e) => setFormData({ ...formData, projectsSubtitle: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Testimonials Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Testimonials Title</label>
                <input
                  type="text"
                  value={formData.testimonialsTitle}
                  onChange={(e) => setFormData({ ...formData, testimonialsTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Testimonials Subtitle</label>
                <textarea
                  value={formData.testimonialsSubtitle}
                  onChange={(e) => setFormData({ ...formData, testimonialsSubtitle: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Call to Action Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">CTA Title</label>
                <input
                  type="text"
                  value={formData.ctaTitle}
                  onChange={(e) => setFormData({ ...formData, ctaTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CTA Subtitle</label>
                <textarea
                  value={formData.ctaSubtitle}
                  onChange={(e) => setFormData({ ...formData, ctaSubtitle: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.ctaButtonText}
                    onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CTA Button Link</label>
                  <input
                    type="text"
                    value={formData.ctaButtonLink}
                    onChange={(e) => setFormData({ ...formData, ctaButtonLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="/contact"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Homepage
