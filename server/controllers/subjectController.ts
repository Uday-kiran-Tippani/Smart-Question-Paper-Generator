import { Request, Response } from "express";
import { storage } from "../storage";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import { insertSubjectSchema, insertUnitSchema, updateSubjectSchema, updateUnitSchema } from "@shared/schema";

export async function getSubjects(req: Request, res: Response) {
    try {
        const subjects = await storage.getSubjects();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch subjects" });
    }
}

export async function createSubject(req: AuthRequest, res: Response) {
    try {
        const input = insertSubjectSchema.parse(req.body);
        const userId = req.user!.id; // Authenticated by middleware
        const subject = await storage.createSubject({ ...input, createdBy: userId });
        res.status(201).json(subject);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Failed to create subject" });
        }
    }
}

export async function updateSubject(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid subject ID" });
        const input = updateSubjectSchema.parse(req.body);
        const subject = await storage.updateSubject(id, input);
        res.json(subject);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Failed to update subject" });
        }
    }
}

export async function deleteSubject(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid subject ID" });
        await storage.deleteSubject(id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ message: "Failed to delete subject" });
    }
}

export async function getUnits(req: Request, res: Response) {
    try {
        const subjectId = Number(req.params.subjectId);
        if (isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject ID" });
        const units = await storage.getUnitsBySubject(subjectId);
        res.json(units);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch units" });
    }
}

export async function createUnit(req: AuthRequest, res: Response) {
    try {
        const subjectId = Number(req.params.subjectId);
        if (isNaN(subjectId)) return res.status(400).json({ message: "Invalid subject ID" });
        const input = insertUnitSchema.parse({ ...req.body, subjectId });
        const unit = await storage.createUnit(input);
        res.status(201).json(unit);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Failed to create unit" });
        }
    }
}

export async function updateUnit(req: Request, res: Response) {
    try {
        const unitId = Number(req.params.unitId);
        if (isNaN(unitId)) return res.status(400).json({ message: "Invalid unit ID" });
        const input = updateUnitSchema.parse(req.body);
        const unit = await storage.updateUnit(unitId, input);
        res.json(unit);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Failed to update unit" });
        }
    }
}

export async function deleteUnit(req: Request, res: Response) {
    try {
        const unitId = Number(req.params.unitId);
        if (isNaN(unitId)) return res.status(400).json({ message: "Invalid unit ID" });
        await storage.deleteUnit(unitId);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ message: "Failed to delete unit" });
    }
}

export async function getDashboardStats(req: Request, res: Response) {
    try {
        const stats = await storage.getDashboardStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
}
