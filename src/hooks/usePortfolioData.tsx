import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import type { PublicBootstrapPayload } from '../types/cms';

interface PortfolioContextValue {
  data: PublicBootstrapPayload | null;
  loading: boolean;
  error: string | null;
  isPreview: boolean;
  refreshPortfolio: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PublicBootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPreview =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === '1';

  const refreshPortfolio = useCallback(async () => {
    try {
      setError(null);
      const endpoint = isPreview ? '/api/public/bootstrap?preview=1' : '/api/public/bootstrap';
      const payload = await apiRequest<PublicBootstrapPayload>(endpoint);
      setData(payload);
    } catch (err) {
      setError((err as Error).message || 'Failed to load portfolio data.');
    } finally {
      setLoading(false);
    }
  }, [isPreview]);

  useEffect(() => {
    void refreshPortfolio();
  }, [refreshPortfolio]);

  return (
    <PortfolioContext.Provider value={{ data, loading, error, isPreview, refreshPortfolio }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioData() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolioData must be used inside PortfolioDataProvider');
  return ctx;
}
