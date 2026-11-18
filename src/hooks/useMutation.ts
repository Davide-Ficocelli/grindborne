import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AxiosResponse } from "axios";
import type ServiceValidation from "../types/serviceValidation";
import { pushLog, dismissLog } from "../lib/logMessagesStore";

// Options that customise the behaviour of feedback and callbacks.
interface UseMutationOptions<TData> {
  // Text to be displayed as "pending" (info). If omitted, no log is recorded
  // "pending" is pushed. Useful for very brief operations.
  pendingMessage?: string;

  // Text to display on success. If omitted, use the backend message
  // (payload.message). Pass an empty string to suppress the toast.
  successMessage?: string;

  // Callback following a successful request (backend ok:true). Receives the response data.
  onSuccess?: (data: TData, message: string) => void;

  // Callback following an error (ok: false or an exception). It receives the message.
  onError?: (message: string) => void;
}

// The fetcher type: a function that calls Axios and returns
// AxiosResponse<ServiceValidation<TData>>. Same type as useApi.
type Fetcher<TData, TArgs extends unknown[]> = (
  ...args: TArgs
) => Promise<AxiosResponse<ServiceValidation<TData>>>;

export function useMutation<
  TData = unknown,
  TArgs extends unknown[] = unknown[],
>(fetcher: Fetcher<TData, TArgs>, options: UseMutationOptions<TData> = {}) {
  const { t } = useTranslation();
  const { pendingMessage, successMessage, onSuccess, onError } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  // useCallback on the mutator: the `mutate` function is stable between renders
  // (provided the fetcher does not change). This prevents cascading re-renders if
  // `mutate` is passed as a prop.
  const mutate = useCallback(
    async (...args: TArgs): Promise<ServiceValidation<TData>> => {
      setLoading(true);
      setError(null);

      // 1) Push the pending item. Save the ID so it can be removed later.
      //    The `pendingId` scope remains valid until the `finally` block.
      const pendingId = pendingMessage
        ? pushLog("info", pendingMessage)
        : undefined;

      try {
        const response = await fetcher(...args);
        const payload = response.data;

        // 2) Backend with `ok:false` = application error. This is not an exception.
        if (!payload.ok) {
          const msg = payload.message || "Unknown server error";
          setError(msg);
          setData(null);
          // Removing the pending status and displaying the error
          if (pendingId) dismissLog(pendingId);
          pushLog("error", msg);
          onError?.(msg);
          return payload;
        }

        // 3) Success.
        setData(payload.data ?? null);
        if (pendingId) dismissLog(pendingId);
        // If successMessage === "", do not display a toast (explicit suppression)
        if (successMessage !== "") {
          pushLog(
            "success",
            successMessage || payload.message || "Operation completed",
          );
        }
        onSuccess?.(payload.data as TData, payload.message);
        return payload;
      } catch (err: any) {
        // 4) Network error / 4xx–5xx. I extract a meaningful message.
        const msg = err.response?.data?.message || t("errors.network");
        setError(msg);
        setData(null);
        if (pendingId) dismissLog(pendingId);
        pushLog("error", msg);
        onError?.(msg);
        // I return a ServiceValidation to uphold the contract
        // that “mutate never throws an exception”. The caller can always use `if (!res.ok)`.
        return { ok: false, status: 0, message: msg };
      } finally {
        setLoading(false);
      }
    },
    // The callback’s dependencies are the fetcher and the options (which are essentially stable
    // because the options are created inline and the fetcher is almost always a
    // lambda; if you want complete stability, pass the options via `useMemo` or create a
    // `mutate` with a named function). For an app like this, it’s fine.
    [fetcher, pendingMessage, successMessage, onSuccess, onError],
  );

  // reset(): resets error/data/loading. Useful for closing a modal after
  // a successful operation or to allow a second, fresh attempt.
  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
}
