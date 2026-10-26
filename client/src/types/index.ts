export interface User {
  id: string;
  name: string;
  email: string;
  role: "AUTHOR" | "ADMIN";
  phone?: string | null;
  city?: string | null;
  joinedDate?: string | null;
}

export interface Book {
  id: string;
  authorId: string;
  title: string;
  isbn?: string | null;
  genre?: string | null;
  publicationDate?: string | null;
  status: string;
  mrp?: number | null;
  authorRoyaltyPerCopy?: number | null;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate?: string | null;
  printPartner?: string | null;
  availableOn: string[];
}

export type TicketCategory =
  | "Royalty & Payments"
  | "ISBN & Metadata Issues"
  | "Printing & Quality"
  | "Distribution & Availability"
  | "Book Status & Production Updates"
  | "General Inquiry";

export type TicketPriority = "Critical" | "High" | "Medium" | "Low";

export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: "AUTHOR" | "ADMIN";
  message: string;
  isInternalNote: boolean;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    role: "AUTHOR" | "ADMIN";
  };
}

export interface TicketAuditLog {
  id: string;
  ticketId: string;
  userId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  authorId: string;
  bookId?: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  aiCategory?: TicketCategory | null;
  isCategoryOverridden: boolean;
  priority: TicketPriority;
  aiPriority?: TicketPriority | null;
  isPriorityOverridden: boolean;
  priorityReasoning?: string | null;
  status: TicketStatus;
  assignedAdminId?: string | null;
  aiDraftResponse?: string | null;
  aiDraftConfidence?: number | null;
  aiDraftGeneratedAt?: string | null;
  slaDueAt?: string | null;
  sentiment?: "Normal" | "Frustrated" | "Critical Risk" | null;
  csatRating?: number | null;
  csatFeedback?: string | null;
  authorReopenedCount?: number;
  createdAt: string;
  updatedAt: string;
  author: User;
  book?: Book | null;
  assignedAdmin?: { id: string; name: string; email: string } | null;
  messages: TicketMessage[];
  auditLogs?: TicketAuditLog[];
}

export interface AnalyticsData {
  overview: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    criticalCount: number;
    highCount: number;
  };
  categoryBreakdown: {
    category: TicketCategory;
    count: number;
  }[];
}
