import React, { useEffect, useState, useRef } from "react";
import { Ticket, TicketMessage } from "../../types";
import { api } from "../../services/api";
import { socketClient } from "../../services/socket";
import { ArrowLeft, Send, BookOpen, Paperclip, Shield } from "lucide-react";

interface Props {
  ticketId: string;
  onBack: () => void;
}

export const AuthorTicketDetail: React.FC<Props> = ({ ticketId, onBack }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
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
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const data = await api.postMessage(ticketId, replyText.trim(), false);
      setReplyText("");
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading || !ticket) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading conversation...</div>;
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case "Open":
        return <span className="inline-flex items-center text-xs text-blue-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5" />Open</span>;
      case "In Progress":
        return <span className="inline-flex items-center text-xs text-amber-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />In Progress</span>;
      case "Resolved":
        return <span className="inline-flex items-center text-xs text-emerald-700 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />Resolved</span>;
      case "Closed":
        return <span className="inline-flex items-center text-xs text-slate-500 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />Closed</span>;
      default:
        return <span className="inline-flex items-center text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 font-sans text-slate-900">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to inquiries</span>
        </button>
        <span className="text-[11px] text-slate-400">Live real-time sync active</span>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-semibold text-slate-400">{ticket.ticketNumber}</span>
            {getStatusDot(ticket.status)}
            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.2 rounded">
              {ticket.category}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {new Date(ticket.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        <h1 className="text-base font-bold text-slate-900">{ticket.subject}</h1>

        {ticket.book && (
          <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-md flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-900">{ticket.book.title}</span>
              <span className="text-slate-400">• ISBN: {ticket.book.isbn || "Pending"}</span>
            </div>
            <span className="text-slate-500 text-[11px]">Status: {ticket.book.status}</span>
          </div>
        )}
      </div>

      {/* Conversation Stream */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col min-h-[380px]">
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-700">Message Thread</span>
          <span>{messages.length} messages</span>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 max-h-[460px] flex-1">
          {messages.map((m) => {
            const isAdmin = m.senderRole === "ADMIN";

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
              >
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-1 px-1">
                  {isAdmin ? (
                    <span className="font-semibold text-slate-800 flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-slate-500" />
                      <span>BookLeaf Support</span>
                    </span>
                  ) : (
                    <span className="font-medium text-slate-700">You</span>
                  )}
                  <span>•</span>
                  <span>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div
                  className={`max-w-lg rounded-lg p-3 text-xs leading-relaxed whitespace-pre-line ${
                    isAdmin
                      ? "bg-slate-50 border border-slate-200 text-slate-900"
                      : "bg-slate-900 text-white shadow-2xs"
                  }`}
                >
                  {m.message}
                </div>

                {m.attachmentName && (
                  <div className="mt-1 text-[11px] text-slate-400 flex items-center space-x-1 px-1">
                    <Paperclip className="w-3 h-3" />
                    <span>Attached: {m.attachmentName}</span>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* CSAT Rating Widget if Resolved */}
        {ticket.status === "Resolved" && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div>
              <div className="font-medium text-slate-900">How was your support experience?</div>
              <div className="text-slate-400 text-[11px]">Your rating helps BookLeaf improve author care.</div>
            </div>
            {ticket.csatRating ? (
              <div className="text-xs font-semibold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200">
                Rating: {"⭐".repeat(ticket.csatRating)}
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={async () => {
                      try {
                        const data = await api.submitCsat(ticket.id, star);
                        setTicket((prev) => (prev ? { ...prev, csatRating: data.ticket.csatRating } : prev));
                      } catch (err) {
                        console.error("CSAT submission failed:", err);
                      }
                    }}
                    className="p-1 hover:scale-110 transition text-sm cursor-pointer"
                    title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reply Form */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {ticket.status === "Closed" ? (
            <div className="text-center py-2 text-xs text-slate-400">
              This inquiry has been closed. Please open a new inquiry if you have more questions.
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="space-y-1.5">
              {ticket.status === "Resolved" && (
                <div className="text-[11px] text-amber-700 font-medium">
                  Note: Replying here will automatically reopen this inquiry for our team.
                </div>
              )}
              <div className="flex items-end space-x-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    ticket.status === "Resolved"
                      ? "Have a follow-up? Type here to reopen..."
                      : "Type your reply to BookLeaf..."
                  }
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 resize-none"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition disabled:opacity-50 h-9 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
