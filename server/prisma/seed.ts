import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing records to ensure clean state
  await prisma.ticketAuditLog.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Create default password hash
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const authorPasswordHash = await bcrypt.hash("author123", 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      id: "ADMIN001",
      email: "admin@bookleafpub.com",
      passwordHash: adminPasswordHash,
      name: "Operations Admin",
      role: "ADMIN",
      phone: "+91-99999-00000",
      city: "Delhi",
      joinedDate: new Date("2021-01-01"),
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // 2. Load Sample Data
  const sampleDataPath = path.resolve(__dirname, "../../bookleaf_sample_data.json");
  if (!fs.existsSync(sampleDataPath)) {
    throw new Error(`Sample data file not found at: ${sampleDataPath}`);
  }

  const rawData = fs.readFileSync(sampleDataPath, "utf-8");
  const parsedData = JSON.parse(rawData);

  console.log(`Found ${parsedData.authors.length} authors in sample dataset.`);

  for (const authorData of parsedData.authors) {
    const author = await prisma.user.create({
      data: {
        id: authorData.author_id,
        email: authorData.email,
        passwordHash: authorPasswordHash,
        name: authorData.name,
        role: "AUTHOR",
        phone: authorData.phone,
        city: authorData.city,
        joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : null,
      },
    });

    for (const bookData of authorData.books) {
      await prisma.book.create({
        data: {
          id: bookData.book_id,
          authorId: author.id,
          title: bookData.title,
          isbn: bookData.isbn,
          genre: bookData.genre,
          publicationDate: bookData.publication_date ? new Date(bookData.publication_date) : null,
          status: bookData.status,
          mrp: bookData.mrp,
          authorRoyaltyPerCopy: bookData.author_royalty_per_copy,
          totalCopiesSold: bookData.total_copies_sold || 0,
          totalRoyaltyEarned: bookData.total_royalty_earned || 0,
          royaltyPaid: bookData.royalty_paid || 0,
          royaltyPending: bookData.royalty_pending || 0,
          lastRoyaltyPayoutDate: bookData.last_royalty_payout_date ? new Date(bookData.last_royalty_payout_date) : null,
          printPartner: bookData.print_partner,
          availableOn: JSON.stringify(bookData.available_on || []),
        },
      });
    }
  }

  console.log("✅ All authors and books seeded successfully.");

  // 3. Pre-seed Realistic Sample Tickets based on prompt guidelines
  const sampleTickets = [
    {
      ticketNumber: "BL-1001",
      authorId: "AUTH001", // Priya Sharma
      bookId: "BK001", // Whispers of the Ganges
      subject: "Unreceived Royalty for Q3",
      description: "I published my book 4 months ago and still haven't received any royalty. What's going on with my account?",
      category: "Royalty & Payments",
      aiCategory: "Royalty & Payments",
      priority: "High",
      aiPriority: "High",
      priorityReasoning: "Author reports overdue royalty payout inquiry with direct financial impact.",
      status: "Open",
      assignedAdminId: null,
      aiDraftResponse:
        "Dear Priya,\n\nThank you for reaching out to us. We completely understand your concern regarding your royalty payout for 'Whispers of the Ganges'.\n\nAt BookLeaf, royalties are calculated on a quarterly cycle and disbursed within 45 days of the quarter ending. According to our records, your pending royalty stands at ₹3,570. Please verify that your bank details are active and linked in your author dashboard. If all details are in place, our finance team will process this payout within our upcoming disbursement run, and we will update you within 48 hours.\n\nWarm regards,\nBookLeaf Operations Team",
      aiDraftConfidence: 0.94,
      createdAt: new Date(Date.now() - 36 * 3600 * 1000), // 36 hours ago
      messages: [
        {
          senderId: "AUTH001",
          senderRole: "AUTHOR",
          message: "I published my book 4 months ago and still haven't received any royalty. What's going on with my account?",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 36 * 3600 * 1000),
        },
      ],
    },
    {
      ticketNumber: "BL-1002",
      authorId: "AUTH003", // Ananya Reddy
      bookId: "BK005", // Between Two Temples
      subject: "ISBN Mismatch on Amazon Listing",
      description: "My book is showing a different ISBN on Amazon than what's printed on the physical copy! Customers are messaging me confused.",
      category: "ISBN & Metadata Issues",
      aiCategory: "ISBN & Metadata Issues",
      priority: "Critical",
      aiPriority: "Critical",
      priorityReasoning: "Severe retail metadata mismatch causing customer confusion and catalogue discrepancy.",
      status: "In Progress",
      assignedAdminId: "ADMIN001",
      aiDraftResponse:
        "Dear Ananya,\n\nThank you for alerting us to this critical issue. We sincerely apologize for the discrepancy between the physical copy of 'Between Two Temples' and its Amazon listing.\n\nISBN integrity is paramount to us, and we treat catalogue mismatches with the highest urgency. I have escalated this directly to our production and distribution desk with ticket reference BL-1002. Our team is actively reviewing the barcode imprint and initiating a metadata correction with Amazon India. We will resolve this within 48 hours and send you a confirmation as soon as the listing reflects the correct ISBN.\n\nWarm regards,\nBookLeaf Operations Team",
      aiDraftConfidence: 0.96,
      createdAt: new Date(Date.now() - 18 * 3600 * 1000),
      messages: [
        {
          senderId: "AUTH003",
          senderRole: "AUTHOR",
          message: "My book is showing a different ISBN on Amazon than what's printed on the physical copy! Customers are messaging me confused.",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 18 * 3600 * 1000),
        },
        {
          senderId: "ADMIN001",
          senderRole: "ADMIN",
          message: "Contacted Repro and Epitome catalog managers to cross-verify the ISBN feed sent to Amazon India. Waiting for feed response.",
          isInternalNote: true, // INTERNAL NOTE
          createdAt: new Date(Date.now() - 12 * 3600 * 1000),
        },
        {
          senderId: "ADMIN001",
          senderRole: "ADMIN",
          message: "Dear Ananya, we have escalated this directly with Amazon's catalogue team. We are tracking this actively and will have this resolved within 48 hours.",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 11 * 3600 * 1000),
        },
      ],
    },
    {
      ticketNumber: "BL-1003",
      authorId: "AUTH004", // Vikram Joshi
      bookId: "BK006", // Debugging Life
      subject: "Severe misprints on author copies received today",
      description: "I received my 10 author copies and the print quality is terrible. The images are blurry and pages 45-60 are misaligned. Please inspect.",
      category: "Printing & Quality",
      aiCategory: "Printing & Quality",
      priority: "High",
      aiPriority: "High",
      priorityReasoning: "Physical defect in printed copies requiring verification and complimentary reprint.",
      status: "Open",
      assignedAdminId: null,
      aiDraftResponse:
        "Dear Vikram,\n\nWe sincerely apologize for the disappointing print quality of your author copies of 'Debugging Life'. This certainly falls below BookLeaf's production standards.\n\nUnder our quality guarantee policy, BookLeaf arranges a complimentary reprint for defective copies. Could you please reply here or attach 2-3 clear photographs showing the blurry illustrations and the misaligned pages? Once our production team verifies the defect, we will immediately order a replacement print run through our facility, which takes 5-7 business days to deliver to Pune.\n\nWarm regards,\nBookLeaf Operations Team",
      aiDraftConfidence: 0.92,
      createdAt: new Date(Date.now() - 6 * 3600 * 1000),
      messages: [
        {
          senderId: "AUTH004",
          senderRole: "AUTHOR",
          message: "I received my 10 author copies and the print quality is terrible. The images are blurry and pages 45-60 are misaligned. Please inspect.",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 6 * 3600 * 1000),
        },
      ],
    },
    {
      ticketNumber: "BL-1004",
      authorId: "AUTH007", // Sneha Kulkarni
      bookId: "BK011", // The Algorithm of Love
      subject: "Amazon shows Currently Unavailable",
      description: "My book 'The Algorithm of Love' is published but showing as 'Currently Unavailable' on Amazon. Can you fix this?",
      category: "Distribution & Availability",
      aiCategory: "Distribution & Availability",
      priority: "Medium",
      aiPriority: "Medium",
      priorityReasoning: "Temporary stock sync interruption on Amazon retail channel.",
      status: "Resolved",
      assignedAdminId: "ADMIN001",
      aiDraftResponse:
        "Dear Sneha,\n\nThank you for reaching out. An 'Unavailable' status on Amazon usually indicates an automated inventory sync delay between retail warehouses and our distribution feed.\n\nWe have triggered a manual inventory refresh for 'The Algorithm of Love'. Amazon's servers typically complete this sync within 24-48 hours. Please check the page tomorrow afternoon; if it hasn't updated, let us know and we will escalate to our channel manager.\n\nWarm regards,\nBookLeaf Operations Team",
      aiDraftConfidence: 0.95,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      messages: [
        {
          senderId: "AUTH007",
          senderRole: "AUTHOR",
          message: "My book 'The Algorithm of Love' is published but showing as 'Currently Unavailable' on Amazon. Can you fix this?",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 48 * 3600 * 1000),
        },
        {
          senderId: "ADMIN001",
          senderRole: "ADMIN",
          message: "Dear Sneha, we have triggered a manual catalogue re-sync with Amazon India. It will reflect back as in-stock within 24-48 hours.",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 42 * 3600 * 1000),
        },
        {
          senderId: "AUTH007",
          senderRole: "AUTHOR",
          message: "Thank you so much! It's back live and showing Buy Now button.",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 20 * 3600 * 1000),
        },
      ],
    },
    {
      ticketNumber: "BL-1005",
      authorId: "AUTH009", // Kavita Deshmukh
      bookId: "BK015", // Raising Roots
      subject: "Typesetting timeline query",
      description: "It's been 3 weeks and my book 'Raising Roots' is still in typesetting. When will it be done?",
      category: "Book Status & Production Updates",
      aiCategory: "Book Status & Production Updates",
      priority: "Medium",
      aiPriority: "Medium",
      priorityReasoning: "Production timeline check for manuscript currently in typesetting phase.",
      status: "Open",
      assignedAdminId: null,
      aiDraftResponse:
        "Dear Kavita,\n\nThank you for following up on 'Raising Roots'. We understand how exciting it is to see your manuscript take shape, and we appreciate your patience.\n\nOur design team is formatting the interior layout and complex chapter styling for 'Raising Roots'. Typesetting is currently in final adjustments and our team expects to generate the first complete PDF proof by this Friday. You will receive an email notification along with the proof for your review and approval.\n\nWarm regards,\nBookLeaf Operations Team",
      aiDraftConfidence: 0.90,
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
      messages: [
        {
          senderId: "AUTH009",
          senderRole: "AUTHOR",
          message: "It's been 3 weeks and my book 'Raising Roots' is still in typesetting. When will it be done?",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 4 * 3600 * 1000),
        },
      ],
    },
    {
      ticketNumber: "BL-1006",
      authorId: "AUTH010", // Diya Chatterjee
      bookId: null, // General / Account Level
      subject: "Updating author bio and book blurb",
      description: "Can I update the description of my book on Amazon after it's already live? What is the procedure?",
      category: "General Inquiry",
      aiCategory: "General Inquiry",
      priority: "Low",
      aiPriority: "Low",
      priorityReasoning: "Standard metadata revision inquiry with no operational failure.",
      status: "Resolved",
      assignedAdminId: "ADMIN001",
      aiDraftResponse:
        "Dear Diya,\n\nYes, absolutely! You can update your book description and author bio even after your book is live on Amazon and retail stores.\n\nYou can submit your updated blurb directly by replying here or sending it to support@bookleafpub.com. Once submitted, our catalog team pushes the updated metadata feed to Amazon and Flipkart, which typically reflects within 3-5 business days.\n\nWarm regards,\nBookLeaf Operations Team",
      aiDraftConfidence: 0.97,
      createdAt: new Date(Date.now() - 72 * 3600 * 1000),
      messages: [
        {
          senderId: "AUTH010",
          senderRole: "AUTHOR",
          message: "Can I update the description of my book on Amazon after it's already live? What is the procedure?",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 72 * 3600 * 1000),
        },
        {
          senderId: "ADMIN001",
          senderRole: "ADMIN",
          message: "Dear Diya, yes, metadata updates can be submitted anytime! Once submitted, it takes 3-5 business days to propagate across Amazon and partner platforms.",
          isInternalNote: false,
          createdAt: new Date(Date.now() - 65 * 3600 * 1000),
        },
      ],
    },
  ];

  for (const t of sampleTickets) {
    const { messages, ...ticketData } = t;
    const ticket = await prisma.ticket.create({
      data: ticketData,
    });

    for (const msg of messages) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: msg.senderId,
          senderRole: msg.senderRole,
          message: msg.message,
          isInternalNote: msg.isInternalNote,
          createdAt: msg.createdAt,
        },
      });
    }
  }

  console.log(`✅ Pre-seeded ${sampleTickets.length} sample tickets with conversation threads and internal notes.`);
  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
