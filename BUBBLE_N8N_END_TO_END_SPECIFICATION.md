# BookLeaf Publishing - Author Royalty Dashboard & Automated Notification System
## End-to-End Architectural Specification & Implementation Manual

**Stack**: Bubble.io (Frontend & Relational Database) + n8n (Orchestration Engine) + OpenAI/LLM API  
**Dataset**: `bookleaf_sample_data.json` (10 Authors, 18 Books, 1 Operations Admin)  
**Security Standard**: Token-authenticated Webhooks, Role-Based Privacy Rules, Edge-Filtered Queries  

---

## 1. Database Architecture & Schema Specification

The Bubble database models a multi-tenant relational system with strict separation between identity, publication catalog, financial records, and operational audit trails.

### A. Data Type: `User` (Built-in Identity Type)
| Field Name | Type | Options / Default | Description |
| :--- | :--- | :--- | :--- |
| `email` | text | Built-in (Unique) | Author or Admin login identifier |
| `name` | text | Mandatory | Full display name (e.g., Priya Sharma) |
| `author_id` | text | Unique Index | Catalog ID (e.g., AUTH001, ADMIN001) |
| `role` | text | `"Author"` or `"Admin"` | Enforces UI role-switching & privacy rules |
| `phone` | text | Optional | Contact phone number |
| `city` | text | Optional | City of residence (used for admin filtering) |
| `joined_date` | date | Optional | Onboarding timestamp |

---

### B. Data Type: `Book`
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `book_id` | text | Unique identifier (e.g., BK001) |
| `title` | text | Official title of the publication |
| `isbn` | text | 13-digit standard identifier |
| `genre` | text | Genre category (Literary Fiction, Poetry, etc.) |
| `status` | text | `"Published & Live"`, `"In Production - Cover Design"`, `"In Production - Typesetting"` |
| `publication_date` | date | Date launched to retail |
| `mrp` | number | Maximum Retail Price in INR (₹) |
| `author_royalty_per_copy` | number | Author net earnings per unit sold |
| `total_copies_sold` | number | Cumulative volume sold across all retail platforms |
| `total_royalty_earned` | number | Cumulative lifetime royalty earnings |
| `royalty_paid` | number | Cumulative royalties disbursed to author's bank account |
| `royalty_pending` | number | Current outstanding unpaid balance |
| `last_royalty_payout_date` | date | Date of most recent quarterly disbursement |
| `print_partner` | text | `"In-House"`, `"Repro India"`, `"Epitome Books"` |
| `available_on` | text | Comma-separated sales channels (Amazon, Flipkart, BookLeaf Store) |
| `author_id` | text | Foreign key matching `User.author_id` |
| `author_email` | text | Direct email reference for rapid query joins |
| `author_name` | text | Cached author name for display performance |

---

### C. Data Type: `Notification_Log`
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `author_id` | text | ID of the author receiving the summary |
| `author_name` | text | Display name of the author |
| `author_email` | text | Destination email |
| `sent_at` | date | Timestamp of webhook execution completion |
| `status` | text | Execution result: `"Success"` or `"Failed"` |
| `email_subject` | text | AI-generated email subject line |
| `email_content` | text | Full AI-generated statement and body text |
| `triggered_by` | text | Admin persona who initiated the action |
| `error_message` | text | Failure diagnostics if status is `"Failed"` |

---

## 2. Bubble Privacy Rules Configuration (Data Isolation)

Navigate to **Data > Privacy** in the Bubble editor to configure access control rules:

### Rules for `User`:
1. **Rule: `Admin Full Access`**
   - **Condition**: `Current User's role is "Admin"`
   - **Permissions**: Check all boxes (View all fields, Find in searches, View attached files).
2. **Rule: `Author Self Access`**
   - **Condition**: `This User is Current User`
   - **Permissions**: Check all boxes.
3. **Rule: `Everyone Else (Default)`**
   - **Permissions**: Uncheck all boxes (Authors cannot see other authors in searches).

