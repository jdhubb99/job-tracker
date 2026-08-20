import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { JobApplicationForm } from '@/components/jobs/JobApplicationForm';
import { useCreateJobApplication, useUpdateJobApplication } from '@/hooks/useJobApplications';
import { ApiError } from '@/lib/api';
import type { JobApplicationFormValues } from '@/lib/schemas/jobApplication';
import type { JobApplicationResponse } from '@/lib/types';

interface JobApplicationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobApplication?: JobApplicationResponse | null;
}

function toFormDefaults(job: JobApplicationResponse): Partial<JobApplicationFormValues> {
  return {
    company: job.company,
    jobTitle: job.jobTitle,
    status: job.status,
    dateApplied: new Date(job.dateApplied + 'T00:00:00'),
    jobPostingUrl: job.jobPostingUrl ?? '',
    location: job.location ?? '',
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    description: job.description ?? '',
  };
}

export function JobApplicationDrawer({
  open,
  onOpenChange,
  jobApplication,
}: JobApplicationDrawerProps) {
  const isEdit = !!jobApplication;
  const createMutation = useCreateJobApplication();
  const updateMutation = useUpdateJobApplication();

  const handleSubmit = (data: JobApplicationFormValues) => {
    const payload = {
      ...data,
      dateApplied: format(data.dateApplied, 'yyyy-MM-dd'),
      jobPostingUrl: data.jobPostingUrl || null,
      location: data.location || null,
      description: data.description || null,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: jobApplication.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Application updated');
            onOpenChange(false);
          },
          onError: (error) => {
            if (error instanceof ApiError) {
              toast.error(error.message);
            } else {
              toast.error('Failed to update application');
            }
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Application created');
          onOpenChange(false);
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            toast.error(error.message);
          } else {
            toast.error('Failed to create application');
          }
        },
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle>{isEdit ? 'Edit Application' : 'New Application'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? `Update your application at ${jobApplication.company}`
              : 'Track a new job application'}
          </SheetDescription>
        </SheetHeader>
        <JobApplicationForm
          key={jobApplication?.id ?? 'create'}
          defaultValues={jobApplication ? toFormDefaults(jobApplication) : undefined}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isPending={isEdit ? updateMutation.isPending : createMutation.isPending}
          submitLabel={isEdit ? 'Save Changes' : 'Create Application'}
        />
      </SheetContent>
    </Sheet>
  );
}
