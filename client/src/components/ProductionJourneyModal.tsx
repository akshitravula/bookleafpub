import React from "react";
import { X, Check, ArrowRight } from "lucide-react";
import { Book } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onRaiseQueryAboutBook?: (bookId: string) => void;
}

const PRODUCTION_STAGES = [
  { id: 1, name: "Manuscript Received", desc: "Manuscript ingested and verified by editorial intake" },
  { id: 2, name: "Editing", desc: "Stylistic review and copy-editing according to package" },
  { id: 3, name: "Cover Design", desc: "Spine, front and back artwork prepared for author sign-off" },
  { id: 4, name: "Typesetting", desc: "Interior typography, margins, running headers, and pagination" },
  { id: 5, name: "Proofreading", desc: "Author revision cycle and final press-ready approval" },
  { id: 6, name: "ISBN Assignment", desc: "13-digit identifier registered under BookLeaf publishing imprint" },
  { id: 7, name: "Printing", desc: "5-7 business days production in Delhi facility or partner press" },
  { id: 8, name: "Distribution Setup", desc: "Catalog feeds provisioned across Amazon, Flipkart, and store" },
  { id: 9, name: "Published & Live", desc: "Catalog listing live with order fulfillment enabled" },
];

export const ProductionJourneyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  book,
  onRaiseQueryAboutBook,
}) => {
  if (!isOpen || !book) return null;

  // Determine current stage index based on book.status
  let currentStageIndex = 8;
  if (book.status.includes("Cover Design")) currentStageIndex = 2;
  else if (book.status.includes("Typesetting")) currentStageIndex = 3;
  else if (book.status.includes("Proofreading")) currentStageIndex = 4;
  else if (book.status.includes("Editing")) currentStageIndex = 1;
  else if (book.status.includes("Printing")) currentStageIndex = 6;
  else if (book.status.includes("Distribution")) currentStageIndex = 7;
  else if (book.status === "Published & Live") currentStageIndex = 8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full flex flex-col border border-slate-200 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Production Lifecycle</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {book.title} &bull; <span className="text-slate-800">{book.status}</span>
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

        {/* Stepper Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="relative pl-6 border-l border-slate-200 space-y-5">
            {PRODUCTION_STAGES.map((stage, i) => {
              const isPast = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              const isFuture = i > currentStageIndex;

              return (
                <div key={stage.id} className="relative">
                  {/* Indicator Dot */}
                  <div
                    className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition ${
                      isPast
                        ? "bg-slate-900 text-white"
                        : isCurrent
                        ? "bg-white border-2 border-slate-900"
                        : "bg-white border border-slate-300"
                    }`}
                  >
                    {isPast && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    {isCurrent && <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />}
                  </div>

                  {/* Stage text */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? "text-slate-900 font-bold"
                            : isPast
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {stage.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-medium bg-slate-900 text-white px-1.5 py-0.2 rounded">
                          Current Stage
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[10px] text-slate-400 font-mono">Completed</span>
                      )}
                    </div>
                    <p
                      className={`text-xs mt-0.5 leading-relaxed ${
                        isCurrent
                          ? "text-slate-600"
                          : isPast
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Stages 3 & 5 require author approval
          </div>
          <div className="flex items-center space-x-2">
            {onRaiseQueryAboutBook && (
              <button
                onClick={() => {
                  onClose();
                  onRaiseQueryAboutBook(book.id);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-xs font-medium rounded transition"
              >
                <span>Ask about this title</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
