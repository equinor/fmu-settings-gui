import { applicationLocale } from "#config";

export function stringCompare(a: string, b: string) {
  return a.localeCompare(b, applicationLocale);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
