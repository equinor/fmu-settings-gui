import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "a97989e5-5477-4e8c-b2e4-b6bfda581331",
    authority:
      "https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
    redirectUri: "/",
  },
};

export const ssoScopes = [
  "691a29c5-8199-4e87-80a2-16bd71e831cd/user_impersonation", // SMDA
];

export const projectLockStatusRefetchInterval = 60_000; // 1 minute

export const rmsMinimumVersion = "15.0.1.0"; // Minimum version to use when opening RMS projects
