import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { FolderOpen, MessageSquare, Clock } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface DashboardStats {
  totalProjects: number
  publishedProjects: number
  unreadMessages: number
  recentActivity: any[]
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    publishedProjects: 0,
    unreadMessages: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [projectsRes, messagesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/projects?limit=100`),
        axios.get(`${API_BASE}/api/messages?unread=true`, {
          withCredentials: true,
        }),
      ])

      setStats({
        totalProjects: projectsRes.data.projects.length,
        publishedProjects: projectsRes.data.projects.filter((p: any) => p.status === 'PUBLISHED').length,
        unreadMessages: messagesRes.data.pagination.total,
        recentActivity: [],
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
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
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Projects</p>
                <p className="text-3xl font-bold">{stats.totalProjects}</p>
              </div>
              <FolderOpen className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Published Projects</p>
                <p className="text-3xl font-bold">{stats.publishedProjects}</p>
              </div>
              <FolderOpen className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Unread Messages</p>
                <p className="text-3xl font-bold">{stats.unreadMessages}</p>
              </div>
              <MessageSquare className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock size={24} />
            Recent Activity
          </h2>
          {stats.recentActivity.length === 0 ? (
            <p className="text-gray-500">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <li key={index} className="text-gray-600">
                  {activity.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