### Rules for `Book`:
1. **Rule: `Admin Full Access`**
   - **Condition**: `Current User's role is "Admin"`
   - **Permissions**: Check all boxes.
2. **Rule: `Author Own Books Only`**
   - **Condition**: `This Book's author_email is Current User's email`
   - **Permissions**: Check all boxes.
3. **Rule: `Everyone Else (Default)`**
   - **Permissions**: Uncheck all boxes (Prevents unauthorized book and royalty scraping).

### Rules for `Notification_Log`:
1. **Rule: `Admin Full Access`**
   - **Condition**: `Current User's role is "Admin"`
   - **Permissions**: Check all boxes.
2. **Rule: `Author View Own Statements`**
   - **Condition**: `This Notification_Log's author_email is Current User's email`
   - **Permissions**: View all fields.

---

## 3. UI Component Blueprint

### Page 1: `author_portal` (Author Workspace)

#### Top Header:
- Brand Logo + Title: **BookLeaf Publishing / Author Workspace**
- Current User Info: `Current User's name` (`Current User's city`)
- Button: **Logout** (Workflow: `Log the user out` -> `Go to page login`)

#### Metric Summary Banner (3 KPI Cards):
1. **Total Royalty Earned**:
   - Dynamic Expression: `Search for Books (author_email = Current User's email)'s total_royalty_earned:sum:formatted as Currency (₹)`
2. **Total Royalty Paid**:
   - Dynamic Expression: `Search for Books (author_email = Current User's email)'s royalty_paid:sum:formatted as Currency (₹)`
3. **Current Pending Payout**:
   - Dynamic Expression: `Search for Books (author_email = Current User's email)'s royalty_pending:sum:formatted as Currency (₹)`
   - Sub-badge Conditional:
     - When Pending < ₹1,000 AND Pending > 0: Show `"Rolls over to next quarter (< ₹1,000 threshold)"` (Amber).
     - When Pending >= ₹1,000: Show `"Eligible for upcoming quarterly payout"` (Green).
     - When Pending is 0: Show `"All royalties settled"` (Slate).

#### "My Books" Repeating Group:
- **Type of content**: `Book`
- **Data source**: `Search for Books` (Constraint: `author_email = Current User's email`, Sorted by `publication_date` descending)
- **Table Columns**:
  1. **Title & ISBN**: `Current cell's Book's title` + `Current cell's Book's isbn`
  2. **Genre & Platforms**: `Current cell's Book's genre` + `Current cell's Book's available_on`
  3. **Status**: `Current cell's Book's status`
  4. **MRP**: `₹` + `Current cell's Book's mrp`
  5. **Sold**: `Current cell's Book's total_copies_sold` copies
  6. **Earned**: `₹` + `Current cell's Book's total_royalty_earned`
  7. **Pending**: `₹` + `Current cell's Book's royalty_pending`
  8. **Last Payout**: `Current cell's Book's last_royalty_payout_date:formatted as dd mmm yyyy` (or `"No payout yet"`)
  9. **Royalty Status Indicator Badge**:
     - **Green Badge (`Paid Up`)**:
       - *Condition*: `Current cell's Book's royalty_pending is 0`
       - *Style*: Green background, text: `"Fully Paid"`
     - **Yellow Badge (`Normal Cycle`)**:
       - *Condition*: `Current cell's Book's royalty_pending > 0` AND (`Current cell's Book's last_royalty_payout_date > Current date/time +(days): -90` OR `Current cell's Book's publication_date > Current date/time +(days): -90`)
       - *Style*: Amber background, text: `"Pending (In Cycle)"`
     - **Red Badge (`Overdue / Action Needed`)**:
       - *Condition*: `Current cell's Book's royalty_pending > 0` AND (`Current cell's Book's last_royalty_payout_date <= Current date/time +(days): -90` OR (`Current cell's Book's last_royalty_payout_date is empty` AND `Current cell's Book's publication_date <= Current date/time +(days): -90`))
       - *Style*: Red background, text: `"Overdue Payout"`

