# BookLeaf Publishing - Author Support & Operations Communication Portal

An enterprise-grade, fullstack Author Support and Operations Management Portal built for **BookLeaf Publishing** to handle author communication at scale across 1,200+ monthly titles and 22,000+ catalog titles.

Powered by a **Knowledge-Grounded AI Engine**, real-time **WebSockets**, and an operations desk featuring **AI Auto-Classification**, **Priority Scoring**, **AI-Drafted Responses**, and **Human-in-the-Loop Admin Overrides**.

---

## 🌐 Live Demo & Evaluation Links

- **Live Application URL**: **[https://relocation-lately-scratch-sentence.trycloudflare.com](https://relocation-lately-scratch-sentence.trycloudflare.com)**
- **Interactive Swagger Docs**: **[https://relocation-lately-scratch-sentence.trycloudflare.com/api/docs](https://relocation-lately-scratch-sentence.trycloudflare.com/api/docs)**
- **API Health Check**: **[https://relocation-lately-scratch-sentence.trycloudflare.com/api/health](https://relocation-lately-scratch-sentence.trycloudflare.com/api/health)**

> **Pre-Seeded Data**: Ready to test out of the box with 10 authors, 18 books, and sample tickets. Use the **1-Click Demo Accounts Switcher** on the login screen or test credentials below.

---

## 🌟 Key Highlights & Architecture

- **Two Dedicated Interfaces**:
  - **Author Self-Service Portal**: Book dashboard with live royalty metrics, support query submission with book linking, and real-time conversation threads.
  - **Admin Operations Desk**: Prioritized support queue with urgency aging indicators, AI auto-classification, priority scoring with reasoning, knowledge-grounded response draft generation, internal private notes, and ticket assignment.
- **AI-Assisted Operations & Response Generation**:
  - Grounded directly in BookLeaf Publishing policies (80/20 royalty split, ₹1,000 threshold, 48h ISBN escalations, 5-7 day free reprints, 24-48h stock sync).
  - Multi-provider support (Google Gemini & OpenAI) with an intelligent **Deterministic Knowledge Engine (DKE)** fallback ensuring **100% graceful degradation** if an API key is absent or rate-limited.
  - **Token-Budgeted & Cost-Aware**: Injects only targeted policy modules instead of dumping the entire knowledge base on every query.
- **Real-Time Communication**:
  - Powered by **Socket.IO**: When an admin posts a reply, the author sees it instantly without refreshing.
  - Ticket queue and counters update across admin screens in real time.
- **Security & Role-Based Access Control (RBAC)**:
  - JWT authentication with bcrypt password hashing.
  - Authors can only access their own books and tickets.
  - **Internal Admin Notes are strictly stripped** from all author responses at the API layer.
- **Interactive API Documentation**:
  - Full OpenAPI 3.0 specification with interactive Swagger UI at `/api/docs`.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Node.js** v18+ (tested on v22)
- **npm** v9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/bookleaf-support-portal.git
cd bookleaf-support-portal

# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Environment Configuration
The repository includes a ready-to-run `.env` file in `server/.env`. You can optionally add an API key for live Gemini or OpenAI generation:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="bookleaf_super_secret_jwt_key_2026_secure"
NODE_ENV="development"
CLIENT_ORIGIN="http://localhost:5173"

# Optional: Add your Google Gemini or OpenAI API Key
# If left empty, the built-in BookLeaf Knowledge Engine operates automatically!
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

### 3. Initialize & Seed Database
```bash
# Push Prisma schema to SQLite database and seed the dataset
npm run seed
```
> **Note**: This seeds all **10 authors and 18 books** from `bookleaf_sample_data.json`, creates the Admin user, and pre-populates 6 realistic sample tickets representing the prompt scenarios!

### 4. Run Development Servers
```bash
# Starts both Backend (port 5000) and Frontend (port 5173) concurrently
npm run dev
```

Open your browser at:
- **Web App**: [http://localhost:5173](http://localhost:5173) (or [http://localhost:5000](http://localhost:5000) in production)
- **API Server & Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Interactive Swagger Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

### 5. Production Build & Docker Deployment (Optional)
```bash
# Build both frontend and backend
npm run build

# Start single-port unified server (serves frontend SPA + API on port 5000)
npm run start

# Alternatively, run via Docker:
docker build -t bookleaf-portal .
docker run -p 5000:5000 bookleaf-portal
```
*(A `render.yaml` blueprint is also included in the repository for 1-click cloud deployment on Render/Railway).*

---

## 🔑 Test Demo Credentials

You can log in manually using the credentials below, or click any account in the **"1-Click Demo Evaluation Accounts"** panel on the login screen.

| Role | Name | Email | Default Password | Details / Pre-seeded Data |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Operations Admin | `admin@bookleafpub.com` | `admin123` | Full access to queue, AI drafts, internal notes |
| **Author** | Priya Sharma | `priya.sharma@email.com` | `author123` | 2 books: *Whispers of the Ganges*, ₹3,570 pending royalty |
| **Author** | Rohit Kapoor | `rohit.kapoor@email.com` | `author123` | 2 books: *Code & Karma*, *Startup Sutra* |
| **Author** | Ananya Reddy | `ananya.reddy@email.com` | `author123` | *Between Two Temples*, Critical ISBN mismatch ticket |
| **Author** | Vikram Joshi | `vikram.joshi@email.com` | `author123` | *Debugging Life*, Defective print copies ticket |
| **Author** | Meera Nair | `meera.nair@email.com` | `author123` | *Cardamom & Chaos*, *Letters from Lakshadweep* |
| **Author** | Arjun Malhotra | `arjun.malhotra@email.com` | `author123` | *Turban Tales*, ₹2,464 pending royalty |
| **Author** | Sneha Kulkarni | `sneha.kulkarni@email.com` | `author123` | *The Algorithm of Love*, Amazon stock sync resolved ticket |
| **Author** | Farhan Sheikh | `farhan.sheikh@email.com` | `author123` | *Ghazal of the Forgotten* |
| **Author** | Kavita Deshmukh | `kavita.deshmukh@email.com` | `author123` | *Raising Roots* (In Typesetting), *The Nagpur Notebooks* |
| **Author** | Diya Chatterjee | `diya.chatterjee@email.com` | `author123` | *Durga’s Daughters*, *Howrah Nights* |

---

## 🧠 AI Integration Architecture

### 1. Prompt Engineering & Knowledge Grounding
The AI system is strictly calibrated to reflect BookLeaf's operational policies and empathetic tone:
- **Empathy & Validation**: Acknowledges author frustration upfront before stating policy.
- **Radical Ownership**: Takes direct responsibility for delays or errors without defensive corporate rhetoric.
- **Concrete Accountability**: Injects actual author details (book title, copies sold, royalty pending in rupees, publication date, print partner) directly into the prompt so drafts cite real figures.
- **Clear SLAs & Next Steps**: Every draft ends with an explicit resolution timeframe (e.g. "within 48 hours", "5-7 business days") and a concrete next action.

### 2. Cost Awareness & Token Budgeting
- **Targeted RAG Slicing**: Rather than sending the full 15,000-character Knowledge Base on every request, `getTargetedKnowledgeBase()` detects query topics (e.g., royalties, ISBN, print defects) and injects only the corresponding policy module.
- **Conversation Windowing**: The prompt limits conversation history to the last 3 turns, discarding historical baggage while preserving context.
- **Compact Output Format**: AI prompts demand strictly structured JSON schemas with temperature 0.1-0.2, minimizing output tokens and eliminating hallucinations.

### 3. Graceful Degradation & Zero-Failure Guarantee
If the LLM API is unreachable, rate-limited, or no API key is configured:
1. The system seamlessly switches to BookLeaf's **Deterministic Knowledge Engine (DKE)**.
2. Tickets are **always created with zero delay**.
3. High-quality rule-based classifications, priority scores, and personalized drafts citing the author's real numbers are populated automatically.
4. Admins always retain full control to edit drafts or respond manually.

### 4. Model Choice Justification
- **Google Gemini 1.5 Flash / 2.0 Flash**: Selected for speed (<800ms latency), high JSON adherence, and cost-effectiveness for customer support routing.
- **OpenAI GPT-4o-mini**: Supported as an alternate plug-and-play provider.

---

## 📡 REST API & WebSocket Reference

### Interactive Swagger Docs
Access the interactive OpenAPI UI at:
**`http://localhost:5000/api/docs`**

### Summary of REST Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user and returns JWT token |
| `GET` | `/api/auth/me` | Authenticated | Returns logged-in user profile |
| `GET` | `/api/auth/demo-users` | Public | Returns pre-seeded demo accounts for quick testing |
| `GET` | `/api/books` | Authenticated | List author's books (or all books for Admin) |
| `GET` | `/api/books/:id` | Authenticated | Single book details (RBAC enforced) |
| `GET` | `/api/tickets` | Authenticated | Filterable ticket queue (Admin sees all; Author sees own) |
| `POST` | `/api/tickets` | Authenticated | Raises support ticket; triggers AI classification & draft |
| `GET` | `/api/tickets/:id` | Authenticated | Ticket thread (Internal notes stripped for Authors) |
| `POST` | `/api/tickets/:id/messages`| Authenticated | Post reply or Admin internal note |
| `PATCH`| `/api/admin/tickets/:id/status` | Admin Only | Updates ticket status (`Open`, `In Progress`, `Resolved`, `Closed`) |
| `PATCH`| `/api/admin/tickets/:id/classification` | Admin Only | Overrides AI category with audit record |
| `PATCH`| `/api/admin/tickets/:id/priority` | Admin Only | Overrides AI priority score with reasoning |
| `PATCH`| `/api/admin/tickets/:id/assign` | Admin Only | Assigns ticket to an admin |
| `POST` | `/api/admin/tickets/:id/generate-draft` | Admin Only | Regenerates AI draft with updated thread context |
| `GET` | `/api/admin/analytics` | Admin Only | Support queue overview metrics and category counts |
| `GET` | `/api/knowledge-base` | Public | Reads official BookLeaf knowledge base policies |

### WebSocket Real-Time Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `ticket:created` | Server → Client | `Ticket` | Broadcast to admins and author when a new ticket is raised |
| `ticket:updated` | Server → Client | `Ticket` | Broadcast when status, priority, or category changes |
| `message:new` | Server → Client | `{ ticketId, message }` | Delivered in real time to active ticket chat rooms |

---

## 📂 Project Structure

```
bookleaf-support-portal/
├── bookleaf_sample_data.json      # Provided dataset (10 authors, 18 books)
├── package.json                   # Root orchestrator (dev, build, start, seed)
├── README.md                      # Comprehensive documentation
├── APPROACH_WRITEUP.md            # 1-page engineering write-up & trade-offs
│
├── server/                        # Node.js + Express + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (User, Book, Ticket, Message, Audit)
│   │   └── seed.ts                # Database seeder (Authors, Books, Sample Tickets)
│   ├── src/
│   │   ├── config/                # Environment configuration
│   │   ├── docs/                  # OpenAPI / Swagger specification
│   │   ├── knowledge/             # BookLeaf Knowledge Base & policy keywords
│   │   ├── middlewares/           # Auth (JWT & RBAC), Validation (Zod), Error handling
│   │   ├── routes/                # Auth, Books, Tickets, Admin routes
│   │   ├── services/
│   │   │   ├── ai.service.ts      # AI Classification, Priority, Draft & DKE Engine
│   │   │   └── socket.service.ts  # Socket.IO real-time notification engine
│   │   ├── app.ts                 # Express application setup & static serving
│   │   └── index.ts               # HTTP & WebSocket server entrypoint
│   └── package.json
│
└── client/                        # React 18 + Vite + TypeScript + Tailwind CSS Frontend
    ├── src/
    │   ├── components/
    │   │   ├── admin/             # Admin Queue, Analytics, and Ticket Workspace
    │   │   ├── author/            # My Books, Submit Query, My Tickets, Ticket Thread
    │   │   ├── DemoLoginModal.tsx # 1-click account switcher
    │   │   ├── KnowledgeBaseModal # In-app policy reader modal
    │   │   ├── LoginView.tsx      # Branded authentication screen
    │   │   └── Navbar.tsx         # Responsive header with live role indicators
    │   ├── context/               # AuthContext & Session management
    │   ├── services/              # API Fetch client & Socket.IO client
    │   ├── types/                 # Shared TypeScript interfaces
    │   ├── App.tsx                # Main portal view orchestrator
    │   └── main.tsx               # Entrypoint
    └── package.json
```

---

## 🛡️ Evaluation Checklist

- [x] **Author Portal**:
  - [x] Email authentication with per-author data isolation
  - [x] "My Books" dashboard with full metrics: ISBN, status, MRP, copies sold, royalty earned/paid/pending
  - [x] "Submit a Support Query" form with book selector dropdown and optional file attachment
  - [x] "My Tickets" real-time view updating immediately via WebSockets when admin replies
- [x] **Admin Operations Portal**:
  - [x] Queue filterable by status, category, priority, and date with urgency highlights
  - [x] AI Auto-Classification into 6 official categories with Admin Override
  - [x] AI-Generated Priority Score (Critical / High / Medium / Low) with reasoning & Admin Override
  - [x] AI-Drafted Response grounded in BookLeaf Knowledge Base + editable reply composer
  - [x] Internal Private Notes (strictly invisible to authors) & Admin Assignment
- [x] **AI Engineering**:
  - [x] Prompt structure adhering to BookLeaf tone guidelines (empathy, specific numbers, SLAs)
  - [x] API key stored securely in environment variables (never leaked to frontend)
  - [x] Graceful degradation: Seamless fallback engine when API keys are absent or offline
  - [x] Token cost consciousness: Targeted RAG context slicing and limited chat history
- [x] **REST API Layer**:
  - [x] Consistent REST conventions & Zod input validation
  - [x] JWT Authentication & strict Role-Based Access Control
  - [x] Interactive OpenAPI/Swagger UI at `/api/docs`
- [x] **Seed Dataset**:
  - [x] Pre-seeded with the exact 10 authors and 18 books from `bookleaf_sample_data.json`
  - [x] Pre-seeded with 6 realistic tickets matching prompt test cases
