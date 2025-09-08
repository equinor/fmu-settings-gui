import { isAxiosError } from "axios";

import { isApiUrlSession, isExternalApi } from "./authentication";

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
