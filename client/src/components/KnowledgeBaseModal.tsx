import React from "react";
import { X, BookOpen } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBaseModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <img
              src="https://res.cloudinary.com/imq5966f/image/upload/v1792991576/171322.png"
              alt="BookLeaf Logo"
              className="w-6 h-6 object-contain"
            />
            <div>
              <h2 className="text-base font-semibold text-slate-900">BookLeaf Knowledge Base</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official operating policies grounding automated drafts and agent macros
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Section: Overview */}
          <div className="border border-slate-200 rounded p-4 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900 text-sm mb-1.5">Company Overview</h3>
            <p className="text-slate-600">
              BookLeaf Publishing is a self-publishing platform operating in India and the US, processing 1,200+ titles monthly across a catalog of 22,000+ books. Production facilities are headquartered in Delhi, partnered with print networks including <strong>Repro India</strong> and <strong>Epitome Books</strong>. Packages include Standard Free (no upfront cost) and Bestseller Breakthrough (paid marketing & distribution).
            </p>
          </div>

          {/* Section: Royalty */}
          <div className="border border-slate-200 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 text-sm">Royalty Policy</h3>
              <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                80% Net Profit / 20% Publisher
              </span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li><strong>Formula:</strong> Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart ~15%), and shipping charges.</li>
              <li><strong>Payout Schedule:</strong> Calculated quarterly, distributed within 45 days of quarter close (Q1: May 15, Q2: Aug 15, Q3: Nov 15, Q4: Feb 15).</li>
              <li><strong>Threshold:</strong> Minimum payout ₹1,000. Balances below ₹1,000 roll over automatically to the subsequent quarter.</li>
              <li><strong>Disbursement:</strong> Direct bank transfer to the verified account on file.</li>
            </ul>
          </div>

          {/* Section: ISBN */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-2">ISBN & Imprint Assignment</h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Each book published receives a dedicated 13-digit ISBN registered under BookLeaf&apos;s imprint.</li>
              <li>Authors retaining their own imprint must supply valid RRRLF or Bowker registration certificates.</li>
              <li><strong>Catalog Discrepancies:</strong> Mismatched ISBNs or duplicate retail links trigger high-priority escalations with a strict 48-hour SLA.</li>
            </ul>
          </div>

          {/* Section: Printing & Quality */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Printing & Physical Quality</h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Standard fulfillment cycle: 5-7 business days from print queue authorization.</li>
              <li>Defect claims (binding failures, missing pages, cover misprints) qualify for complimentary reprints upon photographic verification.</li>
            </ul>
          </div>

          {/* Section: Distribution & Stock */}
          <div className="border border-slate-200 rounded p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Distribution & Retail Availability</h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Retail Channels: Amazon India, Flipkart, Amazon US, Amazon UK, and BookLeaf Bookstore.</li>
              <li>New catalog listings index across retail engines within 7-10 business days post-release.</li>
              <li>&ldquo;Temporarily Out of Stock&rdquo; indications represent EDI inventory feed lags; operations can force an API re-sync within 24-48 hours.</li>
            </ul>
          </div>

          {/* Section: Production Sequence */}
          <div className="border border-slate-200 rounded p-4 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Production Milestones</h3>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {[
                "1. Manuscript Received",
                "2. Editorial Intake",
                "3. Cover Design",
                "4. Typesetting",
                "5. Proofreading",
                "6. ISBN Assignment",
                "7. Printing Queue",
                "8. Channel Sync",
                "9. Published & Live",
              ].map((stage) => (
                <span
                  key={stage}
                  className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded"
                >
                  {stage}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
