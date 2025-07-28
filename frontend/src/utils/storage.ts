export function getStorageItem(storage: Storage, name: string): string | null;
export function getStorageItem(
  storage: Storage,
  name: string,
  toType: "boolean",
): boolean;
export function getStorageItem(
  storage: Storage,
  name: string,
  toType?: "boolean",
) {
  const value = storage.getItem(name);
  if (toType === "boolean") {
    return storage.getItem(name) === "true";
  } else {
    return value;
  }
}

export function setStorageItem(
  storage: Storage,
  name: string,
  value: string | boolean,
) {
  storage.setItem(name, String(value));
}

export function removeStorageItem(storage: Storage, name: string) {
  storage.removeItem(name);
}
