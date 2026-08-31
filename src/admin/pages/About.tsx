import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  Upload,
  Plus,
  Edit2,
  Trash2,
  User as UserIcon,
  Image as ImageIcon,
  X,
  GripVertical,
  Save,
} from "lucide-react";
import axios from "axios";
import { API_BASE } from "@/lib/api";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  originalName: string;
  type: string;
}

interface AboutContent {
  id: string;
  ownerName: string;
  ownerPosition: string;
  ownerDescription: string;
  ownerImageId?: string | null;
  ownerImage?: MediaItem | null;
  companyStory?: string | null;
  mission?: string | null;
  vision?: string | null;
  values?: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  description?: string | null;
  imageId?: string | null;
  image?: MediaItem | null;
  displayOrder: number;
  isActive: boolean;
}

export default function About() {
  const ownerFileInputRef = useRef<HTMLInputElement>(null);
  const teamFileInputRef = useRef<HTMLInputElement>(null);

  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"owner" | "team">("owner");

  const [showOwnerMediaLibrary, setShowOwnerMediaLibrary] = useState(false);
  const [ownerMediaList, setOwnerMediaList] = useState<MediaItem[]>([]);
  const [uploadingOwnerImage, setUploadingOwnerImage] = useState(false);
  const [ownerImagePreview, setOwnerImagePreview] = useState<string | null>(null);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    position: "",
    description: "",
    imageId: "",
    displayOrder: 0,
    isActive: true,
  });
  const [selectedTeamImage, setSelectedTeamImage] = useState<MediaItem | null>(null);
  const [showTeamMediaLibrary, setShowTeamMediaLibrary] = useState(false);
  const [teamMediaList, setTeamMediaList] = useState<MediaItem[]>([]);
  const [uploadingTeamImage, setUploadingTeamImage] = useState(false);
  const [teamImagePreview, setTeamImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchAboutContent();
    fetchTeamMembers();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/about/content`, {
        withCredentials: true,
      });
      setAboutContent(response.data);
    } catch (error) {
      console.error("Failed to fetch about content:", error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/about/team/all`, {
        withCredentials: true,
      });
      setTeamMembers(response.data.members || []);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAbout = async () => {
    if (!aboutContent) return;
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/api/about/content`,
        {
          ownerName: aboutContent.ownerName,
          ownerPosition: aboutContent.ownerPosition,
          ownerDescription: aboutContent.ownerDescription,
          ownerImageId: aboutContent.ownerImageId,
          companyStory: aboutContent.companyStory,
          mission: aboutContent.mission,
          vision: aboutContent.vision,
          values: aboutContent.values,
        },
        { withCredentials: true },
      );
      alert("About content saved successfully!");
    } catch (error) {
      console.error("Failed to save about content:", error);
      alert("Failed to save about content");
    } finally {
      setSaving(false);
    }
  };

  const handleOwnerImageUpload = async (file: File) => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setOwnerImagePreview(localPreview);
    setUploadingOwnerImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${API_BASE}/api/media/upload/about`, formData, {
        withCredentials: true,
      });

      const uploadedMedia = response.data;
      setAboutContent((prev) =>
        prev
          ? {
              ...prev,
              ownerImageId: uploadedMedia.id,
              ownerImage: uploadedMedia,
            }
          : prev,
      );
    } catch (error: any) {
      console.error("Failed to upload image:", error);
      const msg = error.response?.status === 413
        ? "Image is too large (413). Max allowed size is 2GB."
        : (error.response?.data?.error || error.message || "Failed to upload image");
      alert(msg);
    } finally {
      URL.revokeObjectURL(localPreview);
      setOwnerImagePreview(null);
      setUploadingOwnerImage(false);
    }
  };

  const handleOwnerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleOwnerImageUpload(file);
    }
  };

  const handleOwnerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleOwnerImageUpload(file);
    }
    e.target.value = "";
  };

  const openOwnerMediaSelector = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/media?type=image&limit=100`, {
        withCredentials: true,
      });
      setOwnerMediaList(response.data.media || []);
      setShowOwnerMediaLibrary(true);
    } catch (error) {
      console.error("Failed to fetch media library:", error);
    }
  };

  const selectOwnerImage = (media: MediaItem) => {
    setAboutContent((prev) =>
      prev
        ? {
            ...prev,
            ownerImageId: media.id,
            ownerImage: media,
          }
        : prev,
    );
    setShowOwnerMediaLibrary(false);
  };

  const handleCreateTeamMember = () => {
    setEditingTeamMember(null);
    setTeamFormData({
      name: "",
      position: "",
      description: "",
      imageId: "",
      displayOrder: teamMembers.length,
      isActive: true,
    });
    setSelectedTeamImage(null);
    setShowTeamModal(true);
  };

  const handleEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
    setTeamFormData({
      name: member.name,
      position: member.position,
      description: member.description || "",
      imageId: member.imageId || "",
      displayOrder: member.displayOrder,
      isActive: member.isActive,
    });
    setSelectedTeamImage(member.image || null);
    setShowTeamModal(true);
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: teamFormData.name.trim(),
        position: teamFormData.position.trim(),
        description: teamFormData.description.trim() || null,
        imageId: teamFormData.imageId || null,
        displayOrder: Number(teamFormData.displayOrder) || 0,
        isActive: Boolean(teamFormData.isActive),
      };

      if (editingTeamMember) {
        await axios.put(`${API_BASE}/api/about/team/${editingTeamMember.id}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_BASE}/api/about/team`, payload, { withCredentials: true });
      }
      setShowTeamModal(false);
      fetchTeamMembers();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : "Failed to save team member";
      console.error("Failed to save team member:", error);
      alert(message);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;
    try {
      await axios.delete(`${API_BASE}/api/about/team/${id}`, { withCredentials: true });
      fetchTeamMembers();
    } catch (error) {
      console.error("Failed to delete team member:", error);
      alert("Failed to delete team member");
    }
  };

  const handleTeamImageUpload = async (file: File) => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setTeamImagePreview(localPreview);
    setUploadingTeamImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${API_BASE}/api/media/upload/about`, formData, {
        withCredentials: true,
      });

      const uploadedMedia = response.data;
      setTeamFormData((prev) => ({ ...prev, imageId: uploadedMedia.id }));
      setSelectedTeamImage(uploadedMedia);
    } catch (error: any) {
      console.error("Failed to upload image:", error);
      const msg = error.response?.status === 413
        ? "Image is too large (413). Max allowed size is 2GB."
        : (error.response?.data?.error || error.message || "Failed to upload image");
      alert(msg);
    } finally {
      URL.revokeObjectURL(localPreview);
      setTeamImagePreview(null);
      setUploadingTeamImage(false);
    }
  };

  const handleTeamDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleTeamImageUpload(file);
    }
  };

  const handleTeamFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleTeamImageUpload(file);
    }
    e.target.value = "";
  };

  const openTeamMediaSelector = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/media?type=image&limit=100`, {
        withCredentials: true,
      });
      setTeamMediaList(response.data.media || []);
      setShowTeamMediaLibrary(true);
    } catch (error) {
      console.error("Failed to fetch media library:", error);
    }
  };

  const selectTeamImage = (media: MediaItem) => {
    setTeamFormData((prev) => ({ ...prev, imageId: media.id }));
    setSelectedTeamImage(media);
    setShowTeamMediaLibrary(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">About Page CMS</h1>
          <p className="text-gray-600 mt-1">Manage About page content and team members</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <aside className="xl:sticky xl:top-8 h-fit bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">About Content</h2>
                <p className="text-xs text-gray-500">Quick access for CRUD work</p>
              </div>
            </div>

            <nav className="space-y-2">
              <a
                href="#owner-content"
                onClick={() => setActiveSection("owner")}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
                  activeSection === "owner"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>Owner Information</span>
                <span className="text-xs opacity-80">Edit</span>
              </a>
              <a
                href="#team-members"
                onClick={() => setActiveSection("team")}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition ${
                  activeSection === "team"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>Team Members</span>
                <span className="text-xs opacity-80">CRUD</span>
              </a>
            </nav>

            <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={handleSaveAbout}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium text-sm shadow transition disabled:opacity-50"
              >
                <Save size={16} /> {saving ? "Saving..." : "Save About Content"}
              </button>
              <button
                type="button"
                onClick={handleCreateTeamMember}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-medium text-sm shadow transition"
              >
                <Plus size={16} /> Add Team Member
              </button>
            </div>
          </aside>

          <div className="space-y-6">
            <section
              id="owner-content"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-600" /> Owner Information
              </h2>

              {aboutContent && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Owner Name
                      </label>
                      <input
                        type="text"
                        value={aboutContent.ownerName}
                        onChange={(e) =>
                          setAboutContent({ ...aboutContent, ownerName: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Owner Position
                      </label>
                      <input
                        type="text"
                        value={aboutContent.ownerPosition}
                        onChange={(e) =>
                          setAboutContent({ ...aboutContent, ownerPosition: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Owner Description
                    </label>
                    <textarea
                      rows={3}
                      value={aboutContent.ownerDescription}
                      onChange={(e) =>
                        setAboutContent({ ...aboutContent, ownerDescription: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Owner Image
                    </label>
                    <div className="flex items-center gap-4 flex-wrap">
                      {ownerImagePreview || aboutContent.ownerImage ? (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-gray-100">
                          <img
                            src={ownerImagePreview || aboutContent.ownerImage?.url}
                            alt="Owner"
                            className={`w-full h-full object-cover transition-opacity ${
                              uploadingOwnerImage ? "opacity-50" : "opacity-100"
                            }`}
                          />
                          {uploadingOwnerImage ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-medium">
                              Uploading...
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setAboutContent({
                                  ...aboutContent,
                                  ownerImageId: null,
                                  ownerImage: null,
                                })
                              }
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs cursor-pointer hover:border-blue-500 hover:text-blue-500 transition"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleOwnerDrop}
                          onClick={() => ownerFileInputRef.current?.click()}
                        >
                          <ImageIcon size={20} />
                          <span className="mt-1">Drop or click</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={openOwnerMediaSelector}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg font-medium text-xs shadow transition cursor-pointer"
                        >
                          <Upload size={14} /> Select from Library
                        </button>
                        <button
                          type="button"
                          onClick={() => ownerFileInputRef.current?.click()}
                          disabled={uploadingOwnerImage}
                          className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg font-medium text-xs shadow transition cursor-pointer"
                        >
                          <Upload size={14} /> Add File
                        </button>
                        <input
                          ref={ownerFileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleOwnerFileSelect}
                        />
                      </div>
                      {uploadingOwnerImage && (
                        <span className="text-xs text-blue-600 font-medium">Uploading image...</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Company Story
                      </label>
                      <textarea
                        rows={4}
                        value={aboutContent.companyStory || ""}
                        onChange={(e) =>
                          setAboutContent({ ...aboutContent, companyStory: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Mission
                      </label>
                      <textarea
                        rows={4}
                        value={aboutContent.mission || ""}
                        onChange={(e) =>
                          setAboutContent({ ...aboutContent, mission: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Vision
                      </label>
                      <textarea
                        rows={3}
                        value={aboutContent.vision || ""}
                        onChange={(e) =>
                          setAboutContent({ ...aboutContent, vision: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Values
                      </label>
                      <textarea
                        rows={3}
                        value={aboutContent.values || ""}
                        onChange={(e) =>
                          setAboutContent({ ...aboutContent, values: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section
              id="team-members"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" /> Team Members
                </h2>
                <button
                  onClick={handleCreateTeamMember}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow transition"
                >
                  <Plus size={18} /> Add Team Member
                </button>
              </div>

              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition"
                  >
                    <GripVertical className="text-gray-400 cursor-move" />
                    {member.image ? (
                      <img
                        src={member.image.url}
                        alt={member.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                        <UserIcon size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.position}</p>
                      {!member.isActive && <span className="text-xs text-red-600">Hidden</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTeamMember(member)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeamMember(member.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No team members yet. Click "Add Team Member" to add one.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {showTeamModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTeamMember ? "Edit Team Member" : "Add Team Member"}
                </h2>
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTeamMember} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={teamFormData.name}
                      onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      required
                      value={teamFormData.position}
                      onChange={(e) =>
                        setTeamFormData({ ...teamFormData, position: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={teamFormData.description}
                    onChange={(e) =>
                      setTeamFormData({ ...teamFormData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={teamFormData.displayOrder}
                    onChange={(e) =>
                      setTeamFormData({
                        ...teamFormData,
                        displayOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Team Member Image
                  </label>
                  <div className="flex items-center gap-4 flex-wrap">
                    {teamImagePreview || selectedTeamImage ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-gray-100">
                        <img
                          src={teamImagePreview || selectedTeamImage?.url}
                          alt="Team Member"
                          className={`w-full h-full object-cover transition-opacity ${
                            uploadingTeamImage ? "opacity-50" : "opacity-100"
                          }`}
                        />
                        {uploadingTeamImage ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-medium">
                            Uploading...
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTeamFormData({ ...teamFormData, imageId: "" });
                              setSelectedTeamImage(null);
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs cursor-pointer hover:border-blue-500 hover:text-blue-500 transition"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleTeamDrop}
                        onClick={() => teamFileInputRef.current?.click()}
                      >
                        <ImageIcon size={20} />
                        <span className="mt-1">Drop or click</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={openTeamMediaSelector}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg font-medium text-xs shadow transition cursor-pointer"
                      >
                        <Upload size={14} /> Select from Library
                      </button>
                      <button
                        type="button"
                        onClick={() => teamFileInputRef.current?.click()}
                        disabled={uploadingTeamImage}
                        className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg font-medium text-xs shadow transition cursor-pointer"
                      >
                        <Upload size={14} /> Add File
                      </button>
                      <input
                        ref={teamFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleTeamFileSelect}
                      />
                    </div>
                    {uploadingTeamImage && (
                      <span className="text-xs text-blue-600 font-medium">Uploading image...</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={teamFormData.isActive}
                    onChange={(e) =>
                      setTeamFormData({ ...teamFormData, isActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                    Active (visible on website)
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(false)}
                    className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition"
                  >
                    Save Team Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showOwnerMediaLibrary && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ zIndex: 100 }}
          >
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Select Owner Image</h3>
                <button
                  onClick={() => setShowOwnerMediaLibrary(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                {ownerMediaList.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => selectOwnerImage(media)}
                    className="overflow-hidden rounded-xl border border-gray-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-100 focus:outline-none transition group relative aspect-square"
                  >
                    <img
                      src={media.thumbnailUrl || media.url}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showTeamMediaLibrary && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ zIndex: 100 }}
          >
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Select Team Member Image</h3>
                <button
                  onClick={() => setShowTeamMediaLibrary(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                {teamMediaList.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => selectTeamImage(media)}
                    className="overflow-hidden rounded-xl border border-gray-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-100 focus:outline-none transition group relative aspect-square"
                  >
                    <img
                      src={media.thumbnailUrl || media.url}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
