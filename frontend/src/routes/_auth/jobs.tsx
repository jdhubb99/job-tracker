import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/jobs')({
  component: Jobs,
});

function Jobs() {
  return (
    <div className="space-y-4" aria-labelledby="jobs-heading">
      <h1 id="jobs-heading" className="text-3xl font-bold">
        Jobs
      </h1>
      <p className="text-muted-foreground">Job tracking is coming soon.</p>
    </div>
  );
}
