// This file is auto-generated by @hey-api/openapi-ts

import { type Options, v1GetFmuDirectorySession, v1InitFmuDirectorySession, v1GetFmuDirectoryConfig, v1V1HealthCheck, appHealthCheck } from '../sdk.gen';
import { queryOptions, type UseMutationOptions } from '@tanstack/react-query';
import type { V1GetFmuDirectorySessionData, V1GetFmuDirectorySessionError, V1GetFmuDirectorySessionResponse, V1InitFmuDirectorySessionData, V1InitFmuDirectorySessionError, V1InitFmuDirectorySessionResponse, V1GetFmuDirectoryConfigData, V1V1HealthCheckData, AppHealthCheckData } from '../types.gen';
import type { AxiosError } from 'axios';
import { client as _heyApiClient } from '../client.gen';

export type QueryKey<TOptions extends Options> = [
    Pick<TOptions, 'baseURL' | 'body' | 'headers' | 'path' | 'query'> & {
        _id: string;
        _infinite?: boolean;
    }
];

const createQueryKey = <TOptions extends Options>(id: string, options?: TOptions, infinite?: boolean): [
    QueryKey<TOptions>[0]
] => {
    const params: QueryKey<TOptions>[0] = { _id: id, baseURL: (options?.client ?? _heyApiClient).getConfig().baseURL } as QueryKey<TOptions>[0];
    if (infinite) {
        params._infinite = infinite;
    }
    if (options?.body) {
        params.body = options.body;
    }
    if (options?.headers) {
        params.headers = options.headers;
    }
    if (options?.path) {
        params.path = options.path;
    }
    if (options?.query) {
        params.query = options.query;
    }
    return [
        params
    ];
};

export const v1GetFmuDirectorySessionQueryKey = (options: Options<V1GetFmuDirectorySessionData>) => createQueryKey('v1GetFmuDirectorySession', options);

export const v1GetFmuDirectorySessionOptions = (options: Options<V1GetFmuDirectorySessionData>) => {
    return queryOptions({
        queryFn: async ({ queryKey, signal }) => {
            const { data } = await v1GetFmuDirectorySession({
                ...options,
                ...queryKey[0],
                signal,
                throwOnError: true
            });
            return data;
        },
        queryKey: v1GetFmuDirectorySessionQueryKey(options)
    });
};

export const v1GetFmuDirectorySessionMutation = (options?: Partial<Options<V1GetFmuDirectorySessionData>>) => {
    const mutationOptions: UseMutationOptions<V1GetFmuDirectorySessionResponse, AxiosError<V1GetFmuDirectorySessionError>, Options<V1GetFmuDirectorySessionData>> = {
        mutationFn: async (localOptions) => {
            const { data } = await v1GetFmuDirectorySession({
                ...options,
                ...localOptions,
                throwOnError: true
            });
            return data;
        }
    };
    return mutationOptions;
};

export const v1InitFmuDirectorySessionQueryKey = (options: Options<V1InitFmuDirectorySessionData>) => createQueryKey('v1InitFmuDirectorySession', options);

export const v1InitFmuDirectorySessionOptions = (options: Options<V1InitFmuDirectorySessionData>) => {
    return queryOptions({
        queryFn: async ({ queryKey, signal }) => {
            const { data } = await v1InitFmuDirectorySession({
                ...options,
                ...queryKey[0],
                signal,
                throwOnError: true
            });
            return data;
        },
        queryKey: v1InitFmuDirectorySessionQueryKey(options)
    });
};

export const v1InitFmuDirectorySessionMutation = (options?: Partial<Options<V1InitFmuDirectorySessionData>>) => {
    const mutationOptions: UseMutationOptions<V1InitFmuDirectorySessionResponse, AxiosError<V1InitFmuDirectorySessionError>, Options<V1InitFmuDirectorySessionData>> = {
        mutationFn: async (localOptions) => {
            const { data } = await v1InitFmuDirectorySession({
                ...options,
                ...localOptions,
                throwOnError: true
            });
            return data;
        }
    };
    return mutationOptions;
};

export const v1GetFmuDirectoryConfigQueryKey = (options?: Options<V1GetFmuDirectoryConfigData>) => createQueryKey('v1GetFmuDirectoryConfig', options);

export const v1GetFmuDirectoryConfigOptions = (options?: Options<V1GetFmuDirectoryConfigData>) => {
    return queryOptions({
        queryFn: async ({ queryKey, signal }) => {
            const { data } = await v1GetFmuDirectoryConfig({
                ...options,
                ...queryKey[0],
                signal,
                throwOnError: true
            });
            return data;
        },
        queryKey: v1GetFmuDirectoryConfigQueryKey(options)
    });
};

export const v1V1HealthCheckQueryKey = (options?: Options<V1V1HealthCheckData>) => createQueryKey('v1V1HealthCheck', options);

export const v1V1HealthCheckOptions = (options?: Options<V1V1HealthCheckData>) => {
    return queryOptions({
        queryFn: async ({ queryKey, signal }) => {
            const { data } = await v1V1HealthCheck({
                ...options,
                ...queryKey[0],
                signal,
                throwOnError: true
            });
            return data;
        },
        queryKey: v1V1HealthCheckQueryKey(options)
    });
};

export const appHealthCheckQueryKey = (options?: Options<AppHealthCheckData>) => createQueryKey('appHealthCheck', options);

export const appHealthCheckOptions = (options?: Options<AppHealthCheckData>) => {
    return queryOptions({
        queryFn: async ({ queryKey, signal }) => {
            const { data } = await appHealthCheck({
                ...options,
                ...queryKey[0],
                signal,
                throwOnError: true
            });
            return data;
        },
        queryKey: appHealthCheckQueryKey(options)
    });
};