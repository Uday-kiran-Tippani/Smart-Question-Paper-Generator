
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for categorization
export const difficultyEnum = pgEnum("difficulty", ["Easy", "Medium", "Hard"]);
export const questionTypeEnum = pgEnum("question_type", ["MCQ", "Short", "Long"]);
export const roleEnum = pgEnum("role", ["Admin", "Teacher"]);

// === USERS TABLE ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(), // Added email as per requirements
  password: text("password").notNull(),
  role: roleEnum("role").default("Teacher").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === QUESTIONS TABLE ===
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  type: questionTypeEnum("question_type").notNull(),
  marks: integer("marks").notNull(),
  content: text("content").notNull(),
  options: jsonb("options"), // For MCQs: { a: "...", b: "...", ... }
  correctAnswer: text("correct_answer"), // Optional answer key
  timesUsed: integer("times_used").default(0).notNull(),
  lastUsed: timestamp("last_used"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true).notNull(),
  bloomsTaxonomy: text("blooms_taxonomy"), // Added Bloom's Taxonomy field
  className: text("class_name"), // Added class field
});

// === GENERATED PAPERS TABLE ===
export const generatedPapers = pgTable("generated_papers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  className: text("class_name").notNull(), // Added class field
  totalMarks: integer("total_marks").notNull(),
  durationMinutes: integer("duration_minutes").default(180).notNull(), // Ensured not null
  difficultyDistribution: jsonb("difficulty_distribution").notNull(), // e.g. { Easy: 30, Medium: 50, Hard: 20 }
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// === PAPER QUESTIONS (Join Table) ===
export const paperQuestions = pgTable("paper_questions", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").references(() => generatedPapers.id).notNull(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
});

// === SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, timesUsed: true, lastUsed: true, createdAt: true });
export const insertPaperSchema = createInsertSchema(generatedPapers).omit({ id: true, createdAt: true });

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type GeneratedPaper = typeof generatedPapers.$inferSelect;
export type InsertPaper = z.infer<typeof insertPaperSchema>;

// API Types
export type LoginRequest = { username: string; password: string };
export type AuthResponse = { user: User; token: string };

export type GeneratePaperRequest = {
  title: string;
  subject: string;
  totalMarks: number;
  difficultyDistribution: { Easy: number; Medium: number; Hard: number }; // Percentages
  questionTypeDistribution?: { MCQ: number; Short: number; Long: number }; // Percentages (optional)
  topics?: string[]; // Optional topic filter
};

export type DashboardStats = {
  totalQuestions: number;
  questionsBySubject: Record<string, number>;
  questionsByDifficulty: Record<string, number>;
  totalPapers: number;
  recentPapers: GeneratedPaper[];
};
