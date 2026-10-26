export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "BookLeaf Publishing - Author Support Portal API",
    version: "1.0.0",
    description:
      "Enterprise REST API for BookLeaf's Author Support & Communication Portal, featuring AI auto-classification, priority assessment, knowledge-grounded draft responses, and real-time WebSockets.",
    contact: {
      name: "BookLeaf Engineering & Operations",
      email: "support@bookleafpub.com",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Request validation failed" },
              details: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "AUTH001" },
          email: { type: "string", example: "priya.sharma@email.com" },
          name: { type: "string", example: "Priya Sharma" },
          role: { type: "string", enum: ["AUTHOR", "ADMIN"], example: "AUTHOR" },
          phone: { type: "string", example: "+91-98765-43210" },
          city: { type: "string", example: "Mumbai" },
        },
      },
      Book: {
        type: "object",
        properties: {
          id: { type: "string", example: "BK001" },
          title: { type: "string", example: "Whispers of the Ganges" },
          isbn: { type: "string", example: "978-93-5XXXX-01-1" },
          genre: { type: "string", example: "Literary Fiction" },
          publicationDate: { type: "string", format: "date-time" },
          status: { type: "string", example: "Published & Live" },
          mrp: { type: "number", example: 399 },
          totalCopiesSold: { type: "integer", example: 342 },
          totalRoyaltyEarned: { type: "number", example: 11970 },
          royaltyPaid: { type: "number", example: 8400 },
          royaltyPending: { type: "number", example: 3570 },
          lastRoyaltyPayoutDate: { type: "string", format: "date-time" },
          printPartner: { type: "string", example: "In-House" },
          availableOn: { type: "array", items: { type: "string" }, example: ["Amazon India", "Flipkart"] },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "string" },
          ticketNumber: { type: "string", example: "BL-1001" },
          authorId: { type: "string" },
          bookId: { type: "string", nullable: true },
          subject: { type: "string" },
          description: { type: "string" },
          category: {
            type: "string",
            enum: [
              "Royalty & Payments",
              "ISBN & Metadata Issues",
              "Printing & Quality",
              "Distribution & Availability",
              "Book Status & Production Updates",
              "General Inquiry",
            ],
          },
          priority: { type: "string", enum: ["Critical", "High", "Medium", "Low"] },
          priorityReasoning: { type: "string" },
          status: { type: "string", enum: ["Open", "In Progress", "Resolved", "Closed"] },
          aiDraftResponse: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/auth/login": {
      post: {
        summary: "Log in with email and password",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@bookleafpub.com" },
                  password: { type: "string", example: "admin123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Successful login returning token and user details" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/demo-users": {
      get: {
        summary: "List all pre-seeded demo accounts (Admin and 10 Authors) for 1-click testing",
        tags: ["Authentication"],
        security: [],
        responses: { 200: { description: "Demo user list" } },
      },
    },
    "/api/books": {
      get: {
        summary: "List books (Author sees own books; Admin sees all books)",
        tags: ["Books"],
        responses: { 200: { description: "List of books with royalty and status metrics" } },
      },
    },
    "/api/tickets": {
      get: {
        summary: "List support tickets with filtering and urgency sorting",
        tags: ["Tickets"],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "priority", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["urgent", "oldest", "newest"] } },
        ],
        responses: { 200: { description: "Filtered list of tickets" } },
      },
      post: {
        summary: "Create a support ticket with AI auto-classification and priority scoring",
        tags: ["Tickets"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["subject", "description"],
                properties: {
                  bookId: { type: "string", nullable: true, example: "BK001" },
                  subject: { type: "string", example: "Unreceived Royalty for Q3" },
                  description: { type: "string", example: "I published my book 4 months ago..." },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created ticket with AI categorization" } },
      },
    },
    "/api/tickets/{id}": {
      get: {
        summary: "Get ticket details and message thread (Internal notes filtered for authors)",
        tags: ["Tickets"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Ticket details and message thread" } },
      },
    },
    "/api/tickets/{id}/messages": {
      post: {
        summary: "Post a message or response to ticket thread",
        tags: ["Tickets"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string" },
                  isInternalNote: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created message" } },
      },
    },
    "/api/admin/tickets/{id}/status": {
      patch: {
        summary: "Update ticket status (Admin only)",
        tags: ["Admin Operations"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: { status: { type: "string", enum: ["Open", "In Progress", "Resolved", "Closed"] } },
              },
            },
          },
        },
        responses: { 200: { description: "Status updated" } },
      },
    },
    "/api/admin/tickets/{id}/classification": {
      patch: {
        summary: "Override AI Category Classification (Admin only)",
        tags: ["Admin Operations"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Category overridden" } },
      },
    },
    "/api/admin/tickets/{id}/priority": {
      patch: {
        summary: "Override AI Priority Score (Admin only)",
        tags: ["Admin Operations"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Priority overridden" } },
      },
    },
    "/api/admin/tickets/{id}/generate-draft": {
      post: {
        summary: "Regenerate AI draft response on demand (Admin only)",
        tags: ["Admin Operations"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Generated draft" } },
      },
    },
    "/api/admin/analytics": {
      get: {
        summary: "Get support queue operational metrics (Admin only)",
        tags: ["Admin Operations"],
        responses: { 200: { description: "Analytics overview and breakdown" } },
      },
    },
  },
};
