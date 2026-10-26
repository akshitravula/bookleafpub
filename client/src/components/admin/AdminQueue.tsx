import React, { useEffect, useState } from "react";
import { Ticket, AnalyticsData, TicketPriority, TicketStatus } from "../../types";
import { api } from "../../services/api";
import { socketClient } from "../../services/socket";
import { AdminAnalyticsBar } from "./AdminAnalyticsBar";
import { Search, ChevronRight, Clock, AlertCircle } from "lucide-react";

interface Props {
  onSelectTicket: (ticketId: string) => void;
}

export const AdminQueue: React.FC<Props> = ({ onSelectTicket }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("urgent");

  useEffect(() => {
    loadData();

    const socket = socketClient.getSocket();
    socketClient.joinAdmin();

    const handleTicketCreated = (newTicket: Ticket) => {
      setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
      refreshAnalytics();
    };

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
      );
      refreshAnalytics();
    };

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
    };
  }, []);

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter, priorityFilter, search, sortBy]);

  const loadData = async () => {
    await Promise.all([loadTickets(), refreshAnalytics()]);
    setLoading(false);
  };

  const refreshAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  const loadTickets = async () => {
    try {
      const data = await api.getTickets({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search,
        sortBy,
      });
      setTickets(data.tickets);
    } catch (err) {
      console.error("Failed to load queue:", err);
    }
  };

  const getPriorityTag = (priority: TicketPriority) => {
    switch (priority) {
      case "Critical":
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">Critical</span>;
      case "High":
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">High</span>;
      case "Medium":
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200">Medium</span>;
      case "Low":
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500">Low</span>;
    }
  };

  const getStatusDot = (status: TicketStatus) => {
    switch (status) {
      case "Open":
        return <span className="inline-flex items-center text-xs font-medium text-blue-700"><span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5" />Open</span>;
      case "In Progress":
        return <span className="inline-flex items-center text-xs font-medium text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />In Progress</span>;
      case "Resolved":
        return <span className="inline-flex items-center text-xs font-medium text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />Resolved</span>;
      case "Closed":
        return <span className="inline-flex items-center text-xs font-medium text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />Closed</span>;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diffMs / (3600 * 1000));
    if (hours < 1) return "Just now";
    if (hours === 1) return "1h ago";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4 font-sans text-slate-900">
      {/* Analytics Strip */}
      <AdminAnalyticsBar
        analytics={analytics}
        selectedCategory={categoryFilter}
        onSelectCategory={(cat) => setCategoryFilter(cat)}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by author, book, reference #, or content..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 focus:bg-white transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 font-medium text-xs text-slate-800 rounded-md focus:outline-hidden cursor-pointer"
          >
            <option value="urgent">Sort: Priority & Oldest Unresolved</option>
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>
      </div>

      {/* Ticket Queue List */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden" data-tour="admin-queue-table">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <span className="font-semibold text-slate-700">Inbox ({tickets.length})</span>
          <span>Click any row to open conversation & draft</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No tickets matching selected filters.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((t) => {
              const isUrgent =
                (t.priority === "Critical" || t.priority === "High") &&
                (t.status === "Open" || t.status === "In Progress");

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className={`px-4 py-3.5 transition flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:bg-slate-50/80 cursor-pointer ${
                    isUrgent ? "border-l-2 border-l-red-500 bg-red-50/10" : ""
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-slate-500">{t.ticketNumber}</span>
                      {getStatusDot(t.status)}
                      {getPriorityTag(t.priority)}
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {t.category}
                      </span>
                      {t.sentiment && t.sentiment !== "Normal" && (
                        <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-1 py-0.2 rounded font-medium">
                          Escalation risk
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700 transition truncate">
                      {t.subject}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="text-slate-600 font-medium">{t.author.name}</span>
                      {t.book && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600">{t.book.title}</span>
                          {t.book.royaltyPending > 0 && (
                            <span className="text-amber-700 font-medium">
                              (Pending: ₹{t.book.royaltyPending.toLocaleString()})
                            </span>
                          )}
                        </>
                      )}
                      <span>•</span>
                      <span>{getTimeAgo(t.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
                    {t.assignedAdmin ? (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {t.assignedAdmin.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                        Unassigned
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
