import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Mail, Trash2, Search } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface Message {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  isRead: boolean
  createdAt: string
}

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/messages?limit=100`, {
        withCredentials: true,
      })
      setMessages(response.data.messages)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.patch(`${API_BASE}/api/messages/${id}/read`, {}, {
        withCredentials: true,
      })
      setMessages(messages.map((m) => (m.id === id ? { ...m, isRead: true } : m)))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await axios.delete(`${API_BASE}/api/messages/${id}`, {
        withCredentials: true,
      })
      setMessages(messages.filter((m) => m.id !== id))
      if (selectedMessage?.id === id) {
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
      alert('Failed to delete message')
    }
  }

  const filteredMessages = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMessages.map((message) => (
                <tr
                  key={message.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    !message.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!message.isRead) handleMarkAsRead(message.id)
                    setSelectedMessage(message)
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="mr-2 text-gray-400" size={16} />
                      <span className={`text-sm ${!message.isRead ? 'font-semibold' : ''}`}>
                        {message.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {message.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!message.isRead && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(message.id)
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMessages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No messages found.
            </div>
          )}
        </div>

        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{selectedMessage.name}</h2>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {selectedMessage.email}
                  </p>
                  {selectedMessage.phone && (
                    <p className="text-sm text-gray-600">
                      <strong>Phone:</strong> {selectedMessage.phone}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Messages
