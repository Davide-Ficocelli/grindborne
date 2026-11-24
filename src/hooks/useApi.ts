import { useState, useEffect, useCallback } from "react";
import type { AxiosResponse } from "axios";
import type ServiceValidation from "../types/serviceValidation";
import { useTranslation } from "react-i18next";

type UseApiOptions = {
  // When false, the hook does NOT call the fetcher and does not start in the
  // "loading" state. It lets a component that serves several variants
  // (e.g. QuestPage: "add" needs no quest) call the hook unconditionally, as
  // the rules of hooks require, without sending a useless request.
  enabled?: boolean;
};

// Generic hook for API calls.
// Decision: We abstract the state logic (loading, error) to avoid
// to duplicate it on each page. We also return a 'refetch' function
// to allow manual data updating (e.g. after an action).
export function useApi<T>(
  fetcher: () => Promise<AxiosResponse<ServiceValidation<T>>>,
  dependencies: any[] = [],
  options: UseApiOptions = {},
) {
  const { t } = useTranslation();
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  // A disabled request has nothing to wait for, so it starts as "not loading".
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      const payload = response.data;

      // The backend always responds with { ok, status, message, data }.
      // If 'ok' is false, we treat the response as an application error.
      // Note: the fallback text is translated (it used to be hard-coded in Italian).
      if (!payload.ok) {
        setError(payload.message || t("errors.unknown"));
        setData(null);
        return;
      }

      // If ok is true, we extract the real data.
      setData(payload.data ?? null);
    } catch (err: any) {
      // We handle network errors or 4xx/5xx HTTP statuses.
      // If the backend has already sent a message, we use it.
      const msg = err.response?.data?.message || t("errors.network");
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [...dependencies, t]); // Dependencies control when to rerun fetch. Added t to dependencies to re-fetch on lang change if needed

  // Runs the fetch on mount and when dependencies change (only when enabled)
  useEffect(() => {
    if (!enabled) return;
    fetchData();
  }, [fetchData, enabled]);

  return { data, loading, error, refetch: fetchData };
}
