import { Link, useLocation } from 'react-router-dom'
import { Layout, FolderOpen, MessageSquare, Settings, LogOut, Home, FileText, Image, Video, Mail, Globe, User, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const Sidebar = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    media: false,
    communication: false,
    website: false,
    account: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const navItems = [
    { path: '/', icon: Layout, label: 'Dashboard', section: null },
  ]

  const contentItems = [
    { path: '/homepage', icon: Home, label: 'Homepage' },
    { path: '/services', icon: FileText, label: 'Services' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/gallery', icon: Image, label: 'Gallery' },
    { path: '/testimonials', icon: MessageSquare, label: 'Testimonials' },
  ]

  const mediaItems = [
    { path: '/media/images', icon: Image, label: 'Images' },
    { path: '/media/videos', icon: Video, label: 'Videos' },
  ]

  const communicationItems = [
    { path: '/messages', icon: Mail, label: 'Messages' },
  ]

  const websiteItems = [
    { path: '/settings/navigation', icon: Globe, label: 'Navigation' },
    { path: '/settings/seo', icon: Globe, label: 'SEO' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  const accountItems = [
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings/security', icon: Settings, label: 'Security' },
  ]

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">YZ Construction</h1>
        <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {/* Dashboard */}
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}

          {/* Content Section */}
          <li>
            <button
              onClick={() => toggleSection('content')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} />
                <span>Content</span>
              </div>
              {expandedSections.content ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.content && (
              <ul className="mt-2 ml-4 space-y-1">
                {contentItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          isActive(item.path)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>

          {/* Media Section */}
          <li>
            <button
              onClick={() => toggleSection('media')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Image size={20} />
                <span>Media</span>
              </div>
              {expandedSections.media ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.media && (
              <ul className="mt-2 ml-4 space-y-1">
                {mediaItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          isActive(item.path)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>

          {/* Communication Section */}
          <li>
            <button
              onClick={() => toggleSection('communication')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Mail size={20} />
                <span>Communication</span>
              </div>
              {expandedSections.communication ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.communication && (
              <ul className="mt-2 ml-4 space-y-1">
                {communicationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          isActive(item.path)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>

          {/* Website Section */}
          <li>
            <button
              onClick={() => toggleSection('website')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe size={20} />
                <span>Website</span>
              </div>
              {expandedSections.website ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.website && (
              <ul className="mt-2 ml-4 space-y-1">
                {websiteItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          isActive(item.path)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>

          {/* Account Section */}
          <li>
            <button
              onClick={() => toggleSection('account')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User size={20} />
                <span>Account</span>
              </div>
              {expandedSections.account ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {expandedSections.account && (
              <ul className="mt-2 ml-4 space-y-1">
                {accountItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          isActive(item.path)
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="mb-4">
          <p className="text-sm text-gray-400">Logged in as:</p>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
