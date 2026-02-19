
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { InsertQuestion } from "@shared/schema";
import jwt from "jsonwebtoken";
import { generatePDF, generateWord } from "./export";

// JWT Secret (In production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

// Helper for weighted random selection (Simulating ML Logic)
function selectWeightedQuestions(
  pool: any[],
  count: number,
  targetMarks: number
): any[] {
  // Simple heuristic:
  // 1. Sort by timesUsed (ascending) to prefer less used questions
  // 2. Randomize slightly to vary results
  const shuffled = [...pool].sort((a, b) => {
    // Primary sort: usage count
    if (a.timesUsed !== b.timesUsed) return a.timesUsed - b.timesUsed;
    // Secondary sort: random
    return 0.5 - Math.random();
  });

  const selected = [];
  let currentMarks = 0;

  for (const q of shuffled) {
    if (selected.length < count && currentMarks + q.marks <= targetMarks + 5) { // Allow slight buffer
      selected.push(q);
      currentMarks += q.marks;
    }
  }

  return selected;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === AUTHENTICATION ===

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(input);
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      // In a real app, use bcrypt.compare here
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        user: { id: user.id, username: user.username, role: user.role },
        token
      });
    } catch (error) {
       res.status(500).json({ message: "Login failed" });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await storage.getUser(decoded.id);
      if (!user) return res.status(401).json({ message: "User not found" });
      
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  });


  // === QUESTIONS ===
  app.get(api.questions.list.path, async (req, res) => {
    try {
      // Clean query params
      const filters: any = {};
      if (req.query.subject && req.query.subject !== "all") filters.subject = String(req.query.subject);
      if (req.query.topic && req.query.topic !== "all") filters.topic = String(req.query.topic);
      if (req.query.difficulty && req.query.difficulty !== "all") filters.difficulty = String(req.query.difficulty);
      if (req.query.type && req.query.type !== "all") filters.type = String(req.query.type);

      const questions = await storage.getQuestions(filters);
      res.json(questions);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post(api.questions.create.path, async (req, res) => {
    try {
      const input = api.questions.create.input.parse(req.body);
      // Simple duplicate check (exact content match)
      const existing = await db.select().from(questions).where(eq(questions.content, input.content));
      if (existing.length > 0) {
         return res.status(400).json({ message: "Duplicate question content detected" });
      }

      const question = await storage.createQuestion(input);
      res.status(201).json(question);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to create question" });
      }
    }
  });

  app.post(api.questions.bulkCreate.path, async (req, res) => {
    try {
      const input = api.questions.bulkCreate.input.parse(req.body);
      const count = await storage.createQuestionsBulk(input);
      res.status(201).json({ count });
    } catch (err) {
      if (err instanceof z.ZodError) {
         res.status(400).json({ message: "Invalid bulk data format" });
      } else {
         res.status(500).json({ message: "Bulk create failed" });
      }
    }
  });

  app.delete(api.questions.delete.path, async (req, res) => {
    await storage.deleteQuestion(Number(req.params.id));
    res.sendStatus(204);
  });


  // === PAPER GENERATION (The "ML" Engine) ===
  app.post(api.papers.generate.path, async (req, res) => {
    try {
      const input = api.papers.generate.input.parse(req.body);

      // 1. Fetch relevant pool of questions
      const allQuestions = await storage.getQuestions({ subject: input.subject });

      if (allQuestions.length === 0) {
        return res.status(400).json({ message: "No questions found for this subject" });
      }

      // 2. Filter by Topic if provided
      let pool = allQuestions;
      if (input.topics && input.topics.length > 0) {
        pool = pool.filter(q => input.topics!.includes(q.topic));
      }

      // 3. Difficulty Partitioning
      const easyPool = pool.filter(q => q.difficulty === 'Easy');
      const mediumPool = pool.filter(q => q.difficulty === 'Medium');
      const hardPool = pool.filter(q => q.difficulty === 'Hard');

      // 4. Calculate target marks per difficulty
      const easyMarks = Math.floor(input.totalMarks * (input.difficultyDistribution.Easy / 100));
      const mediumMarks = Math.floor(input.totalMarks * (input.difficultyDistribution.Medium / 100));
      const hardMarks = Math.floor(input.totalMarks * (input.difficultyDistribution.Hard / 100));

      // 5. Intelligent Selection (Weighted by usage)
      // We aim to fill the marks buckets.
      const selectedQuestions = [
        ...selectWeightedQuestions(easyPool, 100, easyMarks),
        ...selectWeightedQuestions(mediumPool, 100, mediumMarks),
        ...selectWeightedQuestions(hardPool, 100, hardMarks),
      ];

      if (selectedQuestions.length === 0) {
        return res.status(400).json({ message: "Could not select enough questions matching criteria" });
      }

      // 6. Create Paper Record
      const paper = await storage.createPaper({
        title: input.title,
        subject: input.subject,
        className: input.className,
        totalMarks: input.totalMarks,
        durationMinutes: input.durationMinutes,
        difficultyDistribution: input.difficultyDistribution,
        createdBy: 1, // Default to admin/first user for now (or use JWT decoded id)
      });

      // 7. Link Questions & Update Usage
      const qIds = selectedQuestions.map(q => q.id);
      await storage.addQuestionsToPaper(paper.id, qIds);

      // Update usage stats for selected questions (ML feedback loop)
      for (const id of qIds) {
        await storage.updateQuestionUsage(id);
      }

      // 8. Return result
      res.status(201).json({ ...paper, questions: selectedQuestions });

    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to generate paper" });
      }
    }
  });

  app.get(api.papers.list.path, async (req, res) => {
    const papers = await storage.getPapers();
    res.json(papers);
  });

  app.get(api.papers.get.path, async (req, res) => {
    const paper = await storage.getPaper(Number(req.params.id));
    if (!paper) return res.status(404).json({ message: "Paper not found" });
    res.json(paper);
  });

  // Export Route
  app.get(api.papers.export.path, async (req, res) => {
    try {
      const paperId = Number(req.params.id);
      const format = req.params.format;
      
      const paper = await storage.getPaper(paperId);
      if (!paper) return res.status(404).json({ message: "Paper not found" });

      if (format === 'pdf') {
        const buffer = await generatePDF(paper, paper.questions);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.title}.pdf"`);
        res.send(buffer);
      } else if (format === 'docx') {
        const buffer = await generateWord(paper, paper.questions);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.title}.docx"`);
        res.send(buffer);
      } else {
        res.status(400).json({ message: "Invalid format. Use 'pdf' or 'docx'" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Export failed" });
    }
  });

  app.get(api.analytics.dashboard.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Seed Data Endpoint
  app.post("/api/seed", async (req, res) => {
    try {
      // Check if data exists
      const existing = await storage.getQuestions();
      if (existing.length > 0) return res.json({ message: "Data already seeded" });

      // Create Admin User
      await storage.createUser({
        username: "admin",
        email: "admin@school.com",
        password: "admin", // Plaintext for demo
        role: "Admin"
      });

      // Seed Questions
      const subjects = ["Mathematics", "Physics", "Chemistry"];
      const topics = ["Algebra", "Calculus", "Mechanics", "Optics", "Organic", "Inorganic"];
      const difficulties: any[] = ["Easy", "Medium", "Hard"];
      const types: any[] = ["MCQ", "Short", "Long"];

      const questions: InsertQuestion[] = [];

      for (let i = 0; i < 50; i++) {
        const subject = subjects[i % subjects.length];
        const topic = topics[i % topics.length];
        const difficulty = difficulties[i % 3];
        const type = types[i % 3];
        const marks = type === "MCQ" ? 1 : (type === "Short" ? 5 : 10);

        questions.push({
          subject,
          topic,
          difficulty,
          type,
          marks,
          content: `Sample ${difficulty} ${type} question #${i + 1} for ${subject} - ${topic}?`,
          options: type === "MCQ" ? { a: "Option A", b: "Option B", c: "Option C", d: "Option D" } : null,
          correctAnswer: type === "MCQ" ? "a" : "Answer key...",
          createdBy: 1,
          bloomsTaxonomy: "Analyze" // Added default Bloom's
        });
      }

      const count = await storage.createQuestionsBulk(questions);
      res.json({ message: `Seeded ${count} questions` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Seeding failed" });
    }
  });

  return httpServer;
}
