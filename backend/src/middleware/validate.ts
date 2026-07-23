import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodTypeAny } from 'zod';

export function validate(schema: ZodTypeAny) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.errors.map((e) => ({
            field: e.path.join('.').replace(/^body\./, ''),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid request data' });
    }
  };
}

export const ticketStatusSchema = z.enum(['Todo', 'In Progress', 'Review', 'Done']);
export const ticketPrioritySchema = z.enum(['Low', 'Medium', 'High', 'Critical']);

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: ticketStatusSchema.optional().default('Todo'),
    priority: ticketPrioritySchema.optional().default('Low'),
  }),
});

export const updateTicketSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: ticketStatusSchema.optional(),
    priority: ticketPrioritySchema.optional(),
  }),
});

export const assignUserSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'userId is required'),
  }),
});

export const commentSchema = z.object({
  body: z.object({
    comment: z.string().min(1, 'Comment text is required'),
  }),
});
