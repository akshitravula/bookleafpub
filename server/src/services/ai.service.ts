import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import {
  BOOKLEAF_KNOWLEDGE_BASE,
  CATEGORY_KEYWORDS,
  VALID_CATEGORIES,
  VALID_PRIORITIES,
  ValidCategory,
  ValidPriority,
} from "../knowledge/bookleaf_kb";

export interface AIClassificationResult {
  category: ValidCategory;
  priority: ValidPriority;
  priorityReasoning: string;
  sentiment: "Normal" | "Frustrated" | "Critical Risk";
  confidence: number;
  providerUsed: string;
}

export function calculateSlaDeadline(category: ValidCategory): Date {
  const now = new Date();
  switch (category) {
    case "ISBN & Metadata Issues":
      return new Date(now.getTime() + 48 * 3600 * 1000); // 48 hours
    case "Royalty & Payments":
      return new Date(now.getTime() + 48 * 3600 * 1000); // 48 hours
    case "Printing & Quality":
      return new Date(now.getTime() + 7 * 24 * 3600 * 1000); // 7 business days
    case "Distribution & Availability":
      return new Date(now.getTime() + 48 * 3600 * 1000); // 48 hours
    case "Book Status & Production Updates":
      return new Date(now.getTime() + 5 * 24 * 3600 * 1000); // 5 days
    case "General Inquiry":
    default:
      return new Date(now.getTime() + 72 * 3600 * 1000); // 72 hours
  }
}

export interface AIDraftResult {
  draftResponse: string;
  confidence: number;
  providerUsed: string;
}

export interface BookContext {
  id?: string;
  title?: string;
  isbn?: string | null;
  status?: string;
  mrp?: number | null;
  totalCopiesSold?: number;
  totalRoyaltyEarned?: number;
  royaltyPaid?: number;
  royaltyPending?: number;
  lastRoyaltyPayoutDate?: string | Date | null;
  printPartner?: string | null;
  availableOn?: string[] | string | null;
}

export interface AuthorContext {
  id: string;
  name: string;
  email: string;
  city?: string | null;
  joinedDate?: string | Date | null;
}

