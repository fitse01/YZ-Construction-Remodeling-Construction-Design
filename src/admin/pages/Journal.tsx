import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  Upload,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Archive,
  Search,
  BookOpen,
  Image as ImageIcon,
  User,
  Globe,
  X,
} from "lucide-react";
import axios from "axios";
import { API_BASE } from "@/lib/api";

interface JournalMedia {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
}

interface JournalArticle {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  readingTime: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  featuredImageId?: string | null;
  featuredImage?: JournalMedia | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  originalName: string;
  type: string;
}

export default function Journal() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<JournalArticle | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    shortDesc: "",
    content: "",
    category: "Guide",
    tags: "",
    author: "Yohannes Z.",
    readingTime: "5 min read",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    isFeatured: false,
    featuredImageId: "",
    seoTitle: "",
    seoDescription: "",
    publishDate: "",
  });

  // Media Library selector state
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<JournalMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/journals?limit=100`, {
        withCredentials: true,
      });
      setArticles(response.data.journals || []);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/media?type=image&limit=100`, {
        withCredentials: true,
      });
      setMediaList(response.data.media || []);
    } catch (error) {
      console.error("Failed to fetch media library:", error);
    }
  };

  const openMediaSelector = () => {
    fetchMedia();
    setShowMediaLibrary(true);
  };

  const selectFeaturedImage = (media: MediaItem) => {
    setFormData((prev) => ({ ...prev, featuredImageId: media.id }));
    setSelectedImage({ id: media.id, url: media.url, thumbnailUrl: media.thumbnailUrl });
    setShowMediaLibrary(false);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/api/media/upload/journal`, formData, {
        withCredentials: true,
        timeout: 0,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const uploadedMedia = response.data;
      setFormData((prev) => ({ ...prev, featuredImageId: uploadedMedia.id }));
      setSelectedImage({
        id: uploadedMedia.id,
        url: uploadedMedia.url,
        thumbnailUrl: uploadedMedia.thumbnailUrl || uploadedMedia.url,
      });
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      const msg = error.response?.status === 413
        ? "Image is too large (413). Max allowed size is 2GB."
        : (error.response?.data?.error || error.message || 'Failed to upload image');
      alert(msg);
    } finally {
      URL.revokeObjectURL(localPreview);
      setImagePreview(null);
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = "";
  };

  const handleCreateNew = () => {
    setEditingArticle(null);
    setFormData({
      title: "",
      slug: "",
      shortDesc: "",
      content: "",
      category: "Guide",
      tags: "",
      author: "Yohannes Z.",
      readingTime: "5 min read",
      status: "DRAFT",
      isFeatured: false,
      featuredImageId: "",
      seoTitle: "",
      seoDescription: "",
      publishDate: new Date().toISOString().split("T")[0],
    });
    setSelectedImage(null);
    setShowModal(true);
  };

  const handleEdit = (article: JournalArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      shortDesc: article.shortDesc,
      content: article.content,
      category: article.category,
      tags: article.tags.join(", "),
      author: article.author,
      readingTime: article.readingTime,
      status: article.status,
      isFeatured: article.isFeatured,
      featuredImageId: article.featuredImageId || "",
      seoTitle: article.seoTitle || "",
      seoDescription: article.seoDescription || "",
      publishDate: article.publishDate ? new Date(article.publishDate).toISOString().split("T")[0] : "",
    });
    setSelectedImage(article.featuredImage || null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (editingArticle) {
        await axios.put(`${API_BASE}/api/journals/${editingArticle.id}`, data, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_BASE}/api/journals`, data, {
          withCredentials: true,
        });
      }
      setShowModal(false);
      fetchArticles();
    } catch (error: any) {
      console.error("Failed to save article:", error);
      alert(error.response?.data?.error || "Failed to save article");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await axios.delete(`${API_BASE}/api/journals/${id}`, { withCredentials: true });
      fetchArticles();
    } catch (error) {
      console.error("Failed to delete article:", error);
      alert("Failed to delete article");
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await axios.patch(`${API_BASE}/api/journals/${id}/publish`, {}, { withCredentials: true });
      fetchArticles();
    } catch (error) {
      console.error("Failed to toggle publish status:", error);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this article?")) return;
    try {
      await axios.patch(`${API_BASE}/api/journals/${id}/archive`, {}, { withCredentials: true });
      fetchArticles();
    } catch (error) {
      console.error("Failed to archive article:", error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/api/journals/${id}/duplicate`, {}, { withCredentials: true });
      fetchArticles();
    } catch (error) {
      console.error("Failed to duplicate article:", error);
    }
  };

  // Generate slug dynamically from title if editing slug is empty
  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const next: any = { ...prev, title: val };
      if (!editingArticle || prev.slug === "") {
        next.slug = val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      return next;
    });
  };

  const filtered = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.shortDesc.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || art.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Journal CMS</h1>
            <p className="text-gray-600 mt-1">Manage Guides, Case Studies, and News Articles</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm shadow transition"
          >
            <Plus size={18} />
            <span>Create Article</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Article Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading articles...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            No articles found. Click "Create Article" to write your first journal post!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden flex items-center justify-center border-b">
                  {art.featuredImage ? (
                    <img
                      src={art.featuredImage.url}
                      alt={art.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-2">
                      <ImageIcon size={32} />
                      <span className="text-xs">No Cover Image</span>
                    </div>
                  )}
                  {art.isFeatured && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow">
                      Featured
                    </span>
                  )}
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow text-white ${
                      art.status === "PUBLISHED"
                        ? "bg-green-600"
                        : art.status === "ARCHIVED"
                        ? "bg-red-600"
                        : "bg-gray-500"
                    }`}
                  >
                    {art.status}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <span className="font-semibold text-blue-600">{art.category}</span>
                      <span>·</span>
                      <span>{art.readingTime}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg leading-snug hover:text-blue-600 transition">
                      {art.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                      {art.shortDesc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <User size={12} /> {art.author}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleTogglePublish(art.id)}
                        title={art.status === "PUBLISHED" ? "Unpublish to Draft" : "Publish Now"}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        {art.status === "PUBLISHED" ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => handleDuplicate(art.id)}
                        title="Duplicate Article"
                        className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleArchive(art.id)}
                        title="Archive Article"
                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Archive size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(art)}
                        title="Edit Article"
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(art.id)}
                        title="Delete Article"
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                <span>{editingArticle ? "Edit Article" : "Create New Article"}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                    placeholder="e.g. How to Plan a Kitchen Remodel"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none font-mono"
                    placeholder="e.g. how-to-plan-kitchen-remodel"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Featured Cover Image
                </label>
                <div className="flex items-center gap-4 flex-wrap">
                  {imagePreview || selectedImage ? (
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden border bg-gray-100">
                      <img
                        src={imagePreview || selectedImage?.url}
                        alt="Cover preview"
                        className={`w-full h-full object-cover transition-opacity ${
                          uploading ? "opacity-50" : "opacity-100"
                        }`}
                      />
                      {uploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-medium">
                          Uploading...
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, featuredImageId: "" });
                            setSelectedImage(null);
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-40 aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs cursor-pointer hover:border-blue-500 hover:text-blue-500 transition"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon size={20} />
                      <span className="mt-1">Drop image or click</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openMediaSelector}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg font-medium text-xs shadow transition cursor-pointer"
                    >
                      <Upload size={14} /> Select from Library
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg font-medium text-xs shadow transition cursor-pointer"
                    >
                      <Upload size={14} /> Upload File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileSelect}
                    />
                  </div>
                  {uploading && (
                    <span className="text-xs text-blue-600 font-medium">Uploading image...</span>
                  )}
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Short Description
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.shortDesc}
                  onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                  placeholder="Summary for preview card..."
                />
              </div>

              {/* Rich Text Content */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Article Content (HTML supported)
                </label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 border-b px-3 py-2 flex gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + '<h2>Heading</h2>' })}
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                      title="Heading"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + '<h3>Subheading</h3>' })}
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                      title="Subheading"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + '<strong>Bold</strong>' })}
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 font-bold"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + '<em>Italic</em>' })}
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 italic"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + '<a href="#">Link</a>' })}
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                      title="Link"
                    >
                      Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + '<ul><li>Item</li></ul>' })}
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                      title="Bullet List"
                    >
                      • List
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + '<ol><li>Item</li></ol>' })}
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                      title="Numbered List"
                    >
                      1. List
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + '<blockquote>Quote</blockquote>' })}
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                      title="Blockquote"
                    >
                      Quote
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, content: formData.content + '<p>Paragraph</p>' })}
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                      title="Paragraph"
                    >
                      P
                    </button>
                  </div>
                  <textarea
                    required
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white focus:outline-none font-mono border-0"
                    placeholder="Write article details here... HTML tags supported"
                  />
                </div>
              </div>

              {/* Category, Tags, Author, Read Time, Publish Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none"
                  >
                    <option value="Guide">Guide</option>
                    <option value="Case Study">Case Study</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Reading Time
                  </label>
                  <input
                    type="text"
                    value={formData.readingTime}
                    onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                    placeholder="e.g. 5 min read"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                    placeholder="kitchen, remodel, budget"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-6 items-center pt-8">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isFeatured" className="text-xs font-semibold text-gray-900">
                      Featured Article
                    </label>
                  </div>
                </div>
              </div>

              {/* SEO Details */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
                <h4 className="font-semibold text-blue-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Globe size={16} /> SEO Meta Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">SEO Meta Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="w-full px-3 py-1.5 border rounded-lg bg-white text-xs"
                      placeholder="Defaults to article title..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">SEO Meta Description</label>
                    <input
                      type="text"
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      className="w-full px-3 py-1.5 border rounded-lg bg-white text-xs"
                      placeholder="Defaults to short description..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex items-center justify-end gap-3 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition"
                >
                  Save Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Selector Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">Select Cover Image</h3>
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 p-1 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              {mediaList.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No images in media library. Upload images in the Gallery or Media module first!
                </div>
              ) : (
                mediaList.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => selectFeaturedImage(media)}
                    className="overflow-hidden rounded-xl border border-gray-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-100 focus:outline-none transition group relative aspect-video"
                  >
                    <img src={media.thumbnailUrl || media.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition">
                      Choose Image
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
