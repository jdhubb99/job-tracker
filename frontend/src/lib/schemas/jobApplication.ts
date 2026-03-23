import { z } from 'zod/v4';
import { JOB_APPLICATION_STATUSES } from '@/lib/types';

export const jobApplicationSchema = z
  .object({
    company: z
      .string()
      .min(1, 'Company name is required')
      .max(255, 'Company name must be 255 characters or less'),
    jobTitle: z
      .string()
      .min(1, 'Job title is required')
      .max(255, 'Job title must be 255 characters or less'),
    dateApplied: z.date({ error: 'Application date is required' }),
    status: z.enum(JOB_APPLICATION_STATUSES),
    jobPostingUrl: z
      .string()
      .max(2048, 'URL must be 2048 characters or less')
      .refine((val) => val === '' || z.string().url().safeParse(val).success, 'Enter a valid URL'),
    location: z.string().max(255, 'Location must be 255 characters or less'),
    salaryMin: z.number().nonnegative('Salary must be a positive number').nullable(),
    salaryMax: z.number().nonnegative('Salary must be a positive number').nullable(),
    description: z.string(),
  })
  .refine(
    (data) => {
      if (data.salaryMin != null && data.salaryMax != null) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    { message: 'Minimum salary must not exceed maximum salary', path: ['salaryMin'] }
  );

export type JobApplicationFormValues = z.infer<typeof jobApplicationSchema>;
