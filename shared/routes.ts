import { z } from 'zod';
import { insertUserSchema, insertSubjectSchema, insertUnitSchema, insertPaperSchema } from './schema';

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
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string(), passwordHash: z.string() }),
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
    },
  },
  subjects: {
    list: {
      method: 'GET' as const,
      path: '/api/subjects' as const,
      responses: {
        200: z.array(z.any()), // Subject schema
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/subjects' as const,
      input: insertSubjectSchema,
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/subjects/:id' as const,
      input: z.object({ name: z.string() }),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/subjects/:id' as const,
    },
  },
  units: {
    list: {
      method: 'GET' as const,
      path: '/api/subjects/:subjectId/units' as const,
      responses: {
        200: z.array(z.any()), // Unit schema
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/subjects/:subjectId/units' as const,
      input: insertUnitSchema,
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/subjects/:subjectId/units/:unitId' as const,
      input: insertUnitSchema.partial(),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/subjects/:subjectId/units/:unitId' as const,
    },
  },
  papers: {
    generate: {
      method: 'POST' as const,
      path: '/api/papers/generate' as const,
      input: z.object({
        title: z.string(),
        subjectId: z.number(),
        totalMarks: z.number().min(10).max(500),
        durationMinutes: z.number().min(10).max(300),
        examType: z.enum(['MID-1&2', 'MID-3&4', 'SEMESTER', 'OTHERS']),
        difficultyDistribution: z.object({
          Easy: z.number().min(0).max(100),
          Medium: z.number().min(0).max(100),
          Hard: z.number().min(0).max(100),
        }),
        marksDistribution: z.record(z.string(), z.number()),
      }),
      responses: {
        201: z.any(), // GeneratedPaper schema
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/papers' as const,
      responses: {
        200: z.array(z.any()), // GeneratedPaper schema
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/papers/:id' as const,
      responses: {
        200: z.any(), // GeneratedPaper schema
      }
    },
    export: {
      method: 'GET' as const,
      path: '/api/papers/:id/export/:format' as const,
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/papers/:id' as const,
      input: z.object({ generatedContent: z.string() }),
      responses: {
        200: z.any(), // GeneratedPaper schema
      }
    },
  },
  analytics: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/analytics/dashboard' as const,
      responses: {
        200: z.any(),
      }
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
