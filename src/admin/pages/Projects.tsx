import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Copy,
  Video,
  Image as ImageIcon,
  Sparkles,
  Upload,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import axios from "axios";
import { API_BASE } from "@/lib/api";

interface ProjectMedia {
  id: string;
  type: string;
  folder: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string | null;
  order: number;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  location?: string;
  description: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  displayOrder: number;
  isFeatured: boolean;
  clientName?: string;
  completionDate?: string;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  youtubeUrl?: string;
  uploadedVideo?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  featuredImageId?: string | null;
  featuredImage?: ProjectMedia | null;
  images: ProjectMedia[];
  videos: ProjectMedia[];
  createdAt: string;
  updatedAt: string;
}

export default function Projects() {
  const navigate = useNavigate();
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [videoSource, setVideoSource] = useState<"upload" | "youtube">("upload");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    location: "",
    description: "",
    category: "RESIDENTIAL",
    displayOrder: 0,
    isFeatured: false,
    clientName: "",
    completionDate: "",
    videoUrl: "",
    videoThumbnailUrl: "",
    youtubeUrl: "",
    uploadedVideo: "",
    beforeImageUrl: "",
    afterImageUrl: "",
    seoTitle: "",
    seoDescription: "",
    tags: "",
    featuredImageId: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const urls = pendingFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [pendingFiles]);

  const appendPendingFiles = (files: FileList | File[]) => {
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const uploadProjectAsset = async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    const response = await axios.post(`${API_BASE}/api/media/upload/projects`, formData, {
      withCredentials: true,
    });

    return response.data as ProjectMedia;
  };

  const createVideoThumbnailFile = async (file: File) => {
    if (typeof document === "undefined") return null;

    return new Promise<File | null>((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const video = document.createElement("video");
      const cleanup = () => URL.revokeObjectURL(objectUrl);

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.src = objectUrl;

      const fail = () => {
        cleanup();
        resolve(null);
      };

      video.onloadedmetadata = () => {
        const seekTo = Math.min(0.1, Number.isFinite(video.duration) ? video.duration / 2 : 0.1);

        video.currentTime = seekTo;
      };

      video.onerror = fail;

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const width = video.videoWidth || 1280;
          const height = video.videoHeight || 720;

          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");
          if (!context) {
            fail();
            return;
          }

          context.drawImage(video, 0, 0, width, height);
          canvas.toBlob((blob) => {
            cleanup();
            if (!blob) {
              resolve(null);
              return;
            }

            const thumbnailName = `${file.name.replace(/\.[^.]+$/, "")}-thumbnail.jpg`;
            resolve(new File([blob], thumbnailName, { type: "image/jpeg" }));
          }, "image/jpeg", 0.85);
        } catch (error) {
          fail();
        }
      };
    });
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/projects?limit=100`, {
        withCredentials: true,
      });
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await axios.delete(`${API_BASE}/api/projects/${id}`, {
        withCredentials: true,
      });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await axios.patch(`${API_BASE}/api/projects/${id}/publish`, {}, {
        withCredentials: true,
      });
      fetchProjects();
    } catch (err) {
      console.error("Failed to publish project:", err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/api/projects/${id}/duplicate`, {}, {
        withCredentials: true,
      });
      fetchProjects();
    } catch (err) {
      console.error("Failed to duplicate project:", err);
    }
  };

  const refreshEditingProject = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/projects/${id}`, {
        withCredentials: true,
      });
      setEditingProject(res.data);
      return res.data as Project;
    } catch (err) {
      console.error("Failed to refresh editing project:", err);
      return null;
    }
  };

  const uploadProjectMedia = async (projectId: string) => {
    if (pendingFiles.length === 0) return [] as ProjectMedia[];

    setUploadingMedia(true);
    setUploadProgress(0);
    const uploaded: ProjectMedia[] = [];

    try {
      for (let index = 0; index < pendingFiles.length; index += 1) {
        const file = pendingFiles[index];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);

        const response = await axios.post(`${API_BASE}/api/media/upload/projects`, formData, {
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const current = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const base = (index / pendingFiles.length) * 100;
              const step = current / pendingFiles.length;
              setUploadProgress(Math.min(100, Math.round(base + step)));
            }
          },
        });

        if (response.data) {
          uploaded.push(response.data);
        }
      }
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }

    return uploaded;
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await axios.delete(`${API_BASE}/api/media/${mediaId}`, { withCredentials: true });
      if (editingProject) {
        await refreshEditingProject(editingProject.id);
      }
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete media:", err);
      alert("Failed to delete media");
    }
  };

  const uploadGeneratedVideoThumbnail = async (projectId: string, videoFile: File) => {
    const thumbnailFile = await createVideoThumbnailFile(videoFile);
    if (!thumbnailFile) return null;

    const thumbnailMedia = await uploadProjectAsset(projectId, thumbnailFile);
    return thumbnailMedia.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        tags: typeof formData.tags === "string"
          ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : Array.isArray(formData.tags)
          ? formData.tags
          : [],
        youtubeUrl: videoSource === "youtube" ? formData.youtubeUrl : "",
        uploadedVideo: videoSource === "upload" ? formData.uploadedVideo : "",
        videoUrl: videoSource === "youtube" ? formData.youtubeUrl : formData.uploadedVideo,
      };

      const url = editingProject ? `${API_BASE}/api/projects/${editingProject.id}` : `${API_BASE}/api/projects`;
      const response = await axios({
        url,
        method: editingProject ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        data: payload,
        withCredentials: true,
      });

      const savedProject = response.data;
      const projectId = savedProject.id;

      const uploadedMedia = await uploadProjectMedia(projectId);
      const nextUpdate: Record<string, unknown> = {};

      if (!payload.featuredImageId) {
        const firstImage = uploadedMedia.find((item) => item.type === "image");
        if (firstImage) nextUpdate.featuredImageId = firstImage.id;
      }

      if (videoSource === "upload") {
        const firstVideo = uploadedMedia.find((item) => item.type === "video");
        if (firstVideo) {
          nextUpdate.uploadedVideo = firstVideo.url;
          nextUpdate.videoUrl = firstVideo.url;
        }
      }

      if (!payload.videoThumbnailUrl && videoSource === "upload") {
        const sourceVideoFile = pendingFiles.find((file) => file.type.startsWith("video/"));
        if (sourceVideoFile) {
          const generatedThumbnailUrl = await uploadGeneratedVideoThumbnail(projectId, sourceVideoFile);
          if (generatedThumbnailUrl) {
            nextUpdate.videoThumbnailUrl = generatedThumbnailUrl;
          }
        }
      }

      if (!payload.beforeImageUrl) {
        const firstImage = uploadedMedia.find((item) => item.type === "image");
        if (firstImage) nextUpdate.beforeImageUrl = firstImage.url;
      }

      if (!payload.afterImageUrl) {
        const firstImage = uploadedMedia.filter((item) => item.type === "image")[1];
        if (firstImage) nextUpdate.afterImageUrl = firstImage.url;
      }

      if (Object.keys(nextUpdate).length > 0) {
        await axios.put(`${API_BASE}/api/projects/${projectId}`, nextUpdate, {
          withCredentials: true,
        });
      }

      setShowModal(false);
      setEditingProject(null);
      resetForm();
      setPendingFiles([]);
      fetchProjects();
    } catch (err: any) {
      console.error("Failed to save project:", err);
      const errMsg = err.response?.data?.error || err.message || "Unknown error";
      alert(`Error saving project: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title || "",
      slug: project.slug || "",
      location: project.location || "",
      description: project.description || "",
      category: project.category || "RESIDENTIAL",
      displayOrder: project.displayOrder || 0,
      isFeatured: project.isFeatured || false,
      clientName: project.clientName || "",
      completionDate: project.completionDate
        ? new Date(project.completionDate).toISOString().split("T")[0]
        : "",
      videoUrl: project.videoUrl || "",
      videoThumbnailUrl: project.videoThumbnailUrl || "",
      youtubeUrl: project.youtubeUrl || "",
      uploadedVideo: project.uploadedVideo || "",
      beforeImageUrl: project.beforeImageUrl || "",
      afterImageUrl: project.afterImageUrl || "",
      seoTitle: project.seoTitle || "",
      seoDescription: project.seoDescription || "",
      tags: project.tags ? project.tags.join(", ") : "",
      featuredImageId: project.featuredImageId || project.featuredImage?.id || "",
    });
    setVideoSource(project.youtubeUrl ? "youtube" : "upload");
    setPendingFiles([]);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      location: "",
      description: "",
      category: "RESIDENTIAL",
      displayOrder: 0,
      isFeatured: false,
      clientName: "",
      completionDate: "",
      videoUrl: "",
      videoThumbnailUrl: "",
      youtubeUrl: "",
      uploadedVideo: "",
      beforeImageUrl: "",
      afterImageUrl: "",
      seoTitle: "",
      seoDescription: "",
      tags: "",
      featuredImageId: "",
    });
    setVideoSource("upload");
  };

  const currentMedia = useMemo(() => {
    if (!editingProject) return [] as ProjectMedia[];
    return [...(editingProject.images || []), ...(editingProject.videos || [])];
  }, [editingProject]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8 text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects Portfolio</h1>
            <p className="text-gray-600 mt-1">
              Manage completed work, uploads, video, before/after images, and featured projects.
            </p>
          </div>
          <button
            onClick={() => setShowChoiceModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition shadow"
          >
            <Plus size={18} />
            <span>New Item</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Project Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Media</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Featured</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{project.title}</div>
                    <div className="text-xs text-gray-500">
                      {project.location || "Silver Spring, MD"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">
                      {project.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ImageIcon size={14} /> {project.images?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video size={14} /> {project.videos?.length || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${project.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-600">
                    {project.isFeatured ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <Sparkles size={14} /> Featured
                      </span>
                    ) : (
                      "No"
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleTogglePublish(project.id)}
                      className="text-gray-500 hover:text-blue-600 p-1"
                      title="Toggle Publish"
                    >
                      {project.status === "PUBLISHED" ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleDuplicate(project.id)}
                      className="text-gray-500 hover:text-gray-800 p-1"
                      title="Duplicate Project"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => openEditModal(project)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projects.length === 0 && !loading && (
            <div className="py-12 text-center text-gray-500 text-sm">No projects created yet.</div>
          )}
        </div>

        {showChoiceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                What would you like to create?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Choose whether you are adding a completed showcase project or a service offering.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setShowChoiceModal(false);
                    resetForm();
                    setEditingProject(null);
                    setShowModal(true);
                  }}
                  className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition flex flex-col items-center gap-2"
                >
                  <Sparkles size={24} />
                  <span>Project</span>
                </button>
                <button
                  onClick={() => {
                    setShowChoiceModal(false);
                    navigate({ to: "/admin/services" });
                  }}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold transition flex flex-col items-center gap-2"
                >
                  <ImageIcon size={24} />
                  <span>Service</span>
                </button>
              </div>
              <button
                onClick={() => setShowChoiceModal(false)}
                className="mt-6 text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProject ? "Edit Project" : "New Project"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
                <div>
                  <label className="block font-medium mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Modern Open-Plan Kitchen Remodel"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="RESIDENTIAL">Residential</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="KITCHEN">Kitchen</option>
                      <option value="BATHROOM">Bathroom</option>
                      <option value="INTERIOR">Interior</option>
                      <option value="EXTERIOR">Exterior</option>
                      <option value="FURNITURE_CARPENTRY">Furniture & Carpentry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Bethesda, MD"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">Project Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Upload size={16} /> Media Uploads
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Upload images and videos directly to the VPS, then assign featured media
                        automatically.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => mediaFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer"
                    >
                      <Upload size={16} />
                      <span>Add Files</span>
                    </button>
                    <input
                      ref={mediaFileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          appendPendingFiles(e.target.files);
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        appendPendingFiles(e.dataTransfer.files);
                      }
                    }}
                    className={`rounded-xl border-2 border-dashed p-6 text-center transition ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
                  >
                    <ImageIcon className="mx-auto text-gray-400" size={28} />
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      Drag and drop files here
                    </p>
                    <p className="text-xs text-gray-500">
                      Images and videos are stored locally on the server with unique filenames.
                    </p>
                  </div>

                  {previewUrls.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Pending files
                      </div>
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {previewUrls.map((url, index) => {
                          const file = pendingFiles[index];
                          const isVideo = file?.type.startsWith("video/");
                          return (
                            <div
                              key={url}
                              className="relative overflow-hidden rounded-xl border border-gray-200 bg-white"
                            >
                              {isVideo ? (
                                <video src={url} controls className="h-36 w-full object-cover" />
                              ) : (
                                <img
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  className="h-36 w-full object-cover"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                                }
                                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {uploadingMedia && (
                    <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
                      Uploading media... {uploadProgress}%
                    </div>
                  )}
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3">
                  <h4 className="font-semibold text-purple-900 flex items-center gap-1.5">
                    <Video size={16} /> Video & Media Integration
                  </h4>
                  <div>
                    <label className="block text-xs font-medium mb-1">Video Source</label>
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="videoSource"
                          checked={videoSource === "upload"}
                          onChange={() => setVideoSource("upload")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Upload Video</span>
                      </label>
                      <label className="flex items-center gap-2 font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="videoSource"
                          checked={videoSource === "youtube"}
                          onChange={() => setVideoSource("youtube")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>YouTube Link</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videoSource === "upload" ? (
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Uploaded Video URL (auto-filled when dragging/uploading a video file above)
                        </label>
                        <input
                          type="text"
                          value={formData.uploadedVideo}
                          onChange={(e) => setFormData({ ...formData, uploadedVideo: e.target.value, videoUrl: e.target.value })}
                          className="w-full px-3 py-1.5 border rounded-lg bg-white text-xs"
                          placeholder="e.g. /uploads/projects/myfile.mp4"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium mb-1">YouTube URL</label>
                        <input
                          type="text"
                          value={formData.youtubeUrl}
                          onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value, videoUrl: e.target.value })}
                          className="w-full px-3 py-1.5 border rounded-lg bg-white text-xs"
                          placeholder="e.g. https://www.youtube.com/watch?v=xxxxxxxx"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Video Thumbnail Image
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.videoThumbnailUrl}
                          onChange={(e) =>
                            setFormData({ ...formData, videoThumbnailUrl: e.target.value })
                          }
                          className="flex-1 min-w-0 px-3 py-1.5 border rounded-lg bg-white text-xs"
                          placeholder="/uploads/..."
                        />
                        <button
                          type="button"
                          onClick={() => thumbnailFileInputRef.current?.click()}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700 cursor-pointer transition flex-shrink-0"
                        >
                          <Upload size={14} />
                          <span>Upload</span>
                        </button>
                        <input
                          ref={thumbnailFileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const file = e.target.files[0];
                              const uploadData = new FormData();
                              uploadData.append("file", file);
                              // Clear the value so the same file can be uploaded again
                              e.target.value = "";
                              try {
                                const response = await axios.post(
                                  `${API_BASE}/api/media/upload/projects`,
                                  uploadData,
                                  { withCredentials: true }
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  videoThumbnailUrl: response.data.url,
                                }));
                              } catch (err: any) {
                                console.error("Failed to upload thumbnail:", err);
                                alert("Failed to upload thumbnail: " + (err.response?.data?.error || err.message));
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <ImageIcon size={16} /> Before & After Showcase
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Before Image</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.beforeImageUrl}
                          onChange={(e) =>
                            setFormData({ ...formData, beforeImageUrl: e.target.value })
                          }
                          className="flex-1 min-w-0 px-3 py-1.5 border rounded-lg bg-white text-xs"
                          placeholder="/uploads/before.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => beforeFileInputRef.current?.click()}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700 cursor-pointer transition flex-shrink-0"
                        >
                          <Upload size={14} />
                          <span>Upload</span>
                        </button>
                        <input
                          ref={beforeFileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const file = e.target.files[0];
                              const uploadData = new FormData();
                              uploadData.append("file", file);
                              e.target.value = "";
                              try {
                                const response = await axios.post(
                                  `${API_BASE}/api/media/upload/projects`,
                                  uploadData,
                                  { withCredentials: true }
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  beforeImageUrl: response.data.url,
                                }));
                              } catch (err: any) {
                                console.error("Failed to upload before image:", err);
                                alert("Failed to upload image: " + (err.response?.data?.error || err.message));
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">After Image</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.afterImageUrl}
                          onChange={(e) =>
                            setFormData({ ...formData, afterImageUrl: e.target.value })
                          }
                          className="flex-1 min-w-0 px-3 py-1.5 border rounded-lg bg-white text-xs"
                          placeholder="/uploads/after.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => afterFileInputRef.current?.click()}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-700 cursor-pointer transition flex-shrink-0"
                        >
                          <Upload size={14} />
                          <span>Upload</span>
                        </button>
                        <input
                          ref={afterFileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const file = e.target.files[0];
                              const uploadData = new FormData();
                              uploadData.append("file", file);
                              e.target.value = "";
                              try {
                                const response = await axios.post(
                                  `${API_BASE}/api/media/upload/projects`,
                                  uploadData,
                                  { withCredentials: true }
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  afterImageUrl: response.data.url,
                                }));
                              } catch (err: any) {
                                console.error("Failed to upload after image:", err);
                                alert("Failed to upload image: " + (err.response?.data?.error || err.message));
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Current Project Media</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Set featured images, delete media, and keep uploads attached to the project.
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">{currentMedia.length} items</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {currentMedia.map((media) => (
                      <div
                        key={media.id}
                        className={`overflow-hidden rounded-xl border ${media.id === formData.featuredImageId ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"}`}
                      >
                        {media.type === "video" ? (
                          <video
                            src={media.url}
                            controls
                            className="h-40 w-full bg-gray-100 object-cover"
                          />
                        ) : (
                          <img
                            src={media.thumbnailUrl || media.url}
                            alt={media.originalName}
                            className="h-40 w-full object-cover"
                          />
                        )}
                        <div className="space-y-2 bg-white p-3">
                          <div className="truncate text-xs font-medium text-gray-700">
                            {media.originalName}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {media.type === "image" && (
                              <button
                                type="button"
                                onClick={() => setFeaturedImage(editingProject?.id || "", media.id)}
                                className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                Set Featured
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteMedia(media.id)}
                              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Feature on Homepage</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setPendingFiles([]);
                    }}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {saving ? "Saving..." : editingProject ? "Update Project" : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
