import React, { useEffect, useState } from "react";
import { Ticket } from "../../types";
import { api } from "../../services/api";
import { socketClient } from "../../services/socket";
import { MessageSquarePlus, ChevronRight } from "lucide-react";

interface Props {
  onOpenTicket: (ticketId: string) => void;
  onRaiseNewTicket: () => void;
}

export const MyTickets: React.FC<Props> = ({ onOpenTicket, onRaiseNewTicket }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();

    const socket = socketClient.getSocket();
    const handleTicketCreated = (newTicket: Ticket) => {
      setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
    };

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
      );
    };

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, []);

  const loadTickets = async () => {
    try {
      const data = await api.getTickets();
      setTickets(data.tickets);
    } catch (err) {
      console.error("Failed to load author tickets:", err);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading support inquiries...</div>;
  }

  return (
    <div className="space-y-4 font-sans text-slate-900">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Support Inquiries</h2>
          <p className="text-xs text-slate-500">Track operations replies and ticket resolution status in real time</p>
        </div>
        <button
          onClick={onRaiseNewTicket}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition cursor-pointer"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>New Inquiry</span>
        </button>
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200/90 p-12 text-center">
          <p className="text-xs text-slate-500 mb-4">No inquiries raised yet.</p>
          <button
            onClick={onRaiseNewTicket}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition cursor-pointer"
          >
            Submit an Inquiry
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => onOpenTicket(t.id)}
              className="p-4 hover:bg-slate-50/80 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-400">{t.ticketNumber}</span>
                  {getStatusDot(t.status)}
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    {t.category}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900 group-hover:text-slate-700 transition truncate">
                  {t.subject}
                </div>

                <p className="text-xs text-slate-500 line-clamp-1">
                  {t.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                  {t.book && <span className="text-slate-600 font-medium">{t.book.title}</span>}
                  <span>•</span>
                  <span>{new Date(t.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center text-xs font-medium text-slate-600 group-hover:text-slate-900">
                <span>View conversation</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
