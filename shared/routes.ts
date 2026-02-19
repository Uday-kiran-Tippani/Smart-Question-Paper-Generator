
import { z } from 'zod';
import { insertUserSchema, insertQuestionSchema, insertPaperSchema, questions, generatedPapers } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.object({ id: z.number(), username: z.string(), role: z.string() }), // Don't return password
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ user: z.any(), token: z.string() }), // Simplified for now
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  questions: {
    list: {
      method: 'GET' as const,
      path: '/api/questions' as const,
      input: z.object({
        subject: z.string().optional(),
        topic: z.string().optional(),
        difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
        type: z.enum(['MCQ', 'Short', 'Long']).optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof questions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/questions' as const,
      input: insertQuestionSchema,
      responses: {
        201: z.custom<typeof questions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    bulkCreate: {
      method: 'POST' as const,
      path: '/api/questions/bulk' as const,
      input: z.array(insertQuestionSchema),
      responses: {
        201: z.object({ count: z.number() }),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/questions/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  papers: {
    generate: {
      method: 'POST' as const,
      path: '/api/papers/generate' as const,
      input: z.object({
        title: z.string(),
        subject: z.string(),
        totalMarks: z.number().min(10).max(500),
        difficultyDistribution: z.object({
          Easy: z.number().min(0).max(100),
          Medium: z.number().min(0).max(100),
          Hard: z.number().min(0).max(100),
        }),
        topics: z.array(z.string()).optional(),
      }),
      responses: {
        201: z.custom<typeof generatedPapers.$inferSelect & { questions: (typeof questions.$inferSelect)[] }>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/papers' as const,
      responses: {
        200: z.array(z.custom<typeof generatedPapers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/papers/:id' as const,
      responses: {
        200: z.custom<typeof generatedPapers.$inferSelect & { questions: (typeof questions.$inferSelect)[] }>(),
        404: errorSchemas.notFound,
      },
    },
    export: {
      method: 'GET' as const,
      path: '/api/papers/:id/export/:format' as const, // format: pdf or docx
      responses: {
        200: z.any(), // File stream
        404: errorSchemas.notFound,
      },
    },
  },
  analytics: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/analytics/dashboard' as const,
      responses: {
        200: z.object({
          totalQuestions: z.number(),
          questionsBySubject: z.record(z.number()),
          questionsByDifficulty: z.record(z.number()),
          totalPapers: z.number(),
          recentPapers: z.array(z.custom<typeof generatedPapers.$inferSelect>()),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
