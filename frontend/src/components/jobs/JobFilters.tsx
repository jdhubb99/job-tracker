import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { JobApplicationStatus } from '@/lib/types';

const ALL_STATUSES: { value: JobApplicationStatus; label: string }[] = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'INTERVIEWING', label: 'Interviewing' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

interface JobFiltersProps {
  status: JobApplicationStatus | undefined;
  onStatusChange: (status: JobApplicationStatus | undefined) => void;
}

export function JobFilters({ status, onStatusChange }: JobFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Select
        value={status ?? 'all'}
        onValueChange={(value) =>
          onStatusChange(value === 'all' ? undefined : (value as JobApplicationStatus))
        }
      >
        <SelectTrigger className="w-[160px]" aria-label="Filter by status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {ALL_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
