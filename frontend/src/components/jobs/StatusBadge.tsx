import { Badge } from '@/components/ui/badge';
import type { JobApplicationStatus } from '@/lib/types';

const statusConfig: Record<JobApplicationStatus, { label: string; className: string }> = {
  APPLIED: {
    label: 'Applied',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  INTERVIEWING: {
    label: 'Interviewing',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  OFFER: {
    label: 'Offer',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
};

export function StatusBadge({ status }: { status: JobApplicationStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
