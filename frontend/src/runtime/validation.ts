import { z } from 'zod';

export const bookingSchema = z.object({
  playerId: z.string().uuid("Invalid player ID format"),
  discountCode: z.string()
    .trim()
    .min(1, "Discount code cannot be empty")
    .max(50, "Discount code too long")
    .regex(/^[A-Z0-9-]+$/, "Discount code must contain only uppercase letters, numbers, and hyphens")
});

export const playerSchema = z.object({
  username: z.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores"),
  karma: z.number().int().min(0, "Karma cannot be negative"),
  coins: z.number().int().min(0, "Coins cannot be negative"),
  alignment: z.enum(['Good', 'Neutral', 'Chaotic'])
});

export const gameStateSchema = z.object({
  tick: z.number().int().min(0),
  player: playerSchema,
  herdHealth: z.number().int().min(0).max(100),
  flags: z.record(z.boolean()).optional(),
  activitiesCompleted: z.number().int().min(0).optional(),
  completedActivities: z.array(z.string()).optional(),
  discountPercent: z.number().min(0).max(100).optional()
});
