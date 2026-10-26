import React from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, HelpCircle, Users, ExternalLink, Calculator, Compass } from "lucide-react";

interface Props {
  onOpenKnowledgeBase: () => void;
  onOpenDemoSwitcher: () => void;
  onOpenCalculator: () => void;
  onStartTour: () => void;
}

export const Navbar: React.FC<Props> = ({
  onOpenKnowledgeBase,
  onOpenDemoSwitcher,
  onOpenCalculator,
  onStartTour,
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0" data-tour="nav-brand">
          <div className="flex items-center space-x-2">
            <img
              src="https://res.cloudinary.com/imq5966f/image/upload/v1792991576/171322.png"
              alt="BookLeaf Publishing Logo"
              className="w-7 h-7 object-contain rounded-xs"
            />
            <span className="font-semibold text-slate-900 text-sm tracking-tight">BookLeaf</span>
          </div>

          <span className="hidden sm:inline text-slate-300">/</span>

          <span className="hidden sm:inline-block text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {isAdmin ? "Staff Operations" : "Author Workspace"}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Guided Tour Guide Button */}
          <button
            onClick={onStartTour}
            data-tour="nav-tour"
            className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
            title="Take interactive tour of the portal"
          >
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Tour</span>
          </button>

          {/* Royalty Calculator Button */}
          <button
            onClick={onOpenCalculator}
            data-tour="nav-calc"
            className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
            title="Open Interactive 80/20 Net Profit Calculator"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Royalty Calc</span>
          </button>

          {/* Knowledge Base Button */}
          <button
            onClick={onOpenKnowledgeBase}
            data-tour="nav-kb"
            className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
            title="Read official BookLeaf Knowledge Base policies"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Knowledge Base</span>
          </button>

          {/* API Docs Button */}
          <a
            href="http://localhost:5000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
            title="Open Swagger OpenAPI Documentation"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Demo User Switcher Button */}
          <button
            onClick={onOpenDemoSwitcher}
            data-tour="nav-switcher"
            className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition cursor-pointer"
            title="Switch between Admin and Author demo accounts"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Switch Account</span>
          </button>

          <div className="hidden sm:block h-4 w-px bg-slate-200 mx-1" />

          {/* User Profile Info */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 pl-0.5 sm:pl-1">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <div className="font-semibold text-slate-900">{user.name}</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
