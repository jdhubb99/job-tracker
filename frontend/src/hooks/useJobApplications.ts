import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobApplicationsApi } from '@/lib/api';
import type { JobApplicationResponse, JobApplicationStatus } from '@/lib/types';

export const jobApplicationKeys = {
  all: ['job-applications'] as const,
  lists: () => [...jobApplicationKeys.all, 'list'] as const,
  list: (status?: JobApplicationStatus) => [...jobApplicationKeys.lists(), { status }] as const,
};

export function useJobApplications(status?: JobApplicationStatus) {
  return useQuery({
    queryKey: jobApplicationKeys.list(status),
    queryFn: () => jobApplicationsApi.getAll(status),
  });
}

export function useDeleteJobApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobApplicationsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: jobApplicationKeys.lists() });

      const queries = queryClient.getQueriesData<JobApplicationResponse[]>({
        queryKey: jobApplicationKeys.lists(),
      });

      const snapshots = queries.map(([key, data]) => [key, data] as const);

      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData(
            key,
            data.filter((app) => app.id !== id)
          );
        }
      }

      return { snapshots };
    },
    onError: (_err, _id, context) => {
      if (context?.snapshots) {
        for (const [key, data] of context.snapshots) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: jobApplicationKeys.lists() });
    },
  });
}
