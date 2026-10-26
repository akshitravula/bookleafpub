import React, { useEffect, useState } from "react";
import { Book } from "../../types";
import { api } from "../../services/api";
import { Send, UploadCloud, X, AlertCircle, FileText, Info } from "lucide-react";

interface Props {
  initialBookId?: string | null;
  onTicketCreated: (ticketId: string) => void;
  onCancel: () => void;
}

export const SubmitTicket: React.FC<Props> = ({ initialBookId, onTicketCreated, onCancel }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; size: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInstantSuggestion = () => {
    const text = `${subject} ${description}`.toLowerCase();
    if (text.includes("royalt") || text.includes("payout") || text.includes("payment") || text.includes("bank")) {
      return {
        topic: "Royalty schedule & threshold",
        answer: "BookLeaf royalties follow an 80/20 net profit split and are disbursed quarterly within 45 days of the quarter ending. The minimum payout threshold is ₹1,000 (balances below ₹1,000 roll over automatically).",
      };
    }
    if (text.includes("amazon") || text.includes("unavailable") || text.includes("stock")) {
      return {
        topic: "Platform stock synchronization",
        answer: "When a published title shows 'Currently Unavailable' on Amazon or Flipkart, it is typically a temporary feed synchronization latency. Submitting this inquiry triggers an automated 24-48h catalog re-sync.",
      };
    }
    if (text.includes("isbn") || text.includes("barcode")) {
      return {
        topic: "ISBN assignment & error escalation",
        answer: "Every book is assigned a unique ISBN under BookLeaf's publisher imprint. Retail ISBN mismatches are treated as High Priority with an immediate 48-hour resolution target.",
      };
    }
    if (text.includes("print") || text.includes("defect") || text.includes("blurry") || text.includes("bind")) {
      return {
        topic: "Complimentary reprint policy",
        answer: "Under BookLeaf's quality guarantee, we provide 100% complimentary reprints for misprints or defective copies within 5-7 business days once you attach photos of the defect.",
      };
    }
    return null;
  };

  const instantSuggestion = getInstantSuggestion();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await api.getBooks();
      setBooks(data.books);
    } catch (err) {
      console.error("Failed to load author books:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Please provide both a subject and a description.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createTicket({
        bookId: selectedBookId ? selectedBookId : null,
        subject: subject.trim(),
        description: description.trim(),
        attachmentName: attachment ? attachment.name : null,
        attachmentUrl: attachment ? `/uploads/mock_${attachment.name}` : null,
      });

      onTicketCreated(res.ticket.id);
    } catch (err: any) {
      setError(err?.message || "Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden font-sans text-slate-900">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-base font-bold text-slate-900">Raise a Support Inquiry</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit questions regarding royalties, distribution, printing quality, or metadata.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Book Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Related Book
          </label>
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 transition"
          >
            <option value="">General / Account Level (Not book-specific)</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} (ISBN: {b.isbn || "Pending"}) - {b.status}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Linking a title automatically connects sales, printing partner, and royalty data to your inquiry.
          </p>
        </div>

        {/* Subject Line */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Inquiring about Q3 royalty payout date or ISBN listing"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 transition"
          />
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Description *
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please detail your question. If reporting print defects, mention defective page numbers. If inquiring about royalties, include platform or dates."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 transition resize-y"
          />
        </div>

        {/* Instant Policy Answer Callout */}
        {instantSuggestion && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800 text-[11px]">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Relevant Policy ({instantSuggestion.topic}):</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{instantSuggestion.answer}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium shrink-0 transition cursor-pointer"
            >
              This resolves my issue
            </button>
          </div>
        )}

        {/* Optional File Attachment */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Attachment (Optional)
          </label>
          {attachment ? (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <div>
                  <div className="text-xs font-medium text-slate-800">{attachment.name}</div>
                  <div className="text-[10px] text-slate-400">{attachment.size}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="border border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 rounded-md p-3 flex flex-col items-center justify-center cursor-pointer transition">
              <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs text-slate-600 font-medium">Click to attach photos or documents</span>
              <span className="text-[10px] text-slate-400">Required if reporting print defects or shipping damage</span>
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
            </label>
          )}
        </div>

        {/* Buttons */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-md transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Submitting..." : "Submit Inquiry"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
