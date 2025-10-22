import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobApplicationForm } from '@/components/features/jobs/JobApplicationForm';

// Mock fetch
global.fetch = jest.fn();

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
  }),
}));

describe('JobApplicationForm', () => {
  const mockProps = {
    jobId: 'job-1',
    jobTitle: 'Wedding Photographer Needed',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  it('renders form with job title', () => {
    render(<JobApplicationForm {...mockProps} />);

    expect(
      screen.getByText('Apply for: Wedding Photographer Needed')
    ).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<JobApplicationForm {...mockProps} />);

    expect(screen.getByLabelText(/Cover Letter/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Proposed Budget/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Available From/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Available Until/)).toBeInTheDocument();
    expect(screen.getByText(/Attachments/)).toBeInTheDocument();
  });

  it('shows character count for cover letter', () => {
    render(<JobApplicationForm {...mockProps} />);

    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    fireEvent.change(coverLetterInput, {
      target: { value: 'This is a test cover letter' },
    });

    expect(screen.getByText('27 / 2000 characters')).toBeInTheDocument();
  });

  it('shows minimum character requirement', () => {
    render(<JobApplicationForm {...mockProps} />);

    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    fireEvent.change(coverLetterInput, { target: { value: 'Short' } });

    expect(
      screen.getByText('(Minimum 50 characters required)')
    ).toBeInTheDocument();
  });

  it('disables submit button when cover letter is too short', () => {
    render(<JobApplicationForm {...mockProps} />);

    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    fireEvent.change(coverLetterInput, { target: { value: 'Short' } });

    const submitButton = screen.getByText('Submit Application');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when cover letter meets requirements', () => {
    render(<JobApplicationForm {...mockProps} />);

    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    fireEvent.change(coverLetterInput, {
      target: {
        value:
          'This is a longer cover letter that meets the minimum requirements for submission.',
      },
    });

    const submitButton = screen.getByText('Submit Application');
    expect(submitButton).not.toBeDisabled();
  });

  it('shows good length indicator when cover letter is appropriate', () => {
    render(<JobApplicationForm {...mockProps} />);

    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    fireEvent.change(coverLetterInput, {
      target: {
        value:
          'This is a longer cover letter that meets the minimum requirements for submission.',
      },
    });

    expect(screen.getByText('Good length')).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        application: { id: 'app-1', status: 'pending' },
      }),
    });

    render(<JobApplicationForm {...mockProps} />);

    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    fireEvent.change(coverLetterInput, {
      target: {
        value:
          'This is a longer cover letter that meets the minimum requirements for submission.',
      },
    });

    const submitButton = screen.getByText('Submit Application');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalledWith({
        id: 'app-1',
        status: 'pending',
      });
    });
  });

  it('handles form submission error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<JobApplicationForm {...mockProps} />);

    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    fireEvent.change(coverLetterInput, {
      target: {
        value:
          'This is a longer cover letter that meets the minimum requirements for submission.',
      },
    });

    const submitButton = screen.getByText('Submit Application');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    (fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  application: { id: 'app-1' },
                }),
              }),
            100
          )
        )
    );

    render(<JobApplicationForm {...mockProps} />);

    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    fireEvent.change(coverLetterInput, {
      target: {
        value:
          'This is a longer cover letter that meets the minimum requirements for submission.',
      },
    });

    const submitButton = screen.getByText('Submit Application');
    fireEvent.click(submitButton);

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<JobApplicationForm {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('shows draft badge when isDraft is true', () => {
    render(<JobApplicationForm {...mockProps} isDraft={true} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows save draft button when onSaveDraft is provided', () => {
    const mockOnSaveDraft = jest.fn();
    render(<JobApplicationForm {...mockProps} onSaveDraft={mockOnSaveDraft} />);

    expect(screen.getByText('Save Draft')).toBeInTheDocument();
  });

  it('calls onSaveDraft when save draft button is clicked', () => {
    const mockOnSaveDraft = jest.fn();
    render(<JobApplicationForm {...mockProps} onSaveDraft={mockOnSaveDraft} />);

    const saveDraftButton = screen.getByText('Save Draft');
    fireEvent.click(saveDraftButton);

    expect(mockOnSaveDraft).toHaveBeenCalled();
  });

  it('loads application limits on mount', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        limits: { remaining: 5, total: 10, reset_date: '2024-02-01' },
      }),
    });

    render(<JobApplicationForm {...mockProps} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/contractors/application-limits');
    });
  });

  it('shows application limits warning when remaining is low', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        limits: { remaining: 1, total: 10, reset_date: '2024-02-01' },
      }),
    });

    render(<JobApplicationForm {...mockProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(/You have 1 applications remaining/)
      ).toBeInTheDocument();
    });
  });

  it('handles file upload', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://example.com/file.pdf' }),
    });

    render(<JobApplicationForm {...mockProps} />);

    const file = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });
    const fileInput = screen.getByLabelText(/Choose Files/);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('shows file upload error for invalid file type', () => {
    render(<JobApplicationForm {...mockProps} />);

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/Choose Files/);

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/File type not supported/)).toBeInTheDocument();
  });

  it('shows file upload error for oversized file', () => {
    render(<JobApplicationForm {...mockProps} />);

    const file = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB

    const fileInput = screen.getByLabelText(/Choose Files/);
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      screen.getByText(/File size must be less than 10MB/)
    ).toBeInTheDocument();
  });

  it('prevents uploading more than 3 files', () => {
    render(<JobApplicationForm {...mockProps} />);

    const file1 = new File(['test content'], 'test1.pdf', {
      type: 'application/pdf',
    });
    const file2 = new File(['test content'], 'test2.pdf', {
      type: 'application/pdf',
    });
    const file3 = new File(['test content'], 'test3.pdf', {
      type: 'application/pdf',
    });
    const file4 = new File(['test content'], 'test4.pdf', {
      type: 'application/pdf',
    });

    const fileInput = screen.getByLabelText(/Choose Files/);

    fireEvent.change(fileInput, {
      target: { files: [file1, file2, file3, file4] },
    });

    expect(
      screen.getByText(/Maximum 3 attachments allowed/)
    ).toBeInTheDocument();
  });

  it('allows removing attachments', () => {
    render(
      <JobApplicationForm
        {...mockProps}
        initialData={{ attachments: ['https://example.com/file.pdf'] }}
      />
    );

    expect(screen.getByText('file.pdf')).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(screen.queryByText('file.pdf')).not.toBeInTheDocument();
  });

  it('shows proposed budget field', () => {
    render(<JobApplicationForm {...mockProps} />);

    const budgetInput = screen.getByLabelText(/Proposed Budget/);
    fireEvent.change(budgetInput, { target: { value: '1500' } });

    expect(budgetInput).toHaveValue(1500);
  });

  it('shows availability date fields', () => {
    render(<JobApplicationForm {...mockProps} />);

    const startDateInput = screen.getByLabelText(/Available From/);
    const endDateInput = screen.getByLabelText(/Available Until/);

    fireEvent.change(startDateInput, { target: { value: '2024-06-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-06-02' } });

    expect(startDateInput).toHaveValue('2024-06-01');
    expect(endDateInput).toHaveValue('2024-06-02');
  });

  it('shows file upload instructions', () => {
    render(<JobApplicationForm {...mockProps} />);

    expect(screen.getByText(/Max 3 files, 10MB each/)).toBeInTheDocument();
    expect(
      screen.getByText(/Supported: PDF, JPG, PNG, GIF, DOC, DOCX/)
    ).toBeInTheDocument();
  });
});
