import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFormSubmissionSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Form submission endpoint (public)
  app.post("/api/form-submissions", async (req, res) => {
    try {
      const validationResult = insertFormSubmissionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ 
          error: validationError.message,
          details: validationResult.error.issues 
        });
      }

      const submission = await storage.createFormSubmission(validationResult.data);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating form submission:", error);
      res.status(500).json({ error: "Failed to create form submission" });
    }
  });

  // Admin endpoint - Get all form submissions (protected)
  app.get("/api/admin/submissions", isAuthenticated, async (req, res) => {
    try {
      const submissions = await storage.getAllFormSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      res.status(500).json({ error: "Failed to fetch form submissions" });
    }
  });

  // Analytics endpoints
  app.post("/api/analytics/session-start", async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }

      const session = await storage.createSession(sessionId);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating analytics session:", error);
      res.status(500).json({ error: "Failed to create analytics session" });
    }
  });

  app.post("/api/analytics/event", async (req, res) => {
    try {
      const { sessionId, step, eventType } = req.body;
      
      if (!sessionId || step === undefined || !eventType) {
        return res.status(400).json({ error: "sessionId, step, and eventType are required" });
      }

      const event = await storage.trackEvent(sessionId, step, eventType);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error tracking analytics event:", error);
      res.status(500).json({ error: "Failed to track analytics event" });
    }
  });

  app.patch("/api/analytics/session-complete", async (req, res) => {
    try {
      const { sessionId, submissionId, timeToComplete } = req.body;
      
      if (!sessionId || !submissionId || timeToComplete === undefined) {
        return res.status(400).json({ error: "sessionId, submissionId, and timeToComplete are required" });
      }

      const session = await storage.completeSession(sessionId, submissionId, timeToComplete);
      res.json(session);
    } catch (error) {
      console.error("Error completing analytics session:", error);
      res.status(500).json({ error: "Failed to complete analytics session" });
    }
  });

  app.get("/api/admin/analytics", isAuthenticated, async (req, res) => {
    try {
      const timePeriod = req.query.timePeriod as string | undefined;
      const analytics = await storage.getAnalytics(timePeriod);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Export endpoints
  app.get("/api/admin/export/csv", isAuthenticated, async (req, res) => {
    try {
      const submissions = await storage.getAllFormSubmissions();
      
      // Helper function to escape CSV fields (RFC 4180 compliant)
      const escapeCSVField = (field: string | null | undefined): string => {
        const value = field ?? '';
        if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      // Helper function to format date
      const formatDate = (date: Date): string => {
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        const year = date.getFullYear();
        const time = date.toLocaleString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
        return `${month} ${day}, ${year} ${time}`;
      };

      // Create CSV header
      const headers = ['Name', 'Email', 'Referral Source', 'Referral Source (Other)', 'Additional Info', 'Submitted At'];
      const csvRows = [headers.join(',')];

      // Add data rows
      for (const submission of submissions) {
        const row = [
          escapeCSVField(submission.name),
          escapeCSVField(submission.email),
          escapeCSVField(submission.referralSource),
          escapeCSVField(submission.referralSourceOther),
          escapeCSVField(submission.additionalInfo),
          escapeCSVField(formatDate(new Date(submission.submittedAt)))
        ];
        csvRows.push(row.join(','));
      }

      // RFC 4180 requires CRLF line endings
      const csvContent = csvRows.join('\r\n');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `submissions_${timestamp}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  app.get("/api/admin/export/json", isAuthenticated, async (req, res) => {
    try {
      const submissions = await storage.getAllFormSubmissions();
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `submissions_${timestamp}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(submissions, null, 2));
    } catch (error) {
      console.error("Error exporting JSON:", error);
      res.status(500).json({ error: "Failed to export JSON" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
