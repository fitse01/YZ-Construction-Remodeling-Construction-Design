import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { FolderOpen, FileText, Image, Video, Mail, PlusCircle, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Stats {
  totalProjects: number
  publishedProjects: number
  draftProjects: number
  totalServices: number
  publishedServices: number
  totalImages: number
  totalVideos: number
  totalMessages: number
  unreadMessages: number
  recentMessages: any[]
  recentMedia: any[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    publishedProjects: 0,
    draftProjects: 0,
    totalServices: 0,
    publishedServices: 0,
    totalImages: 0,
    totalVideos: 0,
    totalMessages: 0,
    unreadMessages: 0,
    recentMessages: [],
    recentMedia: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, servicesRes, messagesRes, mediaRes] = await Promise.all([
        fetch('/api/projects?limit=100').then(r => r.json()),
        fetch('/api/services?limit=100').then(r => r.json()),
        fetch('/api/messages?limit=10').then(r => r.json()),
        fetch('/api/media?limit=6').then(r => r.json()),
      ])

      const projects = projectsRes.projects || []
      const services = servicesRes.services || []
      const mediaList = mediaRes.media || []

      setStats({
        totalProjects: projects.length,
        publishedProjects: projects.filter((p: any) => p.status === 'PUBLISHED').length,
        draftProjects: projects.filter((p: any) => p.status === 'DRAFT').length,
        totalServices: services.length,
        publishedServices: services.filter((s: any) => s.status === 'PUBLISHED').length,
        totalImages: mediaList.filter((m: any) => m.type === 'image').length,
        totalVideos: mediaList.filter((m: any) => m.type === 'video').length,
        totalMessages: messagesRes.pagination?.total || 0,
        unreadMessages: messagesRes.unreadCount || 0,
        recentMessages: messagesRes.messages || [],
        recentMedia: mediaList,
      })
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8 text-gray-500">Loading overview...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Welcome back. Here is what is happening across YZ Construction.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/projects"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow"
            >
              <PlusCircle size={18} />
              <span>New Project</span>
            </Link>
            <Link
              to="/services"
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow"
            >
              <PlusCircle size={18} />
              <span>New Service</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Projects</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProjects}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600 font-semibold">{stats.publishedProjects} Published</span> · {stats.draftProjects} Drafts
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FolderOpen size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Services Offered</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalServices}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600 font-semibold">{stats.publishedServices} Active</span> on website
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Media Library</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalImages + stats.totalVideos}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalImages} Images · {stats.totalVideos} Videos
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Image size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Messages & Leads</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalMessages}</h3>
                <p className="text-xs text-orange-600 font-semibold mt-1">
                  {stats.unreadMessages} Unread Inquiry
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Mail size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Newest Messages */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recent Inquiries</h2>
                <p className="text-xs text-gray-500">Latest website submissions</p>
              </div>
              <Link to="/messages" className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View All <ArrowUpRight size={16} />
              </Link>
            </div>

            {stats.recentMessages.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No messages received yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recentMessages.slice(0, 5).map(msg => (
                  <div key={msg.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{msg.name}</span>
                        {!msg.isRead && (
                          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            UNREAD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{msg.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Recent Uploads */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Management</h2>
              <div className="space-y-2.5">
                <Link
                  to="/homepage"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <span>Edit Homepage Banner & Copy</span>
                  <ArrowUpRight size={16} />
                </Link>
                <Link
                  to="/services"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <span>Manage Company Services</span>
                  <ArrowUpRight size={16} />
                </Link>
                <Link
                  to="/media/images"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <span>Upload & Organise Media</span>
                  <ArrowUpRight size={16} />
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <span>Site Phone, Address & Logo</span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
