import type { Express } from "express";
import { type Server } from "http";
import { api } from "@shared/routes";
import { requireAuth } from "./middleware/auth";

// Controllers
import * as authController from "./controllers/authController";
import * as subjectController from "./controllers/subjectController";
import * as paperController from "./controllers/paperController";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === AUTHENTICATION ===
  app.post(api.auth.register.path, authController.register);
  app.post(api.auth.login.path, authController.login);
  app.get(api.auth.me.path, requireAuth, authController.me);

  // === SUBJECTS & UNITS ===
  app.get(api.subjects.list.path, requireAuth, subjectController.getSubjects);
  app.post(api.subjects.create.path, requireAuth, subjectController.createSubject);
  app.patch(api.subjects.update.path, requireAuth, subjectController.updateSubject);
  app.delete(api.subjects.delete.path, requireAuth, subjectController.deleteSubject);

  app.get(api.units.list.path, requireAuth, subjectController.getUnits);
  app.post(api.units.create.path, requireAuth, subjectController.createUnit);
  app.patch(api.units.update.path, requireAuth, subjectController.updateUnit);
  app.delete(api.units.delete.path, requireAuth, subjectController.deleteUnit);

  // === PAPER GENERATION ===
  app.post(api.papers.generate.path, requireAuth, paperController.generatePaper);
  app.get(api.papers.list.path, requireAuth, paperController.getPapers);
  app.get(api.papers.get.path, requireAuth, paperController.getPaper);
  app.patch(api.papers.update.path, requireAuth, paperController.updatePaper);
  app.get(api.papers.export.path, requireAuth, paperController.exportPaperPDF);

  // === ANALYTICS ===
  app.get(api.analytics.dashboard.path, requireAuth, subjectController.getDashboardStats);

  return httpServer;
}
