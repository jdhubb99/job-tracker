export const JOB_STATUSES = {
  APPLIED: {
    label: 'Applied',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  INTERVIEWING: {
    label: 'Interviewing',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  OFFER: {
    label: 'Offer',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  ACCEPTED: {
    label: 'Accepted',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
} as const;

export type JobStatus = keyof typeof JOB_STATUSES;
