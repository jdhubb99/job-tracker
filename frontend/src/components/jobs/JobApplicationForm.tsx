import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { JOB_STATUSES } from '@/lib/constants';
import { JOB_APPLICATION_STATUSES } from '@/lib/types';
import { jobApplicationSchema, type JobApplicationFormValues } from '@/lib/schemas/jobApplication';
import { cn } from '@/lib/utils';

interface JobApplicationFormProps {
  defaultValues?: Partial<JobApplicationFormValues>;
  onSubmit: (data: JobApplicationFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}

export function JobApplicationForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: JobApplicationFormProps) {
  const id = useId();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<JobApplicationFormValues>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      company: '',
      jobTitle: '',
      dateApplied: new Date(),
      status: 'APPLIED',
      jobPostingUrl: '',
      location: '',
      salaryMin: null,
      salaryMax: null,
      description: '',
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-1 flex-col gap-5 overflow-y-auto p-4"
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-company`}>
          Company <span aria-hidden="true">*</span>
        </Label>
        <Input
          {...register('company')}
          id={`${id}-company`}
          aria-required="true"
          aria-invalid={!!errors.company || undefined}
          aria-describedby={errors.company ? `${id}-company-error` : undefined}
        />
        {errors.company && (
          <p id={`${id}-company-error`} className="text-destructive text-sm">
            {errors.company.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-jobTitle`}>
          Job Title <span aria-hidden="true">*</span>
        </Label>
        <Input
          {...register('jobTitle')}
          id={`${id}-jobTitle`}
          aria-required="true"
          aria-invalid={!!errors.jobTitle || undefined}
          aria-describedby={errors.jobTitle ? `${id}-jobTitle-error` : undefined}
        />
        {errors.jobTitle && (
          <p id={`${id}-jobTitle-error`} className="text-destructive text-sm">
            {errors.jobTitle.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-status`}>Status</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={`${id}-status`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_APPLICATION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {JOB_STATUSES[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-dateApplied`}>
          Date Applied <span aria-hidden="true">*</span>
        </Label>
        <Controller
          name="dateApplied"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id={`${id}-dateApplied`}
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                  aria-invalid={!!errors.dateApplied || undefined}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => date && field.onChange(date)}
                  defaultMonth={field.value}
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.dateApplied && (
          <p className="text-destructive text-sm">{errors.dateApplied.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-location`}>Location</Label>
        <Input
          {...register('location')}
          id={`${id}-location`}
          placeholder="e.g. Remote, New York, NY"
        />
        {errors.location && <p className="text-destructive text-sm">{errors.location.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-jobPostingUrl`}>Job Posting URL</Label>
        <Input
          {...register('jobPostingUrl')}
          id={`${id}-jobPostingUrl`}
          type="url"
          placeholder="https://..."
        />
        {errors.jobPostingUrl && (
          <p className="text-destructive text-sm">{errors.jobPostingUrl.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-salaryMin`}>Salary Min</Label>
          <Controller
            name="salaryMin"
            control={control}
            render={({ field }) => (
              <Input
                id={`${id}-salaryMin`}
                type="number"
                min={0}
                placeholder="e.g. 80000"
                value={field.value ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === '' ? null : Number(val));
                }}
              />
            )}
          />
          {errors.salaryMin && (
            <p className="text-destructive text-sm">{errors.salaryMin.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-salaryMax`}>Salary Max</Label>
          <Controller
            name="salaryMax"
            control={control}
            render={({ field }) => (
              <Input
                id={`${id}-salaryMax`}
                type="number"
                min={0}
                placeholder="e.g. 120000"
                value={field.value ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === '' ? null : Number(val));
                }}
              />
            )}
          />
          {errors.salaryMax && (
            <p className="text-destructive text-sm">{errors.salaryMax.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-description`}>Notes</Label>
        <Textarea
          {...register('description')}
          id={`${id}-description`}
          rows={3}
          placeholder="Any additional notes..."
        />
      </div>

      <div className="mt-auto flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending} aria-busy={isPending}>
          {isPending ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
