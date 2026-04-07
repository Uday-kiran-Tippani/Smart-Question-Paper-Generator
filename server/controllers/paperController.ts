import { Request, Response } from "express";
import { storage } from "../storage";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { generateQuestionPaper } from "../services/questionGenerator";
import { generatePDF } from "../export";
import { insertPaperSchema } from "@shared/schema";

export async function generatePaper(req: AuthRequest, res: Response) {
    try {
        // We expect body to match GeneratePaperRequest
        const input = req.body;

        // Call our ML service to build the prompt and talk to OpenAI
        const generatedData = await generateQuestionPaper(input);

        // Ensure it respects DB schema. generatedData should have raw text and parsed questions
        const paperToInsert = {
            subjectId: input.subjectId,
            title: input.title,
            durationMinutes: input.durationMinutes,
            totalMarks: input.totalMarks,
            examType: input.examType,
            difficultyDistribution: input.difficultyDistribution,
            marksDistribution: input.marksDistribution,
            generatedContent: generatedData.rawText,
            createdBy: req.user!.id
        };

        // Save Paper
        const paper = await storage.createPaper(paperToInsert);

        // Save individual Questions for analytics
        const questionsToInsert = generatedData.parsedQuestions.map((q: any) => ({
            paperId: paper.id,
            questionText: q.questionText,
            marks: q.marks,
            difficulty: q.difficulty
        }));
        await storage.saveGeneratedQuestions(questionsToInsert);

        // Return paper layout data
        res.status(201).json({ ...paper, questions: questionsToInsert });

    } catch (err) {
        console.error(err);
        if (err instanceof z.ZodError) {
            res.status(400).json({ message: err.errors[0].message });
        } else if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(500).json({ message: "Failed to generate paper" });
        }
    }
}

export async function getPapers(req: Request, res: Response) {
    try {
        const papers = await storage.getPapers();
        res.json(papers);
    } catch (err) {
        res.status(500).json({ message: "Failed to get papers" });
    }
}

export async function updatePaper(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

        const { generatedContent } = req.body;
        if (typeof generatedContent !== 'string') {
            return res.status(400).json({ message: "generatedContent is required and must be a string" });
        }

        const updated = await storage.updatePaper(id, generatedContent);
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update paper" });
    }
}

export async function getPaper(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

        const paper = await storage.getPaper(id);
        if (!paper) return res.status(404).json({ message: "Paper not found" });

        res.json(paper);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch paper" });
    }
}

export async function exportPaperPDF(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

        const paper = await storage.getPaper(id);
        if (!paper) return res.status(404).json({ message: "Paper not found" });

        const subject = await storage.getSubject(paper.subjectId);
        if (!subject) return res.status(404).json({ message: "Subject not found" });

        const buffer = await generatePDF(paper, paper.questions, subject.name);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.title}.pdf"`);
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Export failed" });
    }
}
