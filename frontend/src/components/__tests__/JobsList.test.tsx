import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JobApplicationResponse } from '@/lib/types';

const mockJobs: JobApplicationResponse[] = [
  {
    id: '1',
    userId: 'u1',
    company: 'Acme Corp',
    jobTitle: 'Software Engineer',
    status: 'APPLIED',
    dateApplied: '2026-03-01',
    jobPostingUrl: null,
    location: 'Remote',
    salaryMin: 100000,
    salaryMax: 150000,
    description: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'u1',
    company: 'Beta Inc',
    jobTitle: 'Frontend Developer',
    status: 'INTERVIEWING',
    dateApplied: '2026-03-10',
    jobPostingUrl: null,
    location: null,
    salaryMin: null,
    salaryMax: null,
    description: null,
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
  },
];

// Import components directly (not the route)
import { JobsTable } from '../jobs/JobsTable';
import { JobCard } from '../jobs/JobCard';
import { JobsEmptyState } from '../jobs/JobsEmptyState';
import { StatusBadge } from '../jobs/StatusBadge';
import { DeleteJobDialog } from '../jobs/DeleteJobDialog';

describe('StatusBadge', () => {
  it('renders the correct label for each status', () => {
    const { rerender } = render(<StatusBadge status="APPLIED" />);
    expect(screen.getByText('Applied')).toBeInTheDocument();

    rerender(<StatusBadge status="INTERVIEWING" />);
    expect(screen.getByText('Interviewing')).toBeInTheDocument();

    rerender(<StatusBadge status="OFFER" />);
    expect(screen.getByText('Offer')).toBeInTheDocument();

    rerender(<StatusBadge status="REJECTED" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();

    rerender(<StatusBadge status="ACCEPTED" />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();

    rerender(<StatusBadge status="WITHDRAWN" />);
    expect(screen.getByText('Withdrawn')).toBeInTheDocument();
  });
});

describe('JobsEmptyState', () => {
  it('shows "no applications yet" when no filters active', () => {
    render(<JobsEmptyState hasFilters={false} />);
    expect(screen.getByText('No applications yet')).toBeInTheDocument();
  });

  it('shows "no matching applications" when filters are active', () => {
    render(<JobsEmptyState hasFilters={true} />);
    expect(screen.getByText('No matching applications')).toBeInTheDocument();
  });
});

describe('JobsTable', () => {
  const onDelete = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders all job applications', () => {
    render(<JobsTable jobs={mockJobs} onDelete={onDelete} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<JobsTable jobs={mockJobs} onDelete={onDelete} />);
    expect(screen.getAllByText('Applied').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Interviewing').length).toBeGreaterThanOrEqual(1);
  });

  it('renders location or dash for missing location', () => {
    render(<JobsTable jobs={mockJobs} onDelete={onDelete} />);
    expect(screen.getByText('Remote')).toBeInTheDocument();
    // Second job has null location, renders as "-"
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<JobsTable jobs={mockJobs} onDelete={onDelete} />);
    // Default sort is dateApplied desc, so Beta Inc (Mar 10) is first
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(mockJobs[1]);
  });

  it('supports sorting by clicking column headers', async () => {
    const user = userEvent.setup();
    render(<JobsTable jobs={mockJobs} onDelete={onDelete} />);
    const companySort = screen.getByRole('button', { name: /sort by company/i });
    await user.click(companySort);
    // After sorting asc by company, Acme should be first
    const rows = screen.getAllByRole('row');
    // First row is header, so data starts at index 1
    expect(within(rows[1]).getByText('Acme Corp')).toBeInTheDocument();
  });
});

describe('JobCard', () => {
  const onDelete = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders job details', () => {
    render(<JobCard job={mockJobs[0]} onDelete={onDelete} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<JobCard job={mockJobs[0]} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(mockJobs[0]);
  });
});

describe('DeleteJobDialog', () => {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows company name in confirmation message', () => {
    render(
      <DeleteJobDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        companyName="Acme Corp"
        isPending={false}
      />
    );
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
  });

  it('calls onConfirm when delete is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DeleteJobDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        companyName="Acme Corp"
        isPending={false}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('shows loading state when pending', () => {
    render(
      <DeleteJobDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        companyName="Acme Corp"
        isPending={true}
      />
    );
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
  });
});
