import React, { useEffect, useState, useRef } from "react";
import { Ticket, TicketMessage, TicketCategory, TicketPriority, TicketStatus } from "../../types";
import { api } from "../../services/api";
import { socketClient } from "../../services/socket";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Send,
  User,
  BookOpen,
  Lock,
  Edit2,
  Clock,
  UserCheck,
  Paperclip,
  Check,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface Props {
  ticketId: string;
  onBack: () => void;
}

const CATEGORIES: TicketCategory[] = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const PRIORITIES: TicketPriority[] = ["Critical", "High", "Medium", "Low"];
const STATUSES: TicketStatus[] = ["Open", "In Progress", "Resolved", "Closed"];

export const AdminTicketDetail: React.FC<Props> = ({ ticketId, onBack }) => {
  const { user: currentAdmin } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [calibratingTone, setCalibratingTone] = useState(false);

  // Overrides
  const [editingCategory, setEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory>("General Inquiry");
  const [categoryReason, setCategoryReason] = useState("");

  const [editingPriority, setEditingPriority] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>("Medium");
  const [priorityReason, setPriorityReason] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTicket();

    const socket = socketClient.getSocket();
    socketClient.joinTicket(ticketId);

    const handleNewMessage = (data: { ticketId: string; message: TicketMessage }) => {
      if (data.ticketId === ticketId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };

    const handleTicketUpdated = (updated: any) => {
      if (updated.id === ticketId || updated.ticketNumber === ticketId) {
        setTicket((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("ticket:updated", handleTicketUpdated);

    return () => {
      socketClient.leaveTicket(ticketId);
      socket.off("message:new", handleNewMessage);
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadTicket = async () => {
    try {
      const data = await api.getTicket(ticketId);
      setTicket(data.ticket);
      setMessages(data.ticket.messages || []);
      setSelectedCategory(data.ticket.category);
      setSelectedPriority(data.ticket.priority);
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      const data = await api.updateTicketStatus(ticket.id, newStatus);
      setTicket((prev) => (prev ? { ...prev, status: data.ticket.status } : prev));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleAssignToMe = async () => {
    if (!ticket || !currentAdmin) return;
    try {
      const data = await api.assignTicket(ticket.id, currentAdmin.id);
      setTicket((prev) => (prev ? { ...prev, assignedAdmin: currentAdmin, assignedAdminId: currentAdmin.id } : prev));
    } catch (err) {
      console.error("Failed to assign ticket:", err);
    }
  };

  const handleUnassign = async () => {
    if (!ticket) return;
    try {
      await api.assignTicket(ticket.id, null);
      setTicket((prev) => (prev ? { ...prev, assignedAdmin: null, assignedAdminId: null } : prev));
    } catch (err) {
      console.error("Failed to unassign ticket:", err);
    }
  };

  const handleSaveCategoryOverride = async () => {
    if (!ticket) return;
    try {
      const data = await api.overrideCategory(ticket.id, selectedCategory, categoryReason.trim() || undefined);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              category: data.ticket.category,
              isCategoryOverridden: true,
            }
          : prev
      );
      setEditingCategory(false);
    } catch (err) {
      console.error("Failed to override category:", err);
    }
  };

  const handleSavePriorityOverride = async () => {
    if (!ticket) return;
    try {
      const data = await api.overridePriority(ticket.id, selectedPriority, priorityReason.trim() || undefined);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              priority: data.ticket.priority,
              isPriorityOverridden: true,
              priorityReasoning: data.ticket.priorityReasoning,
            }
          : prev
      );
      setEditingPriority(false);
    } catch (err) {
      console.error("Failed to override priority:", err);
    }
  };

  const handleRegenerateDraft = async () => {
    if (!ticket) return;
    setRegeneratingDraft(true);
    try {
      const data = await api.regenerateDraft(ticket.id);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              aiDraftResponse: data.draftResponse,
              aiDraftConfidence: data.confidence,
              aiDraftGeneratedAt: new Date().toISOString(),
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to regenerate draft:", err);
    } finally {
      setRegeneratingDraft(false);
    }
  };

  const handleCalibrateTone = async (tone: "empathetic" | "concise" | "formal" | "de-escalation") => {
    if (!ticket || calibratingTone) return;
    setCalibratingTone(true);
    try {
      const res = await api.calibrateDraftTone(ticket.id, ticket.aiDraftResponse || "", tone);
      setTicket((prev) => (prev ? { ...prev, aiDraftResponse: res.calibratedDraft } : prev));
    } catch (err) {
      console.error("Failed to calibrate tone:", err);
    } finally {
      setCalibratingTone(false);
    }
  };

  const handleInsertDraft = () => {
    if (ticket?.aiDraftResponse) {
      setReplyText(ticket.aiDraftResponse);
      setIsInternalNote(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const data = await api.postMessage(ticketId, replyText.trim(), isInternalNote);
      setReplyText("");
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });

      if (!isInternalNote && ticket?.status === "Open") {
        setTicket((prev) => (prev ? { ...prev, status: "In Progress" } : prev));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return <div className="py-20 text-center text-xs text-slate-400 font-sans">Loading ticket workspace...</div>;
  }

  const getPriorityTag = (priority: TicketPriority) => {
    switch (priority) {
      case "Critical":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Critical Priority</span>;
      case "High":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">High Priority</span>;
      case "Medium":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">Medium Priority</span>;
      case "Low":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-slate-500">Low Priority</span>;
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-900 max-w-7xl mx-auto">
      {/* Top Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to queue</span>
        </button>

        <div className="flex items-center space-x-3 text-xs">
          {ticket.assignedAdmin ? (
            <div className="flex items-center space-x-1.5 text-slate-600">
              <span>Assigned:</span>
              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {ticket.assignedAdmin.name}
              </span>
              <button
                onClick={handleUnassign}
                className="text-slate-400 hover:text-red-600 underline ml-1 cursor-pointer"
              >
                Unassign
              </button>
            </div>
          ) : (
            <button
              onClick={handleAssignToMe}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md transition cursor-pointer"
            >
              Assign to me
            </button>
          )}

          {/* Status Dropdown */}
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-md px-2 py-1">
            <span className="text-slate-400">Status:</span>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              className="font-medium text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Header, Message History, Composer */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">{ticket.ticketNumber}</span>
              <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {ticket.category}
              </span>
              {getPriorityTag(ticket.priority)}
            </div>

            <h1 className="text-base font-bold text-slate-900 leading-snug">{ticket.subject}</h1>

            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
              <span>Opened {new Date(ticket.createdAt).toLocaleString("en-IN")}</span>
              {ticket.slaDueAt && (
                <>
                  <span>•</span>
                  <span className={new Date(ticket.slaDueAt).getTime() < Date.now() && ticket.status !== "Resolved" && ticket.status !== "Closed" ? "text-red-600 font-semibold" : "text-slate-500"}>
                    SLA Target: {new Date(ticket.slaDueAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} ({new Date(ticket.slaDueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                  </span>
                </>
              )}
            </div>

            {ticket.sentiment && ticket.sentiment !== "Normal" && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start space-x-2 mt-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Elevated sentiment / grievance risk detected: </span>
                  Author's phrasing indicates frustration. Recommend using the De-escalate or Empathetic response tone.
                </div>
              </div>
            )}
          </div>

          {/* Message Thread */}
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col min-h-[420px]">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">Conversation Thread</span>
              <span>{messages.length} messages</span>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 max-h-[440px] flex-1">
              {messages.map((m) => {
                const isAdmin = m.senderRole === "ADMIN";
                const isInternal = m.isInternalNote;

                return (
                  <div key={m.id} className="space-y-1">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      {isInternal ? (
                        <span className="font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 flex items-center space-x-1">
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>Internal note (Private)</span>
                        </span>
                      ) : isAdmin ? (
                        <span className="font-semibold text-slate-800">
                          {m.sender?.name || "BookLeaf Ops"} (Staff)
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {ticket.author.name} (Author)
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-lg text-xs leading-relaxed whitespace-pre-line ${
                        isInternal
                          ? "bg-amber-50/90 border border-amber-200 text-amber-950 font-sans"
                          : isAdmin
                          ? "bg-slate-50 border border-slate-200 text-slate-900"
                          : "bg-white border border-slate-200 text-slate-800"
                      }`}
                    >
                      {m.message}
                    </div>

                    {m.attachmentName && (
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 pl-1">
                        <Paperclip className="w-3 h-3" />
                        <span>Attached: {m.attachmentName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Box */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
              {/* Type Switcher */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 bg-slate-200/70 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                      !isInternalNote
                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Reply to author
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center space-x-1 ${
                      isInternalNote
                        ? "bg-amber-100 text-amber-900 shadow-2xs font-semibold border border-amber-300"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Internal note</span>
                  </button>
                </div>

                {ticket.aiDraftResponse && !isInternalNote && (
                  <button
                    type="button"
                    onClick={handleInsertDraft}
                    className="text-xs font-medium text-slate-700 hover:text-slate-900 underline cursor-pointer"
                  >
                    Insert suggested draft
                  </button>
                )}
              </div>

              {/* Quick Macro snippets */}
              {!isInternalNote && (
                <div
                  className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-[11px] text-slate-500 pb-0.5"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <span className="shrink-0 text-slate-400">Quick macros:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyText(
                        `Dear ${ticket.author.name.split(" ")[0]},\n\nWe sincerely apologize for the print issue with your book. Under BookLeaf's quality guarantee, we arrange a 100% complimentary reprint for defective copies.\n\nCould you please reply with 2-3 clear photographs showing the defect (binding, page alignment, or ink)? Once verified by production, we will dispatch replacements within 5-7 business days.\n\nWarm regards,\nBookLeaf Operations Team`
                      )
                    }
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-700 shrink-0 whitespace-nowrap transition cursor-pointer"
                  >
                    Defect Photos Request
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyText(
                        `Dear ${ticket.author.name.split(" ")[0]},\n\nThank you for reaching out regarding your royalty disbursement. Royalties are calculated on an 80/20 net profit split and paid quarterly within 45 days of the quarter ending (minimum threshold: ₹1,000).\n\nPlease ensure your bank account details are verified in your author profile so the finance desk can initiate disbursement.\n\nWarm regards,\nBookLeaf Operations Team`
                      )
                    }
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-700 shrink-0 transition cursor-pointer"
                  >
                    Bank Verification
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyText(
                        `Dear ${ticket.author.name.split(" ")[0]},\n\nThank you for alerting us. An "Unavailable" status on Amazon is typically caused by an inventory sync delay. We have triggered a manual feed re-sync with Amazon India, which typically reflects active purchase options within 24-48 hours.\n\nWarm regards,\nBookLeaf Operations Team`
                      )
                    }
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-700 shrink-0 transition cursor-pointer"
                  >
                    Amazon Stock Sync
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="space-y-2">
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? "Write an internal team note (hidden from author)..."
                      : "Type your official reply to the author..."
                  }
                  className={`w-full p-2.5 bg-white border rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition resize-y ${
                    isInternalNote
                      ? "border-amber-300 focus:border-amber-500 bg-amber-50/20"
                      : "border-slate-200 focus:border-slate-400"
                  }`}
                />

                <div className="flex items-center justify-between pt-0.5">
                  <div className="text-[11px] text-slate-400">
                    {isInternalNote ? "🔒 Internal notes are strictly visible to staff only." : "Author receives this reply in their portal immediately."}
                  </div>

                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className={`px-4 py-1.5 text-white font-medium text-xs rounded-md transition disabled:opacity-50 cursor-pointer ${
                      isInternalNote ? "bg-amber-700 hover:bg-amber-800" : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    {sending ? "Sending..." : isInternalNote ? "Save note" : "Send reply"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Metadata & Suggested Response */}
        <div className="lg:col-span-5 space-y-3">
          {/* Suggested Response Card */}
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <div className="text-xs font-semibold text-slate-900">Suggested Response</div>
                <div className="text-[10px] text-slate-400">Grounded in BookLeaf Knowledge Base</div>
              </div>
              <button
                type="button"
                onClick={handleRegenerateDraft}
                disabled={regeneratingDraft}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                title="Regenerate suggested draft"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingDraft ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Tone selector */}
            <div
              className="flex items-center space-x-1 overflow-x-auto no-scrollbar text-[11px]"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <span className="text-slate-400 text-[10px] pr-1 shrink-0">Tone:</span>
              <button
                type="button"
                onClick={() => handleCalibrateTone("empathetic")}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap shrink-0 transition cursor-pointer"
              >
                Empathetic
              </button>
              <button
                type="button"
                onClick={() => handleCalibrateTone("concise")}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap shrink-0 transition cursor-pointer"
              >
                Concise
              </button>
              <button
                type="button"
                onClick={() => handleCalibrateTone("formal")}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Formal
              </button>
              <button
                type="button"
                onClick={() => handleCalibrateTone("de-escalation")}
                className="px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
              >
                De-escalate
              </button>
            </div>

            {/* Text Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-md text-xs text-slate-800 leading-relaxed font-sans max-h-44 overflow-y-auto whitespace-pre-line">
              {calibratingTone ? (
                <div className="py-6 text-center text-slate-400 animate-pulse">
                  Adjusting draft tone...
                </div>
              ) : (
                ticket.aiDraftResponse || "No suggested draft available."
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Confidence: {Math.round((ticket.aiDraftConfidence || 0.94) * 100)}%
              </span>
              <button
                type="button"
                onClick={handleInsertDraft}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition cursor-pointer"
              >
                Use in composer
              </button>
            </div>
          </div>

          {/* Categorization Card */}
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Category</div>
                <div className="text-xs font-semibold text-slate-900 mt-0.5">{ticket.category}</div>
              </div>
              <div className="flex items-center space-x-1.5">
                {ticket.isCategoryOverridden ? (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                    Overridden
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                    Detected
                  </span>
                )}
                <button
                  onClick={() => setEditingCategory(!editingCategory)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                  title="Override category"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {editingCategory && (
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as TicketCategory)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Reason for change..."
                  value={categoryReason}
                  onChange={(e) => setCategoryReason(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                />
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setEditingCategory(false)} className="text-slate-500 hover:text-slate-700 text-xs">
                    Cancel
                  </button>
                  <button onClick={handleSaveCategoryOverride} className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-medium">
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Priority Card */}
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Priority</div>
                <div className="mt-0.5">{getPriorityTag(ticket.priority)}</div>
              </div>
              <div className="flex items-center space-x-1.5">
                {ticket.isPriorityOverridden ? (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                    Overridden
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                    Assigned
                  </span>
                )}
                <button
                  onClick={() => setEditingPriority(!editingPriority)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                  title="Override priority"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {ticket.priorityReasoning && (
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                {ticket.priorityReasoning}
              </div>
            )}

            {editingPriority && (
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as TicketPriority)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Reason for change..."
                  value={priorityReason}
                  onChange={(e) => setPriorityReason(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                />
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setEditingPriority(false)} className="text-slate-500 hover:text-slate-700 text-xs">
                    Cancel
                  </button>
                  <button onClick={handleSavePriorityOverride} className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-medium">
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Author Profile Card */}
          <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-3.5 space-y-2 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Author Details</div>
            <div>
              <div className="font-semibold text-slate-900">{ticket.author.name}</div>
              <div className="text-slate-500 text-[11px]">{ticket.author.email}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div>City: <span className="text-slate-800">{ticket.author.city || "-"}</span></div>
              <div>Phone: <span className="text-slate-800">{ticket.author.phone || "-"}</span></div>
            </div>
          </div>

          {/* Book Card */}
          {ticket.book ? (
            <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-3.5 space-y-2 text-xs">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Linked Book</div>
              <div>
                <div className="font-semibold text-slate-900">{ticket.book.title}</div>
                <div className="text-slate-400 text-[11px]">ISBN: {ticket.book.isbn || "Pending"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>Copies sold: <span className="font-medium text-slate-900">{ticket.book.totalCopiesSold.toLocaleString()}</span></div>
                <div>Pending: <span className="font-semibold text-amber-700">₹{ticket.book.royaltyPending.toLocaleString()}</span></div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-center text-xs text-slate-400">
              General / Account inquiry
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
