async function test() {
  const BASE = "http://localhost:5000/api";

  console.log("1. Testing Demo Users...");
  const demoRes = await fetch(`${BASE}/auth/demo-users`).then((r) => r.json());
  console.log(`✅ Demo users found: ${demoRes.data.demoUsers.length}`);

  console.log("\n2. Testing Admin Login...");
  const adminLogin = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@bookleafpub.com", password: "admin123" }),
  }).then((r) => r.json());
  const adminToken = adminLogin.data.token;
  console.log(`✅ Admin logged in: ${adminLogin.data.user.name} (${adminLogin.data.user.role})`);

  console.log("\n3. Testing Author Login (Priya Sharma)...");
  const authorLogin = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "priya.sharma@email.com", password: "author123" }),
  }).then((r) => r.json());
  const authorToken = authorLogin.data.token;
  console.log(`✅ Author logged in: ${authorLogin.data.user.name} (${authorLogin.data.user.role})`);

  console.log("\n4. Testing Books (Author view)...");
  const authorBooks = await fetch(`${BASE}/books`, {
    headers: { Authorization: `Bearer ${authorToken}` },
  }).then((r) => r.json());
  console.log(`✅ Author books returned: ${authorBooks.data.books.length}`);
  authorBooks.data.books.forEach((b) => {
    console.log(`   - "${b.title}" | Status: ${b.status} | Copies Sold: ${b.totalCopiesSold} | Pending: ₹${b.royaltyPending}`);
  });

  console.log("\n5. Testing Ticket Queue (Admin view)...");
  const ticketsRes = await fetch(`${BASE}/tickets?sortBy=urgent`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());
  console.log(`✅ Admin queue tickets count: ${ticketsRes.data.tickets.length}`);
  ticketsRes.data.tickets.slice(0, 3).forEach((t) => {
    console.log(`   - [${t.ticketNumber}] ${t.priority} | ${t.category} | "${t.subject}" (${t.author.name})`);
  });

  console.log("\n6. Testing Creating a New Ticket with AI Auto-Classification & Draft...");
  const newTicket = await fetch(`${BASE}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authorToken}`,
    },
    body: JSON.stringify({
      bookId: authorBooks.data.books[0].id,
      subject: "Urgent query regarding platform listing and sales report",
      description: "Hi BookLeaf team, I noticed my book shows out of stock on Flipkart and my royalty calculations seem delayed.",
    }),
  }).then((r) => r.json());
  console.log(`✅ New Ticket Created: ${newTicket.data.ticket.ticketNumber}`);
  console.log(`   Category: ${newTicket.data.ticket.category}`);
  console.log(`   Priority: ${newTicket.data.ticket.priority} (${newTicket.data.ticket.priorityReasoning})`);
  console.log(`   AI Draft Preview: ${newTicket.data.ticket.aiDraftResponse.slice(0, 100)}...`);

  console.log("\n7. Testing Admin Analytics Metrics...");
  const analytics = await fetch(`${BASE}/admin/analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());
  console.log(`✅ Analytics Overview:`, analytics.data.overview);

  console.log("\n🎉 ALL BACKEND AND AI REST APIS TESTED SUCCESSFULLY!");
}

test().catch(console.error);
