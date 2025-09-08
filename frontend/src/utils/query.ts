import { isAxiosError } from "axios";
import { toast } from "react-toastify";

import { isApiUrlSession, isExternalApi } from "./authentication";

export const defaultErrorHandling = (error: Error, errorPrefix: string) => {
  const message =
    `${errorPrefix}: ` +
    (isAxiosError(error) &&
    error.response?.data &&
    "detail" in error.response.data
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        String(error.response.data.detail)
      : error.message);
  console.error(message);
  toast.error(message);
};

export const mutationRetry = (failureCount: number, error: Error) => {
  if (
    isAxiosError(error) &&
    error.status === 401 &&
    !(
      isApiUrlSession(error.response?.config.url) ||
      isExternalApi(error.response?.headers)
    )
  ) {
    // Specify one retry to deal with the original mutation failing due to missing
    // API authorisation, but don't retry a failed session creation
    return failureCount < 1;
  }
  return false;
};
