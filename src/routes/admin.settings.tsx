import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import Sidebar from '@/admin/components/Sidebar'
import SiteSettings from '@/admin/pages/SiteSettings'
import AccountSettings from '@/admin/pages/Settings'

export const Route = createFileRoute('/admin/settings')({
  component: UnifiedSettingsPage,
})

function UnifiedSettingsPage() {
  const [activeTab, setActiveTab] = useState<'site' | 'account'>('site')

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-gray-200 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings Manager</h1>
            <p className="text-gray-600 mt-1">Manage public site branding, contact details, SEO, and your admin profile credentials.</p>
          </div>
          <div className="flex bg-gray-200 p-1 rounded-lg self-start md:self-center">
            <button
              onClick={() => setActiveTab('site')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition cursor-pointer ${
                activeTab === 'site'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Site Settings
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Account & Security
            </button>
          </div>
        </div>

        {activeTab === 'site' ? (
          <SiteSettings hideSidebar />
        ) : (
          <AccountSettings hideSidebar />
        )}
      </div>
    </div>
  )
}
