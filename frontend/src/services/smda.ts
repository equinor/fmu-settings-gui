import {
  queryOptions,
  useQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useMemo } from "react";

import {
  type FieldItem,
  type Options,
  type SmdaGetHealthData,
  type SmdaWellHeader,
  smdaGetHealth,
} from "#client";
import {
  smdaGetHealthQueryKey,
  smdaPostWellHeadersOptions,
} from "#client/@tanstack/react-query.gen";

export type HealthCheck = {
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

        return { status, text };
      },
      queryKey: smdaGetHealthQueryKey(options),
    }),
  );
}

export type SmdaWellHeaders = {
  smdaHeaders: SmdaWellHeader[];
  isLoading: boolean;
  isError: boolean;
  hasFields: boolean;
};

export function useSmdaWellHeaders({
  fields,
  enabled,
}: {
  fields: FieldItem[];
  enabled: boolean;
}): SmdaWellHeaders {
  const fieldsByUuid = useMemo(
    () => new Map(fields.map((field) => [field.uuid, field])),
    [fields],
  );
  const { smdaHeaders, isLoading, isError } = useQueries({
    queries: [...fieldsByUuid.values()].map((field) => ({
      ...smdaPostWellHeadersOptions({
        body: { identifier: field.identifier, uuid: field.uuid },
      }),
      enabled,
      meta: {
        errorPrefix: `Could not load SMDA wellbore names for ${field.identifier}`,
      },
    })),
    combine: (results) => {
      const headersByUuid = new Map<string, SmdaWellHeader>();
      results.forEach((result) => {
        result.data?.well_headers.forEach((header) => {
          headersByUuid.set(header.wellbore_uuid, header);
        });
      });

      return {
        smdaHeaders: [...headersByUuid.values()],
        isLoading: results.some((result) => result.isLoading),
        isError: results.some((result) => result.isError),
      };
    },
  });

  return {
    smdaHeaders,
    isLoading,
    isError,
    hasFields: fieldsByUuid.size > 0,
  };
}
