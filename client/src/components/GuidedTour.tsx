import React, { useEffect, useState, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Check, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export interface TourStep {
  id: string;
  targetSelector?: string;
  tabToSwitch?: "books" | "submit" | "tickets";
  title: string;
  description: string;
  badge?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: "books" | "submit" | "tickets") => void;
}

export const GuidedTour: React.FC<Props> = ({ isOpen, onClose, onSwitchTab }) => {
  const { user } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const activeElementRef = useRef<HTMLElement | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const authorSteps: TourStep[] = [
    {
      id: "author-welcome",
      targetSelector: '[data-tour="nav-brand"]',
      title: "Welcome to BookLeaf Author Workspace",
      badge: "Author Overview",
      description:
        "Your personal dashboard to monitor published books, live sales, royalty earnings, and raise support queries with real-time updates.",
    },
    {
      id: "author-books",
      targetSelector: '[data-tour="author-books-tab"]',
      tabToSwitch: "books",
      title: "My Books & Royalty Tracking",
      badge: "Catalog Desk",
      description:
        "Review your catalog, 13-digit ISBNs, and net sales. Royalties below the ₹1,000 threshold roll over to the subsequent quarter per BookLeaf's 80/20 royalty policy.",
    },
    {
      id: "author-submit",
      targetSelector: '[data-tour="author-submit-tab"]',
      tabToSwitch: "submit",
      title: "Submit a Support Query",
      badge: "Smart Help Desk",
      description:
        "Raise queries linked to specific books or general inquiries. Our knowledge engine suggests instant answers as you type to resolve common questions immediately.",
    },
    {
      id: "author-tickets",
      targetSelector: '[data-tour="author-tickets-tab"]',
      tabToSwitch: "tickets",
      title: "Real-Time Conversation Desk",
      badge: "Live Updates",
      description:
        "All tickets update in real time via WebSockets. When operations replies, updates appear without refreshing. You can also rate ticket resolution via 5-star CSAT.",
    },
    {
      id: "author-calc",
      targetSelector: '[data-tour="nav-calc"]',
      title: "Royalty 80/20 Simulator",
      badge: "Financial Transparency",
      description:
        "Simulate net author earnings based on retail MRP, print costs, platform commission (~15%), and shipping according to BookLeaf's transparent 80/20 split.",
    },
    {
      id: "author-kb",
      targetSelector: '[data-tour="nav-kb"]',
      title: "Official Policy Knowledge Base",
      badge: "Policies & SLAs",
      description:
        "Check official operating rules anytime: Delhi press 5-7 day reprint guarantees, 48-hour ISBN resolution turnaround, and Amazon inventory sync procedures.",
    },
  ];

  const adminSteps: TourStep[] = [
    {
      id: "admin-welcome",
      targetSelector: '[data-tour="nav-brand"]',
      title: "BookLeaf Operations Desk",
      badge: "Operations Command",
      description:
        "Central management console for handling incoming author queries across BookLeaf's 22,000+ titles and 1,200+ monthly publications.",
    },
    {
      id: "admin-analytics",
      targetSelector: '[data-tour="admin-analytics-strip"]',
      title: "Live Operations KPI Strip",
      badge: "Triage Metrics",
      description:
        "Monitor open ticket queues, critical-tier issues, average resolution aging, and real-time category distribution across all authors.",
    },
    {
      id: "admin-queue",
      targetSelector: '[data-tour="admin-queue-table"]',
      title: "Priority Queue & Aging Escalations",
      badge: "Intelligent Queue",
      description:
        "Tickets are sorted by urgency. Queries waiting more than 12 hours feature aging flags. High-priority issues (such as Amazon retail ISBN mismatches) are pinned near the top.",
    },
    {
      id: "admin-classification",
      targetSelector: '[data-tour="admin-filter-pills"]',
      title: "AI Auto-Classification & Overrides",
      badge: "Classification Engine",
      description:
        "Every incoming inquiry is categorized into 1 of 6 operational categories and assigned a priority score with explicit rationale. Operations staff can override any classification with full audit tracking.",
    },
    {
      id: "admin-switcher",
      targetSelector: '[data-tour="nav-switcher"]',
      title: "1-Click Persona Switcher",
      badge: "Evaluator Tool",
      description:
        "Seamlessly switch between staff operations and any of the 10 pre-seeded authors to verify how tickets and real-time updates appear on both sides.",
    },
  ];

  const steps = isAdmin ? adminSteps : authorSteps;
  const currentStep = steps[currentStepIndex] || steps[0];

  // Tab switch handler
  useEffect(() => {
    if (!isOpen) return;
    if (currentStep?.tabToSwitch && onSwitchTab) {
      onSwitchTab(currentStep.tabToSwitch);
    }
  }, [isOpen, currentStepIndex]);

  // Highlight target element with class
  useEffect(() => {
    // Remove previous spotlight class
    if (activeElementRef.current) {
      activeElementRef.current.classList.remove("tour-spotlight-active");
      activeElementRef.current = null;
    }

    if (!isOpen || !currentStep?.targetSelector) return;

    // Allow tab switch / DOM update to settle
    const timer = setTimeout(() => {
      try {
        const el = document.querySelector(currentStep.targetSelector!) as HTMLElement;
        if (el) {
          el.classList.add("tour-spotlight-active");
          activeElementRef.current = el;

          // Check if element is in viewport; if not, gently scroll it into view
          const rect = el.getBoundingClientRect();
          const isInViewport =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth);

          if (!isInViewport) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      } catch (err) {
        console.warn("Tour spotlight error:", err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (activeElementRef.current) {
        activeElementRef.current.classList.remove("tour-spotlight-active");
        activeElementRef.current = null;
      }
    };
  }, [isOpen, currentStepIndex, currentStep]);

  // Clean up spotlight on unmount or close
  useEffect(() => {
    return () => {
      if (activeElementRef.current) {
        activeElementRef.current.classList.remove("tour-spotlight-active");
        activeElementRef.current = null;
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleComplete();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (activeElementRef.current) {
      activeElementRef.current.classList.remove("tour-spotlight-active");
      activeElementRef.current = null;
    }
    if (user) {
      try {
        localStorage.setItem(`bookleaf_tour_seen_${user.role}_${user.id}`, "true");
      } catch {}
    }
    onClose();
    setCurrentStepIndex(0);
  };

  if (!isOpen) return null;

  return (
    <aside
      role="dialog"
      aria-label="Guided Product Tour"
      className="fixed z-50 transition-all duration-200 bottom-3 inset-x-3 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[390px] max-w-full"
    >
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 text-slate-900 p-4 sm:p-5 ring-1 ring-slate-900/5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-slate-100 text-slate-700">
              <Compass className="w-3.5 h-3.5" />
            </div>
            {currentStep.badge && (
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                {currentStep.badge}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400">
              {currentStepIndex + 1} of {steps.length}
            </span>
            <button
              onClick={handleComplete}
              className="text-slate-400 hover:text-slate-700 p-1 rounded transition cursor-pointer"
              title="Close tour (Esc)"
              aria-label="Close Tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold text-slate-900">{currentStep.title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{currentStep.description}</p>
        </div>

        {/* Footer Navigation Controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex space-x-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-4 bg-slate-900"
                    : "w-1.5 bg-slate-200 hover:bg-slate-300"
                }`}
                title={`Step ${idx + 1}`}
                aria-label={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              onClick={handleComplete}
              className="text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1 transition cursor-pointer"
            >
              Skip
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition cursor-pointer shadow-xs"
            >
              <span>{currentStepIndex === steps.length - 1 ? "Finish" : "Next"}</span>
              {currentStepIndex < steps.length - 1 ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
