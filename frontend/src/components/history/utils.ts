export function formatRecoveredFilesMessage(
  files: string[],
  scopeLabel: "project" | "user",
) {
  if (files.length === 0) {
    return `No deleted ${scopeLabel} files were recovered`;
  }

  if (files.length === 1) {
    return `Recovered ${files[0]}`;
  }

  if (files.length === 2) {
    return `Recovered ${files[0]} and ${files[1]}`;
  }

  return `Recovered ${String(files.length)} deleted ${scopeLabel} files`;
}
