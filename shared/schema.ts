import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Form submissions table
export const formSubmissions = pgTable("form_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  additionalInfo: text("additional_info").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).pick({
  name: true,
  email: true,
  additionalInfo: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Name is required"),
  additionalInfo: z.string().min(1, "Please provide some additional information"),
});

export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Form analytics sessions table
export const formSessions = pgTable("form_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  submissionId: varchar("submission_id").references(() => formSubmissions.id),
  timeToComplete: integer("time_to_complete"),
});

export type FormSession = typeof formSessions.$inferSelect;
export type InsertFormSession = typeof formSessions.$inferInsert;

// Form analytics events table
export const formAnalyticsEvents = pgTable("form_analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  step: integer("step").notNull(),
  eventType: text("event_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type FormAnalyticsEvent = typeof formAnalyticsEvents.$inferSelect;
export type InsertFormAnalyticsEvent = typeof formAnalyticsEvents.$inferInsert;
