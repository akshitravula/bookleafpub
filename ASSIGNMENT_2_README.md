# BookLeaf Publishing - Author Royalty Dashboard & Automated Notification System
## Assignment 2 Technical Submission & Architectural Documentation

**Candidate**: Akshit Ravula  
**Stack**: Bubble.io (Full-Stack Application & Relational DB) + n8n Cloud (Automation Engine) + OpenAI (LLM API)  
**Dataset**: `bookleaf_sample_data.json`  

---

## 1. Executive Summary & Live Deliverables

This project builds an automated, role-isolated operations platform for BookLeaf Publishing:
- **Author Portal (`author_dashboard`)**: Allows authors to independently monitor their book catalogue, quarterly sales, and royalty balances with intuitive visual payout status badges (Green / Yellow / Red).
- **Admin Operations Console (`admin_dashboard`)**: Equips the editorial operations team to search, filter by city/status, inspect author financials, and trigger automated AI royalty statement notifications.
- **n8n Automation Engine**: Listens to secure webhooks from Bubble, enforces token-based security, aggregates catalog figures according to BookLeaf operating policies (80/20 split, 45-day post-quarter window, ₹1,000 rollover rule), synthesizes personalized emails via LLM, and sends real-time status callbacks to Bubble's notification log.

### Deliverables Checklist:
1. **Live Bubble Application**: `https://bookleaf-royalty-portal.bubbleapps.io/version-test/admin_dashboard`
   - **Admin Account**: `admin@bookleafpub.com` / `admin123`
   - **Author Account**: `priya.sharma@email.com` / `author123`
2. **n8n Workflow Export**: [`n8n_royalty_notification_workflow.json`](./n8n_royalty_notification_workflow.json)
3. **Video Walkthrough (3-5 mins Loom)**: [Included in Submission]
4. **Documentation**: Full schema, integration security, prompt design, and learning reflection detailed below.

---

## 2. Database Design & Relational Modeling

The database is built on Bubble's built-in relational engine, modeling separation of concerns between identity, publication catalog, and communication audit logs.

### Schema Architecture:

```
┌────────────────────────┐         ┌────────────────────────┐
│      User (Author)     │ 1     * │          Book          │
├────────────────────────┤─────────┼────────────────────────┤
│ email (Text, Unique)   │         │ book_id (Text)         │
│ name (Text)            │         │ title (Text)           │
│ author_id (Text)       │         │ status (Text)          │
│ role (Author / Admin)  │         │ mrp (Number)           │
│ city (Text)            │         │ total_copies_sold (Num)│
│ phone (Text)           │         │ total_royalty_earned   │
│ joined_date (Date)     │         │ royalty_paid (Number)  │
└────────────────────────┘         │ royalty_pending (Num)  │
            │ 1                    │ author_email (Text)    │
            │                      │ last_payout_date (Date)│
            │ *                    └────────────────────────┘
┌────────────────────────┐
│    Notification_Log    │
├────────────────────────┤
│ author_name (Text)     │
│ author_email (Text)    │
│ author_id (Text)       │
│ sent_at (Date)         │
│ status (Success/Failed)│
│ email_subject (Text)   │
│ email_content (Text)   │
│ triggered_by (Text)    │
└────────────────────────┘
```

### Key Schema Decisions:
- **Direct Foreign Reference (`author_email` on Book)**: While Bubble supports list fields, indexing books with `author_email` enables high-performance single-pass queries (`Search for Books where author_email = Current User's email`) with zero N+1 overhead.
- **Financial Granularity**: Royalties are split into `total_royalty_earned`, `royalty_paid`, and `royalty_pending`, matching BookLeaf's accounting ledger.
- **Audit Persistence (`Notification_Log`)**: Every webhook trigger stores the generated message, execution timestamp, and status for compliance and author grievance tracking.

---

## 3. Security & Privacy Rules (Data Isolation)

To satisfy requirement **A4**, privacy rules were implemented in Bubble's database security layer:

1. **`Book` Privacy Rules**:
   - **Admin Access**: `Current User's role is "Admin"` -> Full access to all books, royalty figures, and sales counts across the entire catalog.
   - **Author Self-Access**: `This Book's author_email is Current User's email` -> Read access granted only to their own publication records.
   - **Default (Everyone Else)**: All access revoked. No author can inspect or search another author's titles or financial numbers.

2. **`User` Privacy Rules**:
   - **Admin Access**: `Current User's role is "Admin"` -> Full visibility to search and filter authors by city and payout status.
   - **Author Self-Access**: `This User is Current User` -> Read access to their own profile.
   - **Default**: Public search and unauthorized profile queries disabled.

---

## 4. Visual Dashboard Features & Logic

### Author Portal (`author_dashboard`):
- **Consolidated Metric Cards**: Real-time aggregation of `total_royalty_earned:sum`, `royalty_paid:sum`, and `royalty_pending:sum`.
- **Dynamic Rollover Alert**: If pending royalties are > ₹0 but < ₹1,000, displays a policy badge: `"Rolls over to next quarter (< ₹1,000 threshold)"`.
- **Royalty Status Indicators**:
  - 🟢 **Green (Fully Paid)**: `royalty_pending is 0`.
  - 🟡 **Yellow (Normal Cycle)**: `royalty_pending > 0` AND last payout date is within the current 90-day cycle.
  - 🔴 **Red (Overdue)**: `royalty_pending > 0` AND last payout date was > 90 days ago (or book published > 90 days ago with zero payouts).

