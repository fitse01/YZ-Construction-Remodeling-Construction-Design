import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { Image, Video, Upload, Search, Trash2, Copy, Check, Folder, FileText } from 'lucide-react'

interface MediaItem {
  id: string
  folder: string
  type: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  createdAt: string
}

export default function MediaLibrary({ initialType = 'all' }: { initialType?: string }) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [activeFolder, setActiveFolder] = useState('all')
  const [activeType, setActiveType] = useState(initialType)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const folders = [
    { id: 'all', label: 'All Media' },
    { id: 'projects', label: 'Projects' },
    { id: 'services', label: 'Services' },
    { id: 'hero', label: 'Hero' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'logo', label: 'Logos' },
    { id: 'videos', label: 'Videos' },
    { id: 'documents', label: 'Documents' },
  ]

  useEffect(() => {
    fetchMedia()
  }, [activeFolder, activeType, search])

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeFolder !== 'all') params.append('folder', activeFolder)
      if (activeType !== 'all') params.append('type', activeType)
      if (search) params.append('search', search)

      const res = await fetch(`/api/media?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setMediaList(data.media || [])
      }
    } catch (err) {
      console.error('Failed to fetch media:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const targetFolder = activeFolder === 'all' ? 'gallery' : activeFolder

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append('file', files[i])

      try {
        await fetch(`/api/media/upload/${targetFolder}`, {
          method: 'POST',
          body: formData,
        })
      } catch (err) {
        console.error('Upload failed for file:', files[i].name, err)
      }
    }

    setUploading(false)
    fetchMedia()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media file?')) return
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMediaList(prev => prev.filter(m => m.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete media:', err)
    }
  }

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600 mt-1">Upload, search, filter, and reuse media files across your website</p>
          </div>
          <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg cursor-pointer transition font-medium text-sm shadow">
            <Upload size={18} />
            <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
            <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>

        {/* Filters and Folders */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeFolder === f.id
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Folder size={16} />
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search file name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={activeType}
              onChange={e => setActiveType(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </div>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading media library...</div>
        ) : mediaList.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200 text-gray-500">
            <Image size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700">No media files found</p>
            <p className="text-sm mt-1">Upload new images or videos to organize into folders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mediaList.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group shadow-sm hover:shadow-md transition">
                <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {item.type === 'video' ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <Video className="text-blue-600 mb-2" size={36} />
                      <span className="text-xs text-gray-600 font-medium truncate max-w-full px-2">{item.originalName}</span>
                    </div>
                  ) : (
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded">
                    {item.folder}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-800 truncate" title={item.originalName}>
                    {item.originalName}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{(item.size / 1024 / 1024).toFixed(2)} MB</p>
                  <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs">
                    <button
                      onClick={() => copyToClipboard(item.url, item.id)}
                      className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition"
                      title="Copy public URL"
                    >
                      {copiedId === item.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy URL'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-600 transition"
                      title="Delete file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
