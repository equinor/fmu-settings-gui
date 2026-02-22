import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { type Options, type SmdaGetHealthData, smdaGetHealth } from "#client";
import { smdaGetHealthQueryKey } from "#client/@tanstack/react-query.gen";

type HealthCheck = {
  status: boolean;
  text: string;
};

export function useSmdaHealthCheck(options?: Options<SmdaGetHealthData>) {
  return useSuspenseQuery(
    queryOptions({
      queryFn: async ({ queryKey, signal }) => {
        let status: boolean;
        let text = "";
        try {
          const response = await smdaGetHealth({
            ...options,
            ...queryKey[0],
            signal,
            throwOnError: true,
          });
          status = true;
          text = response.data.status ?? "";
        } catch (error) {
          status = false;
          if (
            isAxiosError(error) &&
            error.response?.data &&
            "detail" in error.response.data
          ) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            text = String(error.response.data.detail);
          }
        }

        return { status, text } as HealthCheck;
      },
      queryKey: smdaGetHealthQueryKey(options),
    }),
  );
}
