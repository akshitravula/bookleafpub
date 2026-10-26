import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, HelpCircle } from "lucide-react";

interface Props {
  onOpenKnowledgeBase: () => void;
}

export const LoginView: React.FC<Props> = ({ onOpenKnowledgeBase }) => {
  const { login, switchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "demo">("signin");
  const [email, setEmail] = useState("admin@bookleafpub.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: "ADMIN",
      name: "Operations Admin",
      email: "admin@bookleafpub.com",
      subtitle: "Operations Queue • Triage & AI Drafts",
      badge: "Staff Desk",
    },
    {
      role: "AUTHOR",
      name: "Priya Sharma",
      email: "priya.sharma@email.com",
      subtitle: "Whispers of the Ganges • ₹3,570 Pending",
      badge: "AUTH001",
    },
    {
      role: "AUTHOR",
      name: "Ananya Reddy",
      email: "ananya.reddy@email.com",
      subtitle: "Between Two Temples • ISBN Issue",
      badge: "AUTH003",
    },
    {
      role: "AUTHOR",
      name: "Vikram Joshi",
      email: "vikram.joshi@email.com",
      subtitle: "Debugging Life • Reprint Request",
      badge: "AUTH004",
    },
    {
      role: "AUTHOR",
      name: "Sneha Kulkarni",
      email: "sneha.kulkarni@email.com",
      subtitle: "The Algorithm of Love • Stock Sync",
      badge: "AUTH007",
    },
  ];

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#F8F9FA] flex flex-col justify-between py-3 px-3 sm:py-8 sm:px-6 lg:px-8 text-slate-900 font-sans select-none">
      {/* Top Header Brand */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto text-center shrink-0 pt-1">
        <div className="inline-flex items-center justify-center mb-1.5 sm:mb-2">
          <img
            src="https://res.cloudinary.com/imq5966f/image/upload/v1792991576/171322.png"
            alt="BookLeaf Publishing Logo"
            className="w-8 h-8 sm:w-11 sm:h-11 object-contain mx-auto"
          />
        </div>
        <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
          BookLeaf Publishing
        </h1>
        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
          Author Support & Editorial Operations Portal
        </p>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto shrink-0">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
          {/* Subtle switcher tabs */}
          <div className="flex border-b border-slate-100 pb-2 mb-3.5 sm:mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={`text-xs font-semibold pb-1 transition relative mr-4 cursor-pointer ${
                activeTab === "signin"
                  ? "text-slate-900 border-b-2 border-slate-900 font-bold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Account Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("demo")}
              className={`text-xs font-semibold pb-1 transition relative cursor-pointer ${
                activeTab === "demo"
                  ? "text-slate-900 border-b-2 border-slate-900 font-bold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Demo Accounts (1-Click)
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {activeTab === "signin" ? (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2 sm:py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>{loading ? "Signing in..." : "Continue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("demo")}
                  className="text-[11px] text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Quick evaluator access? <span className="font-semibold underline">Select demo user</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-500 mb-1.5">
                Click any persona to log in immediately:
              </p>
              <div className="max-h-[220px] sm:max-h-[260px] overflow-y-auto space-y-1.5 pr-1">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => switchUser({ email: acc.email, role: acc.role })}
                    className="w-full text-left p-2 sm:p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-xs text-slate-900">{acc.name}</span>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {acc.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{acc.subtitle}</div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-900 shrink-0">
                      Enter →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Knowledge Base Footnote Link */}
        <div className="mt-2.5 sm:mt-3 text-center">
          <button
            type="button"
            onClick={onOpenKnowledgeBase}
            className="inline-flex items-center space-x-1 text-[11px] sm:text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Read Knowledge Base & Policies</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] sm:text-[11px] text-slate-400 shrink-0 pb-1">
        BookLeaf Publishing © {new Date().getFullYear()} • Support & Editorial Desk
      </div>
    </div>
  );
};
