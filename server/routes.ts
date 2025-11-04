import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFormSubmissionSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Form submission endpoint
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

  // Get all form submissions (for potential admin view in future)
  app.get("/api/form-submissions", async (req, res) => {
    try {
      const submissions = await storage.getAllFormSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      res.status(500).json({ error: "Failed to fetch form submissions" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
