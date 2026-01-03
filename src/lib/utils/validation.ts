
import { z } from 'zod'

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be less than 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    full_name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

export const profileSchema = z.object({
    display_name: z
        .string()
        .min(2, 'Display name must be at least 2 characters')
        .max(50, 'Display name must be less than 50 characters'),
    bio: z
        .string()
        .max(160, 'Bio must be less than 160 characters')
        .optional(),
    website: z
        .string()
        .url('Invalid URL')
        .optional()
        .or(z.literal('')),
    location: z
        .string()
        .max(50, 'Location must be less than 50 characters')
        .optional(),
    tags: z
        .array(z.string())
        .max(5, 'Maximum 5 tags allowed')
        .optional(),
})

export const socialAccountSchema = z.object({
    platform: z.string().min(1, 'Platform is required'),
    platform_username: z
        .string()
        .min(1, 'Username is required')
        .max(50, 'Username too long'),
    platform_url: z.string().url('Invalid URL'),
})
