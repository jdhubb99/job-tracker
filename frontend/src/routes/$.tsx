import { createFileRoute } from '@tanstack/react-router';
import { NotFound } from '@/components/errors/NotFound';

export const Route = createFileRoute('/$')({
  component: NotFound,
});
