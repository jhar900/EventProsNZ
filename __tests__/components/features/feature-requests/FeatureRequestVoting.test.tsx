import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeatureRequestVoting from '@/components/features/feature-requests/FeatureRequestVoting';

// Mock fetch
global.fetch = jest.fn();

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('FeatureRequestVoting', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  const mockVoteData = {
    votes: [],
    vote_counts: {
      upvotes: 5,
      downvotes: 2,
      total: 3,
    },
    user_vote: null,
  };

  it('renders voting buttons correctly', () => {
    render(<FeatureRequestVoting featureRequestId="123" />);

    expect(screen.getByRole('button', { name: /5/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2/i })).toBeInTheDocument();
  });

  it('loads vote data on mount', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVoteData,
    });

    render(<FeatureRequestVoting featureRequestId="123" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/feature-requests/123/vote');
    });
  });

  it('handles upvote correctly', async () => {
    const user = userEvent.setup();
    const mockOnVoteChange = jest.fn();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoteData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Vote recorded',
          vote_type: 'upvote',
          action: 'created',
        }),
      });

    render(
      <FeatureRequestVoting
        featureRequestId="123"
        onVoteChange={mockOnVoteChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /5/i })).toBeInTheDocument();
    });

    const upvoteButton = screen.getByRole('button', { name: /5/i });
    await user.click(upvoteButton);

    expect(fetch).toHaveBeenCalledWith('/api/feature-requests/123/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vote_type: 'upvote' }),
    });
  });

  it('handles downvote correctly', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoteData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Vote recorded',
          vote_type: 'downvote',
          action: 'created',
        }),
      });

    render(<FeatureRequestVoting featureRequestId="123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /2/i })).toBeInTheDocument();
    });

    const downvoteButton = screen.getByRole('button', { name: /2/i });
    await user.click(downvoteButton);

    expect(fetch).toHaveBeenCalledWith('/api/feature-requests/123/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vote_type: 'downvote' }),
    });
  });

  it('shows user vote status', async () => {
    const voteDataWithUserVote = {
      ...mockVoteData,
      user_vote: 'upvote',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => voteDataWithUserVote,
    });

    render(<FeatureRequestVoting featureRequestId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/you voted: upvote/i)).toBeInTheDocument();
    });
  });

  it('shows analytics when enabled', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVoteData,
    });

    render(
      <FeatureRequestVoting featureRequestId="123" showAnalytics={true} />
    );

    await waitFor(() => {
      expect(screen.getByText(/7 total votes/i)).toBeInTheDocument();
    });
  });

  it('handles vote removal', async () => {
    const user = userEvent.setup();
    const voteDataWithUserVote = {
      ...mockVoteData,
      user_vote: 'upvote',
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => voteDataWithUserVote,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Vote removed',
          vote_type: null,
          action: 'removed',
        }),
      });

    render(<FeatureRequestVoting featureRequestId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/you voted: upvote/i)).toBeInTheDocument();
    });

    const upvoteButton = screen.getByRole('button', { name: /5/i });
    await user.click(upvoteButton);

    expect(fetch).toHaveBeenCalledWith('/api/feature-requests/123/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vote_type: 'upvote' }),
    });
  });

  it('handles vote change', async () => {
    const user = userEvent.setup();
    const voteDataWithUserVote = {
      ...mockVoteData,
      user_vote: 'upvote',
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => voteDataWithUserVote,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Vote updated',
          vote_type: 'downvote',
          action: 'updated',
        }),
      });

    render(<FeatureRequestVoting featureRequestId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/you voted: upvote/i)).toBeInTheDocument();
    });

    const downvoteButton = screen.getByRole('button', { name: /2/i });
    await user.click(downvoteButton);

    expect(fetch).toHaveBeenCalledWith('/api/feature-requests/123/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vote_type: 'downvote' }),
    });
  });

  it('handles voting errors', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoteData,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Voting failed' }),
      });

    render(<FeatureRequestVoting featureRequestId="123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /5/i })).toBeInTheDocument();
    });

    const upvoteButton = screen.getByRole('button', { name: /5/i });
    await user.click(upvoteButton);

    // Should not throw error, just show toast
    expect(screen.getByRole('button', { name: /5/i })).toBeInTheDocument();
  });

  it('disables buttons while voting', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoteData,
      })
      .mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

    render(<FeatureRequestVoting featureRequestId="123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /5/i })).toBeInTheDocument();
    });

    const upvoteButton = screen.getByRole('button', { name: /5/i });
    await user.click(upvoteButton);

    // Button should be disabled while voting
    expect(upvoteButton).toBeDisabled();
  });
});
