import { Briefcase } from 'lucide-react';

export function JobsEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <Briefcase className="text-muted-foreground h-8 w-8" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold">No matching applications</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Try adjusting your filters to see more results.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold">No applications yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Start tracking your job search by adding your first application.
          </p>
        </>
      )}
    </div>
  );
}