---

### Page 2: `admin_portal` (Operations Console)

#### Top Header & Action Strip:
- Brand Logo + Title: **BookLeaf Operations Desk**
- Button: **"Trigger Bulk Royalty Summaries"**
  - Workflow: Runs a recursive loop or calls n8n for all authors with `Search for Books's royalty_pending:sum > 0`.

#### Search & Filter Bar:
- **Search Input**: Input element (`Placeholder: Search author name...`)
- **City Dropdown**: Choices: `All Cities`, `Delhi`, `Mumbai`, `Hyderabad`, `Pune`, `Kochi`, `Chandigarh`, `Bangalore`, `Lucknow`, `Nagpur`, `Kolkata`
- **Status Dropdown**: Choices: `All Authors`, `Has Pending Payouts`, `Fully Settled`

#### Authors Repeating Group:
- **Type of content**: `User`
- **Data source**: `Search for Users` (Constraints: `role = "Author"`, `city = Dropdown City's value (when not 'All Cities')`, `name contains Input Search's value`)
- **Row Columns**:
  1. **Author Name & ID**: `Current cell's User's name` (`Current cell's User's author_id`)
  2. **Location**: `Current cell's User's city`
  3. **Total Titles**: `Search for Books (author_email = Current cell's User's email):count` books
  4. **Total Pending**: `Search for Books (author_email = Current cell's User's email)'s royalty_pending:sum:formatted as Currency`
  5. **Action Button**: **"View Details & Statements"**
     - Workflow: Sets custom state `selected_author = Current cell's User` and opens Author Detail Panel / Modal.

#### Author Detail Modal / Drawer:
- Header: `selected_author's name` (`selected_author's email`)
- Book List Repeating Group for `selected_author`'s books.
- **Trigger Button**: **"Generate & Send Royalty Summary"**
  - **Step 1**: Show loading state / disable button (prevents double-click).
  - **Step 2**: Call API Connector `n8n - Trigger Royalty Summary`:
    - `author_id`: `selected_author's author_id`
    - `author_name`: `selected_author's name`
    - `author_email`: `selected_author's email`
    - `books`: Format `Search for Books (author_email = selected_author's email)` as JSON string
    - `triggered_by`: `Current User's name`
  - **Step 3**: Create a new `Notification_Log` entry in Bubble with returned `status`, `sent_at`, and `email_body`.
  - **Step 4**: Hide loading state and display toast: `"Royalty summary generated successfully!"`

#### Notification Log Table:
- Repeating Group: `Notification_Log`
- Columns: `Author Name`, `Author Email`, `Timestamp`, `Status Badge` (Green for Success, Red for Failed), `Triggered By`, `Action: "View Generated Email"`.
- Clicking "View Generated Email" opens a pop-up rendering the full AI-generated email text.

---

## 4. Bubble API Connector Setup (n8n Webhook Connection)

1. In Bubble, install the official free plugin: **API Connector**.
2. Click **Add another API**:
   - **API Name**: `n8n Automation Engine`
   - **Authentication**: `None or self-handled`
3. Click **Add another call**:
   - **Call Name**: `Trigger Royalty Summary`
   - **Use as**: `Action`
   - **Data type**: `JSON`
   - **HTTP Method**: `POST`
   - **URL**: `https://<your-n8n-domain>/webhook/royalty-summary`
   - **Headers**:
     - `Content-Type`: `application/json`
     - `x-bookleaf-api-key`: `bookleaf_secure_webhook_token_2026`
   - **Body (JSON)**:
     ```json
     {
       "author_id": "<author_id>",
       "author_name": "<author_name>",
       "author_email": "<author_email>",
       "triggered_by": "<triggered_by>",
       "books": [
         {
           "title": "Whispers of the Ganges",
           "isbn": "978-93-5XXXX-01-1",
           "status": "Published & Live",
           "mrp": 399,
           "total_copies_sold": 342,
           "total_royalty_earned": 11970,
           "royalty_paid": 8400,
           "royalty_pending": 3570,
           "last_royalty_payout_date": "2025-10-15",
           "available_on": "Amazon India, Flipkart, BookLeaf Store"
         }
       ]
     }
     ```
   - Uncheck `Private` for the dynamic parameters so workflows can pass live data.
   - Click **Initialize call** to verify connection.

