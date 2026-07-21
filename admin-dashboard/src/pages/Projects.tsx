import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Project {
  id: string
  title: string
  description: string
  category: string
  status: string
  displayOrder: number
  images: any[]
  videos: any[]
  createdAt: string
  updatedAt: string
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/projects?limit=100`)
      setProjects(response.data.projects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      await axios.delete(`${API_BASE}/api/projects/${id}`, {
        withCredentials: true,
      })
      setProjects(projects.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project')
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      await axios.patch(`${API_BASE}/api/projects/${id}/publish`, {}, {
        withCredentials: true,
      })
      fetchProjects()
    } catch (error) {
      console.error('Failed to toggle publish status:', error)
      alert('Failed to update project')
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
          <h1 className="text-3xl font-bold">Projects</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            New Project
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
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {project.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleTogglePublish(project.id, project.status)}
                        className="text-blue-600 hover:text-blue-900"
                        title={project.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      >
                        {project.status === 'PUBLISHED' ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => setEditingProject(project)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
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
          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No projects yet. Create your first project to get started.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Projects
