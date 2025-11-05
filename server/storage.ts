// Storage interface and implementation - based on javascript_database blueprint
import { 
  users, 
  formSubmissions,
  formSessions,
  formAnalyticsEvents,
  type User, 
  type UpsertUser,
  type FormSubmission,
  type InsertFormSubmission,
  type FormSession,
  type FormAnalyticsEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, count, gte, and } from "drizzle-orm";

export interface AnalyticsData {
  totalSessions: number;
  totalSubmissions: number;
  completionRate: number;
  averageTimeToComplete: number | null;
  dropOffByStep: {
    step: number;
    viewed: number;
    continued: number;
    dropOffRate: number;
  }[];
}

export interface IStorage {
  // User methods for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Form submission methods
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  getAllFormSubmissions(): Promise<FormSubmission[]>;
  
  // Analytics methods
  createSession(sessionId: string): Promise<FormSession>;
  trackEvent(sessionId: string, step: number, eventType: string): Promise<FormAnalyticsEvent>;
  completeSession(sessionId: string, submissionId: string, timeToComplete: number): Promise<FormSession>;
  getAnalytics(timePeriod?: string): Promise<AnalyticsData>;
}

export class DatabaseStorage implements IStorage {
  // User methods for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Form submission methods
  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    const [formSubmission] = await db
      .insert(formSubmissions)
      .values(submission)
      .returning();
    return formSubmission;
  }

  async getAllFormSubmissions(): Promise<FormSubmission[]> {
    return await db
      .select()
      .from(formSubmissions)
      .orderBy(desc(formSubmissions.submittedAt));
  }

  // Analytics methods
  async createSession(sessionId: string): Promise<FormSession> {
    const [session] = await db
      .insert(formSessions)
      .values({ sessionId })
      .returning();
    return session;
  }

  async trackEvent(sessionId: string, step: number, eventType: string): Promise<FormAnalyticsEvent> {
    const [event] = await db
      .insert(formAnalyticsEvents)
      .values({ sessionId, step, eventType })
      .returning();
    return event;
  }

  async completeSession(sessionId: string, submissionId: string, timeToComplete: number): Promise<FormSession> {
    const [session] = await db
      .update(formSessions)
      .set({ 
        completedAt: new Date(),
        submissionId,
        timeToComplete
      })
      .where(eq(formSessions.sessionId, sessionId))
      .returning();
    return session;
  }

  async getAnalytics(timePeriod?: string): Promise<AnalyticsData> {
    let dateFilter: Date | null = null;
    
    if (timePeriod === '7days') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timePeriod === '30days') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get total sessions
    const sessionsQuery = dateFilter
      ? db.select({ count: count() }).from(formSessions).where(gte(formSessions.startedAt, dateFilter))
      : db.select({ count: count() }).from(formSessions);
    
    const [{ count: totalSessions }] = await sessionsQuery;

    // Get total submissions (completed sessions)
    const submissionsQuery = dateFilter
      ? db.select({ count: count() }).from(formSessions)
          .where(and(
            sql`${formSessions.completedAt} IS NOT NULL`,
            gte(formSessions.startedAt, dateFilter)
          ))
      : db.select({ count: count() }).from(formSessions)
          .where(sql`${formSessions.completedAt} IS NOT NULL`);
    
    const [{ count: totalSubmissions }] = await submissionsQuery;

    // Calculate completion rate
    const completionRate = totalSessions > 0 ? (totalSubmissions / totalSessions) * 100 : 0;

    // Get average time to complete
    const avgTimeQuery = dateFilter
      ? db.select({ avg: sql<number>`AVG(${formSessions.timeToComplete})` })
          .from(formSessions)
          .where(and(
            sql`${formSessions.timeToComplete} IS NOT NULL`,
            gte(formSessions.startedAt, dateFilter)
          ))
      : db.select({ avg: sql<number>`AVG(${formSessions.timeToComplete})` })
          .from(formSessions)
          .where(sql`${formSessions.timeToComplete} IS NOT NULL`);
    
    const [{ avg }] = await avgTimeQuery;
    const averageTimeToComplete = avg ? Math.round(avg) : null;

    // Calculate drop-off by step
    const dropOffByStep = [];
    
    for (let step = 0; step <= 2; step++) {
      // Get sessions that viewed this step
      const viewedQuery = dateFilter
        ? db.select({ 
            sessionId: formAnalyticsEvents.sessionId 
          })
          .from(formAnalyticsEvents)
          .innerJoin(formSessions, eq(formAnalyticsEvents.sessionId, formSessions.sessionId))
          .where(and(
            eq(formAnalyticsEvents.step, step),
            eq(formAnalyticsEvents.eventType, 'view'),
            gte(formSessions.startedAt, dateFilter)
          ))
        : db.select({ 
            sessionId: formAnalyticsEvents.sessionId 
          })
          .from(formAnalyticsEvents)
          .where(and(
            eq(formAnalyticsEvents.step, step),
            eq(formAnalyticsEvents.eventType, 'view')
          ));
      
      const viewedSessions = await viewedQuery;
      const viewed = viewedSessions.length;

      // Get sessions that continued past this step (viewed next step or completed)
      let continued = 0;
      if (step < 2) {
        const continuedQuery = dateFilter
          ? db.select({ 
              sessionId: formAnalyticsEvents.sessionId 
            })
            .from(formAnalyticsEvents)
            .innerJoin(formSessions, eq(formAnalyticsEvents.sessionId, formSessions.sessionId))
            .where(and(
              eq(formAnalyticsEvents.step, step + 1),
              eq(formAnalyticsEvents.eventType, 'view'),
              gte(formSessions.startedAt, dateFilter)
            ))
          : db.select({ 
              sessionId: formAnalyticsEvents.sessionId 
            })
            .from(formAnalyticsEvents)
            .where(and(
              eq(formAnalyticsEvents.step, step + 1),
              eq(formAnalyticsEvents.eventType, 'view')
            ));
        
        const continuedSessions = await continuedQuery;
        continued = continuedSessions.length;
      } else {
        // For the last step, count completed sessions
        const completedQuery = dateFilter
          ? db.select({ 
              sessionId: formSessions.sessionId 
            })
            .from(formSessions)
            .where(and(
              sql`${formSessions.completedAt} IS NOT NULL`,
              gte(formSessions.startedAt, dateFilter)
            ))
          : db.select({ 
              sessionId: formSessions.sessionId 
            })
            .from(formSessions)
            .where(sql`${formSessions.completedAt} IS NOT NULL`);
        
        const completedSessions = await completedQuery;
        continued = completedSessions.length;
      }

      const dropOffRate = viewed > 0 ? ((viewed - continued) / viewed) * 100 : 0;

      dropOffByStep.push({
        step,
        viewed,
        continued,
        dropOffRate
      });
    }

    return {
      totalSessions,
      totalSubmissions,
      completionRate,
      averageTimeToComplete,
      dropOffByStep
    };
  }
}

export const storage = new DatabaseStorage();
