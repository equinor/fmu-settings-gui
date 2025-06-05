import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { Options, SessionResponse, V1CreateSessionData } from "../client";

const FRAGMENTTOKEN_PREFIX = "#token=";
const STORAGETOKEN_NAME = "apiToken";
const APITOKEN_HEADER = "x-fmu-settings-api";
const APIURL_SESSION = "/api/v1/session";

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

export function setTokenInStorage(token: string): void {
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

export function isApiUrlSession(url?: string): boolean {
  return url === APIURL_SESSION;
}

export async function createSessionAsync(
  createSessionMutateAsync: UseMutateAsyncFunction<
    SessionResponse,
    AxiosError,
    Options<V1CreateSessionData>
  >,
  apiToken: string,
) {
  await createSessionMutateAsync({
    headers: { [APITOKEN_HEADER]: apiToken },
  });
}
