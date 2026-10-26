import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { LoginView } from "./components/LoginView";
import { KnowledgeBaseModal } from "./components/KnowledgeBaseModal";
import { DemoLoginModal } from "./components/DemoLoginModal";
import { RoyaltyCalculatorModal } from "./components/RoyaltyCalculatorModal";
import { GuidedTour } from "./components/GuidedTour";
import { MyBooks } from "./components/author/MyBooks";
import { SubmitTicket } from "./components/author/SubmitTicket";
import { MyTickets } from "./components/author/MyTickets";
import { AuthorTicketDetail } from "./components/author/AuthorTicketDetail";
import { AdminQueue } from "./components/admin/AdminQueue";
import { AdminTicketDetail } from "./components/admin/AdminTicketDetail";
import { BookOpen, MessageSquare, Plus } from "lucide-react";

type AuthorTab = "books" | "submit" | "tickets";

export const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [isDemoSwitcherOpen, setIsDemoSwitcherOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Author Portal States
  const [authorTab, setAuthorTab] = useState<AuthorTab>("books");
  const [preselectedBookId, setPreselectedBookId] = useState<string | null>(null);
  const [activeAuthorTicketId, setActiveAuthorTicketId] = useState<string | null>(null);

  // Admin Portal States
  const [activeAdminTicketId, setActiveAdminTicketId] = useState<string | null>(null);

  // Automatically trigger tour guide for new users on first login after dashboard loads
  useEffect(() => {
    if (user) {
      try {
        const tourKey = `bookleaf_tour_seen_${user.role}_${user.id}`;
        const seen = localStorage.getItem(tourKey);
        if (!seen) {
          const timer = setTimeout(() => {
            setIsTourOpen(true);
          }, 1200);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.warn("Tour storage check:", e);
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-3">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs text-slate-500 font-mono">Loading BookLeaf Portal...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginView onOpenKnowledgeBase={() => setIsKbOpen(true)} />
        <KnowledgeBaseModal isOpen={isKbOpen} onClose={() => setIsKbOpen(false)} />
      </>
    );
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans text-slate-900 antialiased">
      {/* Navigation Header */}
      <Navbar
        onOpenKnowledgeBase={() => setIsKbOpen(true)}
        onOpenDemoSwitcher={() => setIsDemoSwitcherOpen(true)}
        onOpenCalculator={() => setIsCalcOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isAdmin ? (
          /* ================= ADMIN OPERATIONS PORTAL ================= */
          <div>
            {activeAdminTicketId ? (
              <AdminTicketDetail
                ticketId={activeAdminTicketId}
                onBack={() => setActiveAdminTicketId(null)}
              />
            ) : (
              <AdminQueue onSelectTicket={(id) => setActiveAdminTicketId(id)} />
            )}
          </div>
        ) : (
          /* ================= AUTHOR SELF-SERVICE PORTAL ================= */
          <div>
            {activeAuthorTicketId ? (
              <AuthorTicketDetail
                ticketId={activeAuthorTicketId}
                onBack={() => setActiveAuthorTicketId(null)}
              />
            ) : (
              <div className="space-y-6">
                {/* Author Portal Navigation Tabs */}
                <div className="bg-white p-1 rounded border border-slate-200 inline-flex space-x-1">
                  <button
                    onClick={() => setAuthorTab("books")}
                    data-tour="author-books-tab"
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                      authorTab === "books"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>My Books</span>
                  </button>

                  <button
                    onClick={() => {
                      setPreselectedBookId(null);
                      setAuthorTab("submit");
                    }}
                    data-tour="author-submit-tab"
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                      authorTab === "submit"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Submit Query</span>
                  </button>

                  <button
                    onClick={() => setAuthorTab("tickets")}
                    data-tour="author-tickets-tab"
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                      authorTab === "tickets"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>My Tickets</span>
                  </button>
                </div>

                {/* Tab Views */}
                {authorTab === "books" && (
                  <MyBooks
                    onSelectBookForTicket={(bookId) => {
                      setPreselectedBookId(bookId);
                      setAuthorTab("submit");
                    }}
                  />
                )}

                {authorTab === "submit" && (
                  <SubmitTicket
                    initialBookId={preselectedBookId}
                    onTicketCreated={(ticketId) => {
                      setActiveAuthorTicketId(ticketId);
                    }}
                    onCancel={() => setAuthorTab("books")}
                  />
                )}

                {authorTab === "tickets" && (
                  <MyTickets
                    onOpenTicket={(ticketId) => setActiveAuthorTicketId(ticketId)}
                    onRaiseNewTicket={() => {
                      setPreselectedBookId(null);
                      setAuthorTab("submit");
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Modals & Interactive Tour */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSwitchTab={(tab) => setAuthorTab(tab)}
      />
      <KnowledgeBaseModal isOpen={isKbOpen} onClose={() => setIsKbOpen(false)} />
      <DemoLoginModal isOpen={isDemoSwitcherOpen} onClose={() => setIsDemoSwitcherOpen(false)} />
      <RoyaltyCalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
