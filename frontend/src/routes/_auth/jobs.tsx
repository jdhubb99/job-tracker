import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { JobFilters } from '@/components/jobs/JobFilters';
import { JobsTable } from '@/components/jobs/JobsTable';
import { JobCard } from '@/components/jobs/JobCard';
import { JobsEmptyState } from '@/components/jobs/JobsEmptyState';
import { JobsLoadingSkeleton } from '@/components/jobs/JobsLoadingSkeleton';
import { DeleteJobDialog } from '@/components/jobs/DeleteJobDialog';
import { useJobApplications, useDeleteJobApplication } from '@/hooks/useJobApplications';
import { JOB_APPLICATION_STATUSES } from '@/lib/types';
import type { JobApplicationResponse, JobApplicationStatus } from '@/lib/types';

interface JobsSearch {
  status?: JobApplicationStatus;
}

export const Route = createFileRoute('/_auth/jobs')({
  component: Jobs,
  validateSearch: (search: Record<string, unknown>): JobsSearch => ({
    status: JOB_APPLICATION_STATUSES.includes(search.status as JobApplicationStatus)
      ? (search.status as JobApplicationStatus)
      : undefined,
  }),
});

function Jobs() {
  const { status } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: jobs, isLoading, isError } = useJobApplications(status);
  const deleteMutation = useDeleteJobApplication();

  const [deleteTarget, setDeleteTarget] = useState<JobApplicationResponse | null>(null);

  const handleStatusChange = (newStatus: JobApplicationStatus | undefined) => {
    navigate({ search: newStatus ? { status: newStatus } : {} });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-6" aria-labelledby="jobs-heading">
      <div className="flex items-center justify-between">
        <h1 id="jobs-heading" className="text-3xl font-bold">
          Jobs
        </h1>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add Job
        </Button>
      </div>

      <JobFilters status={status} onStatusChange={handleStatusChange} />

      {isLoading && <JobsLoadingSkeleton />}

      {isError && (
        <p className="text-destructive text-sm">Failed to load applications. Please try again.</p>
      )}

      {jobs && jobs.length === 0 && <JobsEmptyState hasFilters={status != null} />}

      {jobs && jobs.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <JobsTable jobs={jobs} onDelete={setDeleteTarget} />
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onDelete={setDeleteTarget} />
            ))}
          </div>
        </>
      )}

      <DeleteJobDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        companyName={deleteTarget?.company ?? ''}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
