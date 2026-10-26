import React, { useState } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMrp?: number;
  initialCopies?: number;
  bookTitle?: string;
}

export const RoyaltyCalculatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialMrp = 399,
  initialCopies = 200,
  bookTitle,
}) => {
  const [mrp, setMrp] = useState<number>(initialMrp);
  const [copies, setCopies] = useState<number>(initialCopies);
  const [printCost, setPrintCost] = useState<number>(110);
  const [commissionPct, setCommissionPct] = useState<number>(15); // Amazon/Flipkart ~15%
  const [shipping, setShipping] = useState<number>(40);

  if (!isOpen) return null;

  // BookLeaf 80/20 Royalty Formula:
  // Net Profit per book = MRP - Printing Cost - Platform Commission - Shipping Charges
  const platformFeePerBook = (mrp * commissionPct) / 100;
  const netProfitPerBook = Math.max(0, mrp - printCost - platformFeePerBook - shipping);

  const authorRoyaltyPerBook = netProfitPerBook * 0.8; // 80%
  const bookLeafSharePerBook = netProfitPerBook * 0.2; // 20%

  const totalAuthorRoyalty = authorRoyaltyPerBook * copies;
  const totalBookLeafShare = bookLeafSharePerBook * copies;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <img
              src="https://res.cloudinary.com/imq5966f/image/upload/v1792991576/171322.png"
              alt="BookLeaf Logo"
              className="w-6 h-6 object-contain"
            />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Royalty Calculator</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                80/20 Net Profit Breakdown {bookTitle && <span className="font-mono text-slate-700">({bookTitle})</span>}
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
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Policy formula banner */}
          <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-900">Standard Formula: </span>
            Net profit = MRP minus printing, platform commission (~15%), and shipping. Author receives 80% of net proceeds.
          </div>

          {/* Sliders / Inputs */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Retail MRP (₹)
              </label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(Math.max(1, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Copies Sold
              </label>
              <input
                type="number"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Print Cost / copy (₹)
              </label>
              <input
                type="number"
                value={printCost}
                onChange={(e) => setPrintCost(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Platform Commission (%)
              </label>
              <input
                type="number"
                value={commissionPct}
                onChange={(e) => setCommissionPct(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Author Net Royalty (80%):</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                ₹{Math.round(totalAuthorRoyalty).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
              <span>Royalty per copy:</span>
              <span className="font-mono font-medium text-slate-900">₹{authorRoyaltyPerBook.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Publisher share (20%):</span>
              <span className="font-mono">₹{Math.round(totalBookLeafShare).toLocaleString()}</span>
            </div>
          </div>

          {/* Breakdown Visualizer */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500">
              Unit Allocation per Copy (MRP: ₹{mrp})
            </span>
            <div className="h-4 w-full rounded overflow-hidden flex text-[10px] text-white font-medium text-center leading-4">
              <div
                style={{ width: `${(printCost / mrp) * 100}%` }}
                className="bg-slate-400"
                title={`Printing: ₹${printCost}`}
              />
              <div
                style={{ width: `${(platformFeePerBook / mrp) * 100}%` }}
                className="bg-slate-500"
                title={`Platform fee: ₹${platformFeePerBook.toFixed(0)}`}
              />
              <div
                style={{ width: `${(shipping / mrp) * 100}%` }}
                className="bg-slate-600"
                title={`Shipping: ₹${shipping}`}
              />
              <div
                style={{ width: `${(authorRoyaltyPerBook / mrp) * 100}%` }}
                className="bg-slate-900"
                title={`Author Royalty (80%): ₹${authorRoyaltyPerBook.toFixed(0)}`}
              />
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 pt-1 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-slate-400" /> Print (₹{printCost})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-slate-500" /> Platform (₹{platformFeePerBook.toFixed(0)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-slate-600" /> Ship (₹{shipping})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-slate-900" /> Author (₹{authorRoyaltyPerBook.toFixed(0)})
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
