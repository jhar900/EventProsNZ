import { create } from 'zustand';
import {
  ContractorMatch,
  MatchingFilters,
  MatchingAnalytics,
} from '@/types/matching';

interface ContractorMatchingState {
  matches: ContractorMatch[];
  analytics: MatchingAnalytics | null;
  filters: MatchingFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
  selectedMatch: ContractorMatch | null;
}

interface ContractorMatchingActions {
  setMatches: (matches: ContractorMatch[]) => void;
  setAnalytics: (analytics: MatchingAnalytics | null) => void;
  setFilters: (filters: MatchingFilters) => void;
  setPagination: (
    pagination: Partial<ContractorMatchingState['pagination']>
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedMatch: (match: ContractorMatch | null) => void;
  clearMatches: () => void;
  updateMatch: (matchId: string, updates: Partial<ContractorMatch>) => void;
  removeMatch: (matchId: string) => void;
  reset: () => void;
}

const initialState: ContractorMatchingState = {
  matches: [],
  analytics: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
  loading: false,
  error: null,
  selectedMatch: null,
};

export const useContractorMatchingStore = create<
  ContractorMatchingState & ContractorMatchingActions
>((set, get) => ({
  ...initialState,

  setMatches: matches => set({ matches }),

  setAnalytics: analytics => set({ analytics }),

  setFilters: filters =>
    set({ filters, pagination: { ...get().pagination, page: 1 } }),

  setPagination: pagination =>
    set({ pagination: { ...get().pagination, ...pagination } }),

  setLoading: loading => set({ loading }),

  setError: error => set({ error }),

  setSelectedMatch: selectedMatch => set({ selectedMatch }),

  clearMatches: () =>
    set({ matches: [], analytics: null, selectedMatch: null }),

  updateMatch: (matchId, updates) => {
    const matches = get().matches.map(match =>
      match.id === matchId ? { ...match, ...updates } : match
    );
    set({ matches });
  },

  removeMatch: matchId => {
    const matches = get().matches.filter(match => match.id !== matchId);
    set({ matches });
  },

  reset: () => set(initialState),
}));
