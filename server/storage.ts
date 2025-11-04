// Storage interface and implementation - based on javascript_database blueprint
import { 
  users, 
  formSubmissions,
  type User, 
  type InsertUser,
  type FormSubmission,
  type InsertFormSubmission 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods (kept for reference)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Form submission methods
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  getAllFormSubmissions(): Promise<FormSubmission[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
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
    return await db.select().from(formSubmissions);
  }
}

export const storage = new DatabaseStorage();
