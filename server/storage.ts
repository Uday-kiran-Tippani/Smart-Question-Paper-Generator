import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  users, subjects, units, generatedPapers, generatedQuestions, questionBank,
  type User, type InsertUser,
  type Subject, type InsertSubject,
  type Unit, type InsertUnit,
  type GeneratedPaper, type InsertPaper,
  type GeneratedQuestion, type InsertGeneratedQuestion,
  type QuestionBankItem, type InsertQuestionBankItem
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject & { createdBy: number }): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: number): Promise<void>;

  // Units
  getUnitsBySubject(subjectId: number): Promise<Unit[]>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: number, unit: Partial<InsertUnit>): Promise<Unit>;
  deleteUnit(id: number): Promise<void>;

  // Papers
  createPaper(paper: InsertPaper & { createdBy: number; generatedContent: string }): Promise<GeneratedPaper>;
  saveGeneratedQuestions(questions: InsertGeneratedQuestion[]): Promise<void>;
  getPaper(id: number): Promise<(GeneratedPaper & { subject?: string; questions: GeneratedQuestion[] }) | undefined>;
  getPapers(): Promise<(GeneratedPaper & { subject?: string })[]>;
  getUserPapers(userId: number): Promise<(GeneratedPaper & { subject?: string })[]>;
  updatePaper(id: number, content: string): Promise<GeneratedPaper>;

  // Question Bank
  getQuestionBankQuestions(subjectId: number, unitId: number, difficulty: string, type: string, limit: number): Promise<QuestionBankItem[]>;
  saveQuestionBankQuestions(questions: InsertQuestionBankItem[]): Promise<QuestionBankItem[]>;

  // Analytics
  getDashboardStats(): Promise<{
    totalSubjects: number;
    totalPapers: number;
    totalQuestionsGenerated: number;
    questionsByDifficulty: Record<string, number>;
    questionsBySubject: Record<string, number>;
    recentPapers: any[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Subject methods
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(desc(subjects.createdAt));
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subject: InsertSubject & { createdBy: number }): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject> {
    const [updated] = await db.update(subjects).set(subject).where(eq(subjects.id, id)).returning();
    if (!updated) throw new Error("Subject not found");
    return updated;
  }

  async deleteSubject(id: number): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  // Unit methods
  async getUnitsBySubject(subjectId: number): Promise<Unit[]> {
    return await db.select().from(units).where(eq(units.subjectId, subjectId)).orderBy(units.unitNumber);
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    const [newUnit] = await db.insert(units).values(unit).returning();
    return newUnit;
  }

  async updateUnit(id: number, unit: Partial<InsertUnit>): Promise<Unit> {
    const [updated] = await db.update(units).set(unit).where(eq(units.id, id)).returning();
    if (!updated) throw new Error("Unit not found");
    return updated;
  }

  async deleteUnit(id: number): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }

  // Question Bank
  async getQuestionBankQuestions(subjectId: number, unitId: number, difficulty: any, type: any, limit: number): Promise<QuestionBankItem[]> {
    // Randomly order the fetched questions using raw SQL 'RANDOM()'
    return await db.select()
      .from(questionBank)
      .where(
        and(
          eq(questionBank.subjectId, subjectId),
          eq(questionBank.unitId, unitId),
          eq(questionBank.difficultyLevel, difficulty),
          eq(questionBank.questionType, type)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async saveQuestionBankQuestions(questions: InsertQuestionBankItem[]): Promise<QuestionBankItem[]> {
    if (questions.length === 0) return [];
    return await db.insert(questionBank).values(questions).returning();
  }

  // Paper and Question methods
  async createPaper(paper: InsertPaper & { createdBy: number; generatedContent: string }): Promise<GeneratedPaper> {
    const [newPaper] = await db.insert(generatedPapers).values(paper).returning();
    return newPaper;
  }

  async saveGeneratedQuestions(qList: InsertGeneratedQuestion[]): Promise<void> {
    if (qList.length === 0) return;
    await db.insert(generatedQuestions).values(qList);
  }

  async getPaper(id: number): Promise<(GeneratedPaper & { subject?: string; questions: GeneratedQuestion[] }) | undefined> {
    const [row] = await db.select({
      paper: generatedPapers,
      subjectName: subjects.name
    })
      .from(generatedPapers)
      .innerJoin(subjects, eq(generatedPapers.subjectId, subjects.id))
      .where(eq(generatedPapers.id, id));

    if (!row) return undefined;

    const paperQs = await db.select()
      .from(generatedQuestions)
      .where(eq(generatedQuestions.paperId, id))
      .orderBy(generatedQuestions.id); // Or order by marks, etc.

    return { ...row.paper, subject: row.subjectName, questions: paperQs };
  }

  async updatePaper(id: number, content: string): Promise<GeneratedPaper> {
    const [updated] = await db.update(generatedPapers)
      .set({ generatedContent: content })
      .where(eq(generatedPapers.id, id))
      .returning();

    if (!updated) throw new Error("Paper not found");
    return updated;
  }

  async getPapers(): Promise<(GeneratedPaper & { subject?: string })[]> {
    const rows = await db.select({
      paper: generatedPapers,
      subjectName: subjects.name
    })
      .from(generatedPapers)
      .innerJoin(subjects, eq(generatedPapers.subjectId, subjects.id))
      .orderBy(desc(generatedPapers.createdAt));

    return rows.map(r => ({ ...r.paper, subject: r.subjectName }));
  }

  async getUserPapers(userId: number): Promise<(GeneratedPaper & { subject?: string })[]> {
    const rows = await db.select({
      paper: generatedPapers,
      subjectName: subjects.name
    })
      .from(generatedPapers)
      .innerJoin(subjects, eq(generatedPapers.subjectId, subjects.id))
      .where(eq(generatedPapers.createdBy, userId))
      .orderBy(desc(generatedPapers.createdAt));

    return rows.map(r => ({ ...r.paper, subject: r.subjectName }));
  }

  // Analytics
  async getDashboardStats() {
    const totalSubjects = await db.select({ count: sql<number>`count(*)` }).from(subjects).then(r => Number(r[0].count));
    const totalPapers = await db.select({ count: sql<number>`count(*)` }).from(generatedPapers).then(r => Number(r[0].count));
    const totalQuestionsGenerated = await db.select({ count: sql<number>`count(*)` }).from(generatedQuestions).then(r => Number(r[0].count));

    // Group questions by difficulty
    const diffRows = await db.select({
      difficulty: generatedQuestions.difficulty,
      count: sql<number>`count(*)`
    }).from(generatedQuestions).groupBy(generatedQuestions.difficulty);

    const questionsByDifficulty: Record<string, number> = { "Easy": 0, "Medium": 0, "Hard": 0 };
    diffRows.forEach(row => {
      questionsByDifficulty[row.difficulty] = Number(row.count);
    });

    // Group questions by subject
    const subjectRows = await db.select({
      subjectName: subjects.name,
      count: sql<number>`count(*)`
    })
      .from(generatedQuestions)
      .innerJoin(generatedPapers, eq(generatedQuestions.paperId, generatedPapers.id))
      .innerJoin(subjects, eq(generatedPapers.subjectId, subjects.id))
      .groupBy(subjects.name);

    const questionsBySubject: Record<string, number> = {};
    subjectRows.forEach(row => {
      questionsBySubject[row.subjectName] = Number(row.count);
    });

    const recentPapers = await db.select({
      id: generatedPapers.id,
      title: generatedPapers.title,
      totalMarks: generatedPapers.totalMarks,
      createdAt: generatedPapers.createdAt,
      subject: subjects.name
    })
      .from(generatedPapers)
      .innerJoin(subjects, eq(generatedPapers.subjectId, subjects.id))
      .orderBy(desc(generatedPapers.createdAt))
      .limit(5);

    return {
      totalSubjects,
      totalPapers,
      totalQuestionsGenerated,
      questionsByDifficulty,
      questionsBySubject,
      recentPapers
    };
  }
}

export const storage = new DatabaseStorage();
