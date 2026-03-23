import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/jobs/StatusBadge';
import type { JobApplicationResponse } from '@/lib/types';

interface JobCardProps {
  job: JobApplicationResponse;
  onDelete: (job: JobApplicationResponse) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function JobCard({ job, onDelete }: JobCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{job.company}</CardTitle>
          <p className="text-muted-foreground text-sm">{job.jobTitle}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => onDelete(job)}
          aria-label={`Delete ${job.company} application`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <StatusBadge status={job.status} />
          <span className="text-muted-foreground">{formatDate(job.dateApplied)}</span>
        </div>
        {job.location && <p className="text-muted-foreground">{job.location}</p>}
      </CardContent>
    </Card>
  );
}