export class AIService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiKey);
    }

    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (openAiKey) {
      this.openaiClient = new OpenAI({ apiKey: openAiKey });
    }
  }

  /**
   * Cost-Aware Context Selector:
   * Instead of dumping the full 15,000-character knowledge base into every request,
   * we extract only the policy sections relevant to the query keywords.
   */
  private getTargetedKnowledgeBase(subject: string, description: string): string {
    const fullText = `${subject} ${description}`.toLowerCase();
    const sections: string[] = [];

    // Always include core tone & company identity
    sections.push(`
BookLeaf Publishing Context:
- Self-publishing company in India and US (Delhi printing facility & warehouse).
- Partners: Repro India, Epitome Books.
- Tone: Empathetic, professional, partner-centric, radical ownership, specific dates/numbers, clear next steps.
    `);

    // Check relevant keywords
    if (fullText.includes("royalt") || fullText.includes("pay") || fullText.includes("money") || fullText.includes("earn") || fullText.includes("bank")) {
      sections.push(`
Royalty Policy:
- 80/20 split (80% net profit to author, 20% to BookLeaf).
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping.
- Paid quarterly within 45 days of quarter ending (Q1: May 15, Q2: Aug 15, Q3: Nov 15, Q4: Feb 15).
- Minimum payout threshold: ₹1,000. Below ₹1,000 rolls over to next quarter.
- Bank transfer to linked account in author dashboard.
      `);
    }

    if (fullText.includes("isbn") || fullText.includes("barcode") || fullText.includes("imprint")) {
      sections.push(`
ISBN Policy:
- Unique ISBN assigned under BookLeaf publisher imprint.
- Custom imprint requires author independent registration.
- ISBN errors (duplicate or mismatched book on retail channels) are treated as HIGH/CRITICAL priority and escalated to production desk with 48-hour resolution timeline.
      `);
    }

    if (fullText.includes("print") || fullText.includes("qualit") || fullText.includes("defect") || fullText.includes("blurry") || fullText.includes("bind") || fullText.includes("page")) {
      sections.push(`
Printing & Quality:
- Standard turnaround: 5-7 business days from order confirmation.
- Defect resolution: If author reports misprints/binding defects/color issues, BookLeaf provides 100% free reprint upon receiving photo proof. Reprint turnaround is 5-7 business days.
      `);
    }

    if (fullText.includes("amazon") || fullText.includes("flipkart") || fullText.includes("unavail") || fullText.includes("stock") || fullText.includes("distribut") || fullText.includes("list")) {
      sections.push(`
Distribution & Availability:
- Channels: Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store.
- Goes live within 7-10 business days after publication.
- "Currently Unavailable" on Amazon: Stock sync issue between warehouse feeds. Ops team can trigger manual sync within 24-48 hours.
      `);
    }

    if (fullText.includes("status") || fullText.includes("stage") || fullText.includes("typeset") || fullText.includes("cover") || fullText.includes("proof") || fullText.includes("when will") || fullText.includes("delay")) {
      sections.push(`
Production Stages:
- Sequence: Manuscript Received -> Editing -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
- Delays typically occur at Cover Design (author approval) and Proofreading (revision rounds).
- Explain delay collaboratively, give concrete timeline without defensive blame.
      `);
    }

    // Default fallback if no specific keywords matched
    if (sections.length === 1) {
      sections.push(BOOKLEAF_KNOWLEDGE_BASE);
    }

    return sections.join("\n---\n");
  }

  /**
   * Deterministic Rule-Based Fallback for Classification & Priority:
   * Guarantees 100% graceful degradation if LLM APIs are offline, unconfigured, or rate-limited.
   */
  public classifyFallback(subject: string, description: string): AIClassificationResult {
    const combined = `${subject} ${description}`.toLowerCase();
    let bestCategory: ValidCategory = "General Inquiry";
    let maxMatches = 0;

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let matches = 0;
      for (const kw of keywords) {
        if (combined.includes(kw)) matches++;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = cat as ValidCategory;
      }
    }

    // Determine priority based on urgency cues
    let priority: ValidPriority = "Medium";
    let priorityReasoning = "Standard inquiry requiring support team review.";

    if (
      combined.includes("haven't received") ||
      combined.includes("not received") ||
      combined.includes("missing royalty") ||
      combined.includes("wrong isbn") ||
      combined.includes("terrible") ||
      combined.includes("urgent") ||
      combined.includes("broken") ||
      combined.includes("defective")
    ) {
      if (bestCategory === "ISBN & Metadata Issues" || combined.includes("6 months") || combined.includes("legal")) {
        priority = "Critical";
        priorityReasoning = "Potential catalog integrity defect or severe delayed payout requiring immediate operations escalation.";
      } else {
        priority = "High";
        priorityReasoning = "Author reported quality, publication or overdue financial grievance.";
      }
    } else if (
      combined.includes("update bio") ||
      combined.includes("author bio") ||
      combined.includes("spelling in bio") ||
      bestCategory === "General Inquiry"
    ) {
      priority = "Low";
      priorityReasoning = "Routine informational or account update query with no operational disruption.";
    }

    // Determine sentiment and legal/escalation risk cues
    let sentiment: "Normal" | "Frustrated" | "Critical Risk" = "Normal";
    if (
      combined.includes("legal") ||
      combined.includes("lawyer") ||
      combined.includes("court") ||
      combined.includes("consumer forum") ||
      combined.includes("police") ||
      combined.includes("scam") ||
      combined.includes("cheat") ||
      combined.includes("fraud")
    ) {
      sentiment = "Critical Risk";
      priority = "Critical";
      priorityReasoning = "Critical legal or consumer grievance risk flagged for immediate managerial review.";
    } else if (
      combined.includes("terrible") ||
      combined.includes("horrible") ||
      combined.includes("worst") ||
      combined.includes("angry") ||
      combined.includes("disappointed") ||
      combined.includes("furious") ||
      combined.includes("6 months")
    ) {
      sentiment = "Frustrated";
    }

    return {
      category: bestCategory,
      priority,
      priorityReasoning,
      sentiment,
      confidence: 0.88,
      providerUsed: "BookLeaf Rule Engine (Fallback)",
    };
  }

  /**
   * Deterministic Rule-Based Fallback for Draft Response Generation:
   * Formats a personalized, professional BookLeaf response based on author and book stats.
   */
  public draftFallback(
    subject: string,
    description: string,
    category: ValidCategory,
    author: AuthorContext,
    book?: BookContext | null
  ): AIDraftResult {
    const firstName = author.name ? author.name.split(" ")[0] : "Author";
    const bookTitle = book?.title ? `"${book.title}"` : "your book";

    let body = "";
    switch (category) {
      case "Royalty & Payments": {
        const pending = book?.royaltyPending !== undefined ? `₹${book.royaltyPending.toLocaleString()}` : "your calculated amount";
        const totalSold = book?.totalCopiesSold !== undefined ? `${book.totalCopiesSold}` : "recorded";
        body = `Thank you for reaching out regarding your royalties for ${bookTitle}. We understand the importance of timely payouts.\n\n` +
          `At BookLeaf, royalties follow an 80/20 net profit split and are distributed quarterly within 45 days of the quarter ending (minimum threshold: ₹1,000). According to your account records, you currently have ${totalSold} copies sold with a pending royalty of ${pending}.\n\n` +
          `Please confirm that your bank details are up to date in your author dashboard. Our finance team will review the disbursement queue within 48 hours.`;
        break;
      }
      case "ISBN & Metadata Issues": {
        const isbnText = book?.isbn ? `(Registered ISBN: ${book.isbn})` : "";
        body = `Thank you for alerting us to this issue regarding ${bookTitle} ${isbnText}. We take ISBN accuracy and metadata integrity very seriously.\n\n` +
          `We have escalated this discrepancy directly to our production and distribution desk. Our catalog specialist is reviewing the channel feeds to resolve the mismatch within 48 hours. We will notify you as soon as the retail listing is verified.`;
        break;
      }
      case "Printing & Quality": {
        body = `We are very sorry to hear about the quality issue with your copies of ${bookTitle}. That is certainly not the standard of craftsmanship we strive for at BookLeaf.\n\n` +
          `Under our quality guarantee policy, BookLeaf will arrange a 100% complimentary reprint for defective copies. Could you please reply with 2-3 clear photographs showing the defect (binding, print alignment, or color)? Once verified, our team will initiate a replacement order, which typically takes 5-7 business days to deliver.`;
        break;
      }
      case "Distribution & Availability": {
        body = `Thank you for bringing this to our attention regarding ${bookTitle}.\n\n` +
          `When a published title shows as "Currently Unavailable" on retail platforms like Amazon or Flipkart, it usually indicates a temporary inventory sync latency between our warehouse feed and their catalog systems. We have triggered an automated re-sync with our distribution team. The listing should refresh and show active purchasing options within 24-48 hours.`;
        break;
      }
      case "Book Status & Production Updates": {
        const currentStatus = book?.status || "Production";
        body = `Thank you for following up on the progress of ${bookTitle}.\n\n` +
          `Your book is currently in the "${currentStatus}" stage. Our production team is reviewing layout and styling standards to ensure your work looks pristine. Delays can occur during proofing or cover iterations, but our team is actively working on finalizing this. We will send you an updated milestone proof within 3-5 business days.`;
        break;
      }
      case "General Inquiry":
      default: {
        body = `Thank you for contacting BookLeaf Support.\n\n` +
          `We have received your query regarding "${subject}". If this relates to updating your author bio, blurb, or account profile, you can reply directly with the desired updates, and our operations team will reflect them across your catalogue within 3-5 business days.\n\n` +
          `Please let us know if there is anything else we can assist you with!`;
        break;
      }
    }

    const fullResponse = `Dear ${firstName},\n\n${body}\n\nWarm regards,\nBookLeaf Operations Team`;

    return {
      draftResponse: fullResponse,
      confidence: 0.9,
      providerUsed: "BookLeaf Knowledge Base Engine (Fallback)",
    };
  }

  /**
   * AI Ticket Auto-Classification and Priority Scoring
   */
  public async classifyTicket(
    subject: string,
    description: string,
    bookContext?: BookContext | null
  ): Promise<AIClassificationResult> {
    const targetedKB = this.getTargetedKnowledgeBase(subject, description);

    const prompt = `You are the lead AI operations classifier at BookLeaf Publishing.
Classify the following author support ticket and determine its priority score.

Allowed Categories (pick exactly ONE):
- Royalty & Payments
- ISBN & Metadata Issues
- Printing & Quality
- Distribution & Availability
- Book Status & Production Updates
- General Inquiry

Allowed Priority Scores (pick exactly ONE):
- Critical (e.g. serious ISBN mismatch, prolonged unpaid royalties over 6 months, legal risk)
- High (e.g. unreceived royalties, defective author copies received, severe delays)
- Medium (e.g. stock sync / unavailable listing, standard production timeline inquiries)
- Low (e.g. author bio updates, general questions, routine info)

Ticket Details:
Subject: ${subject}
Description: ${description}
${bookContext ? `Related Book: ${bookContext.title} (Status: ${bookContext.status}, Sold: ${bookContext.totalCopiesSold}, Royalty Pending: ₹${bookContext.royaltyPending})` : "Related Book: General / Account Level"}

Relevant Knowledge Context:
${targetedKB}

Output ONLY valid JSON in this exact structure:
{
  "category": "One of the allowed categories",
  "priority": "One of Critical / High / Medium / Low",
  "priorityReasoning": "1 sentence explanation why this priority was assigned",
  "sentiment": "One of Normal / Frustrated / Critical Risk",
  "confidence": 0.95
}`;

    // 1. Try Gemini
    if (this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (VALID_CATEGORIES.includes(parsed.category) && VALID_PRIORITIES.includes(parsed.priority)) {
          return {
            category: parsed.category,
            priority: parsed.priority,
            priorityReasoning: parsed.priorityReasoning || "Classified via Gemini AI",
            sentiment: ["Normal", "Frustrated", "Critical Risk"].includes(parsed.sentiment) ? parsed.sentiment : "Normal",
            confidence: Number(parsed.confidence) || 0.95,
            providerUsed: "Google Gemini 1.5 Flash",
          };
        }
      } catch (err: any) {
        console.warn("⚠️ Gemini classification failed, falling back:", err?.message || err);
      }
    }

    // 2. Try OpenAI if configured
    if (this.openaiClient) {
      try {
        const completion = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        });
        const text = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(text);

        if (VALID_CATEGORIES.includes(parsed.category) && VALID_PRIORITIES.includes(parsed.priority)) {
          return {
            category: parsed.category,
            priority: parsed.priority,
            priorityReasoning: parsed.priorityReasoning || "Classified via OpenAI GPT-4o-mini",
            sentiment: ["Normal", "Frustrated", "Critical Risk"].includes(parsed.sentiment) ? parsed.sentiment : "Normal",
            confidence: Number(parsed.confidence) || 0.95,
            providerUsed: "OpenAI GPT-4o-mini",
          };
        }
      } catch (err: any) {
        console.warn("⚠️ OpenAI classification failed, falling back:", err?.message || err);
      }
    }

    // 3. Graceful Fallback
    return this.classifyFallback(subject, description);
  }

  /**
   * AI Response Draft Generation based on BookLeaf Knowledge Base and Author Context
   */
  public async generateDraftResponse(
    subject: string,
    description: string,
    category: ValidCategory,
    author: AuthorContext,
    book?: BookContext | null,
    recentMessages?: { senderRole: string; message: string }[]
  ): Promise<AIDraftResult> {
    const targetedKB = this.getTargetedKnowledgeBase(subject, description);
    const authorName = author.name || "Author";
    const firstName = authorName.split(" ")[0];

    // Build concise conversation history (cost awareness: last 3 messages only)
    const historySnippet = recentMessages && recentMessages.length > 0
      ? recentMessages
          .slice(-3)
          .map((m) => `${m.senderRole}: ${m.message}`)
          .join("\n")
      : `AUTHOR: ${description}`;

    const prompt = `You are a warm, highly competent support specialist at BookLeaf Publishing responding to an author.
Draft a professional and empathetic reply to the author's inquiry.

COMMUNICATION GUIDELINES:
1. Always empathetic and professional. Authors are partners, not customers to manage.
2. Acknowledge and validate their concern before jumping to solutions.
3. Be specific: Cite actual numbers, dates, statuses, and book titles from their account context below.
4. Radical ownership: If something is a delay, defect, or glitch, own it directly without corporate deflection.
5. Provide clear timelines (e.g. "within 24-48 hours", "5-7 business days").
6. Always end with a clear next step and a warm sign-off from "BookLeaf Operations Team".

AUTHOR CONTEXT:
- Author Name: ${author.name} (Address as: "Dear ${firstName},")
- City: ${author.city || "India"}

BOOK CONTEXT:
${book ? `
- Title: ${book.title}
- ISBN: ${book.isbn || "Pending assignment"}
- Status: ${book.status}
- Total Copies Sold: ${book.totalCopiesSold || 0}
- Total Royalty Earned: ₹${book.totalRoyaltyEarned || 0}
- Royalty Paid: ₹${book.royaltyPaid || 0}
- Royalty Pending: ₹${book.royaltyPending || 0}
- Last Royalty Payout Date: ${book.lastRoyaltyPayoutDate || "No payouts yet"}
- Print Partner: ${book.printPartner || "In-House Delhi"}
- Channels: ${Array.isArray(book.availableOn) ? book.availableOn.join(", ") : book.availableOn || "Amazon India, BookLeaf Store"}
` : "Query is at General / Account level (no specific book selected)."}

CONVERSATION / INQUIRY:
Subject: ${subject}
${historySnippet}

KNOWLEDGE BASE POLICIES:
${targetedKB}

Output ONLY valid JSON in this exact structure:
{
  "draftResponse": "Your full response message text formatted with proper linebreaks",
  "confidence": 0.95
}`;

    // 1. Try Gemini
    if (this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (parsed.draftResponse && typeof parsed.draftResponse === "string") {
          return {
            draftResponse: parsed.draftResponse.trim(),
            confidence: Number(parsed.confidence) || 0.95,
            providerUsed: "Google Gemini 1.5 Flash",
          };
        }
      } catch (err: any) {
        console.warn("⚠️ Gemini draft generation failed, falling back:", err?.message || err);
      }
    }

    // 2. Try OpenAI
    if (this.openaiClient) {
      try {
        const completion = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        });
        const text = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(text);

        if (parsed.draftResponse && typeof parsed.draftResponse === "string") {
          return {
            draftResponse: parsed.draftResponse.trim(),
            confidence: Number(parsed.confidence) || 0.95,
            providerUsed: "OpenAI GPT-4o-mini",
          };
        }
      } catch (err: any) {
        console.warn("⚠️ OpenAI draft generation failed, falling back:", err?.message || err);
      }
    }

    // 3. Fallback
    return this.draftFallback(subject, description, category, author, book);
  }

  /**
   * AI Tone Calibrator:
   * Dynamically restyles any draft response into Empathetic, Concise, Formal, or De-escalation mode.
   */
  public async calibrateDraftTone(
    originalDraft: string,
    tone: "empathetic" | "concise" | "formal" | "de-escalation",
    authorName: string
  ): Promise<string> {
    const firstName = authorName ? authorName.split(" ")[0] : "Author";

    const prompt = `You are an expert communications editor at BookLeaf Publishing.
Rewrite the following response message to match the target communication style: "${tone.toUpperCase()}".

STYLE DEFINITIONS:
- EMPATHETIC: Warm, partner-centric, reassuring, validating the author's creative effort and concerns.
- CONCISE: Bulleted, direct, SLA-driven, immediate next steps with zero fluff.
- FORMAL: Authoritative executive publishing tone, citing BookLeaf imprint policies and procedural SLAs.
- DE-ESCALATION: Sincere apology, radical ownership of the issue without defensive deflection, high empathy, expedited resolution timeline.

Original Message:
${originalDraft}

Return ONLY valid JSON:
{
  "calibratedDraft": "Your rewritten response message with proper linebreaks"
}`;

    if (this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
        });
        const res = await model.generateContent(prompt);
        const parsed = JSON.parse(res.response.text());
        if (parsed.calibratedDraft) return parsed.calibratedDraft.trim();
      } catch (e) {
        console.warn("Gemini tone calibration fallback:", e);
      }
    }

    if (this.openaiClient) {
      try {
        const completion = await this.openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        });
        const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
        if (parsed.calibratedDraft) return parsed.calibratedDraft.trim();
      } catch (e) {
        console.warn("OpenAI tone calibration fallback:", e);
      }
    }

    // Deterministic fallback styles
    if (tone === "concise") {
      return `Dear ${firstName},\n\nUpdate regarding your inquiry:\n• Status: Reviewed by BookLeaf Operations\n• Resolution: In active processing with the production/finance desk\n• Target Resolution: Within 24-48 hours\n\nWarm regards,\nBookLeaf Operations Team`;
    } else if (tone === "de-escalation") {
      return `Dear ${firstName},\n\nWe sincerely apologize for the frustration and inconvenience this has caused you. We take radical ownership of this issue - authors are our core partners, and this falls short of our standards.\n\nI have personally prioritized your case with our operations lead for expedited resolution within 24 hours. We will follow up with you directly as soon as the corrective action is completed.\n\nWarm regards,\nBookLeaf Operations Team`;
    } else if (tone === "formal") {
      return `Dear ${firstName},\n\nThis communication serves to confirm that your inquiry has been registered under BookLeaf Publishing Operations.\n\nPursuant to BookLeaf Publisher Policies, our technical and catalog units have initiated procedural verification. Resolution will be executed within the standard 48-hour SLA window.\n\nWarm regards,\nBookLeaf Operations Team`;
    }

    return originalDraft;
  }
}

export const aiService = new AIService();
