import { useState, useMemo } from 'react';
import { ArrowUpDown, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/jobs/StatusBadge';
import type { JobApplicationResponse } from '@/lib/types';

type SortField = 'company' | 'jobTitle' | 'dateApplied';
type SortDirection = 'asc' | 'desc';

interface JobsTableProps {
  jobs: JobApplicationResponse[];
  onDelete: (job: JobApplicationResponse) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatSalary(min: number | null, max: number | null): string {
  if (min == null && max == null) return '-';
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function SortableHeader({
  field,
  children,
  onSort,
}: {
  field: SortField;
  children: React.ReactNode;
  onSort: (field: SortField) => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        className="flex items-center gap-1 hover:text-foreground"
        onClick={() => onSort(field)}
        aria-label={`Sort by ${field}`}
      >
        {children}
        <ArrowUpDown className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
}

export function JobsTable({ jobs, onDelete }: JobsTableProps) {
  const [sortField, setSortField] = useState<SortField>('dateApplied');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    return [...jobs].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [jobs, sortField, sortDir]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="company" onSort={toggleSort}>
              Company
            </SortableHeader>
            <SortableHeader field="jobTitle" onSort={toggleSort}>
              Role
            </SortableHeader>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <SortableHeader field="dateApplied" onSort={toggleSort}>
              Applied
            </SortableHeader>
            <TableHead>Salary</TableHead>
            <TableHead className="w-[60px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.company}</TableCell>
              <TableCell>{job.jobTitle}</TableCell>
              <TableCell className="text-muted-foreground">{job.location ?? '-'}</TableCell>
              <TableCell>
                <StatusBadge status={job.status} />
              </TableCell>
              <TableCell>{formatDate(job.dateApplied)}</TableCell>
              <TableCell>{formatSalary(job.salaryMin, job.salaryMax)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(job)}
                  aria-label={`Delete ${job.company} application`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