---

## 5. n8n Workflow Architecture

The exported workflow JSON is located at [`d:\Bookleafpub\n8n_royalty_notification_workflow.json`](file:///d:/Bookleafpub/n8n_royalty_notification_workflow.json).

### Workflow Flowchart:
```
[Bubble API Call] 
       │ (POST with x-bookleaf-api-key)
       ▼
[Webhook Node] ──▶ [Validate API Security Key] ──▶ (Invalid) ──▶ [Return 401 Unauthorized]
                                │ (Valid)
                                ▼
               [Process & Validate Royalty Metrics]
               - Aggregates sales & payouts
               - Identifies books in production
               - Validates ₹1,000 rollover threshold
                                │
                                ▼
               [Generate Policy-Aware AI Summary]
               - OpenAI/Claude node with BookLeaf SOPs
               - Personalized greeting
               - Quarterly 45-day window explanation
                                │
                                ▼
               [Package Final Notification Object]
                                │
                                ▼
               [Return Success to Bubble UI]
```

### Prompt Engineering Strategy:
The prompt enforces BookLeaf's exact operating policies:
1. **80/20 Net Profit Rule**: Clear explanation of how earnings are calculated.
2. **Quarterly Payout Schedule**: Explains that payouts are processed within 45 days after quarter end (May, August, November, February).
3. **Rollover Threshold**: Balances < ₹1,000 are gracefully explained as rolling over to the next cycle without penalizing the author.
4. **Production Transparency**: In-production titles receive reassurance with BookLeaf's 5-7 day print guarantee.
5. **Tone**: Dignified, encouraging, empathetic, and professional.

---

## 6. Verification & Loom Screen Recording Script (3-5 Minutes)

### Minute 0:00 - 0:45: Introduction & Architecture
- "Hello! Today I am presenting the Author Royalty Dashboard & Automated Notification System built for BookLeaf Publishing using Bubble.io and n8n."
- Show database structure in Bubble Data tab (`User`, `Book`, `Notification_Log`).
- Highlight privacy rules: Authors can only access their own records, while Admins have platform-wide visibility.

### Minute 0:45 - 2:00: Author Portal Walkthrough
- Log in as **Priya Sharma** (`priya.sharma@email.com`).
- Walk through the Consolidated Royalty Cards (Total Earned, Total Paid, Total Pending).
- Highlight the "My Books" repeating group and point out the **Royalty Status Indicators** (Green for fully paid books, Yellow/Red for pending or overdue balances).
- Show that attempting to view another author's URL is blocked by Bubble's privacy rules.

### Minute 2:00 - 3:15: Admin Console & Search/Filtering
- Log in as **Operations Admin** (`admin@bookleafpub.com`).
- Demonstrate the Author Overview table.
- Filter by City (e.g., Delhi, Mumbai) and search by author name.
- Click on an author to open the detailed book and royalty breakdown drawer.

### Minute 3:15 - 4:30: Live n8n Automation Execution
- Click the **"Generate & Send Royalty Summary"** button.
- Switch to the n8n execution canvas: show the webhook trigger, the security check passing, the metrics aggregation, and the AI summary node executing.
- Return to Bubble: show the new entry populated in the **Notification Log** with status `Success`.
- Click "View Generated Email" to review the AI output: highlight the personalized greeting, book-by-book numbers, and 80/20 quarterly payout timeline.

### Minute 4:30 - 5:00: Error Handling & Wrap-up
- Show error branch handling: invalid token returns 401, while network/API failures update the notification log to `Failed`.
- Wrap up by highlighting how Bubble and n8n work together seamlessly to power BookLeaf's editorial operations.
