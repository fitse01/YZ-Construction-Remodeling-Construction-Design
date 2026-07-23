import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  Mail,
  Trash2,
  Search,
  Archive,
  AlertOctagon,
  Reply,
  CheckCircle,
  X,
  Send,
} from "lucide-react";

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  isSpam: boolean;
  replyMessage?: string;
  repliedAt?: string;
  createdAt: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeStatus, setActiveStatus] = useState("unread");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchMessages();
  }, [activeStatus, search, page]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("status", activeStatus);
      params.append("page", String(page));
      params.append("limit", String(pageSize));
      if (search) params.append("search", search);

      const res = await fetch(`/api/messages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = async (id: string, updates: Partial<Message>) => {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchMessages();
        if (selectedMsg?.id === id) {
          setSelectedMsg((prev) => (prev ? { ...prev, ...updates } : null));
        }
      }
    } catch (err) {
      console.error("Failed to update message:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMsg?.id === id) setSelectedMsg(null);
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMsg || !replyText.trim()) return;
    setSendingReply(true);

    await updateMessage(selectedMsg.id, {
      replyMessage: replyText,
      isRead: true,
    });

    setSendingReply(false);
    setReplyText("");
    alert(`Reply recorded for ${selectedMsg.email}. (Owner mail client / Nodemailer configured)`);
  };

  const tabs = [
    { id: "unread", label: "Unread" },
    { id: "read", label: "Read" },
    { id: "all", label: "All Inquiries" },
    { id: "archived", label: "Archived" },
    { id: "spam", label: "Spam" },
  ];

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inquiries & Leads</h1>
            <p className="text-gray-600 mt-1">
              Review contact form submissions, free estimate requests, and client messages.
            </p>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => handleStatusChange(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeStatus === t.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search name, email, scope..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Project Scope</th>
                <th className="px-6 py-3">Budget / Timeline</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {messages.map((msg) => (
                <tr
                  key={msg.id}
                  onClick={() => {
                    if (!msg.isRead) updateMessage(msg.id, { isRead: true });
                    setSelectedMsg(msg);
                  }}
                  className={`hover:bg-blue-50/50 cursor-pointer transition ${!msg.isRead ? "bg-amber-50/40 font-semibold" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium">{msg.name}</span>
                      {!msg.isRead && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {msg.email} · {msg.phone || "No Phone"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded">
                      {msg.projectType || "General Inquiry"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{msg.message}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    <div>Budget: {msg.budget || "N/A"}</div>
                    <div>Time: {msg.timeline || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                  <td
                    className="px-6 py-4 text-right space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => updateMessage(msg.id, { isRead: !msg.isRead })}
                      className="text-gray-400 hover:text-blue-600 p-1"
                      title={msg.isRead ? "Mark as Unread" : "Mark as Read"}
                    >
                      {msg.isRead ? <Mail size={16} /> : <CheckCircle size={16} />}
                    </button>
                    <button
                      onClick={() => updateMessage(msg.id, { isArchived: !msg.isArchived })}
                      className="text-gray-400 hover:text-gray-700 p-1"
                      title={msg.isArchived ? "Unarchive" : "Archive"}
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      onClick={() => updateMessage(msg.id, { isSpam: !msg.isSpam })}
                      className="text-gray-400 hover:text-orange-600 p-1"
                      title="Mark as Spam"
                    >
                      <AlertOctagon size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete Message"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {messages.length === 0 && !loading && (
            <div className="py-12 text-center text-gray-500 text-sm">
              No messages found in this category.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {messages.length} of {totalCount} messages
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200">
              Page {page} of {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Message Detail & Reply Modal */}
        {selectedMsg && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMsg.name}</h2>
                  <p className="text-xs text-gray-500">
                    {selectedMsg.email} · {selectedMsg.phone || "No Phone"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMsg(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 text-sm">
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-xs text-gray-500 block uppercase font-mono">
                      Project Scope
                    </span>
                    <span className="font-semibold text-gray-900">
                      {selectedMsg.projectType || "General"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block uppercase font-mono">
                      Estimated Budget
                    </span>
                    <span className="font-semibold text-gray-900">
                      {selectedMsg.budget || "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block uppercase font-mono">
                      Timeline
                    </span>
                    <span className="font-semibold text-gray-900">
                      {selectedMsg.timeline || "Not specified"}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Message Body</h4>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedMsg.message}
                  </div>
                </div>

                {selectedMsg.replyMessage && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-1">
                    <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider font-mono">
                      Previous Reply Sent:
                    </span>
                    <p className="text-gray-800">{selectedMsg.replyMessage}</p>
                  </div>
                )}

                {/* Reply Form */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Reply size={16} /> Send Reply
                  </h4>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Type response for ${selectedMsg.email}...`}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => updateMessage(selectedMsg.id, { isRead: !selectedMsg.isRead })}
                      className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium text-sm transition"
                    >
                      <Mail size={16} />
                      <span>{selectedMsg.isRead ? "Mark Unread" : "Mark Read"}</span>
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 transition shadow"
                    >
                      <Send size={16} />
                      <span>{sendingReply ? "Sending..." : "Send Email Reply"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
