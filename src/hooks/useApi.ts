import { useState, useEffect, useCallback } from "react";
import type { AxiosResponse } from "axios";
import type ServiceValidation from "../types/serviceValidation"; // Assicurati che il tipo esista o adattalo
import { useTranslation } from "react-i18next";

// Generic hook for API calls.
// Decision: We abstract the state logic (loading, error) to avoid
// to duplicate it on each page. We also return a 'refetch' function
// to allow manual data updating (e.g. after an action).
export function useApi<T>(
  fetcher: () => Promise<AxiosResponse<ServiceValidation<T>>>,
  dependencies: any[] = [],
) {
  const { t } = useTranslation();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      const payload = response.data;

      // The backend always responds with { ok, status, message, data }.
      // If 'ok' is false, we treat the response as an application error.
      if (!payload.ok) {
        setError(payload.message || "Errore sconosciuto dal server");
        setData(null);
        return;
      }

      // If ok is true, we extract the real data.
      setData(payload.data ?? null);
    } catch (err: any) {
      // We handle network errors or 4xx/5xx HTTP statuses.
      // If the backend has already sent a message, we use it.
      const msg =
        err.response?.data?.message || "Errore di connessione al server";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [...dependencies, t]); // Dependencies control when to rerun fetch. Added t to dependencies to re-fetch on lang change if needed

  // Runs the fetch on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
