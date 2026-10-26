import React, { useEffect, useState } from "react";
import { X, UserCheck, Shield, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoLoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { switchUser, user: currentUser } = useAuth();
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadDemoUsers();
    }
  }, [isOpen]);

  const loadDemoUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getDemoUsers();
      setDemoUsers(data.demoUsers);
    } catch (err) {
      console.error("Failed to load demo users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: any) => {
    await switchUser(user);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Switch Demo Account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any pre-seeded persona to test operations or author workflows
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User list */}
        <div
          className="overflow-y-auto no-scrollbar p-6 space-y-2.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading accounts...</div>
          ) : (
            demoUsers.map((u) => {
              const isCurrent = currentUser?.id === u.id;
              const isAdmin = u.role === "ADMIN";

              return (
                <div
                  key={u.id}
                  onClick={() => !isCurrent && handleSelectUser(u)}
                  className={`p-3.5 rounded border transition flex items-center justify-between cursor-pointer ${
                    isCurrent
                      ? "border-slate-900 bg-slate-50/70 cursor-default"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center font-medium text-xs ${
                        isAdmin
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {isAdmin ? <Shield className="w-4 h-4" /> : u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-900 text-sm">{u.name}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                            isAdmin
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {isAdmin ? "Admin Desk" : "Author"}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono">{u.email}</span>
                        {u.city && <span>• {u.city}</span>}
                      </div>
                      {!isAdmin && u.books && u.books.length > 0 && (
                        <div className="mt-1 flex items-center space-x-1.5 text-xs text-slate-600">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-sm">
                            {u.books.map((b: any) => b.title).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isCurrent && (
                    <div className="flex items-center space-x-1 text-xs font-medium text-slate-700 hover:text-slate-900 pr-1">
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
