import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

export interface AuthRequest extends Request {
    user?: User;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        storage.getUser(decoded.id).then(user => {
            if (!user) return res.status(401).json({ message: "User not found" });
            req.user = user;
            next();
        }).catch(err => {
            res.status(500).json({ message: "Internal server error" });
        });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
}
