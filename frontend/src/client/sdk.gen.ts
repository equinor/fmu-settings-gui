// This file is auto-generated by @hey-api/openapi-ts

import type { Options as ClientOptions, TDataShape, Client } from '@hey-api/client-axios';
import type { V1DeleteFmuDirectorySessionData, V1DeleteFmuDirectorySessionResponse, V1DeleteFmuDirectorySessionError, V1GetCwdFmuDirectorySessionData, V1GetCwdFmuDirectorySessionResponse, V1GetFmuDirectorySessionData, V1GetFmuDirectorySessionResponse, V1GetFmuDirectorySessionError, V1InitFmuDirectorySessionData, V1InitFmuDirectorySessionResponse, V1InitFmuDirectorySessionError, V1GetFmuDirectoryConfigData, V1GetFmuDirectoryConfigResponse, V1GetFmuDirectoryConfigError, V1V1HealthCheckData, V1V1HealthCheckResponse, AppHealthCheckData, AppHealthCheckResponse } from './types.gen';
import { client as _heyApiClient } from './client.gen';

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<TData, ThrowOnError> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
    /**
     * You can pass arbitrary values through the `meta` object. This can be
     * used to access values that aren't defined as part of the SDK function.
     */
    meta?: Record<string, unknown>;
};

/**
 * Delete Fmu Directory Session
 * Deletes a .fmu session if it exists.
 */
export const v1DeleteFmuDirectorySession = <ThrowOnError extends boolean = false>(options?: Options<V1DeleteFmuDirectorySessionData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).delete<V1DeleteFmuDirectorySessionResponse, V1DeleteFmuDirectorySessionError, ThrowOnError>({
        security: [
            {
                name: 'x-fmu-settings-api',
                type: 'apiKey'
            }
        ],
        url: '/api/v1/fmu/',
        ...options
    });
};

/**
 * Get Cwd Fmu Directory Session
 * Returns the paths and configuration for the nearest .fmu directory.
 *
 * This directory is searched for above the current working directory.
 */
export const v1GetCwdFmuDirectorySession = <ThrowOnError extends boolean = false>(options?: Options<V1GetCwdFmuDirectorySessionData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<V1GetCwdFmuDirectorySessionResponse, unknown, ThrowOnError>({
        security: [
            {
                name: 'x-fmu-settings-api',
                type: 'apiKey'
            }
        ],
        url: '/api/v1/fmu/',
        ...options
    });
};

/**
 * Get Fmu Directory Session
 * Returns the paths and configuration for the .fmu directory at 'path'.
 */
export const v1GetFmuDirectorySession = <ThrowOnError extends boolean = false>(options: Options<V1GetFmuDirectorySessionData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<V1GetFmuDirectorySessionResponse, V1GetFmuDirectorySessionError, ThrowOnError>({
        security: [
            {
                name: 'x-fmu-settings-api',
                type: 'apiKey'
            }
        ],
        url: '/api/v1/fmu/',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Init Fmu Directory Session
 * Initializes .fmu at 'path' and returns its paths and configuration.
 */
export const v1InitFmuDirectorySession = <ThrowOnError extends boolean = false>(options: Options<V1InitFmuDirectorySessionData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<V1InitFmuDirectorySessionResponse, V1InitFmuDirectorySessionError, ThrowOnError>({
        security: [
            {
                name: 'x-fmu-settings-api',
                type: 'apiKey'
            }
        ],
        url: '/api/v1/fmu/init',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Get Fmu Directory Config
 * Returns the configuration for the currently open FMU Directory session.
 */
export const v1GetFmuDirectoryConfig = <ThrowOnError extends boolean = false>(options?: Options<V1GetFmuDirectoryConfigData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<V1GetFmuDirectoryConfigResponse, V1GetFmuDirectoryConfigError, ThrowOnError>({
        security: [
            {
                name: 'x-fmu-settings-api',
                type: 'apiKey'
            }
        ],
        url: '/api/v1/config/',
        ...options
    });
};

/**
 * V1 Health Check
 * Simple health check endpoint.
 */
export const v1V1HealthCheck = <ThrowOnError extends boolean = false>(options?: Options<V1V1HealthCheckData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<V1V1HealthCheckResponse, unknown, ThrowOnError>({
        security: [
            {
                name: 'x-fmu-settings-api',
                type: 'apiKey'
            }
        ],
        url: '/api/v1/health',
        ...options
    });
};

/**
 * Health Check
 * Simple health check endpoint.
 */
export const appHealthCheck = <ThrowOnError extends boolean = false>(options?: Options<AppHealthCheckData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<AppHealthCheckResponse, unknown, ThrowOnError>({
        url: '/health',
        ...options
    });
};