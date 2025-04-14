// This file is auto-generated by @hey-api/openapi-ts

/**
 * The configuration file in a .fmu directory.
 *
 * Stored as config.json.
 */
export type Config = {
    version: string;
    created_at: string;
    created_by: string;
};

/**
 * Path where a .fmu directory may exist.
 */
export type FmuDirPath = {
    path: string;
};

export type HttpValidationError = {
    detail?: Array<ValidationError>;
};

export type ValidationError = {
    loc: Array<string | number>;
    msg: string;
    type: string;
};

export type V1GetFmuDirectorySessionData = {
    body: FmuDirPath;
    path?: never;
    query?: never;
    url: '/api/v1/fmu/';
};

export type V1GetFmuDirectorySessionErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type V1GetFmuDirectorySessionError = V1GetFmuDirectorySessionErrors[keyof V1GetFmuDirectorySessionErrors];

export type V1GetFmuDirectorySessionResponses = {
    /**
     * Successful Response
     */
    200: Config;
};

export type V1GetFmuDirectorySessionResponse = V1GetFmuDirectorySessionResponses[keyof V1GetFmuDirectorySessionResponses];

export type V1InitFmuDirectorySessionData = {
    body: FmuDirPath;
    path?: never;
    query?: never;
    url: '/api/v1/fmu/init';
};

export type V1InitFmuDirectorySessionErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type V1InitFmuDirectorySessionError = V1InitFmuDirectorySessionErrors[keyof V1InitFmuDirectorySessionErrors];

export type V1InitFmuDirectorySessionResponses = {
    /**
     * Successful Response
     */
    200: Config;
};

export type V1InitFmuDirectorySessionResponse = V1InitFmuDirectorySessionResponses[keyof V1InitFmuDirectorySessionResponses];

export type V1GetFmuDirectoryConfigData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/v1/config/';
};

export type V1GetFmuDirectoryConfigErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type V1GetFmuDirectoryConfigError = V1GetFmuDirectoryConfigErrors[keyof V1GetFmuDirectoryConfigErrors];

export type V1GetFmuDirectoryConfigResponses = {
    /**
     * Successful Response
     */
    200: Config;
};

export type V1GetFmuDirectoryConfigResponse = V1GetFmuDirectoryConfigResponses[keyof V1GetFmuDirectoryConfigResponses];

export type V1V1HealthCheckData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/v1/health';
};

export type V1V1HealthCheckResponses = {
    /**
     * Successful Response
     */
    200: {
        [key: string]: string;
    };
};

export type V1V1HealthCheckResponse = V1V1HealthCheckResponses[keyof V1V1HealthCheckResponses];

export type AppHealthCheckData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/health';
};

export type AppHealthCheckResponses = {
    /**
     * Successful Response
     */
    200: {
        [key: string]: string;
    };
};

export type AppHealthCheckResponse = AppHealthCheckResponses[keyof AppHealthCheckResponses];

export type ClientOptions = {
    baseURL: 'http://localhost:8001' | (string & {});
};