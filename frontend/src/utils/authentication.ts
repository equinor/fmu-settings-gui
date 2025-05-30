const FRAGMENTTOKEN_PREFIX = "#token=";
const STORAGETOKEN_NAME = "apiToken";

function getTokenFromFragment(): string {
  const fragment = location.hash;
  if (fragment !== "" && fragment.startsWith(FRAGMENTTOKEN_PREFIX)) {
    return fragment.substring(FRAGMENTTOKEN_PREFIX.length);
  } else {
    return "";
  }
}

export function getApiToken(): string {
  const fragmentToken = getTokenFromFragment();
  const storageToken = sessionStorage.getItem(STORAGETOKEN_NAME) ?? "";
  if (fragmentToken !== "") {
    sessionStorage.setItem(STORAGETOKEN_NAME, fragmentToken);
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

export function isApiToken(apiToken: string): boolean {
  return apiToken !== "";
}
