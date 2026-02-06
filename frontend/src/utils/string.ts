export function stringCompare(a: string, b: string) {
  return a.localeCompare(b, "no");
}

export function isVersionLessThan(version: string, minimum: string) {
  const v1Parts = version.split(".").map(Number);
  const v2Parts = minimum.split(".").map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1 = v1Parts[i] || 0;
    const v2 = v2Parts[i] || 0;
    if (v1 < v2) return true;
    if (v1 > v2) return false;
  }

  return false;
}
