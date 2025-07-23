import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { AxiosError, AxiosResponse, isAxiosError } from "axios";
import { Dispatch, SetStateAction } from "react";

import { Message, Options, V1CreateSessionData } from "../client";

const FRAGMENTTOKEN_PREFIX = "#token=";
const STORAGETOKEN_NAME = "apiToken";
const APITOKEN_HEADER = "x-fmu-settings-api";
const APIURL_SESSION = "/api/v1/session/";

export type TokenStatus = {
  present?: boolean;
  valid?: boolean;
};

function getTokenFromFragment(): string {
  const fragment = location.hash;
  if (fragment !== "" && fragment.startsWith(FRAGMENTTOKEN_PREFIX)) {
    return fragment.substring(FRAGMENTTOKEN_PREFIX.length);
  } else {
    return "";
  }
}

function getTokenFromStorage(): string {
  return sessionStorage.getItem(STORAGETOKEN_NAME) ?? "";
}

function setTokenInStorage(token: string): void {
  sessionStorage.setItem(STORAGETOKEN_NAME, token);
}

export function removeTokenFromStorage(): void {
  sessionStorage.removeItem(STORAGETOKEN_NAME);
}

export function getApiToken(): string {
  const fragmentToken = getTokenFromFragment();
  const storageToken = getTokenFromStorage();
  if (fragmentToken !== "") {
    setTokenInStorage(fragmentToken);
    history.pushState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    return fragmentToken;
  } else if (storageToken !== "") {
    return storageToken;
  } else {
    return "";
  }
}

export function isApiTokenNonEmpty(apiToken: string): boolean {
  return apiToken !== "";
}

function isApiUrlSession(url?: string): boolean {
  return url === APIURL_SESSION;
}

function isExternalApi(source?: string): boolean {
  return source === "SMDA";
}

async function createSessionAsync(
  createSessionMutateAsync: UseMutateAsyncFunction<
    Message,
    AxiosError,
    Options<V1CreateSessionData>
  >,
  apiToken: string,
) {
  await createSessionMutateAsync({
    headers: { [APITOKEN_HEADER]: apiToken },
  });
}

export const responseInterceptorFulfilled =
  (
    apiTokenStatusValid: boolean,
    setApiTokenStatus: Dispatch<SetStateAction<TokenStatus>>,
  ) =>
  (response: AxiosResponse): AxiosResponse => {
    if (isApiUrlSession(response.config.url) && !apiTokenStatusValid) {
      setApiTokenStatus((apiTokenStatus) => ({
        ...apiTokenStatus,
        valid: true,
      }));
    }
    return response;
  };

export const responseInterceptorRejected =
  (
    apiToken: string,
    setApiToken: Dispatch<SetStateAction<string>>,
    apiTokenStatusValid: boolean,
    setApiTokenStatus: Dispatch<SetStateAction<TokenStatus>>,
    createSessionMutateAsync: UseMutateAsyncFunction<
      Message,
      AxiosError,
      Options<V1CreateSessionData>
    >,
  ) =>
  async (error: AxiosError) => {
    if (error.status === 401) {
      if (isApiUrlSession(error.response?.config.url)) {
        if (isApiTokenNonEmpty(apiToken)) {
          setApiToken(() => "");
          removeTokenFromStorage();
        }
        if (apiTokenStatusValid) {
          setApiTokenStatus(() => ({}));
        }
      } else if (
        !isExternalApi(String(error.response?.headers["x-upstream-source"]))
      ) {
        await createSessionAsync(createSessionMutateAsync, apiToken);
      }
    }
    return Promise.reject(error);
  };

export const queryMutationRetry = (failureCount: number, error: Error) => {
  if (
    isAxiosError(error) &&
    isApiUrlSession(error.response?.config.url) &&
    error.status === 401
  ) {
    // Don't retry query or mutation if it resulted in a failed session creation
    return false;
  }
  // Specify at most 2 retries
  return failureCount < 2;
};
