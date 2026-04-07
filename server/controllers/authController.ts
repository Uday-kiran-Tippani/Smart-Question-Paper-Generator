import { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { hashPassword, verifyPassword } from "../utils/crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

export async function register(req: Request, res: Response) {
    try {
        const input = api.auth.register.input.parse(req.body);
        const existing = await storage.getUserByEmail(input.email);
        if (existing) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password before saving
        const passwordHash = hashPassword(input.passwordHash); // input.passwordHash actually contains plain password based on schema change logic, but let's just hash whatever is sent
        const userToCreate = { ...input, passwordHash };

        const user = await storage.createUser(userToCreate);
        const { passwordHash: _, ...safeUser } = user;
        res.status(201).json(safeUser);
    } catch (err) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ message: err.errors[0].message });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, passwordHash: plainPassword } = req.body;
        const user = await storage.getUserByEmail(email);

        if (!user || !verifyPassword(plainPassword, user.passwordHash)) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed" });
    }
}

export async function me(req: AuthRequest, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { passwordHash, ...safeUser } = req.user;
    res.json(safeUser);
}
