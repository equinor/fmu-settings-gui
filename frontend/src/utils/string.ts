import { applicationLocale } from "#config";

export function stringCompare(a: string, b: string) {
  return a.localeCompare(b, applicationLocale);
}
