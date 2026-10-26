/**
 * BookLeaf Publishing - Official Knowledge Base Context & Guidelines
 * Used for RAG, prompt grounding, and fallback deterministic engine.
 */

export const BOOKLEAF_KNOWLEDGE_BASE = `
# BookLeaf Publishing Knowledge Base

## Company Overview
- BookLeaf Publishing is a self-publishing company operating in India and the US.
- We process 1,200+ books monthly across a catalog of 22,000+ titles.
- Packages offered:
  - Standard Free: No upfront cost.
  - Bestseller Breakthrough: Premium paid package with marketing and distribution add-ons.
- BookLeaf handles cover design, typesetting, ISBN assignment, printing, distribution, and royalty management.
- Facilities: In-house printing facility and warehouse are located in Delhi. Print partners include Repro India and Epitome Books.

## Royalty Policy
- Royalty Split: 80/20 split (80% of net profit per book goes to the author, 20% to BookLeaf).
- Net Profit Formula: Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Payout Schedule: Royalties are calculated quarterly and paid within 45 days of the quarter ending.
  - Q1 (Jan-Mar): Paid by May 15
  - Q2 (Apr-Jun): Paid by Aug 15
  - Q3 (Jul-Sep): Paid by Nov 15
  - Q4 (Oct-Dec): Paid by Feb 15
- Minimum Payout Threshold: ₹1,000. If accumulated royalties are below ₹1,000, they roll over to the next quarter.
- Payment Method: Direct bank transfer to the bank account linked in the author dashboard.
- Royalty Breakdown: Authors can view sales figures per platform and detailed breakdown in their dashboard.

## ISBN Policy
- Unique ISBN: Every book published through BookLeaf receives a unique ISBN assigned under BookLeaf's publisher imprint.
- Custom Imprint: If an author wants an ISBN under their own imprint, they must obtain it independently.
- ISBN Errors: If an author reports an ISBN error (duplicate, wrong book linked on retail platforms), it is treated as HIGH priority and escalated to the production team immediately with a 48-hour resolution timeline.

## Printing & Quality
- Printing Partners: In-house printing handles most orders; overflow or specific formats go to Repro India or Epitome Books.
- Turnaround Time: Standard print turnaround is 5-7 business days from order confirmation.
- Quality Defects (misprints, binding defects, color inconsistency, blurred images): BookLeaf arranges a 100% free reprint after verification. Author must share photos of defective copies. Reprint timeline is 5-7 business days.

## Distribution & Availability
- Channels: Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
- Listing Time: New listings typically go live within 7-10 business days after publication is complete.
- "Currently Unavailable" Status: Usually indicates an automated stock sync issue between BookLeaf and retail platforms. BookLeaf operations can trigger a manual re-sync within 24-48 hours.

## Production Stages
Sequence: Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
- Authors receive stage updates via email.
- Common delay points: Cover Design (waiting for author feedback/approval) and Proofreading (revision rounds).
- Approach to delays: Check actual status in production tracker, explain reason collaboratively without blaming the author, and give a specific realistic timeline.

## Communication Tone Guidelines
1. Empathetic and Professional: Treat authors as creative partners, never as tickets to be processed.
2. Acknowledge and Validate: Acknowledge the author's frustration or concern first before jumping into policies.
3. Be Concrete & Specific: Cite actual dates, book titles, sales numbers, and royalty figures from their account.
4. Radical Ownership: If BookLeaf caused the delay or issue, apologize directly and take ownership without corporate deflection.
5. Clear Timelines: Always provide explicit resolution timeframes (e.g., "within 24-48 hours", "5-7 business days").
6. Clear Next Steps: Always conclude with an actionable next step for the author or the BookLeaf ops team.
`;

export const VALID_CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
] as const;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];

export const VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export type ValidPriority = (typeof VALID_PRIORITIES)[number];

export const CATEGORY_KEYWORDS: Record<ValidCategory, string[]> = {
  "Royalty & Payments": [
    "royalty",
    "royalties",
    "payout",
    "payment",
    "bank transfer",
    "earning",
    "earnings",
    "profit",
    "threshold",
    "1000",
    "quarterly",
    "sales report",
    "net profit",
    "commission",
  ],
  "ISBN & Metadata Issues": [
    "isbn",
    "barcode",
    "imprint",
    "wrong book",
    "duplicate isbn",
    "metadata",
    "title mismatch",
    "author name misspelled",
  ],
  "Printing & Quality": [
    "print",
    "printing",
    "quality",
    "blurry",
    "binding",
    "damaged",
    "defect",
    "misprint",
    "page missing",
    "paper",
    "author copies",
    "reprint",
    "cover color",
  ],
  "Distribution & Availability": [
    "amazon",
    "flipkart",
    "unavailable",
    "out of stock",
    "currently unavailable",
    "listing",
    "distribution",
    "stock sync",
    "store",
    "buy button",
  ],
  "Book Status & Production Updates": [
    "status",
    "production",
    "typesetting",
    "cover design",
    "proofreading",
    "manuscript",
    "timeline",
    "when will it be published",
    "live",
    "delay",
    "editing",
  ],
  "General Inquiry": [
    "bio",
    "update bio",
    "account",
    "general",
    "question",
    "contact",
    "package",
    "guidelines",
    "marketing",
  ],
};