### Admin Portal (`admin_dashboard`):
- **Author Search & City Filter**: Multi-attribute filtering across Delhi, Mumbai, Hyderabad, Bangalore, etc.
- **Author Detail Drawer**: Opens author catalog, displaying lifetime earnings and individual book records.
- **Live Notification Log**: Real-time table displaying timestamped dispatch records with green `Success` or red `Failed` badges and a **"View Email"** modal.

---

## 5. Bubble ↔ n8n Integration Architecture

### Webhook Flow & Payload Design:
When an admin clicks **"Generate & Send Royalty Summary"**, Bubble's API Connector fires an authenticated POST request to n8n:

```http
POST /webhook/royalty-summary HTTP/1.1
Host: bookleafpub.app.n8n.cloud
Content-Type: application/json
x-bookleaf-api-key: bookleaf_secure_webhook_token_2026

{
  "author_id": "AUTH001",
  "author_name": "Priya Sharma",
  "author_email": "priya.sharma@email.com",
  "triggered_by": "Operations Admin",
  "books": [
    {
      "title": "Whispers of the Ganges",
      "status": "Published & Live",
      "total_copies_sold": 342,
      "total_royalty_earned": 11970,
      "royalty_paid": 8400,
      "royalty_pending": 3570
    }
  ]
}
```

### n8n Pipeline Nodes:
1. **Webhook Trigger**: Listens on `/webhook/royalty-summary`.
2. **Security Validator (If Node)**: Validates `x-bookleaf-api-key`. Rejects unauthorized calls with HTTP 401.
3. **Data Aggregator (Code Node)**: Computes gross earnings, separates published books from in-production titles, and calculates next payout eligibility.
4. **AI Generation Node (OpenAI / LLM)**: Synthesizes a structured, empathetic, and policy-compliant royalty email.
5. **Response Node**: Returns HTTP 200 with structured JSON (`email_subject`, `email_body`, `sent_at`, `status: "Success"`).
6. **Error Catch Node**: In case of LLM API timeouts or malformed payloads, catches exceptions, logs failure diagnostics, and returns HTTP 500 with `status: "Failed"`.

---

## 6. AI Prompt Strategy & Policy Alignment

The LLM system prompt is explicitly primed with BookLeaf's Standard Operating Procedures from Assignment 1:

1. **80/20 Net Profit Rule**: Transparently frames author royalties as an 80% net profit share after production and distribution deductions.
2. **Quarterly 45-Day Payout SLA**: Explicitly explains that royalties are calculated quarterly and disbursed within 45 days of quarter close (Q1 in May, Q2 in August, Q3 in November, Q4 in February).
3. **₹1,000 Rollover Threshold**: If unpaid royalties are under ₹1,000, gently explains that the balance safely rolls over into the subsequent quarter without forfeit.
4. **In-Production Reassurance**: Mentions books currently in Cover Design or Typesetting, citing BookLeaf Delhi press 5-7 day print guarantee.
5. **Tone**: Literary, encouraging, transparent, and respectful.

---

## 7. Error Handling & Edge Cases

| Scenario | Risk | Mitigation |
| :--- | :--- | :--- |
| **Unauthorized Webhook Access** | Malicious trigger from external sources | Custom header `x-bookleaf-api-key` validated upfront; 401 response blocks downstream AI usage. |
| **Double Click / Rapid Repeat** | Duplicate AI generation and notification | Button disables on click with loading state; n8n validates timestamps. |
| **AI API Failure / Timeout** | Workflow hangs, leaving Bubble UI frozen | n8n Error Trigger catches timeout, sets status to `Failed`, and logs error message. |
| **Author with Zero Payouts** | Null pointer exceptions in date calculations | Conditional expressions format empty dates as `"No payout yet"` without runtime crashes. |
| **Books in Production** | Showing confusing ₹0 sales for unreleased books | Workflow separates published from in-production titles and generates reassuring status updates. |

---

## 8. Reflection on the Learning Process

Coming into this assignment, our primary background was in code-based platforms (React, Node.js, Express, TypeScript). Transitioning to **Bubble.io** and **n8n** required adapting to visual logic paradigms:

1. **Relational Data in Bubble**: Translating relational SQL foreign-key concepts into Bubble's native Data Types and repeating groups was intuitive once privacy rules and `:sum` aggregations were mastered.
2. **Orchestration with n8n**: The visual node pipeline in n8n provided great transparency into payloads between steps. Building explicit security guards and error-handling branches demonstrated how low-code tools can maintain production-grade rigor.
3. **Key Takeaway**: Low-code tools like Bubble and n8n drastically accelerate operational prototyping, while strict database modeling, role-based privacy rules, and error-resilient webhooks remain just as critical as in code-based architectures.
