
import { db } from "./db";
import {
  users, questions, generatedPapers, paperQuestions,
  type User, type InsertUser,
  type Question, type InsertQuestion,
  type GeneratedPaper, type InsertPaper
} from "@shared/schema";
import { eq, desc, sql, inArray, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Questions
  getQuestions(filters?: { subject?: string; topic?: string; difficulty?: string; type?: string }): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  createQuestionsBulk(questionsList: InsertQuestion[]): Promise<number>;
  updateQuestionUsage(id: number): Promise<void>;
  deleteQuestion(id: number): Promise<void>;

  // Papers
  createPaper(paper: InsertPaper): Promise<GeneratedPaper>;
  addQuestionsToPaper(paperId: number, questionIds: number[]): Promise<void>;
  getPaper(id: number): Promise<(GeneratedPaper & { questions: Question[] }) | undefined>;
  getPapers(): Promise<GeneratedPaper[]>;
  getUserPapers(userId: number): Promise<GeneratedPaper[]>;

  // Analytics
  getDashboardStats(): Promise<{
    totalQuestions: number;
    questionsBySubject: Record<string, number>;
    questionsByDifficulty: Record<string, number>;
    totalPapers: number;
    recentPapers: GeneratedPaper[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getQuestions(filters?: { subject?: string; topic?: string; difficulty?: string; type?: string }): Promise<Question[]> {
    const conditions = [];
    if (filters?.subject) conditions.push(eq(questions.subject, filters.subject));
    if (filters?.topic) conditions.push(eq(questions.topic, filters.topic));
    // Cast difficulty and type to their enum types for comparison, or let Drizzle handle it if types match
    if (filters?.difficulty) conditions.push(eq(questions.difficulty, filters.difficulty as any));
    if (filters?.type) conditions.push(eq(questions.type, filters.type as any));

    if (conditions.length > 0) {
      return await db.select().from(questions).where(and(...conditions)).orderBy(desc(questions.createdAt));
    }
    return await db.select().from(questions).orderBy(desc(questions.createdAt));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async createQuestionsBulk(questionsList: InsertQuestion[]): Promise<number> {
    const result = await db.insert(questions).values(questionsList).returning();
    return result.length;
  }

  async updateQuestionUsage(id: number): Promise<void> {
    await db.update(questions)
      .set({
        timesUsed: sql`${questions.timesUsed} + 1`,
        lastUsed: new Date()
      })
      .where(eq(questions.id, id));
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async createPaper(paper: InsertPaper): Promise<GeneratedPaper> {
    const [newPaper] = await db.insert(generatedPapers).values(paper).returning();
    return newPaper;
  }

  async addQuestionsToPaper(paperId: number, questionIds: number[]): Promise<void> {
    if (questionIds.length === 0) return;
    const values = questionIds.map(qid => ({
      paperId,
      questionId: qid
    }));
    await db.insert(paperQuestions).values(values);
  }

  async getPaper(id: number): Promise<(GeneratedPaper & { questions: Question[] }) | undefined> {
    const [paper] = await db.select().from(generatedPapers).where(eq(generatedPapers.id, id));
    if (!paper) return undefined;

    const paperQs = await db.select()
      .from(paperQuestions)
      .where(eq(paperQuestions.paperId, id));

    const questionIds = paperQs.map(pq => pq.questionId);
    let paperQuestionsList: Question[] = [];

    if (questionIds.length > 0) {
      paperQuestionsList = await db.select()
        .from(questions)
        .where(inArray(questions.id, questionIds));
    }

    return { ...paper, questions: paperQuestionsList };
  }

  async getPapers(): Promise<GeneratedPaper[]> {
    return await db.select().from(generatedPapers).orderBy(desc(generatedPapers.createdAt));
  }

  async getUserPapers(userId: number): Promise<GeneratedPaper[]> {
    return await db.select().from(generatedPapers)
      .where(eq(generatedPapers.createdBy, userId))
      .orderBy(desc(generatedPapers.createdAt));
  }

  async getDashboardStats() {
    const allQuestions = await db.select().from(questions);
    const allPapers = await db.select().from(generatedPapers).orderBy(desc(generatedPapers.createdAt)).limit(5);

    const questionsBySubject: Record<string, number> = {};
    const questionsByDifficulty: Record<string, number> = {};

    allQuestions.forEach(q => {
      questionsBySubject[q.subject] = (questionsBySubject[q.subject] || 0) + 1;
      questionsByDifficulty[q.difficulty] = (questionsByDifficulty[q.difficulty] || 0) + 1;
    });

    return {
      totalQuestions: allQuestions.length,
      questionsBySubject,
      questionsByDifficulty,
      totalPapers: await db.select({ count: sql<number>`count(*)` }).from(generatedPapers).then(r => Number(r[0].count)),
      recentPapers: allPapers
    };
  }
}

export const storage = new DatabaseStorage();
