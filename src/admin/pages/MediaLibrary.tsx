import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Image, Video, Upload, Search, Trash2, Copy, Check, Folder, ImageIcon } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface MediaItem {
  id: string;
  folder: string;
  type: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export default function MediaLibrary({ initialType = 'all' }: { initialType?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [activeType, setActiveType] = useState(initialType);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const folders = [
    { id: 'all', label: 'All Media' },
    { id: 'projects', label: 'Projects' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    { id: 'journal', label: 'Journal' },
    { id: 'hero', label: 'Hero' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'videos', label: 'Videos' },
    { id: 'documents', label: 'Documents' },
  ];

  useEffect(() => {
    fetchMedia();
  }, [activeFolder, activeType, search]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFolder !== 'all') params.append('folder', activeFolder);
      if (activeType !== 'all') params.append('type', activeType);
      if (search) params.append('search', search);

      const res = await axios.get(`${API_BASE}/api/media?${params.toString()}`, {
        withCredentials: true,
      });
      setMediaList(res.data.media || []);
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    const targetFolder = activeFolder === 'all' ? 'gallery' : activeFolder;
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post(`${API_BASE}/api/media/upload/${targetFolder}`, formData, {
          withCredentials: true,
          timeout: 0,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const current = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const base = (i / files.length) * 100;
              const step = current / files.length;
              setUploadProgress(Math.min(100, Math.round(base + step)));
            }
          },
        });
      } catch (err: any) {
        failedCount++;
        console.error('Upload failed for file:', file.name, err);
        const errMsg = err.response?.status === 413
          ? `File "${file.name}" is too large (413). Max allowed size is 2GB.`
          : (err.response?.data?.error || err.message);
        alert(`Failed to upload ${file.name}: ${errMsg}`);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    fetchMedia();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      uploadFiles(filesArray);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      uploadFiles(filesArray);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media file?')) return;
    try {
      await axios.delete(`${API_BASE}/api/media/${id}`, {
        withCredentials: true,
      });
      setMediaList((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete media:', err);
      alert('Failed to delete media file');
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600 mt-1">Upload, search, filter, and reuse media files across your website</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg cursor-pointer transition font-medium text-sm shadow w-full sm:w-auto"
          >
            <Upload size={18} />
            <span>{uploading ? `Uploading (${uploadProgress}%)...` : 'Upload Media'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-6 rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'
          }`}
        >
          <ImageIcon className="mx-auto text-gray-400" size={32} />
          <p className="mt-2 text-sm font-medium text-gray-900">
            {uploading ? `Uploading files... ${uploadProgress}%` : 'Drag and drop media files here, or click to browse'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports HD images and videos up to 2GB. Uploads into &quot;{folders.find(f => f.id === activeFolder)?.label || 'Gallery'}&quot;.
          </p>
          {uploading && (
            <div className="w-full max-w-md mx-auto mt-3 bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Filters and Folders */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
            {folders.map((f) => (
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            <select
              value={activeType}
              onChange={(e) => setActiveType(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
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
            {mediaList.map((item) => (
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
                      className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition cursor-pointer"
                      title="Copy public URL"
                    >
                      {copiedId === item.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy URL'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-600 transition cursor-pointer"
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
  );
}
