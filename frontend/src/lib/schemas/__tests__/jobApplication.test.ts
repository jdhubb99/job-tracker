import { describe, it, expect } from 'vitest';
import { jobApplicationSchema, type JobApplicationFormValues } from '@/lib/schemas/jobApplication';
import { JOB_APPLICATION_STATUSES } from '@/lib/types';

function validInput(): JobApplicationFormValues {
  return {
    company: 'Acme Corp',
    jobTitle: 'Software Engineer',
    dateApplied: new Date('2026-03-10T00:00:00'),
    status: 'APPLIED',
    jobPostingUrl: '',
    location: '',
    salaryMin: null,
    salaryMax: null,
    description: '',
  };
}

/** Collect validation messages for a given top-level field. */
function messagesFor(input: unknown, field: string): string[] {
  const result = jobApplicationSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message);
}

describe('jobApplicationSchema', () => {
  it('accepts a valid, fully-populated input', () => {
    const result = jobApplicationSchema.safeParse({
      ...validInput(),
      jobPostingUrl: 'https://example.com/job',
      location: 'Remote',
      salaryMin: 80000,
      salaryMax: 120000,
      description: 'Referred by a friend',
    });
    expect(result.success).toBe(true);
  });

  it('accepts the minimal required fields with optional fields blank/null', () => {
    const result = jobApplicationSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  describe('company', () => {
    it('rejects an empty company', () => {
      expect(messagesFor({ ...validInput(), company: '' }, 'company')).toContain(
        'Company name is required'
      );
    });

    it('rejects a company over 255 characters', () => {
      expect(messagesFor({ ...validInput(), company: 'a'.repeat(256) }, 'company')).toContain(
        'Company name must be 255 characters or less'
      );
    });
  });

  describe('jobTitle', () => {
    it('rejects an empty job title', () => {
      expect(messagesFor({ ...validInput(), jobTitle: '' }, 'jobTitle')).toContain(
        'Job title is required'
      );
    });

    it('rejects a job title over 255 characters', () => {
      expect(messagesFor({ ...validInput(), jobTitle: 'a'.repeat(256) }, 'jobTitle')).toContain(
        'Job title must be 255 characters or less'
      );
    });
  });

  describe('dateApplied', () => {
    it('rejects a missing date', () => {
      const result = jobApplicationSchema.safeParse({ ...validInput(), dateApplied: undefined });
      expect(result.success).toBe(false);
      expect(messagesFor({ ...validInput(), dateApplied: undefined }, 'dateApplied')).toContain(
        'Application date is required'
      );
    });

    it('rejects a non-Date value', () => {
      const result = jobApplicationSchema.safeParse({ ...validInput(), dateApplied: '2026-03-10' });
      expect(result.success).toBe(false);
    });
  });

  describe('status', () => {
    it('accepts every known status', () => {
      for (const status of JOB_APPLICATION_STATUSES) {
        expect(jobApplicationSchema.safeParse({ ...validInput(), status }).success).toBe(true);
      }
    });

    it('rejects an unknown status', () => {
      const result = jobApplicationSchema.safeParse({ ...validInput(), status: 'GHOSTED' });
      expect(result.success).toBe(false);
    });
  });

  describe('jobPostingUrl', () => {
    it('allows an empty string', () => {
      expect(messagesFor({ ...validInput(), jobPostingUrl: '' }, 'jobPostingUrl')).toHaveLength(0);
    });

    it('allows a valid URL', () => {
      expect(
        messagesFor(
          { ...validInput(), jobPostingUrl: 'https://jobs.example.com/123' },
          'jobPostingUrl'
        )
      ).toHaveLength(0);
    });

    it('rejects a malformed URL', () => {
      expect(
        messagesFor({ ...validInput(), jobPostingUrl: 'not-a-url' }, 'jobPostingUrl')
      ).toContain('Enter a valid URL');
    });

    it('rejects a URL over 2048 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2048);
      expect(messagesFor({ ...validInput(), jobPostingUrl: longUrl }, 'jobPostingUrl')).toContain(
        'URL must be 2048 characters or less'
      );
    });
  });

  describe('location', () => {
    it('rejects a location over 255 characters', () => {
      expect(messagesFor({ ...validInput(), location: 'a'.repeat(256) }, 'location')).toContain(
        'Location must be 255 characters or less'
      );
    });
  });

  describe('salary', () => {
    it('allows null salaries', () => {
      const result = jobApplicationSchema.safeParse({
        ...validInput(),
        salaryMin: null,
        salaryMax: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects a decimal salary', () => {
      expect(messagesFor({ ...validInput(), salaryMin: 80000.5 }, 'salaryMin')).toContain(
        'Salary must be a whole number'
      );
    });

    it('rejects a negative salary', () => {
      expect(messagesFor({ ...validInput(), salaryMax: -1 }, 'salaryMax')).toContain(
        'Salary must not be negative'
      );
    });

    it('accepts zero', () => {
      const result = jobApplicationSchema.safeParse({
        ...validInput(),
        salaryMin: 0,
        salaryMax: 0,
      });
      expect(result.success).toBe(true);
    });

    it('rejects min greater than max', () => {
      expect(
        messagesFor({ ...validInput(), salaryMin: 120000, salaryMax: 80000 }, 'salaryMin')
      ).toContain('Minimum salary must not exceed maximum salary');
    });

    it('allows min equal to max', () => {
      const result = jobApplicationSchema.safeParse({
        ...validInput(),
        salaryMin: 100000,
        salaryMax: 100000,
      });
      expect(result.success).toBe(true);
    });

    it('skips the min/max comparison when one bound is null', () => {
      expect(
        jobApplicationSchema.safeParse({ ...validInput(), salaryMin: 120000, salaryMax: null })
          .success
      ).toBe(true);
      expect(
        jobApplicationSchema.safeParse({ ...validInput(), salaryMin: null, salaryMax: 80000 })
          .success
      ).toBe(true);
    });
  });
});
