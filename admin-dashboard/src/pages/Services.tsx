import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Plus, Edit, Trash2, Eye, EyeOff, Copy, X } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Service {
  id: string
  title: string
  slug: string
  category: string
  shortDesc: string
  longDesc: string
  showOnHomepage: boolean
  displayOrder: number
  status: string
  features: string[]
  benefits: string[]
  tags: string[]
  seoTitle?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'KITCHEN',
    shortDesc: '',
    longDesc: '',
    showOnHomepage: true,
    displayOrder: 0,
    features: [''],
    benefits: [''],
    tags: [''],
    seoTitle: '',
    seoDescription: '',
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/services?limit=100`)
      setServices(response.data.services)
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      await axios.delete(`${API_BASE}/api/services/${id}`, {
        withCredentials: true,
      })
      setServices(services.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Failed to delete service:', error)
      alert('Failed to delete service')
    }
  }

  const handleTogglePublish = async (id: string) => {
    try {
      await axios.patch(`${API_BASE}/api/services/${id}/publish`, {}, {
        withCredentials: true,
      })
      fetchServices()
    } catch (error) {
      console.error('Failed to toggle publish status:', error)
      alert('Failed to update service')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/api/services/${id}/duplicate`, {}, {
        withCredentials: true,
      })
      fetchServices()
    } catch (error) {
      console.error('Failed to duplicate service:', error)
      alert('Failed to duplicate service')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      ...formData,
      features: formData.features.filter(f => f.trim()),
      benefits: formData.benefits.filter(b => b.trim()),
      tags: formData.tags.filter(t => t.trim()),
    }

    try {
      if (editingService) {
        await axios.put(`${API_BASE}/api/services/${editingService.id}`, data, {
          withCredentials: true,
        })
      } else {
        await axios.post(`${API_BASE}/api/services`, data, {
          withCredentials: true,
        })
      }
      setShowModal(false)
      setEditingService(null)
      resetFormData()
      fetchServices()
    } catch (error) {
      console.error('Failed to save service:', error)
      alert('Failed to save service')
    }
  }

  const openEditModal = (service: Service) => {
    setEditingService(service)
    setFormData({
      title: service.title,
      slug: service.slug,
      category: service.category,
      shortDesc: service.shortDesc,
      longDesc: service.longDesc,
      showOnHomepage: service.showOnHomepage,
      displayOrder: service.displayOrder,
      features: service.features.length ? service.features : [''],
      benefits: service.benefits.length ? service.benefits : [''],
      tags: service.tags.length ? service.tags : [''],
      seoTitle: service.seoTitle || '',
      seoDescription: service.seoDescription || '',
    })
    setShowModal(true)
  }

  const resetFormData = () => {
    setFormData({
      title: '',
      slug: '',
      category: 'KITCHEN',
      shortDesc: '',
      longDesc: '',
      showOnHomepage: true,
      displayOrder: 0,
      features: [''],
      benefits: [''],
      tags: [''],
      seoTitle: '',
      seoDescription: '',
    })
  }

  const addArrayItem = (field: 'features' | 'benefits' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }))
  }

  const updateArrayItem = (field: 'features' | 'benefits' | 'tags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }))
  }

  const removeArrayItem = (field: 'features' | 'benefits' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
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
          <h1 className="text-3xl font-bold">Services</h1>
          <button
            onClick={() => {
              resetFormData()
              setEditingService(null)
              setShowModal(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            New Service
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Homepage
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{service.title}</div>
                    <div className="text-xs text-gray-500">{service.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        service.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs ${service.showOnHomepage ? 'text-green-600' : 'text-gray-400'}`}>
                      {service.showOnHomepage ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleTogglePublish(service.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title={service.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      >
                        {service.status === 'PUBLISHED' ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => handleDuplicate(service.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Duplicate"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(service)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {services.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No services yet. Create your first service to get started.
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingService ? 'Edit Service' : 'New Service'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingService(null)
                    resetFormData()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="KITCHEN">Kitchen</option>
                      <option value="BATHROOM">Bathroom</option>
                      <option value="WHOLE_HOME">Whole Home</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="EXTERIOR">Exterior</option>
                      <option value="CARPENTRY">Carpentry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Short Description *</label>
                  <input
                    type="text"
                    value={formData.shortDesc}
                    onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Long Description *</label>
                  <textarea
                    value={formData.longDesc}
                    onChange={(e) => setFormData({ ...formData, longDesc: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Features</label>
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateArrayItem('features', index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('features', index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('features')}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    + Add Feature
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Benefits</label>
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => updateArrayItem('benefits', index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {formData.benefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('benefits', index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('benefits')}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    + Add Benefit
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => updateArrayItem('tags', index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {formData.tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('tags', index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('tags')}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    + Add Tag
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">SEO Description</label>
                    <input
                      type="text"
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showOnHomepage"
                    checked={formData.showOnHomepage}
                    onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="showOnHomepage" className="text-sm font-medium">
                    Show on Homepage
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingService(null)
                      resetFormData()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Services
