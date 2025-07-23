import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { smdaGetHealth } from "../client";
import { smdaGetHealthQueryKey } from "../client/@tanstack/react-query.gen";

type HealthCheck = {
  status: boolean;
  text: string;
};

export function useSmdaHealthCheck() {
  return useSuspenseQuery(
    queryOptions({
      queryFn: async ({ queryKey, signal }) => {
        let text = "";
        try {
          await smdaGetHealth({
            ...queryKey[0],
            signal,
            throwOnError: true,
          });
          return { status: true, text } as HealthCheck;
        } catch (error) {
          if (
            isAxiosError(error) &&
            error.response?.data &&
            "detail" in error.response.data
          ) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            text = String(error.response.data.detail);
          }
          return { status: false, text } as HealthCheck;
        }
      },
      queryKey: smdaGetHealthQueryKey(),
      retry: false,
    }),
  );
}
