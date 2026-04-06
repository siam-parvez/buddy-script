import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    repeatPassword: z.string(),
    agreeToTerms: z.boolean().refine((value) => value, {
      message: 'Please agree to terms and conditions',
    }),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.repeatPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['repeatPassword'],
      })
    }
  })

export const createPostSchema = z.object({
  content: z.string().trim().max(2000, 'Post content must be 2000 characters or fewer'),
  visibility: z.enum(['public', 'private']),
})

