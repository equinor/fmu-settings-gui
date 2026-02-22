import {
  InteractionRequiredAuthError,
  type IPublicClientApplication,
} from "@azure/msal-browser";
import type {
  UseMutateAsyncFunction,
  UseMutateFunction,
} from "@tanstack/react-query";
import type {
  AxiosError,
  AxiosResponse,
  AxiosResponseHeaders,
  InternalAxiosRequestConfig,
  RawAxiosResponseHeaders,
} from "axios";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";

import type {
  Message,
  Options,
  SessionPatchAccessTokenData,
  SessionPostSessionData,
  SessionResponse,
} from "#client";
import { sessionPatchAccessToken } from "#client";
import { client } from "#client/client.gen";
import { ssoScopes } from "#config";
import { HTTP_STATUS_UNAUTHORIZED } from "./api";
import {
  getStorageItem,
  removeStorageItem,
  STORAGENAME_API_TOKEN,
  setStorageItem,
} from "./storage";

const FRAGMENTTOKEN_PREFIX = "#token=";
const APITOKEN_HEADER = "x-fmu-settings-api";
const UPSTREAMSOURCE_HEADER = "x-upstream-source";
const APIURL_SESSION = "/api/v1/session/";

export type TokenStatus = {
  present?: boolean;
  valid?: boolean;
};

function getTokenFromFragment() {
  const fragment = location.hash;
  if (fragment !== "" && fragment.startsWith(FRAGMENTTOKEN_PREFIX)) {
    return fragment.substring(FRAGMENTTOKEN_PREFIX.length);
  } else {
    return "";
  }
}

function getTokenFromStorage() {
  return getStorageItem(sessionStorage, STORAGENAME_API_TOKEN) ?? "";
}

function setTokenInStorage(token: string) {
  setStorageItem(sessionStorage, STORAGENAME_API_TOKEN, token);
}

export function removeTokenFromStorage() {
  removeStorageItem(sessionStorage, STORAGENAME_API_TOKEN);
}

export function getApiToken() {
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

export function isApiTokenNonEmpty(apiToken: string) {
  return apiToken !== "";
}

export function isApiUrlSession(url?: string): boolean {
  return url === APIURL_SESSION;
}

export function isExternalApi(
  headers: RawAxiosResponseHeaders | AxiosResponseHeaders | undefined,
) {
  return headers && headers[UPSTREAMSOURCE_HEADER] === "SMDA";
}

export async function createSessionAsync(
  createSessionMutateAsync: UseMutateAsyncFunction<
    SessionResponse,
    AxiosError,
    Options<SessionPostSessionData>
  >,
  apiToken: string,
) {
  await createSessionMutateAsync({
    headers: { [APITOKEN_HEADER]: apiToken },
  });
}

export function handleSsoLogin(msalInstance: IPublicClientApplication) {
  try {
    void msalInstance.loginRedirect({ scopes: ssoScopes });
  } catch (error) {
    console.error("Error when logging in to SSO: ", error);
    toast.error(String(error));
  }
}

export function handleAddSsoAccessToken(
  patchAccessTokenMutate: UseMutateFunction<
    Message,
    AxiosError,
    Options<SessionPatchAccessTokenData>
  >,
  accessToken: string,
) {
  patchAccessTokenMutate({ body: { id: "smda_api", key: accessToken } });
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

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
};

export const responseInterceptorRejected =
  (
    apiToken: string,
    setApiToken: Dispatch<SetStateAction<string>>,
    apiTokenStatusValid: boolean,
    setApiTokenStatus: Dispatch<SetStateAction<TokenStatus>>,
    setRequestSessionCreation: Dispatch<SetStateAction<boolean>>,
    msalInstance?: IPublicClientApplication,
    setAccessToken?: Dispatch<SetStateAction<string>>,
  ) =>
  async (error: AxiosError) => {
    if (error.status === HTTP_STATUS_UNAUTHORIZED) {
      if (isApiUrlSession(error.response?.config.url)) {
        if (isApiTokenNonEmpty(apiToken)) {
          setApiToken(() => "");
          removeTokenFromStorage();
        }
        if (apiTokenStatusValid) {
          setApiTokenStatus(() => ({}));
        }
      } else if (isExternalApi(error.response?.headers)) {
        const config = error.config as RetryableRequestConfig | undefined;
        if (msalInstance && config && !config._retried) {
          config._retried = true;
          try {
            const result = await msalInstance.acquireTokenSilent({
              scopes: ssoScopes,
            });
            setAccessToken?.(result.accessToken);
            await sessionPatchAccessToken({
              body: { id: "smda_api", key: result.accessToken },
              throwOnError: true,
            });

            return await client.instance(config);
          } catch (tokenError) {
            if (tokenError instanceof InteractionRequiredAuthError) {
              void msalInstance.acquireTokenRedirect({ scopes: ssoScopes });
            }
          }
        }
      } else {
        setRequestSessionCreation(true);
      }
    }

    return Promise.reject(error);
  };
