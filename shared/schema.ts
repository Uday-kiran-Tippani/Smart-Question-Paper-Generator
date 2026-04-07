import { pgTable, text, serial, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for categorization
export const difficultyEnum = pgEnum("difficulty", ["Easy", "Medium", "Hard"]);
export const roleEnum = pgEnum("role", ["admin", "lecturer"]);
export const examTypeEnum = pgEnum("exam_type", ["MID-1&2", "MID-3&4", "SEMESTER", "OTHERS"]);
export const questionTypeEnum = pgEnum("question_type", ["Short", "Long", "MCQ", "Analytical"]);
export const questionSourceEnum = pgEnum("question_source", ["AI", "Database"]);

// === USERS TABLE ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").default("lecturer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SUBJECTS TABLE ===
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === UNITS TABLE ===
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  unitNumber: integer("unit_number").notNull(),
  title: text("title").notNull(),
  syllabusContent: text("syllabus_content").notNull(),
});

// === GENERATED PAPERS TABLE ===
export const generatedPapers = pgTable("generated_papers", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  durationMinutes: integer("duration_minutes").default(180).notNull(),
  totalMarks: integer("total_marks").notNull(),
  examType: examTypeEnum("exam_type").notNull(),
  difficultyDistribution: jsonb("difficulty_distribution").notNull(), // { Easy: number, Medium: number, Hard: number }
  marksDistribution: jsonb("marks_distribution").notNull(), // { "2m": number, "5m": number, "10m": number, "15m": number }
  generatedContent: text("generated_content").notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === GENERATED QUESTIONS TABLE ===
// Store individual questions from the generated paper for future analytics
export const generatedQuestions = pgTable("generated_questions", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").references(() => generatedPapers.id, { onDelete: 'cascade' }).notNull(),
  questionText: text("question_text").notNull(),
  marks: integer("marks").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
});

// === QUESTION BANK TABLE ===
// Global repository of all generated questions for hybrid caching
export const questionBank = pgTable("question_bank", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  unitId: integer("unit_id").references(() => units.id, { onDelete: 'cascade' }).notNull(),
  questionText: text("question_text").notNull(),
  questionType: questionTypeEnum("question_type").notNull(),
  marks: integer("marks").notNull(),
  difficultyLevel: difficultyEnum("difficulty_level").notNull(),
  source: questionSourceEnum("source").default("AI").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const selectUserSchema = createSelectSchema(users);

export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true, createdBy: true });
export const selectSubjectSchema = createSelectSchema(subjects);

export const insertUnitSchema = createInsertSchema(units).omit({ id: true });
export const selectUnitSchema = createSelectSchema(units);

export const insertPaperSchema = createInsertSchema(generatedPapers).omit({ id: true, createdAt: true, createdBy: true, generatedContent: true });
export const selectPaperSchema = createSelectSchema(generatedPapers);

export const insertGeneratedQuestionSchema = createInsertSchema(generatedQuestions).omit({ id: true });
export const selectGeneratedQuestionSchema = createSelectSchema(generatedQuestions);

export const insertQuestionBankSchema = createInsertSchema(questionBank).omit({ id: true, createdAt: true });
export const selectQuestionBankSchema = createSelectSchema(questionBank);

export const updateSubjectSchema = insertSubjectSchema.partial();
export const updateUnitSchema = insertUnitSchema.partial();

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export type GeneratedPaper = typeof generatedPapers.$inferSelect;
export type InsertPaper = z.infer<typeof insertPaperSchema>;

export type GeneratedQuestion = typeof generatedQuestions.$inferSelect;
export type InsertGeneratedQuestion = z.infer<typeof insertGeneratedQuestionSchema>;

export type QuestionBankItem = typeof questionBank.$inferSelect;
export type InsertQuestionBankItem = z.infer<typeof insertQuestionBankSchema>;

// API Request Types
export type LoginRequest = { email: string; passwordHash: string }; // Plain password passed before hashing
export type AuthResponse = { user: User; token: string };

export type GeneratePaperRequest = {
  title: string;
  subjectId: number;
  totalMarks: number;
  durationMinutes: number;
  examType: "MID-1&2" | "MID-3&4" | "SEMESTER" | "OTHERS";
  difficultyDistribution: { Easy: number; Medium: number; Hard: number }; // Percentages summing to 100
  marksDistribution: Record<string, number>; // How many of each mark type
};
