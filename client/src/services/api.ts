import { User, Book, Ticket, TicketMessage, AnalyticsData, TicketCategory, TicketPriority, TicketStatus } from "../types";

const RAW_API = (import.meta.env.VITE_API_URL as string | undefined) || "";
const API_BASE = RAW_API.endsWith("/api")
  ? RAW_API
  : RAW_API
  ? `${RAW_API.replace(/\/$/, "")}/api`
  : "/api";

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("bookleaf_token");
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("bookleaf_token", token);
    } else {
      localStorage.removeItem("bookleaf_token");
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      const errMessage = data?.error?.message || "An API request error occurred";
      throw new Error(errMessage);
    }

    return data.data;
  }

  // Auth
  public async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  public async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/auth/me");
  }

  public async getDemoUsers(): Promise<{ demoUsers: any[] }> {
    return this.request<{ demoUsers: any[] }>("/auth/demo-users");
  }

  // Books
  public async getBooks(authorId?: string): Promise<{ books: Book[] }> {
    const query = authorId ? `?authorId=${authorId}` : "";
    return this.request<{ books: Book[] }>(`/books${query}`);
  }

  public async getBook(id: string): Promise<{ book: Book }> {
    return this.request<{ book: Book }>(`/books/${id}`);
  }

  // Tickets
  public async getTickets(params?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
    if (params?.category && params.category !== "ALL") searchParams.set("category", params.category);
    if (params?.priority && params.priority !== "ALL") searchParams.set("priority", params.priority);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.request<{ tickets: Ticket[]; total: number }>(`/tickets${query}`);
  }

  public async getTicket(id: string): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/tickets/${id}`);
  }

  public async createTicket(body: {
    bookId?: string | null;
    subject: string;
    description: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
  }): Promise<{ ticket: Ticket; meta: { aiProviderUsed: string } }> {
    return this.request<{ ticket: Ticket; meta: { aiProviderUsed: string } }>("/tickets", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  public async postMessage(
    ticketId: string,
    message: string,
    isInternalNote = false,
    attachmentUrl?: string | null,
    attachmentName?: string | null
  ): Promise<{ message: TicketMessage }> {
    return this.request<{ message: TicketMessage }>(`/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message, isInternalNote, attachmentUrl, attachmentName }),
    });
  }

  public async submitCsat(ticketId: string, rating: number, feedback?: string): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/tickets/${ticketId}/csat`, {
      method: "POST",
      body: JSON.stringify({ rating, feedback }),
    });
  }

  // Admin Operations
  public async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/admin/tickets/${ticketId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  public async overrideCategory(ticketId: string, category: TicketCategory, reason?: string): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/admin/tickets/${ticketId}/classification`, {
      method: "PATCH",
      body: JSON.stringify({ category, reason }),
    });
  }

  public async overridePriority(ticketId: string, priority: TicketPriority, reason?: string): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/admin/tickets/${ticketId}/priority`, {
      method: "PATCH",
      body: JSON.stringify({ priority, reason }),
    });
  }

  public async assignTicket(ticketId: string, adminId: string | null): Promise<{ ticket: Ticket }> {
    return this.request<{ ticket: Ticket }>(`/admin/tickets/${ticketId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ adminId }),
    });
  }

  public async regenerateDraft(ticketId: string): Promise<{ draftResponse: string; confidence: number; providerUsed: string }> {
    return this.request<{ draftResponse: string; confidence: number; providerUsed: string }>(`/admin/tickets/${ticketId}/generate-draft`, {
      method: "POST",
    });
  }

  public async calibrateDraftTone(
    ticketId: string,
    draftText: string,
    tone: "empathetic" | "concise" | "formal" | "de-escalation"
  ): Promise<{ calibratedDraft: string; tone: string }> {
    return this.request<{ calibratedDraft: string; tone: string }>(`/admin/tickets/${ticketId}/calibrate-tone`, {
      method: "POST",
      body: JSON.stringify({ draftText, tone }),
    });
  }

  public async getAnalytics(): Promise<AnalyticsData> {
    return this.request<AnalyticsData>("/admin/analytics");
  }

  public async getKnowledgeBase(): Promise<{ content: string }> {
    return this.request<{ content: string }>("/knowledge-base");
  }
}

export const api = new ApiService();
