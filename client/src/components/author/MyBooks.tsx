import React, { useEffect, useState } from "react";
import { Book } from "../../types";
import { api } from "../../services/api";
import { Calculator, Compass, MessageSquarePlus } from "lucide-react";
import { RoyaltyCalculatorModal } from "../RoyaltyCalculatorModal";
import { ProductionJourneyModal } from "../ProductionJourneyModal";

interface Props {
  onSelectBookForTicket?: (bookId: string) => void;
}

export const MyBooks: React.FC<Props> = ({ onSelectBookForTicket }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedCalcBook, setSelectedCalcBook] = useState<Book | null>(null);
  const [selectedJourneyBook, setSelectedJourneyBook] = useState<Book | null>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await api.getBooks();
      setBooks(data.books);
    } catch (err) {
      console.error("Failed to load books:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalSold = books.reduce((acc, b) => acc + (b.totalCopiesSold || 0), 0);
  const totalEarned = books.reduce((acc, b) => acc + (b.totalRoyaltyEarned || 0), 0);
  const totalPaid = books.reduce((acc, b) => acc + (b.royaltyPaid || 0), 0);
  const totalPending = books.reduce((acc, b) => acc + (b.royaltyPending || 0), 0);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading catalog records...</div>;
  }

  return (
    <div className="space-y-4 font-sans text-slate-900">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Titles</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{books.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Published & in-production</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Copies Sold</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalSold.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across Amazon, Flipkart, Store</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Royalty Earned</div>
          <div className="text-xl font-bold text-slate-900 mt-1">₹{totalEarned.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">₹{totalPaid.toLocaleString()} disbursed</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Royalty Pending</div>
          <div className="text-xl font-bold text-slate-900 mt-1">₹{totalPending.toLocaleString()}</div>
          <div className="text-[11px] mt-0.5">
            {totalPending < 1000 && totalPending > 0 ? (
              <span className="text-amber-700 font-medium">Rolls over (&lt;₹1,000 threshold)</span>
            ) : totalPending >= 1000 ? (
              <span className="text-emerald-700 font-medium">Eligible for quarterly payout</span>
            ) : (
              <span className="text-slate-400">All settled</span>
            )}
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
          <span className="font-semibold text-slate-700">My Catalogue</span>
          <span className="text-slate-400">{books.length} titles</span>
        </div>

        {books.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No books found in this author account.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Title & Details</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">MRP</th>
                  <th className="px-3 py-3 text-right">Sold</th>
                  <th className="px-3 py-3 text-right">Earned</th>
                  <th className="px-3 py-3 text-right">Pending</th>
                  <th className="px-3 py-3">Channels</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((b) => {
                  const isLive = b.status === "Published & Live";
                  const channels = Array.isArray(b.availableOn) ? b.availableOn : [];

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 text-xs">{b.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ISBN: {b.isbn || "Pending"} • {b.genre || "General"}
                        </div>
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            isLive
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right font-medium text-slate-900">
                        {b.mrp ? `₹${b.mrp}` : "-"}
                      </td>

                      <td className="px-3 py-3 text-right font-medium text-slate-900 font-mono">
                        {b.totalCopiesSold.toLocaleString()}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="font-medium text-slate-900">₹{b.totalRoyaltyEarned.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">Paid: ₹{b.royaltyPaid.toLocaleString()}</div>
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="font-semibold text-slate-900">₹{b.royaltyPending.toLocaleString()}</div>
                        {b.royaltyPending > 0 && b.royaltyPending < 1000 && (
                          <div className="text-[10px] text-amber-700">Rollover</div>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {channels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {channels.map((ch) => (
                              <span
                                key={ch}
                                className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600"
                              >
                                {ch}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not live yet</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedJourneyBook(b)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Publishing pipeline stepper"
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedCalcBook(b)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="80/20 royalty simulator"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectBookForTicket?.(b.id)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded transition cursor-pointer"
                          >
                            Query
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RoyaltyCalculatorModal
        isOpen={Boolean(selectedCalcBook)}
        onClose={() => setSelectedCalcBook(null)}
        initialMrp={selectedCalcBook?.mrp || 399}
        initialCopies={selectedCalcBook?.totalCopiesSold || 200}
        bookTitle={selectedCalcBook?.title}
      />

      <ProductionJourneyModal
        isOpen={Boolean(selectedJourneyBook)}
        onClose={() => setSelectedJourneyBook(null)}
        book={selectedJourneyBook}
        onRaiseQueryAboutBook={onSelectBookForTicket}
      />
    </div>
  );
};
